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
import { reportPlace } from '../../lib/api/places';

interface ReportModalProps {
  visible: boolean;
  targetId: number;
  targetType?: 'place' | 'review';
  targetName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_REASONS = [
  { id: 'incorrect_info', label: 'Sai lệch thông tin / địa chỉ' },
  { id: 'place_not_exist', label: 'Địa điểm không có thật' },
  { id: 'wrong_location', label: 'Sai vị trí tọa độ trên bản đồ' },
  { id: 'spam', label: 'Spam / Quảng cáo rác' },
  { id: 'inappropriate', label: 'Nội dung phản cảm / vi phạm' },
  { id: 'other', label: 'Lý do khác' },
] as const;

export function ReportModal({
  visible,
  targetId,
  targetType = 'place',
  targetName,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<typeof REPORT_REASONS[number]['id']>('incorrect_info');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await reportPlace(targetId, {
        target_type: targetType,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
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
                  <Text style={styles.title}>Báo cáo vi phạm</Text>
                  {targetName && (
                    <Text numberOfLines={1} style={styles.subtitle}>
                      {targetName}
                    </Text>
                  )}
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={22} color="#64748B" />
                </Pressable>
              </View>

              {/* Reason Selector */}
              <Text style={styles.sectionLabel}>Chọn lý do báo cáo:</Text>
              <View style={styles.reasonsList}>
                {REPORT_REASONS.map((r) => {
                  const isSelected = selectedReason === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setSelectedReason(r.id)}
                      style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                    >
                      <MaterialIcons
                        name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={18}
                        color={isSelected ? '#00220F' : '#94A3B8'}
                      />
                      <Text
                        style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Extra details input */}
              <View style={styles.inputWrap}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Mô tả chi tiết hơn (tùy chọn)..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
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
                  <Text style={styles.submitBtnText}>Gửi báo cáo 🚩</Text>
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
    marginBottom: 16,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  reasonsList: {
    gap: 6,
    marginBottom: 14,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  reasonItemSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reasonLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  reasonLabelSelected: {
    color: '#00220F',
    fontWeight: '700',
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
    height: 70,
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
    backgroundColor: '#DC2626',
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
