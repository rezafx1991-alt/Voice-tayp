import { create } from 'zustand';
import { AppSettings, DEFAULT_SETTINGS, KeyboardLanguage } from '@shared/types';

export type ActivePanel = 'keyboard' | 'settings';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

interface AppState {
  settings: AppSettings;
  settingsLoaded: boolean;
  activePanel: ActivePanel;
  isShiftActive: boolean;
  isCapsLockActive: boolean;
  isCtrlActive: boolean;
  isAltActive: boolean;
  voiceStatus: VoiceStatus;
  voiceError: string | null;
  interimTranscript: string;
  micLevel: number;
  foregroundAppName: string | null;

  setSettings: (settings: AppSettings) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setActivePanel: (panel: ActivePanel) => void;
  toggleShift: () => void;
  toggleCapsLock: () => void;
  toggleCtrl: () => void;
  toggleAlt: () => void;
  clearModifiers: () => void;
  setKeyboardLanguage: (lang: KeyboardLanguage) => void;
  setVoiceStatus: (status: VoiceStatus, error?: string | null) => void;
  setInterimTranscript: (text: string) => void;
  setMicLevel: (level: number) => void;
  setForegroundAppName: (name: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  settingsLoaded: false,
  activePanel: 'keyboard',
  isShiftActive: false,
  isCapsLockActive: false,
  isCtrlActive: false,
  isAltActive: false,
  voiceStatus: 'idle',
  voiceError: null,
  interimTranscript: '',
  micLevel: 0,
  foregroundAppName: null,

  setSettings: (settings) => set({ settings, settingsLoaded: true }),

  updateSetting: (key, value) => {
    const next = { ...get().settings, [key]: value };
    set({ settings: next });
    void window.traderKeyboard.settings.set(key, value);
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  toggleShift: () => set((s) => ({ isShiftActive: !s.isShiftActive })),
  toggleCapsLock: () => set((s) => ({ isCapsLockActive: !s.isCapsLockActive })),
  toggleCtrl: () => set((s) => ({ isCtrlActive: !s.isCtrlActive })),
  toggleAlt: () => set((s) => ({ isAltActive: !s.isAltActive })),
  clearModifiers: () => set({ isShiftActive: false, isCtrlActive: false, isAltActive: false }),

  setKeyboardLanguage: (lang) => {
    const next = { ...get().settings, keyboardLanguage: lang };
    set({ settings: next });
    void window.traderKeyboard.settings.set('keyboardLanguage', lang);
  },

  setVoiceStatus: (status, error = null) => set({ voiceStatus: status, voiceError: error }),
  setInterimTranscript: (text) => set({ interimTranscript: text }),
  setMicLevel: (level) => set({ micLevel: level }),
  setForegroundAppName: (name) => set({ foregroundAppName: name }),
}));
