import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import TitleBar from './components/TitleBar';
import KeyboardPanel from './components/KeyboardPanel';
import SettingsPanel from './components/SettingsPanel';
import VoiceBar from './components/VoiceBar';

export default function App() {
  const { settings, settingsLoaded, activePanel, setSettings, setForegroundAppName } = useAppStore();

  useEffect(() => {
    window.traderKeyboard.settings.get().then(setSettings);
  }, [setSettings]);

  // Periodically poll which application currently has OS focus, purely to
  // show a friendly "typing into: X" hint in the title bar. This has no
  // effect on where keystrokes are actually sent — injection always targets
  // whatever the OS reports as focused at press-time, independent of this
  // display-only poll.
  useEffect(() => {
    if (!settingsLoaded) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const info = await window.traderKeyboard.input.getForegroundWindow();
        if (!cancelled) {
          setForegroundAppName(info?.processName || info?.title || null);
        }
      } catch {
        if (!cancelled) setForegroundAppName(null);
      }
    };

    void poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [settingsLoaded, setForegroundAppName]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (mode: typeof settings.theme) => {
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', mode === 'dark');
      }
    };
    if (settingsLoaded) applyTheme(settings.theme);
  }, [settings.theme, settingsLoaded]);

  useEffect(() => {
    document.documentElement.dir = settings.keyboardLanguage === 'fa' ? 'rtl' : 'ltr';
  }, [settings.keyboardLanguage]);

  if (!settingsLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface text-white/60 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden rounded-xl2 border border-white/10 bg-surface/95 dark:bg-surface/95 text-white shadow-panel backdrop-blur-xl"
      style={{ opacity: settings.windowOpacity }}
    >
      <TitleBar />
      <VoiceBar />
      <div className="flex-1 overflow-hidden">
        {activePanel === 'keyboard' ? <KeyboardPanel /> : <SettingsPanel />}
      </div>
    </div>
  );
}
