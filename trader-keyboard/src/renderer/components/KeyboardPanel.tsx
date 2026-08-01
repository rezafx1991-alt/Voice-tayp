import { ArrowBigUp, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Delete, CornerDownLeft, Globe } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ENGLISH_ROWS } from '../layouts/englishLayout';
import { PERSIAN_ROWS } from '../layouts/persianLayout';
import Key from './Key';

export default function KeyboardPanel() {
  const {
    settings,
    setKeyboardLanguage,
    isShiftActive,
    isCapsLockActive,
    isCtrlActive,
    isAltActive,
    toggleShift,
    toggleCapsLock,
    toggleCtrl,
    toggleAlt,
    clearModifiers,
  } = useAppStore();

  const rows = settings.keyboardLanguage === 'fa' ? PERSIAN_ROWS : ENGLISH_ROWS;
  const isUpperCase = isShiftActive !== isCapsLockActive; // XOR: either one alone means uppercase

  const modifiers: Array<'ctrl' | 'alt' | 'shift'> = [
    ...(isCtrlActive ? (['ctrl'] as const) : []),
    ...(isAltActive ? (['alt'] as const) : []),
  ];

  const sendChar = async (char: string) => {
    if (modifiers.length > 0) {
      // Ctrl/Alt + letter combos (e.g. Ctrl+C, Ctrl+V) go through as raw
      // key combos rather than text injection. Only plain a-z letters are
      // valid combo targets; anything else (digits, Persian, accented
      // characters) is sent as text since there's no meaningful
      // Ctrl+<that character> shortcut for them here.
      const comboKey = /^[a-z]$/i.test(char) ? char.toLowerCase() : char;
      await window.traderKeyboard.input.injectKey({
        key: comboKey,
        modifiers,
      });
    } else {
      await window.traderKeyboard.input.injectText({ text: char });
    }
    if (isShiftActive && !isCapsLockActive) {
      // Shift is momentary (like a real keyboard) unless Caps Lock is on.
      toggleShift();
    }
  };

  const sendSpecial = async (key: Parameters<typeof window.traderKeyboard.input.injectKey>[0]['key']) => {
    await window.traderKeyboard.input.injectKey({ key, modifiers });
  };

  const toggleLanguage = () => {
    setKeyboardLanguage(settings.keyboardLanguage === 'fa' ? 'en' : 'fa');
  };

  return (
    <div className="flex h-full flex-col gap-1.5 p-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-1 gap-1.5">
          {row.map((keyDef, keyIndex) => {
            const char = isUpperCase ? keyDef.shifted : keyDef.normal;
            return (
              <Key
                key={keyIndex}
                label={char}
                width={keyDef.width ?? 1}
                onPress={() => void sendChar(char)}
              />
            );
          })}
        </div>
      ))}

      {/* Modifier + control row */}
      <div className="flex flex-1 gap-1.5">
        <Key
          label={<ArrowBigUp size={16} />}
          width={1.6}
          variant="modifier"
          active={isShiftActive}
          onPress={toggleShift}
        />
        <Key label="Caps" width={1.4} variant="modifier" active={isCapsLockActive} onPress={toggleCapsLock} />
        <Key label="Ctrl" width={1.2} variant="modifier" active={isCtrlActive} onPress={toggleCtrl} />
        <Key label="Alt" width={1.2} variant="modifier" active={isAltActive} onPress={toggleAlt} />
        <Key
          label={<Globe size={15} />}
          width={1.2}
          variant="accent"
          onPress={toggleLanguage}
        />
        <Key
          label="space"
          width={4}
          onPress={() => void sendSpecial('Space')}
        />
        <Key
          label={<ArrowLeft size={15} />}
          width={0.9}
          variant="modifier"
          onPress={() => void sendSpecial('ArrowLeft')}
        />
        <Key
          label={<ArrowRight size={15} />}
          width={0.9}
          variant="modifier"
          onPress={() => void sendSpecial('ArrowRight')}
        />
        <Key
          label={<ArrowUp size={15} />}
          width={0.9}
          variant="modifier"
          onPress={() => void sendSpecial('ArrowUp')}
        />
        <Key
          label={<ArrowDown size={15} />}
          width={0.9}
          variant="modifier"
          onPress={() => void sendSpecial('ArrowDown')}
        />
        <Key
          label={<Delete size={15} />}
          width={1.1}
          variant="danger"
          onPress={() => void sendSpecial('Backspace')}
        />
        <Key
          label={<CornerDownLeft size={15} />}
          width={1.3}
          variant="accent"
          onPress={() => void sendSpecial('Enter')}
        />
      </div>

      {/* Clear-modifiers helper row appears only when a sticky modifier is on */}
      {(isCtrlActive || isAltActive) && (
        <button
          className="no-drag mt-0.5 self-center rounded-full bg-white/5 px-3 py-0.5 text-[11px] text-white/50 hover:bg-white/10"
          onClick={clearModifiers}
        >
          Clear modifiers (Ctrl/Alt)
        </button>
      )}
    </div>
  );
}

