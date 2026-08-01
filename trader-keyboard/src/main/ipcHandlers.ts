import { ipcMain, BrowserWindow } from 'electron';
import { settingsStore } from './settingsStore';
import { injectText, injectKey } from './inputInjector';
import { getForegroundWindowInfo } from './foregroundWindow';
import { logger } from './logger';
import os from 'node:os';
import {
  AppSettings,
  InjectKeyPayload,
  InjectTextPayload,
  LogEntry,
  WindowBounds,
} from '../shared/types';

type GetWindow = () => BrowserWindow | null;

export function registerIpcHandlers(getWindow: GetWindow): void {
  // --- Settings ---
  ipcMain.handle('settings:get', () => settingsStore.getAll());

  ipcMain.handle('settings:set', (_event, key: keyof AppSettings, value: unknown) => {
    const updated = settingsStore.set(key, value as AppSettings[typeof key]);
    if (key === 'alwaysOnTop') {
      getWindow()?.setAlwaysOnTop(Boolean(value), 'screen-saver');
    }
    return updated;
  });

  ipcMain.handle('settings:setAll', (_event, settings: AppSettings) => {
    const updated = settingsStore.setAll(settings);
    getWindow()?.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
    return updated;
  });

  ipcMain.handle('settings:reset', () => settingsStore.reset());

  // --- Input injection ---
  ipcMain.handle('input:injectText', async (_event, payload: InjectTextPayload) => {
    return injectText(payload);
  });

  ipcMain.handle('input:injectKey', async (_event, payload: InjectKeyPayload) => {
    return injectKey(payload);
  });

  ipcMain.handle('input:getForegroundWindow', async () => {
    return getForegroundWindowInfo();
  });

  // --- Window controls ---
  ipcMain.handle('window:minimize', () => {
    getWindow()?.hide();
  });

  ipcMain.handle('window:close', () => {
    getWindow()?.hide();
  });

  ipcMain.handle('window:toggleAlwaysOnTop', (_event, value: boolean) => {
    settingsStore.set('alwaysOnTop', value);
    getWindow()?.setAlwaysOnTop(value, 'screen-saver');
  });

  ipcMain.handle('window:getBounds', () => {
    const win = getWindow();
    return win ? win.getBounds() : { x: 0, y: 0, width: 900, height: 340 };
  });

  ipcMain.handle('window:setBounds', (_event, bounds: WindowBounds) => {
    getWindow()?.setBounds(bounds);
  });

  // --- System info ---
  ipcMain.handle('system:getPlatformInfo', () => ({
    platform: process.platform,
    version: os.release(),
    arch: process.arch,
  }));

  ipcMain.handle('system:getMicrophones', () => {
    // Actual device enumeration happens in the renderer via
    // navigator.mediaDevices (Chromium's media stack), since that's the
    // only place with permission-gated access to device labels. The first
    // getUserMedia() call from the renderer (see SettingsPanel) triggers
    // Windows' native microphone permission prompt automatically.
    return [];
  });

  // --- Logging ---
  ipcMain.handle('log:write', (_event, entry: LogEntry) => {
    if (entry.level === 'error') logger.error(entry.message);
    else if (entry.level === 'warn') logger.warn(entry.message);
    else logger.info(entry.message);
  });
}
