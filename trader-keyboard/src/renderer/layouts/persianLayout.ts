import { KeyRow } from './englishLayout';

// Standard Persian (Farsi) keyboard layout, matching the layout used by
// Windows' built-in "Persian" input method so muscle memory transfers.
export const PERSIAN_ROWS: KeyRow[] = [
  [
    { normal: '\u067e', shifted: '\u0651' }, // پ / ّ
    { normal: '1', shifted: '!' },
    { normal: '2', shifted: '\u066c' }, // ٬
    { normal: '3', shifted: '\u066b' }, // ٫
    { normal: '4', shifted: '\ufdfc' }, // ﷼ (Rial sign)
    { normal: '5', shifted: '%' },
    { normal: '6', shifted: '\u00d7' },
    { normal: '7', shifted: '\u060c' }, // ،
    { normal: '8', shifted: '*' },
    { normal: '9', shifted: ')' },
    { normal: '0', shifted: '(' },
    { normal: '-', shifted: '_' },
    { normal: '=', shifted: '+' },
  ],
  [
    { normal: '\u0636', shifted: '\u064e' }, // ض / َ
    { normal: '\u0635', shifted: '\u064b' }, // ص / ً
    { normal: '\u062b', shifted: '\u064f' }, // ث / ُ
    { normal: '\u0642', shifted: '\u064c' }, // ق / ٌ
    { normal: '\u0641', shifted: '\u0644' }, // ف / ل
    { normal: '\u063a', shifted: '\u0625' }, // غ / إ
    { normal: '\u0639', shifted: '\u0621' }, // ع / ء
    { normal: '\u0647', shifted: '\u0629' }, // ه / ة
    { normal: '\u062e', shifted: '\u064d' }, // خ / ٍ
    { normal: '\u062d', shifted: '\u060c' }, // ح / ،
    { normal: '\u062c', shifted: ']' },
    { normal: '\u0686', shifted: '[' },
  ],
  [
    { normal: '\u0634', shifted: '\u0624' }, // ش / ؤ
    { normal: '\u0633', shifted: '\u0626' }, // س / ئ
    { normal: '\u06cc', shifted: '\u0649' }, // ی / ى
    { normal: '\u0628', shifted: '\u0628' }, // ب
    { normal: '\u0644', shifted: '\u0644' }, // ل
    { normal: '\u0627', shifted: '\u0622' }, // ا / آ
    { normal: '\u062a', shifted: '\u0629' }, // ت / ة
    { normal: '\u0646', shifted: '\u060c' }, // ن / ،
    { normal: '\u0645', shifted: '\u0645' }, // م
    { normal: '\u06a9', shifted: '\u0643' }, // ک / ك
    { normal: '\u06af', shifted: '\u06af' }, // گ
  ],
  [
    { normal: '\u0638', shifted: '\u0638' }, // ظ
    { normal: '\u0637', shifted: '\u0637' }, // ط
    { normal: '\u0632', shifted: '\u0698' }, // ز / ژ
    { normal: '\u0631', shifted: '\u0631' }, // ر
    { normal: '\u0630', shifted: '\u0630' }, // ذ
    { normal: '\u062f', shifted: '\u062f' }, // د
    { normal: '\u067e', shifted: '\u067e' }, // پ
    { normal: '\u0648', shifted: '\u0621' }, // و / ء
    { normal: '.', shifted: '\u061b' }, // ؛
    { normal: '/', shifted: '\u061f' }, // ؟
  ],
];
