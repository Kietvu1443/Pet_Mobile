// Thẻ thú cưng PetSnap — cấu trúc legacy (.pet-card): CỘT DỌC.
//   - Trên : khung ảnh (flex) tràn viền + carousel + chấm chỉ số ảnh
//   - Dưới : PANEL ĐẶC màu #f2f5eb (KHÔNG phải overlay trên ảnh) — tên + "Tuổi", lưới
//            meta 2 cột (Loại/Giống/Giới tính/Màu), mô tả. Chữ tối trên nền sáng.
//
// Thuần trình bày + một state cục bộ: chỉ số ảnh đang xem. KHÔNG chứa logic vuốt deck
// (SwipeDeck lo). Điều hướng ảnh: chạm nửa trái/phải để lùi/tiến, chạm chấm để nhảy.
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SNAP_COLORS, SNAP_FONTS } from '@/constants/petsnap-theme';
import type { Pet } from '@/lib/snap/adapter';

// Một ô meta: "Nhãn: giá trị" inline, nhãn đậm — đúng legacy .pet-meta-grid span strong.
function MetaCell({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaText} numberOfLines={1}>
        <Text style={styles.metaLabel}>{label}: </Text>
        {value ?? '—'}
      </Text>
    </View>
  );
}

export function PetCard({ pet }: { pet: Pet }) {
  const photos = pet.photos;
  const [index, setIndex] = useState(0);

  const safeIndex = Math.min(index, Math.max(photos.length - 1, 0));
  const current = photos[safeIndex];

  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const next = () => setIndex((i) => Math.min(i + 1, photos.length - 1));

  return (
    <View style={styles.card}>
      {/* --- Khung ảnh (phần trên, co giãn) --- */}
      <View style={styles.imageWrap}>
        {current ? (
          <Image source={{ uri: current.uri }} style={styles.image} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackText}>Không có ảnh</Text>
          </View>
        )}

        {/* Vùng chạm lùi/tiến ảnh (chỉ khi có nhiều hơn 1 ảnh). */}
        {photos.length > 1 ? (
          <View style={styles.tapRow} pointerEvents="box-none">
            <Pressable style={styles.tapZone} onPress={prev} />
            <Pressable style={styles.tapZone} onPress={next} />
          </View>
        ) : null}

        {/* Chấm chỉ số ảnh — đáy khung ảnh, giữa (legacy .image-dots). */}
        {photos.length > 1 ? (
          <View style={styles.dots}>
            {photos.map((p, i) => (
              <Pressable key={p.id} hitSlop={6} onPress={() => setIndex(i)}>
                <View style={[styles.dot, i === safeIndex && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* --- Panel thông tin (phần dưới, nền đặc #f2f5eb) --- */}
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.age}>Tuổi: {pet.age ?? '?'}</Text>
        </View>

        <View style={styles.metaGrid}>
          <MetaCell label="Loại" value={pet.type} />
          <MetaCell label="Giống" value={pet.breed} />
          <MetaCell label="Giới tính" value={pet.gender} />
          <MetaCell label="Màu" value={pet.color} />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {pet.description || 'Chưa có mô tả.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: SNAP_COLORS.border,
    overflow: 'hidden',
    backgroundColor: SNAP_COLORS.card,
    flexDirection: 'column',
  },
  // --- Ảnh ---
  imageWrap: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#d1d5db',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1d5db',
  },
  fallbackText: {
    color: SNAP_COLORS.muted,
    fontFamily: SNAP_FONTS.semibold,
    fontSize: 16,
  },
  tapRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapZone: {
    flex: 1,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.22)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    transform: [{ scale: 1.12 }],
  },
  // --- Panel thông tin (đặc, dưới ảnh) ---
  body: {
    backgroundColor: SNAP_COLORS.panel, // #f2f5eb
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 84, // chừa chỗ cho fab nổi đè (legacy card-body padding-bottom 110)
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  name: {
    flexShrink: 1,
    color: '#1f2937',
    fontFamily: SNAP_FONTS.bold,
    fontSize: 24,
  },
  age: {
    color: '#475569',
    fontFamily: SNAP_FONTS.semibold,
    fontSize: 15,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaCell: {
    width: '50%',
    paddingVertical: 3,
    paddingRight: 12,
  },
  metaText: {
    color: '#334155',
    fontFamily: SNAP_FONTS.medium,
    fontSize: 14,
  },
  metaLabel: {
    color: '#111827',
    fontFamily: SNAP_FONTS.semibold,
  },
  description: {
    color: '#374151',
    fontFamily: SNAP_FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
});
