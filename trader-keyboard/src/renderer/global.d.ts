import type { TraderKeyboardAPI } from '@shared/types';

// The preload script (src/preload/preload.ts) exposes this object via
// contextBridge.exposeInMainWorld('traderKeyboard', ...). This file exists
// purely so renderer TypeScript code can reference window.traderKeyboard
// with full type safety instead of `any`.
export {};

declare global {
  interface Window {
    traderKeyboard: TraderKeyboardAPI;
  }
}
