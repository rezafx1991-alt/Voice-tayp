import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppSettings,
  ForegroundWindowInfo,
  InjectKeyPayload,
  InjectTextPayload,
  LogEntry,
  MicrophoneDevice,
  TraderKeyboardAPI,
  WindowBounds,
} from '../shared/types';

// contextIsolation is enabled (see main.ts webPreferences), so this is the
// ONLY way renderer code can reach Node/Electron APIs. Nothing beyond this
// explicit, typed surface is exposed — the renderer has no access to
// require(), fs, child_process, or any other Node primitive.
const api: TraderKeyboardAPI = {
  settings: {
    get: () => ipcRenderer.invoke('settings:get') as Promise<AppSettings>,
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value) as Promise<AppSettings>,
    setAll: (settings: AppSettings) => ipcRenderer.invoke('settings:setAll', settings) as Promise<AppSettings>,
    reset: () => ipcRenderer.invoke('settings:reset') as Promise<AppSettings>,
  },
  input: {
    injectText: (payload: InjectTextPayload) => ipcRenderer.invoke('input:injectText', payload),
    injectKey: (payload: InjectKeyPayload) => ipcRenderer.invoke('input:injectKey', payload),
    getForegroundWindow: () =>
      ipcRenderer.invoke('input:getForegroundWindow') as Promise<ForegroundWindowInfo | null>,
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleAlwaysOnTop: (value: boolean) => ipcRenderer.invoke('window:toggleAlwaysOnTop', value),
    getBounds: () => ipcRenderer.invoke('window:getBounds') as Promise<WindowBounds>,
    setBounds: (bounds: WindowBounds) => ipcRenderer.invoke('window:setBounds', bounds),
  },
  system: {
    getPlatformInfo: () =>
      ipcRenderer.invoke('system:getPlatformInfo') as Promise<{
        platform: string;
        version: string;
        arch: string;
      }>,
    getMicrophones: () => ipcRenderer.invoke('system:getMicrophones') as Promise<MicrophoneDevice[]>,
  },
  log: {
    write: (entry: LogEntry) => ipcRenderer.invoke('log:write', entry),
    onError: (callback: (message: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
      ipcRenderer.on('app:error', listener);
      return () => ipcRenderer.removeListener('app:error', listener);
    },
  },
};

contextBridge.exposeInMainWorld('traderKeyboard', api);
