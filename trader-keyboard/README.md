# Trader Keyboard

An always-on-top virtual keyboard for Windows with Persian and English layouts and voice typing. Click into any application — Word, Notepad, Chrome, Telegram, VS Code, whatever has focus — and Trader Keyboard types directly into it.

## Features

- On-screen Persian (ISIRI-style) and English (QWERTY) keyboard layouts, with Shift, Caps Lock, Ctrl, Alt, arrows, Backspace, Enter, Tab, and a language-switch key
- Voice typing in Persian (`fa-IR`) and English (`en-US`) via the browser's built-in speech recognition, with auto-punctuation and a configurable silence timeout
- Reliable text injection into the currently focused window using OS-level keystroke simulation, with an automatic clipboard-paste path for non-ASCII text (Persian, accented characters, emoji)
- Resizable, movable, frameless window with dark/light/system themes, adjustable opacity, and an "always on top" pin
- Runs from the system tray; closing the window hides it rather than quitting
- Non-focus-stealing: clicking keyboard keys never takes focus away from your target app
- Settings: microphone selection, speech engine, speech language, theme, start-with-Windows, always-on-top, voice timeout, auto-punctuation, noise suppression, echo cancellation, automatic gain control
- No telemetry, no ads, no network calls except to the browser's speech-recognition service while actively listening

## Requirements

- Windows 10 or 11, 64-bit
- Node.js 18+ and npm, for building from source
- Text injection depends on `@nut-tree-fork/nut-js`, which wraps a native addon (`libnut`). Prebuilt binaries are published for common Node/Electron ABI versions and are used automatically when available; if `npm install` needs to compile from source on your machine, it will require the [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) toolchain (Visual Studio Build Tools + Python). If `npm install` fails specifically on `@nut-tree-fork/*` packages, install those build tools first and retry.

## Getting started

```bash
npm install
npm run dev
```

This starts Vite and Electron in development mode with hot reload.

## Building the Windows installer locally

```bash
npm install
npm run build
```

This runs the TypeScript build, bundles the renderer and main/preload processes with Vite, and invokes `electron-builder` to produce:

```
release/TraderKeyboard Setup <version>.exe
```

## Building via GitHub Actions (recommended)

The repository includes a GitHub Actions workflow (`.github/workflows/build.yml`) that builds the Windows installer on a real Windows runner. **This is the easiest way to get a working `.exe` without a Windows machine.**

### To trigger a build and download the installer:

**Option A — Manual trigger (quickest):**
1. Push this project to a GitHub repository
2. Go to **Actions** → **Build Windows Installer** → **Run workflow**
3. Wait ~5–10 minutes for the build to finish
4. Under the completed run, click **Artifacts** → download `TraderKeyboard-Setup`
5. Unzip and run `TraderKeyboard Setup 1.0.0.exe`

**Option B — Tag a release:**
1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions builds the installer automatically and attaches it to the GitHub Release

### Voice typing online

Voice typing uses the Web Speech API (powered by Google's cloud speech service). It requires an internet connection while the microphone button is active. No audio is stored or sent anywhere other than the recognition service during an active session.

- Persian voice typing: select **Persian** in Settings → Speech language
- English voice typing: select **English (US)** in Settings → Speech language

The "Whisper (offline)" and "Windows Speech" options in the speech engine selector are placeholders for a future release.

## How text injection works

Trader Keyboard does not attempt to locate or focus windows on your behalf — exactly like a physical keyboard, it types into whatever currently has OS focus. Click into a text field in any application first, then use the on-screen keyboard or the microphone button.

The window is set to non-focusable (`setFocusable(false)`) on Windows, which means clicking any key never steals OS focus from your target app. This is the same technique used by every professional on-screen keyboard (e.g. the built-in Windows OSK).

- Short ASCII keystrokes (regular typing) are sent as literal simulated key presses for the lowest latency and to preserve native undo/redo and key-repeat behavior in editors.
- Longer text and non-ASCII text (Persian, accented characters, punctuation from voice typing) is inserted via a clipboard-paste sequence: your current clipboard is saved, the recognized text is placed on the clipboard, `Ctrl+V` is simulated, and your original clipboard contents are restored shortly after. This is the same technique used by most production voice-typing tools because it works identically across Word, browsers, Telegram, VS Code, and plain Windows text boxes.

## Application compatibility

Works with any Windows application that accepts keyboard input:

| App | Manual typing | Voice typing |
|-----|--------------|-------------|
| Microsoft Word | ✅ | ✅ |
| Microsoft Excel | ✅ | ✅ |
| Telegram Desktop | ✅ | ✅ |
| VS Code | ✅ | ✅ |
| Chrome / Edge | ✅ | ✅ |
| Notepad | ✅ | ✅ |
| Any app with a text field | ✅ | ✅ |

## Privacy

- No analytics, telemetry, or crash-reporting SDKs
- No advertising
- Settings are stored locally only, in your Windows user profile (`%APPDATA%\trader-keyboard-settings.json` via electron-store)
- Logs are written locally only, to `%APPDATA%\TraderKeyboard\logs\main.log`, and never transmitted anywhere
- Audio is streamed to your browser's speech-recognition backend only while the microphone button is actively listening

## Project structure

```
src/
  main/        Electron main process: window/tray management, IPC handlers,
               settings persistence, native text/key injection, foreground
               window lookup, logging
  preload/     contextBridge-based secure API surface exposed to the renderer
  renderer/    React + TypeScript UI: keyboard panel, voice bar, settings
               panel, Persian/English layouts, Zustand store
  shared/      Types shared between main and renderer (no Electron/Node
               imports, safe on both sides of the context bridge)
```

## License

MIT — see [LICENSE](./LICENSE).
