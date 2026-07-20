/**
 * Relative time formatter supporting multiple locales (vi, en)
 */
export function formatRelativeTime(dateString: string, locale: 'vi' | 'en' = 'vi'): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Guard for invalid dates
  if (isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  const strings = {
    vi: {
      justNow: 'Vừa xong',
      minutesAgo: (m: number) => `${m} phút trước`,
      hoursAgo: (h: number) => `${h} giờ trước`,
      yesterday: 'Hôm qua',
      daysAgo: (d: number) => `${d} ngày trước`,
      longDate: (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    },
    en: {
      justNow: 'Just now',
      minutesAgo: (m: number) => `${m} minutes ago`,
      hoursAgo: (h: number) => `${h} hours ago`,
      yesterday: 'Yesterday',
      daysAgo: (d: number) => `${d} days ago`,
      longDate: (d: Date) => d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    },
  };

  const currentStrings = strings[locale] || strings.vi;

  // For future offset or slight timezone discrepancy
  if (diffSecs < 5) {
    return currentStrings.justNow;
  }

  if (diffSecs < 60) {
    return currentStrings.justNow;
  } else if (diffMins < 60) {
    return currentStrings.minutesAgo(diffMins);
  } else if (diffHrs < 24) {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return currentStrings.yesterday;
    }
    return currentStrings.hoursAgo(diffHrs);
  } else if (diffDays === 1) {
    return currentStrings.yesterday;
  } else if (diffDays < 7) {
    return currentStrings.daysAgo(diffDays);
  } else {
    return currentStrings.longDate(date);
  }
}
