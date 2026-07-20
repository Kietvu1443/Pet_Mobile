import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SNAP_COLORS, SNAP_FONTS } from '@/constants/petsnap-theme';
import { formatRelativeTime } from '@/lib/utils/time';

export type NotificationPriority = 'success' | 'warning' | 'info' | 'critical';

export interface NotificationMetaConfig {
  priority: NotificationPriority;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  route: string;
  params?: (item: any) => Record<string, any>;
}

export const NOTIFICATION_META: Record<string, NotificationMetaConfig> = {
  HOUSING_APPROVED: {
    priority: 'success',
    icon: 'checkmark-circle-outline',
    color: '#34C759',
    bg: '#E8F8EE',
    route: '/housing-review',
  },
  HOUSING_REJECTED: {
    priority: 'critical',
    icon: 'close-circle-outline',
    color: '#FF4D4F',
    bg: '#FFF0F0',
    route: '/housing-review',
  },
  SHELTER_APPROVED: {
    priority: 'success',
    icon: 'business-outline',
    color: '#34C759',
    bg: '#E8F8EE',
    route: '/shelter-registration',
  },
  SHELTER_REJECTED: {
    priority: 'critical',
    icon: 'close-circle-outline',
    color: '#FF4D4F',
    bg: '#FFF0F0',
    route: '/shelter-registration',
  },
  ADOPTION_APPROVED: {
    priority: 'success',
    icon: 'heart-outline',
    color: '#FF4FA3',
    bg: '#FFF0F7',
    route: '/(tabs)/profile',
  },
  ADOPTION_REJECTED: {
    priority: 'critical',
    icon: 'heart-dislike-outline',
    color: '#888888',
    bg: '#F5F5F5',
    route: '/(tabs)/profile',
  },
  PET_RETURN_CREATED: {
    priority: 'warning',
    icon: 'arrow-undo-outline',
    color: '#FF9500',
    bg: '#FFF8E8',
    route: '/(tabs)/profile',
  },
  PET_RETURN_UPDATED: {
    priority: 'info',
    icon: 'sync-outline',
    color: '#007AFF',
    bg: '#E8F4FF',
    route: '/(tabs)/profile',
  },
  // Backward compatibility legacy support
  return_workflow: {
    priority: 'warning',
    icon: 'arrow-undo-outline',
    color: '#FF9500',
    bg: '#FFF8E8',
    route: '/(tabs)/profile',
  },
  system: {
    priority: 'info',
    icon: 'notifications-outline',
    color: '#8B5CF6',
    bg: '#F0F0FF',
    route: '/(tabs)/profile',
  },
};

const DEFAULT_META: NotificationMetaConfig = {
  priority: 'info',
  icon: 'notifications-outline',
  color: '#888888',
  bg: '#F5F5F5',
  route: '/(tabs)/profile',
};

export interface NotificationData {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: number | boolean;
  created_at: string;
}

interface NotificationItemProps {
  item: NotificationData;
  onPress: (item: NotificationData) => void;
  disabled?: boolean;
}

const NotificationItemComponent: React.FC<NotificationItemProps> = ({
  item,
  onPress,
  disabled = false,
}) => {
  const meta = NOTIFICATION_META[item.type] || DEFAULT_META;
  const isRead = !!item.is_read;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        !isRead && styles.unreadCard,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(item)}
      disabled={disabled}
    >
      {/* Visual Category Icon */}
      <View style={[styles.iconContainer, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>

      {/* Texts Column */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !isRead && styles.unreadText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.timeText}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
        <Text style={[styles.message, !isRead && styles.unreadMessage]} numberOfLines={3}>
          {item.message}
        </Text>
      </View>

      {/* Unread dot indicator */}
      {!isRead && (
        <View style={styles.unreadDot} />
      )}
    </Pressable>
  );
};

export const NotificationItem = React.memo(NotificationItemComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadCard: {
    backgroundColor: '#FAF5FF', // Subtle light violet background for unread notification items
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: SNAP_FONTS.semibold,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: '#000000',
    fontFamily: SNAP_FONTS.bold,
  },
  timeText: {
    fontSize: 12,
    fontFamily: SNAP_FONTS.regular,
    color: '#888888',
  },
  message: {
    fontSize: 13,
    fontFamily: SNAP_FONTS.regular,
    color: '#666666',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#333333',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SNAP_COLORS.like, // Deep Purple branding dot
  },
});
