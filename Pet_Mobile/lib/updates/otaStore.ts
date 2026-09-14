import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const OTA_STORAGE_KEYS = {
  LAST_CHECKED_AT: 'pethelper.ota.lastCheckedAt',
  DISMISSED_UPDATE_GROUP: 'pethelper.ota.dismissedUpdateGroup',
  CURRENT_VERSION: 'pethelper.ota.currentVersion',
};

export interface OTAUpdateInfo {
  version: string;
  updateGroup: string;
  runtimeVersion: string;
  channel: string;
  releaseDate: string;
  isMandatory: boolean;
  changelog: string[];
  latestVersion?: string;
  remainingUpdatesCount?: number;
}

export interface OTAState {
  currentVersion: string;
  hasUpdate: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  dismissedUpdateGroup: string | null;
  updateInfo: OTAUpdateInfo | null;
  error: string | null;
}

let memoryState: OTAState = {
  currentVersion: '1.0.0',
  hasUpdate: false,
  isChecking: false,
  isDownloading: false,
  isDownloaded: false,
  dismissedUpdateGroup: null,
  updateInfo: null,
  error: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const otaStore = {
  getState(): OTAState {
    return memoryState;
  },

  setState(partialState: Partial<OTAState>) {
    memoryState = { ...memoryState, ...partialState };
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async dismissBanner(updateGroup: string) {
    memoryState = { ...memoryState, dismissedUpdateGroup: updateGroup };
    notify();
    try {
      await AsyncStorage.setItem(OTA_STORAGE_KEYS.DISMISSED_UPDATE_GROUP, updateGroup);
    } catch {
      // Ignore storage write error
    }
  },

  async setCurrentVersion(version: string) {
    memoryState = { ...memoryState, currentVersion: version };
    notify();
    try {
      await AsyncStorage.setItem(OTA_STORAGE_KEYS.CURRENT_VERSION, version);
    } catch {
      // Ignore storage write error
    }
  },

  async resetVersion() {
    memoryState = { ...memoryState, currentVersion: '1.0.0' };
    notify();
    try {
      await AsyncStorage.setItem(OTA_STORAGE_KEYS.CURRENT_VERSION, '1.0.0');
    } catch {
      // Ignore storage write error
    }
  },

  async initPersistedState() {
    try {
      const [dismissed, savedVersion] = await Promise.all([
        AsyncStorage.getItem(OTA_STORAGE_KEYS.DISMISSED_UPDATE_GROUP),
        AsyncStorage.getItem(OTA_STORAGE_KEYS.CURRENT_VERSION),
      ]);
      const updates: Partial<OTAState> = {};
      if (dismissed && memoryState.dismissedUpdateGroup !== dismissed) {
        updates.dismissedUpdateGroup = dismissed;
      }
      if (savedVersion && memoryState.currentVersion !== savedVersion) {
        updates.currentVersion = savedVersion;
      }
      if (Object.keys(updates).length > 0) {
        memoryState = { ...memoryState, ...updates };
        notify();
      }
    } catch {
      // Ignore storage read error
    }
  },
};

export function useOTAStore(): OTAState {
  const [state, setState] = useState<OTAState>(otaStore.getState());

  useEffect(() => {
    otaStore.initPersistedState();
    const unsubscribe = otaStore.subscribe(() => {
      setState(otaStore.getState());
    });
    return unsubscribe;
  }, []);

  return state;
}
