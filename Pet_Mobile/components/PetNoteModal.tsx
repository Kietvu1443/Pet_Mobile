import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchPetNote,
  savePetNote,
  deletePetNote,
  type RawPetNote,
} from '@/lib/api/notes';
import { useTheme } from '@/lib/theme/ThemeContext';

const MAX_NOTE_LENGTH = 500;

export function PetNoteModal({
  visible,
  petId,
  petName,
  onClose,
}: {
  visible: boolean;
  petId: number | null;
  petName?: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Fetch note
  const noteQuery = useQuery({
    queryKey: ['note', petId],
    queryFn: async () => {
      if (!petId) return null;
      const res = await fetchPetNote(petId);
      return res.note;
    },
    enabled: visible && petId !== null,
  });

  // Sync state when query data changes
  useEffect(() => {
    if (noteQuery.data !== undefined) {
      setContent(noteQuery.data?.content || '');
    }
  }, [noteQuery.data]);

  // Mutation: Save Note
  const saveMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (!petId) return null;
      const res = await savePetNote(petId, newContent);
      return res.note;
    },
    onMutate: async (newContent) => {
      await queryClient.cancelQueries({ queryKey: ['note', petId] });
      const previousNote = queryClient.getQueryData<RawPetNote | null>(['note', petId]);

      const optimisticNote: RawPetNote = {
        id: previousNote?.id || Date.now(),
        user_id: 0,
        pet_id: petId || 0,
        content: newContent,
        created_at: previousNote?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['note', petId], optimisticNote);
      return { previousNote };
    },
    onError: (_err, _newContent, context) => {
      if (context) {
        queryClient.setQueryData(['note', petId], context.previousNote);
      }
      showToast('Không thể lưu ghi chú, vui lòng thử lại');
    },
    onSuccess: () => {
      showToast('Đã lưu ghi chú thành công!');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['note', petId] });
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Mutation: Delete Note
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!petId) return;
      await deletePetNote(petId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['note', petId] });
      const previousNote = queryClient.getQueryData<RawPetNote | null>(['note', petId]);
      queryClient.setQueryData(['note', petId], null);
      return { previousNote };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['note', petId], context.previousNote);
      }
      showToast('Không thể xóa ghi chú');
    },
    onSuccess: () => {
      setContent('');
      showToast('Đã xóa ghi chú!');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['note', petId] });
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (!visible || !petId) return null;

  const remainingChars = MAX_NOTE_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;
  const hasExistingNote = Boolean(noteQuery.data?.content);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={[styles.title, { color: theme.colors.text }]}>Ghi chú cá nhân</Text>
                {petName ? (
                  <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
                    Dành riêng cho {petName}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          {/* Toast feedback */}
          {toastMessage ? (
            <View
              style={[
                styles.toastBanner,
                { backgroundColor: `${theme.colors.primary}18`, borderColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.toastText, { color: theme.colors.primary }]}>{toastMessage}</Text>
            </View>
          ) : null}

          {/* Editor Body */}
          {noteQuery.isLoading ? (
            <ActivityIndicator style={{ marginVertical: 30 }} color={theme.colors.primary} />
          ) : (
            <View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.surface,
                    borderColor: isOverLimit ? theme.colors.notification : theme.colors.border,
                  },
                ]}
                placeholder="Ví dụ: Gọi chủ vào buổi tối, bé thích ăn cá sấy, nhà gần trường học..."
                placeholderTextColor={theme.colors.muted}
                multiline
                numberOfLines={4}
                maxLength={MAX_NOTE_LENGTH + 50} // Allow typing slightly over to show warning
                value={content}
                onChangeText={setContent}
                autoFocus
              />

              {/* Character Counter */}
              <View style={styles.counterRow}>
                <Text
                  style={[
                    styles.counterText,
                    { color: isOverLimit ? theme.colors.notification : theme.colors.muted },
                  ]}
                >
                  {remainingChars >= 0
                    ? `Còn lại ${remainingChars} ký tự`
                    : `Vượt quá ${Math.abs(remainingChars)} ký tự`}
                </Text>
              </View>

              {/* Actions Footer */}
              <View style={styles.actionsRow}>
                {hasExistingNote && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteBtn,
                      pressed && { opacity: 0.8 },
                      deleteMutation.isPending && { opacity: 0.5 },
                    ]}
                    onPress={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.notification} />
                    <Text style={[styles.deleteBtnText, { color: theme.colors.notification }]}>
                      Xóa
                    </Text>
                  </Pressable>
                )}

                <View style={{ flex: 1 }} />

                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={[styles.cancelBtnText, { color: theme.colors.muted }]}>Hủy</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: theme.colors.primary },
                    (saveMutation.isPending || isOverLimit) && { opacity: 0.6 },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => saveMutation.mutate(content)}
                  disabled={saveMutation.isPending || isOverLimit}
                >
                  <Text style={styles.saveBtnText}>
                    {saveMutation.isPending ? 'Đang lưu...' : 'Lưu ghi chú'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  toastText: { fontSize: 13, fontWeight: '700', flex: 1 },
  textArea: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 110,
    maxHeight: 160,
    fontSize: 14,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 16,
  },
  counterText: { fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
});
