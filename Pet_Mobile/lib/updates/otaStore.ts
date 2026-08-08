import { useState, useEffect } from 'react';

export interface OTAUpdateInfo {
  version: string;
  updateGroup: string;
  runtimeVersion: string;
  channel: string;
  releaseDate: string;
  isMandatory: boolean;
  changelog: string[];
}

export interface OTAState {
  hasUpdate: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  dismissedUpdateGroup: string | null;
  updateInfo: OTAUpdateInfo | null;
  error: string | null;
}

let memoryState: OTAState = {
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

  dismissBanner(updateGroup: string) {
    memoryState = { ...memoryState, dismissedUpdateGroup: updateGroup };
    notify();
  },
};

export function useOTAStore(): OTAState {
  const [state, setState] = useState<OTAState>(otaStore.getState());

  useEffect(() => {
    const unsubscribe = otaStore.subscribe(() => {
      setState(otaStore.getState());
    });
    return unsubscribe;
  }, []);

  return state;
}
