export type NotificationMeta = {
  priority: 'success' | 'warning' | 'info' | 'critical';
  icon: string;
  color: string;
  bg: string;
};

export const NOTIFICATION_META: Record<string, NotificationMeta> = {
  HOUSING_APPROVED: {
    priority: 'success',
    icon: 'home-outline',
    color: '#34C759',
    bg: '#E8F8EE',
  },
  HOUSING_REJECTED: {
    priority: 'warning',
    icon: 'home-outline',
    color: '#FF4D4F',
    bg: '#FFF0F0',
  },
  SHELTER_APPROVED: {
    priority: 'success',
    icon: 'shield-checkmark-outline',
    color: '#34C759',
    bg: '#E8F8EE',
  },
  SHELTER_REJECTED: {
    priority: 'warning',
    icon: 'shield-checkmark-outline',
    color: '#FF4D4F',
    bg: '#FFF0F0',
  },
  ADOPTION_APPROVED: {
    priority: 'success',
    icon: 'paw-outline',
    color: '#34C759',
    bg: '#E8F8EE',
  },
  ADOPTION_REJECTED: {
    priority: 'warning',
    icon: 'paw-outline',
    color: '#FF4D4F',
    bg: '#FFF0F0',
  },
  PET_RETURN_CREATED: {
    priority: 'info',
    icon: 'return-up-back-outline',
    color: '#3A7AFE',
    bg: '#EEF2FF',
  },
  PET_RETURN_UPDATED: {
    priority: 'info',
    icon: 'return-up-back-outline',
    color: '#FFB340',
    bg: '#FFF8E8',
  },
  __default__: {
    priority: 'info',
    icon: 'notifications-outline',
    color: '#888888',
    bg: '#F5F5F5',
  },
};
