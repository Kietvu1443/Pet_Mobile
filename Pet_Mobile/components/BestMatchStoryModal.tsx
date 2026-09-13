import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/lib/theme/ThemeContext';
import { AppDialog, AppDialogProps } from '@/components/ui/AppDialog';
import {
  createBestMatchStory,
  deleteBestMatchStory,
  updateBestMatchStory,
  type BestMatchStory,
} from '@/lib/api/bestMatches';

export type BestMatchStoryModalProps = {
  visible: boolean;
  bestMatchId: number;
  story?: BestMatchStory | null;
  onClose: () => void;
  onSaved: (story?: BestMatchStory) => void;
  onDeleted: (storyId?: number) => void;
};

type PendingMedia = {
  uri: string;
  name: string;
  type: string;
};

const MAX_MEDIA = 10;

function normalizeStoryDate(dateInput?: string | null): string {
  if (!dateInput) return '';
  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function mediaTypeLabel(type: string): string {
  return type.startsWith('video/') ? 'Video' : 'Ảnh';
}

export function BestMatchStoryModal({
  visible,
  bestMatchId,
  story,
  onClose,
  onSaved,
  onDeleted,
}: BestMatchStoryModalProps) {
  const { theme } = useTheme();
  const editing = Boolean(story);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [storyDate, setStoryDate] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'connections' | 'public'>('private');
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<AppDialogProps | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(story?.title ?? '');
    setContent(story?.content ?? '');
    setStoryDate(normalizeStoryDate(story?.story_date ?? null));
    setVisibility(
      story?.visibility === 'public' || story?.visibility === 'connections'
        ? story.visibility
        : 'private',
    );
    setMedia([]);
  }, [visible, story]);

  const canSave = content.trim().length > 0 && !saving && !deleting;

  const helperText = useMemo(() => {
    if (editing) return 'Bạn có thể chỉnh sửa nội dung và quyền riêng tư. Media cũ vẫn được giữ nguyên.';
    return 'Một kỷ niệm nhỏ cũng đủ để lưu lại hành trình.';
  }, [editing]);

  const pickMedia = async () => {
    if (editing) {
      setDialogConfig({
        visible: true,
        title: 'Chỉnh sửa câu chuyện',
        message: 'Ở chế độ chỉnh sửa, bạn chỉ cần sửa nội dung. Media hiện có sẽ được giữ nguyên.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    if (media.length >= MAX_MEDIA) {
      setDialogConfig({
        visible: true,
        title: 'Đã đủ media',
        message: `Mỗi câu chuyện có thể có tối đa ${MAX_MEDIA} ảnh/video.`,
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setDialogConfig({
        visible: true,
        title: 'Cần quyền truy cập',
        message: 'Hãy cho phép ứng dụng truy cập thư viện ảnh/video để lưu kỷ niệm.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - media.length,
      quality: 0.85,
    });

    if (result.canceled) return;

    const selected = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `best-match-${Date.now()}-${index}${asset.type === 'video' ? '.mp4' : '.jpg'}`,
      type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    }));

    setMedia((prev) => [...prev, ...selected].slice(0, MAX_MEDIA));
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setDialogConfig({
        visible: true,
        title: 'Thiếu nội dung',
        message: 'Hãy viết một chút về kỷ niệm này trước khi lưu.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }
    if (trimmed.length > 5000) {
      setDialogConfig({
        visible: true,
        title: 'Nội dung quá dài',
        message: 'Nội dung câu chuyện tối đa 5000 ký tự.',
        singleButton: true,
        confirmText: 'Đã hiểu',
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    setSaving(true);
    try {
      if (story) {
        const updated = await updateBestMatchStory({
          bestMatchId,
          storyId: story.id,
          title: title.trim() || null,
          content: trimmed,
          storyDate: storyDate.trim() || null,
          visibility,
        });
        onSaved(updated);
      } else {
        const created = await createBestMatchStory({
          bestMatchId,
          title: title.trim() || undefined,
          content: trimmed,
          storyDate: storyDate.trim() || null,
          visibility,
          media,
        });
        onSaved(created);
      }
    } catch (error: any) {
      setDialogConfig({
        visible: true,
        variant: 'destructive',
        title: 'Không thể lưu',
        message: error?.message || 'Đã xảy ra lỗi khi lưu câu chuyện.',
        singleButton: true,
        confirmText: 'Đóng',
        onConfirm: () => setDialogConfig(null),
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!story || deleting || saving) return;
    setDialogConfig({
      visible: true,
      variant: 'destructive',
      iconName: 'trash-outline',
      title: 'Xoá kỷ niệm?',
      message: 'Câu chuyện sẽ được xoá khỏi dòng thời gian. Hành động này không thể hoàn tác từ màn hình hiện tại.',
      confirmText: 'Xoá',
      cancelText: 'Huỷ',
      onConfirm: async () => {
        setDialogConfig(null);
        setDeleting(true);
        try {
          await deleteBestMatchStory(bestMatchId, story.id);
          onDeleted(story.id);
        } catch (error: any) {
          setDialogConfig({
            visible: true,
            variant: 'destructive',
            title: 'Không thể xoá',
            message: error?.message || 'Đã xảy ra lỗi khi xoá câu chuyện.',
            singleButton: true,
            confirmText: 'Đóng',
            onConfirm: () => setDialogConfig(null),
          });
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => setDialogConfig(null),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}> 
                {editing ? 'Chỉnh sửa kỷ niệm' : 'Lưu một kỷ niệm'}
              </Text>
              <Text style={[styles.helper, { color: theme.colors.muted }]}>{helperText}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={saving || deleting}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.label, { color: theme.colors.text }]}>Tiêu đề</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Ngày đầu tiên ở nhà"
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              maxLength={255}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Nội dung *</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Hôm nay chúng mình..."
              placeholderTextColor={theme.colors.muted}
              style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              multiline
              textAlignVertical="top"
              maxLength={5000}
            />
            <Text style={[styles.counter, { color: theme.colors.muted }]}>{content.length}/5000</Text>

            <Text style={[styles.label, { color: theme.colors.text }]}>Ngày kỷ niệm</Text>
            <TextInput
              value={storyDate}
              onChangeText={setStoryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.muted}
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              autoCapitalize="none"
              maxLength={10}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Ai có thể xem?</Text>
            <View style={styles.visibilityRow}>
              {(
                [
                  ['private', 'Riêng tư', 'lock-closed-outline'],
                  ['connections', 'Kết nối', 'people-outline'],
                  ['public', 'Công khai', 'globe-outline'],
                ] as const
              ).map(([value, label, icon]) => {
                const active = visibility === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setVisibility(value)}
                    style={[
                      styles.visibilityChip,
                      {
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                        backgroundColor: active ? theme.colors.primaryContainer : theme.colors.surface,
                      },
                    ]}
                  >
                    <Ionicons name={icon} size={15} color={active ? theme.colors.primary : theme.colors.muted} />
                    <Text style={{ color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? '700' : '500', fontSize: 12 }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!editing && (
              <>
                <View style={styles.mediaHeader}>
                  <Text style={[styles.label, { color: theme.colors.text, marginBottom: 0 }]}>Ảnh / video</Text>
                  <Text style={[styles.counter, { color: theme.colors.muted }]}>{media.length}/{MAX_MEDIA}</Text>
                </View>
                <Pressable
                  onPress={pickMedia}
                  style={[styles.mediaPickerBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                  disabled={saving || deleting}
                >
                  <Ionicons name="images-outline" size={20} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Chọn ảnh hoặc video</Text>
                </Pressable>

                {media.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {media.map((item, index) => (
                        <View key={`${item.uri}-${index}`} style={styles.mediaThumbWrap}>
                          <Image source={{ uri: item.uri }} style={styles.mediaThumb} />
                          <View style={styles.mediaTypeBadge}>
                            <Ionicons name={item.type.startsWith('video/') ? 'videocam' : 'image'} size={11} color="white" />
                            <Text style={styles.mediaTypeText}>{mediaTypeLabel(item.type)}</Text>
                          </View>
                          <Pressable
                            onPress={() => setMedia((prev) => prev.filter((_, i) => i !== index))}
                            style={styles.removeMediaBtn}
                          >
                            <Ionicons name="close" size={14} color="white" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </>
            )}

            <View style={styles.actions}>
              {editing && (
                <Pressable
                  onPress={confirmDelete}
                  disabled={saving || deleting}
                  style={[styles.deleteBtn, { borderColor: theme.colors.error }]}
                >
                  {deleting ? (
                    <ActivityIndicator color={theme.colors.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  )}
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                disabled={saving || deleting}
                style={[styles.secondaryBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Huỷ</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                style={[styles.primaryBtn, { backgroundColor: canSave ? theme.colors.primary : theme.colors.border }]}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="white" />
                    <Text style={styles.primaryBtnText}>{editing ? 'Lưu thay đổi' : 'Lưu kỷ niệm'}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
      <AppDialog
        visible={Boolean(dialogConfig?.visible)}
        title={dialogConfig?.title || ''}
        message={dialogConfig?.message}
        variant={dialogConfig?.variant}
        iconName={dialogConfig?.iconName}
        confirmText={dialogConfig?.confirmText}
        cancelText={dialogConfig?.cancelText}
        singleButton={dialogConfig?.singleButton}
        loading={dialogConfig?.loading}
        onConfirm={dialogConfig?.onConfirm}
        onCancel={dialogConfig?.onCancel || (() => setDialogConfig(null))}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  title: { fontSize: 21, fontWeight: '800', marginBottom: 4 },
  helper: { fontSize: 12.5, lineHeight: 18 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 13,
    fontSize: 14,
    lineHeight: 20,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 11,
    marginTop: 5,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  visibilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
  },
  mediaPickerBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 8,
  },
  mediaThumbWrap: {
    width: 112,
    height: 112,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DDD',
  },
  mediaTypeBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  mediaTypeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    minWidth: 82,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
});
