// BestMatchProfileScreen — hồ sơ hành trình Best Match của MỘT thú cưng.
//
// Đây không phải hồ sơ thú cưng (khác với app/user-pet/[id].tsx) — đây là
// câu chuyện giữa người dùng và thú cưng đã chính thức nhận nuôi:
// "Đây là bằng chứng cho hành trình chúng ta đã đi cùng nhau."
//
// Nguồn dữ liệu: GET /api/v1/best-matches/:id (đã bao gồm sẵn stories +
// assessment, không cần gọi thêm endpoint nào khác).
//
// Cố tình KHÔNG hiển thị: % tương thích, confidence, điểm số, thanh tiến
// độ ép người dùng "phải đạt" long_term, huy hiệu XP/streak, hoặc bảng
// điều khiển bằng chứng/evidence.
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/lib/theme/ThemeContext';
import { resolveImageUrl } from '@/lib/images/resolveUrl';
import {
  fetchBestMatchProfile,
  formatJourneyDuration,
  formatJourneyStartDate,
  formatJourneyStageLabel,
  type BestMatchProfileResponse,
  type BestMatchStory,
} from '@/lib/api/bestMatches';
import { BestMatchStoryModal } from '@/components/BestMatchStoryModal';

function StoryMediaRow({ media }: { media: BestMatchStory['media'] }) {
  if (!media || media.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {media.map((m) => {
          const uri = resolveImageUrl(m.media_path);
          if (!uri) return null;
          return (
            <View key={m.id} style={styles.mediaThumbWrap}>
              <Image source={{ uri }} style={styles.mediaThumb} />
              {m.media_type === 'video' && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={14} color="white" />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function BestMatchProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bestMatchId = Number(id);

  const [data, setData] = useState<BestMatchProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingStory, setEditingStory] = useState<BestMatchStory | null>(null);

  const load = useCallback(async () => {
    if (!bestMatchId || isNaN(bestMatchId)) {
      setError('Không tìm thấy hành trình này.');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetchBestMatchProfile(bestMatchId);
      setData(res);
    } catch (err: any) {
      console.error('Fetch best match profile error:', err);
      setError(err.message || 'Không thể tải hành trình này.');
    } finally {
      setLoading(false);
    }
  }, [bestMatchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreateModal = () => {
    setEditingStory(null);
    setModalVisible(true);
  };

  const openEditModal = (story: BestMatchStory) => {
    setEditingStory(story);
    setModalVisible(true);
  };

  const handleSaved = () => {
    setModalVisible(false);
    load();
  };

  const handleDeleted = () => {
    setModalVisible(false);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.colors.background, paddingHorizontal: 32 }]}>
        <View style={[styles.errorIconCircle, { backgroundColor: theme.colors.errorContainer }]}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Không thể tải hành trình</Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.muted }]}>{error}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <Pressable style={[styles.errorBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => router.back()}>
            <Text style={[styles.errorBtnText, { color: theme.colors.text }]}>Quay lại</Text>
          </Pressable>
          <Pressable style={[styles.errorBtn, { backgroundColor: theme.colors.primary }]} onPress={load}>
            <Text style={[styles.errorBtnText, { color: 'white' }]}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { bestMatch, stories, assessment, is_owner } = data;
  const avatarUrl = resolveImageUrl(bestMatch.pet.avatar);
  const durationLabel = formatJourneyDuration(bestMatch.duration_days);
  const startDateLabel = formatJourneyStartDate(bestMatch.started_at);
  // Backend trả stories mới nhất trước; hiển thị dạng dòng thời gian nên đảo lại (cũ -> mới).
  const timelineStories = [...stories].reverse();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Hero */}
        <View style={styles.hero}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text style={{ fontSize: 80 }}>🐾</Text>
            </View>
          )}
          <View style={styles.heroGradientOverlay} />

          <Pressable
            style={[styles.floatingNavBtn, { top: insets.top + 12, left: 20, backgroundColor: theme.isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          <View style={styles.heroTextWrap}>
            <View style={styles.bestMatchPill}>
              <Ionicons name="infinite" size={13} color="white" />
              <Text style={styles.bestMatchPillText}>Best Match</Text>
            </View>
            <Text style={styles.heroPetName}>{bestMatch.pet.name}</Text>
            <Text style={styles.heroSince}>Cùng nhau từ {startDateLabel} · {durationLabel}</Text>
          </View>
        </View>

        <View style={[styles.contentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          {/* Journey stage — mô tả giai đoạn theo thời gian, không phải điểm số */}
          {assessment && (
            <View style={[styles.stageCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <View style={styles.rowInline}>
                <Ionicons name="leaf-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.stageLabel, { color: theme.colors.primary }]}>
                  {formatJourneyStageLabel(assessment.level)}
                </Text>
              </View>
              <Text style={[styles.stageExplanation, { color: theme.colors.text }]}>
                {assessment.explanation}
              </Text>
            </View>
          )}

          {/* Our Story */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Câu chuyện của chúng ta</Text>
            {is_owner && stories.length > 0 && (
              <Pressable style={({ pressed }) => [styles.addStoryBtn, { backgroundColor: theme.colors.primary }, pressed && { opacity: 0.85 }]} onPress={openCreateModal}>
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.addStoryBtnText}>Lưu kỷ niệm</Text>
              </Pressable>
            )}
          </View>

          {stories.length === 0 ? (
            <View style={styles.emptyStoryWrap}>
              <Text style={[styles.emptyStoryText, { color: theme.colors.muted }]}>
                Mỗi hành trình đều bắt đầu trong yên lặng.{'\n'}Khi nào bạn muốn, hãy lưu lại một kỷ niệm ở đây.
              </Text>
              {is_owner && (
                <Pressable style={({ pressed }) => [styles.saveMemoryBtn, { backgroundColor: theme.colors.primary }, pressed && { opacity: 0.85 }]} onPress={openCreateModal}>
                  <Ionicons name="heart-outline" size={16} color="white" />
                  <Text style={styles.saveMemoryBtnText}>Lưu một kỷ niệm</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.timeline}>
              {/* Mốc bắt đầu hành trình */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.colors.primary }]} />
                  <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineDate, { color: theme.colors.muted }]}>{startDateLabel}</Text>
                  <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>
                    Ngày hành trình chính thức bắt đầu
                  </Text>
                </View>
              </View>

              {timelineStories.map((story, idx) => {
                const isLast = idx === timelineStories.length - 1;
                const dateLabel = story.story_date
                  ? formatJourneyStartDate(story.story_date)
                  : formatJourneyStartDate(story.created_at);
                return (
                  <Pressable
                    key={story.id}
                    style={styles.timelineItem}
                    disabled={!is_owner}
                    onPress={() => openEditModal(story)}
                  >
                    <View style={styles.timelineRail}>
                      <View style={[styles.timelineDot, { backgroundColor: theme.colors.muted }]} />
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.colors.border }]} />}
                    </View>
                    <View style={[styles.timelineContent, styles.storyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Text style={[styles.timelineDate, { color: theme.colors.muted }]}>{dateLabel}</Text>
                      {story.title ? (
                        <Text style={[styles.timelineTitle, { color: theme.colors.text }]}>{story.title}</Text>
                      ) : null}
                      <Text style={[styles.storyContent, { color: theme.colors.text }]} numberOfLines={6}>
                        {story.content}
                      </Text>
                      <StoryMediaRow media={story.media} />
                      {story.visibility === 'private' && (
                        <View style={styles.privacyRow}>
                          <Ionicons name="lock-closed-outline" size={11} color={theme.colors.muted} />
                          <Text style={[styles.privacyText, { color: theme.colors.muted }]}>Riêng tư</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {is_owner && (
        <BestMatchStoryModal
          visible={modalVisible}
          bestMatchId={bestMatchId}
          story={editingStory}
          onClose={() => setModalVisible(false)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorIconCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  errorTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  errorSubtitle: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
  errorBtn: { borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, borderWidth: 1 },
  errorBtnText: { fontSize: 14, fontWeight: '700' },

  hero: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  floatingNavBtn: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  heroTextWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  bestMatchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217,143,43,0.9)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 8,
  },
  bestMatchPillText: { color: 'white', fontSize: 12, fontWeight: '700' },
  heroPetName: { color: 'white', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  heroSince: { color: 'rgba(255,255,255,0.9)', fontSize: 13.5 },

  contentCard: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    minHeight: 300,
  },
  stageCard: { borderRadius: 18, padding: 16, marginBottom: 24 },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stageLabel: { fontSize: 14, fontWeight: '800' },
  stageExplanation: { fontSize: 13, lineHeight: 19, marginTop: 8 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  addStoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  addStoryBtnText: { color: 'white', fontSize: 12.5, fontWeight: '700' },

  emptyStoryWrap: { alignItems: 'center', paddingVertical: 24 },
  emptyStoryText: { fontSize: 13.5, lineHeight: 21, textAlign: 'center', marginBottom: 18 },
  saveMemoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 13 },
  saveMemoryBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },

  timeline: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center', width: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineDate: { fontSize: 11.5, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  timelineTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  storyCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 4 },
  storyContent: { fontSize: 13.5, lineHeight: 20 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  privacyText: { fontSize: 11 },

  mediaThumbWrap: { position: 'relative' },
  mediaThumb: { width: 72, height: 72, borderRadius: 12 },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12,
  },
});
