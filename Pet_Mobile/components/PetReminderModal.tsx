import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import {
  cancelPetReminder,
  getPetReminder,
  schedulePetReminder,
} from '@/lib/notifications/reminders';
import { fetchMySuperliked } from '@/lib/api/favorites';
import { useTheme } from '@/lib/theme/ThemeContext';

type Props = {
  visible: boolean;
  petId: number | null;
  petName?: string;
  onClose: () => void;
};

export function PetReminderModal({ visible, petId, petName = 'thú cưng', onClose }: Props) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom DateTimePicker State
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [isCustomSelected, setIsCustomSelected] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Query existing reminder
  const reminderQuery = useQuery({
    queryKey: ['reminder', petId],
    queryFn: async () => {
      if (!petId) return null;
      return await getPetReminder(petId);
    },
    enabled: Boolean(visible && petId),
  });

  const existingReminder = reminderQuery.data;

  const handleOpenCustomPicker = () => {
    const start = selectedDate || new Date(Date.now() + 60 * 60 * 1000);
    setTempDate(start);
    setPickerMode('date');
  };

  const handlePickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') {
      setPickerMode(null);
      return;
    }
    if (date) {
      if (pickerMode === 'date') {
        const merged = new Date(tempDate);
        merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setTempDate(merged);
        if (Platform.OS === 'android') {
          setPickerMode('time');
        } else {
          // On iOS
          setPickerMode('time');
        }
      } else if (pickerMode === 'time') {
        const merged = new Date(tempDate);
        merged.setHours(date.getHours(), date.getMinutes(), 0, 0);

        if (merged.getTime() <= Date.now()) {
          showToast('Vui lòng chọn mốc thời gian ở tương lai');
          setPickerMode(null);
          return;
        }

        setSelectedDate(merged);
        setIsCustomSelected(true);
        setPickerMode(null);
      }
    }
  };

  // Presets calculation
  const presets = useMemo(() => {
    const now = new Date();

    // 1. Sau 1 phút (Test)
    const in1Min = new Date(now.getTime() + 60 * 1000);

    // 2. Tối nay (20:00)
    const tonight = new Date(now);
    tonight.setHours(20, 0, 0, 0);
    if (tonight.getTime() <= now.getTime()) {
      tonight.setDate(tonight.getDate() + 1);
    }

    // 3. Sáng mai (09:00)
    const tomorrowMorning = new Date(now);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(9, 0, 0, 0);

    // 4. Cuối tuần này (Thứ 7 10:00)
    const weekend = new Date(now);
    const dayOfWeek = weekend.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    weekend.setDate(weekend.getDate() + daysUntilSaturday);
    weekend.setHours(10, 0, 0, 0);

    // 5. Tuần sau (Thứ 2 09:00)
    const nextWeek = new Date(now);
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    nextWeek.setDate(nextWeek.getDate() + daysUntilMonday);
    nextWeek.setHours(9, 0, 0, 0);

    return [
      { id: '1min', label: '⚡ 1 phút tới', date: in1Min },
      { id: 'tonight', label: '🌅 Tối nay (20:00)', date: tonight },
      { id: 'tomorrow', label: '☀️ Sáng mai (09:00)', date: tomorrowMorning },
      { id: 'weekend', label: '📅 Cuối tuần này', date: weekend },
      { id: 'nextweek', label: '🗓️ Tuần sau', date: nextWeek },
    ];
  }, []);

  const superlikedPetsQuery = useQuery({
    queryKey: ['favorites', 'superliked'],
    queryFn: async () => {
      const res = await fetchMySuperliked();
      return (res.favorites || []).map((f) => f.id);
    },
    enabled: Boolean(petId),
  });

  const isSuperliked = (superlikedPetsQuery.data || []).includes(petId || -1);

  // Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: async (dateToSchedule: Date) => {
      if (!petId) throw new Error('Thiếu petId');
      return await schedulePetReminder(petId, petName, dateToSchedule, isSuperliked);
    },
    onSuccess: (newReminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminder', petId] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });

      const timeStr = newReminder
        ? new Date(newReminder.remindAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      showToast(`✓ Đã đặt lời nhắc lúc ${timeStr}!`);
      setTimeout(() => {
        onClose();
      }, 800);
    },
    onError: (err: Error) => {
      showToast(err.message || 'Lỗi khi đặt lời nhắc');
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!petId) return;
      return await cancelPetReminder(petId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder', petId] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      showToast('✓ Đã hủy lời nhắc!');
      setSelectedDate(null);
      setTimeout(() => {
        onClose();
      }, 800);
    },
  });

  const handleSave = () => {
    if (!selectedDate) {
      showToast('Vui lòng chọn mốc thời gian nhắc nhở');
      return;
    }
    scheduleMutation.mutate(selectedDate);
  };

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Title Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="notifications" size={22} color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Đặt lời nhắc — {petName}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.muted} />
            </Pressable>
          </View>

          {/* Toast Message */}
          {toastMessage && (
            <View style={[styles.toastBanner, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.toastText, { color: theme.colors.primary }]}>{toastMessage}</Text>
            </View>
          )}

          {/* Existing Reminder Info */}
          {existingReminder ? (
            <View
              style={[
                styles.reminderInfoBox,
                { backgroundColor: `${theme.colors.primary}12`, borderColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="alarm" size={20} color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBoxTitle, { color: theme.colors.primary }]}>
                  Đã đặt lời nhắc
                </Text>
                <Text style={[styles.infoBoxDesc, { color: theme.colors.text }]}>
                  Vào lúc{' '}
                  {new Date(existingReminder.remindAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ngày{' '}
                  {new Date(existingReminder.remindAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.subtitle, { color: theme.colors.muted }]}>
              Ứng dụng sẽ gửi thông báo đến điện thoại của bạn khi đến giờ hẹn để bạn quay lại xem bé!
            </Text>
          )}

          {/* Preset Buttons */}
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Chọn thời điểm:</Text>
          <View style={styles.presetsWrap}>
            {presets.map((p) => {
              const isSelected = !isCustomSelected && selectedDate?.getTime() === p.date.getTime();
              return (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    setIsCustomSelected(false);
                    setSelectedDate(p.date);
                  }}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: isSelected ? 'white' : theme.colors.text },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Custom Picker Button */}
            <Pressable
              style={({ pressed }) => [
                styles.presetChip,
                {
                  backgroundColor: isCustomSelected ? theme.colors.primary : theme.colors.surface,
                  borderColor: isCustomSelected ? theme.colors.primary : theme.colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleOpenCustomPicker}
            >
              <Text
                style={[
                  styles.presetChipText,
                  { color: isCustomSelected ? 'white' : theme.colors.primary, fontWeight: '700' },
                ]}
              >
                📆 Tùy chỉnh ngày & giờ
              </Text>
            </Pressable>
          </View>

          {/* Custom Native DateTimePicker Component */}
          {pickerMode !== null && (
            <DateTimePicker
              value={tempDate}
              mode={pickerMode}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={handlePickerChange}
            />
          )}

          {/* Selected Date Summary */}
          {selectedDate && (
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                Hẹn giờ: {selectedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                — {selectedDate.toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            {existingReminder && (
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { borderColor: theme.colors.notification },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.notification} />
                ) : (
                  <Text style={[styles.cancelBtnText, { color: theme.colors.notification }]}>
                    Hủy nhắc
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.colors.primary },
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleSave}
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {existingReminder ? 'Đổi thời gian' : 'Đặt lời nhắc'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  modalTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  toastText: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  reminderInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBoxTitle: { fontSize: 13, fontWeight: '800' },
  infoBoxDesc: { fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  presetsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  presetChip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 12.5, fontWeight: '600' },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  summaryText: { fontSize: 12.5, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700' },
  saveBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
});
