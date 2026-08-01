import Store from 'electron-store';
import { app } from 'electron';
import { AppSettings, DEFAULT_SETTINGS } from '../shared/types';

/**
 * Thin wrapper around electron-store, typed against AppSettings.
 * electron-store persists to a JSON file in the user's appData directory,
 * so settings survive restarts without any custom serialization code.
 */
class SettingsStore {
  private store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'trader-keyboard-settings',
      defaults: DEFAULT_SETTINGS,
      clearInvalidConfig: true,
    });
  }

  getAll(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...(this.store.store as Partial<AppSettings>) };
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key, DEFAULT_SETTINGS[key]);
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): AppSettings {
    this.store.set(key, value);

    if (key === 'startWithWindows') {
      this.applyStartWithWindows(value as unknown as boolean);
    }

    return this.getAll();
  }

  setAll(settings: AppSettings): AppSettings {
    this.store.set(settings);
    this.applyStartWithWindows(settings.startWithWindows);
    return this.getAll();
  }

  reset(): AppSettings {
    this.store.clear();
    this.store.set(DEFAULT_SETTINGS);
    this.applyStartWithWindows(DEFAULT_SETTINGS.startWithWindows);
    return this.getAll();
  }

  private applyStartWithWindows(enabled: boolean): void {
    if (process.platform !== 'win32') return;
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: process.execPath,
      args: ['--hidden'],
    });
  }
}

export const settingsStore = new SettingsStore();
