// Shared type definitions used across main, preload, and renderer processes.
// This file must not import anything from Electron or Node so it stays usable
// on both sides of the context bridge.

export type KeyboardLanguage = 'fa' | 'en';

export type ThemeMode = 'dark' | 'light' | 'system';

export type SpeechEngine = 'web-speech' | 'whisper-local' | 'windows-speech';

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppSettings {
  theme: ThemeMode;
  alwaysOnTop: boolean;
  startWithWindows: boolean;
  keyboardLanguage: KeyboardLanguage;
  speechLanguage: KeyboardLanguage;
  speechEngine: SpeechEngine;
  microphoneDeviceId: string | null;
  voiceTimeoutMs: number;
  autoPunctuation: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  windowBounds: WindowBounds | null;
  windowOpacity: number;
  keySoundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  alwaysOnTop: true,
  startWithWindows: false,
  keyboardLanguage: 'en',
  speechLanguage: 'en',
  speechEngine: 'web-speech',
  microphoneDeviceId: null,
  voiceTimeoutMs: 8000,
  autoPunctuation: true,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  windowBounds: null,
  windowOpacity: 1,
  keySoundEnabled: false,
};

export interface InjectTextPayload {
  text: string;
  /** If true, sends as literal keystrokes instead of clipboard-paste. */
  forceKeystrokes?: boolean;
}

export interface InjectKeyPayload {
  /**
   * Either a named special key (Enter, Backspace, arrows, ...) or a single
   * lowercase a-z letter/digit for shortcut combos like Ctrl+C, Ctrl+V,
   * Ctrl+A, Ctrl+Z. Letters are only meaningful when `modifiers` is
   * non-empty; plain letter typing always goes through injectText instead.
   */
  key: SpecialKey | string;
  modifiers?: KeyModifier[];
}

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'win';

export type SpecialKey =
  | 'Backspace'
  | 'Enter'
  | 'Tab'
  | 'Space'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'Delete'
  | 'Escape'
  | 'Home'
  | 'End';

export interface ForegroundWindowInfo {
  title: string;
  processName: string | null;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

/**
 * The full API surface exposed on `window.traderKeyboard` by the preload
 * script. Kept here so renderer code gets type-checked calls without
 * importing anything Electron-specific.
 */
export interface TraderKeyboardAPI {
  settings: {
    get: () => Promise<AppSettings>;
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<AppSettings>;
    setAll: (settings: AppSettings) => Promise<AppSettings>;
    reset: () => Promise<AppSettings>;
  };
  input: {
    injectText: (payload: InjectTextPayload) => Promise<{ success: boolean; error?: string }>;
    injectKey: (payload: InjectKeyPayload) => Promise<{ success: boolean; error?: string }>;
    getForegroundWindow: () => Promise<ForegroundWindowInfo | null>;
  };
  window: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    toggleAlwaysOnTop: (value: boolean) => Promise<void>;
    getBounds: () => Promise<WindowBounds>;
    setBounds: (bounds: WindowBounds) => Promise<void>;
  };
  system: {
    getPlatformInfo: () => Promise<{ platform: string; version: string; arch: string }>;
    getMicrophones: () => Promise<MicrophoneDevice[]>;
  };
  log: {
    write: (entry: LogEntry) => Promise<void>;
    onError: (callback: (message: string) => void) => () => void;
  };
}
