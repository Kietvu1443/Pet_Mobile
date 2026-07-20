import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api/client';

type UnreadResponse = {
  notifications: unknown[];
  unread: number;
};

// Centralized state container
let globalUnread = 0;
let globalLoading = true;
let isFirstFetch = true;
const listeners = new Set<(unread: number, loading: boolean) => void>();

export function updateGlobalUnread(unread: number) {
  globalUnread = unread;
  globalLoading = false;
  listeners.forEach(listener => listener(globalUnread, globalLoading));
}

export function resetGlobalUnread() {
  globalUnread = 0;
  globalLoading = true;
  isFirstFetch = true;
  listeners.forEach(listener => listener(globalUnread, globalLoading));
}

export async function fetchGlobalUnread(): Promise<void> {
  try {
    const data = await apiRequest<UnreadResponse>('/notifications');
    updateGlobalUnread(data.unread ?? 0);
  } catch (err) {
    console.warn('[Push State] Failed to fetch unread count:', err);
    globalLoading = false;
    listeners.forEach(listener => listener(globalUnread, globalLoading));
  }
}

export function useUnreadNotifications() {
  const [unread, setUnread] = useState(globalUnread);
  const [loading, setLoading] = useState(globalLoading);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Synchronize state changes across all hook instances
    const listener = (newUnread: number, newLoading: boolean) => {
      if (mountedRef.current) {
        setUnread(newUnread);
        setLoading(newLoading);
      }
    };
    listeners.add(listener);

    // Initial fetch if this is the first observer mounting
    if (isFirstFetch) {
      isFirstFetch = false;
      void fetchGlobalUnread();
    }

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchGlobalUnread();
  }, []);

  return { unread, loading, refresh };
}
