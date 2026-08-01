import { clipboard } from 'electron';
import { keyboard, Key } from '@nut-tree-fork/nut-js';
import { logger } from './logger';
import {
  InjectKeyPayload,
  InjectTextPayload,
  KeyModifier,
  SpecialKey,
} from '../shared/types';

// nut-js issues real OS-level input events (SendInput on Windows under the
// hood), so text/keys land in whatever window currently has focus — Word,
// Chrome, Telegram, VS Code, etc. — exactly like a physical keyboard would.
// We do not attempt to find/focus a window ourselves: the user clicks into
// their target app first, which is how every on-screen keyboard behaves.

keyboard.config.autoDelayMs = 0;

const MODIFIER_MAP: Record<KeyModifier, Key> = {
  ctrl: Key.LeftControl,
  alt: Key.LeftAlt,
  shift: Key.LeftShift,
  win: Key.LeftSuper,
};

const SPECIAL_KEY_MAP: Record<SpecialKey, Key> = {
  Backspace: Key.Backspace,
  Enter: Key.Enter,
  Tab: Key.Tab,
  Space: Key.Space,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  Delete: Key.Delete,
  Escape: Key.Escape,
  Home: Key.Home,
  End: Key.End,
};

/**
 * Text containing non-ASCII characters (Persian, punctuation variants, etc.)
 * is unreliable to type key-by-key across arbitrary apps because it depends
 * on the OS keyboard layout currently active in the target window. The
 * robust cross-app approach — used by virtually every production on-screen
 * keyboard and voice-typing tool on Windows — is:
 *   1) stash current clipboard contents
 *   2) put our text on the clipboard
 *   3) send Ctrl+V to the focused window
 *   4) restore the original clipboard contents
 * This works identically in Notepad, Word, browsers, Telegram, VS Code, etc.
 * ASCII-only single characters (regular typing on the virtual keyboard) are
 * still sent as literal keystrokes for lower latency and to preserve native
 * key-repeat/undo behavior in editors.
 */
async function typeViaClipboard(text: string): Promise<void> {
  const previousClipboard = clipboard.readText();
  try {
    clipboard.writeText(text);
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
  } finally {
    // Restore whatever the user had copied before, after a short delay to
    // make sure the paste has already been processed by the target app.
    setTimeout(() => {
      clipboard.writeText(previousClipboard);
    }, 250);
  }
}

async function typeAsKeystrokes(text: string): Promise<void> {
  await keyboard.type(text);
}

export async function injectText(payload: InjectTextPayload): Promise<{ success: boolean; error?: string }> {
  const { text, forceKeystrokes } = payload;
  if (!text) return { success: true };

  try {
    const isAsciiOnly = /^[\x00-\x7F]*$/.test(text);
    if (forceKeystrokes || (isAsciiOnly && text.length <= 4)) {
      await typeAsKeystrokes(text);
    } else {
      await typeViaClipboard(text);
    }
    return { success: true };
  } catch (error) {
    logger.error('injectText failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function resolveKey(key: string): Key {
  if (key in SPECIAL_KEY_MAP) {
    return SPECIAL_KEY_MAP[key as SpecialKey];
  }

  // Single lowercase letter combo target (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Z, ...)
  if (/^[a-z]$/.test(key)) {
    const letterKeyName = key.toUpperCase() as keyof typeof Key;
    const mapped = Key[letterKeyName];
    if (typeof mapped === 'number') {
      return mapped as Key;
    }
  }

  throw new Error(`Unsupported key: ${key}`);
}

export async function injectKey(payload: InjectKeyPayload): Promise<{ success: boolean; error?: string }> {
  const { key, modifiers = [] } = payload;

  try {
    const mappedModifiers = modifiers.map((m) => MODIFIER_MAP[m]);
    const mappedKey = resolveKey(key);

    if (mappedModifiers.length > 0) {
      await keyboard.pressKey(...mappedModifiers, mappedKey);
      await keyboard.releaseKey(...mappedModifiers, mappedKey);
    } else {
      await keyboard.pressKey(mappedKey);
      await keyboard.releaseKey(mappedKey);
    }

    return { success: true };
  } catch (error) {
    logger.error('injectKey failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
