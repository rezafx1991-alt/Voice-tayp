import { clipboard } from 'electron';
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
//
// IMPORTANT: nut-js is loaded LAZILY (on first use) rather than at import
// time. Loading it at startup hooks into Windows low-level input APIs
// synchronously, which can freeze the system during installation or on slow
// machines. Lazy loading defers this until the user actually presses a key.

type NutKeyboard = typeof import('@nut-tree-fork/nut-js').keyboard;
type NutKey     = typeof import('@nut-tree-fork/nut-js').Key;

let _keyboard: NutKeyboard | null = null;
let _Key: NutKey | null = null;
let _nutError: Error | null = null;

async function getNut(): Promise<{ keyboard: NutKeyboard; Key: NutKey } | null> {
  if (_nutError) return null;          // already failed once — don't retry
  if (_keyboard && _Key) return { keyboard: _keyboard, Key: _Key };

  try {
    const nut = await import('@nut-tree-fork/nut-js');
    _keyboard = nut.keyboard;
    _Key      = nut.Key;
    _keyboard.config.autoDelayMs = 0;
    logger.info('nut-js loaded successfully');
    return { keyboard: _keyboard, Key: _Key };
  } catch (err) {
    _nutError = err instanceof Error ? err : new Error(String(err));
    logger.error('Failed to load nut-js:', _nutError);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Key maps (built lazily once Key enum is available)
// ---------------------------------------------------------------------------

function getModifierMap(Key: NutKey): Record<KeyModifier, InstanceType<NutKey>> {
  return {
    ctrl:  Key.LeftControl,
    alt:   Key.LeftAlt,
    shift: Key.LeftShift,
    win:   Key.LeftSuper,
  } as unknown as Record<KeyModifier, InstanceType<NutKey>>;
}

function getSpecialKeyMap(Key: NutKey): Record<SpecialKey, InstanceType<NutKey>> {
  return {
    Backspace:  Key.Backspace,
    Enter:      Key.Enter,
    Tab:        Key.Tab,
    Space:      Key.Space,
    ArrowLeft:  Key.Left,
    ArrowRight: Key.Right,
    ArrowUp:    Key.Up,
    ArrowDown:  Key.Down,
    Delete:     Key.Delete,
    Escape:     Key.Escape,
    Home:       Key.Home,
    End:        Key.End,
  } as unknown as Record<SpecialKey, InstanceType<NutKey>>;
}

// ---------------------------------------------------------------------------
// Text injection
// ---------------------------------------------------------------------------

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
async function typeViaClipboard(
  keyboard: NutKeyboard,
  Key: NutKey,
  text: string,
): Promise<void> {
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

export async function injectText(payload: InjectTextPayload): Promise<{ success: boolean; error?: string }> {
  const { text, forceKeystrokes } = payload;
  if (!text) return { success: true };

  const nut = await getNut();
  if (!nut) {
    return { success: false, error: 'Input injection unavailable (nut-js failed to load)' };
  }

  try {
    const { keyboard, Key } = nut;
    const isAsciiOnly = text.split('').every(c => c.charCodeAt(0) < 128);
    if (forceKeystrokes || (isAsciiOnly && text.length <= 4)) {
      await keyboard.type(text);
    } else {
      await typeViaClipboard(keyboard, Key, text);
    }
    return { success: true };
  } catch (error) {
    logger.error('injectText failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ---------------------------------------------------------------------------
// Key injection
// ---------------------------------------------------------------------------

function resolveKey(key: string, Key: NutKey): InstanceType<NutKey> {
  const specialMap = getSpecialKeyMap(Key);
  if (key in specialMap) {
    return specialMap[key as SpecialKey];
  }

  // Single lowercase letter combo target (Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Z, ...)
  if (/^[a-z]$/.test(key)) {
    const letterKeyName = key.toUpperCase() as keyof typeof Key;
    const mapped = (Key as unknown as Record<string, unknown>)[letterKeyName];
    if (typeof mapped === 'number') {
      return mapped as InstanceType<NutKey>;
    }
  }

  throw new Error(`Unsupported key: ${key}`);
}

export async function injectKey(payload: InjectKeyPayload): Promise<{ success: boolean; error?: string }> {
  const { key, modifiers = [] } = payload;

  const nut = await getNut();
  if (!nut) {
    return { success: false, error: 'Input injection unavailable (nut-js failed to load)' };
  }

  try {
    const { keyboard, Key } = nut;
    const modifierMap = getModifierMap(Key);
    const mappedModifiers = modifiers.map((m) => modifierMap[m]);
    const mappedKey = resolveKey(key, Key);

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
