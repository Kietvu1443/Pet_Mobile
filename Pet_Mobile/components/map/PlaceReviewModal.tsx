import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { submitPlaceReview } from '../../lib/api/places';

interface PlaceReviewModalProps {
  visible: boolean;
  placeId: number;
  placeName: string;
  initialRating?: number;
  initialComment?: string | null;
  onClose: () => void;
  onSuccess: (newRatingAvg: number, newReviewCount: number) => void;
}

export function PlaceReviewModal({
  visible,
  placeId,
  placeName,
  initialRating = 5,
  initialComment = '',
  onClose,
  onSuccess,
}: PlaceReviewModalProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState<string>(initialComment || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Vui lòng chọn từ 1 đến 5 sao');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await submitPlaceReview(placeId, {
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess(res.rating_avg, res.review_count);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Đánh giá địa điểm</Text>
                  <Text numberOfLines={1} style={styles.subtitle}>
                    {placeName}
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={22} color="#64748B" />
                </Pressable>
              </View>

              {/* Star Rating Select */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={8}
                    style={styles.starPressable}
                  >
                    <MaterialIcons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </Pressable>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {rating === 5 && 'Tuyệt vời! 😍'}
                {rating === 4 && 'Rất tốt! 😊'}
                {rating === 3 && 'Bình thường 🙂'}
                {rating === 2 && 'Chưa hài lòng 🙁'}
                {rating === 1 && 'Rất tệ 😡'}
              </Text>

              {/* Comment Input */}
              <View style={styles.inputWrap}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  style={styles.textInput}
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.85 },
                  loading && { opacity: 0.6 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Gửi đánh giá 🌟</Text>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    maxWidth: 260,
  },
  closeBtn: {
    padding: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starPressable: {
    padding: 2,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 18,
  },
  inputWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
    height: 90,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#00220F',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
