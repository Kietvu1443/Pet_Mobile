import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDERS_STORAGE_KEY = '@pet_helper_reminders_v1';

export type PetReminder = {
  petId: number;
  petName: string;
  notificationId: string;
  remindAt: string; // ISO Date String
  createdAt: string;
};

// Configure Notification Behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions from OS / Expo
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Nhắc nhở nhận nuôi',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4FA3',
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Get all saved reminders from AsyncStorage
 */
export async function getAllScheduledReminders(): Promise<PetReminder[]> {
  try {
    const json = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!json) return [];
    const list: PetReminder[] = JSON.parse(json);

    // Filter out reminders that have already passed by more than 1 day
    const now = new Date().getTime();
    const valid = list.filter((r) => {
      const t = new Date(r.remindAt).getTime();
      return t > now - 24 * 60 * 60 * 1000;
    });

    if (valid.length !== list.length) {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(valid));
    }

    return valid;
  } catch (error) {
    console.error('Failed to load reminders:', error);
    return [];
  }
}

/**
 * Get specific reminder for a petId
 */
export async function getPetReminder(petId: number): Promise<PetReminder | null> {
  const all = await getAllScheduledReminders();
  return all.find((r) => r.petId === petId) || null;
}

/**
 * Schedule a reminder for a pet
 */
export async function schedulePetReminder(
  petId: number,
  petName: string,
  targetDate: Date,
  isSuperliked: boolean = false
): Promise<PetReminder | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    throw new Error('Chưa cấp quyền thông báo cho ứng dụng');
  }

  // 1. Cancel existing reminder for this pet if any
  await cancelPetReminder(petId);

  // 2. Calculate trigger date
  const now = new Date();
  if (targetDate.getTime() <= now.getTime()) {
    throw new Error('Thời gian nhắc nhở phải ở tương lai');
  }

  // 3. Schedule Expo local notification
  const title = isSuperliked
    ? `⭐ Nhắc nhở ƯU TIÊN: Ghé thăm ${petName}!`
    : `⏰ Nhắc nhở: Ghé thăm ${petName}!`;
  const body = isSuperliked
    ? `⭐ Đừng bỏ lỡ bé ${petName} mà bạn đặc biệt quan tâm nhé! Đã đến giờ quay lại rồi nè 🐾`
    : `Đã đến giờ quay lại xem thông tin hoặc liên hệ nhận nuôi bé ${petName} rồi nè! 🐾`;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { petId },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: targetDate,
    },
  });

  // 4. Save to AsyncStorage
  const newReminder: PetReminder = {
    petId,
    petName,
    notificationId,
    remindAt: targetDate.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const all = await getAllScheduledReminders();
  const updated = [...all.filter((r) => r.petId !== petId), newReminder];
  await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated));

  return newReminder;
}

/**
 * Cancel a reminder for a pet
 */
export async function cancelPetReminder(petId: number): Promise<boolean> {
  try {
    const all = await getAllScheduledReminders();
    const existing = all.find((r) => r.petId === petId);

    if (existing) {
      // Cancel Expo notification
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId).catch(() => {});
      
      // Update AsyncStorage
      const updated = all.filter((r) => r.petId !== petId);
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(updated));
    }

    return true;
  } catch (error) {
    console.error('Failed to cancel reminder:', error);
    return false;
  }
}
