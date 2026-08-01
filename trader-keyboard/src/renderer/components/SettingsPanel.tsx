import { useEffect, useState, type ReactNode } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MicrophoneDevice, ThemeMode } from '@shared/types';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">{children}</h3>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-white/70">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="no-drag rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-accent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-surface text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function SettingsPanel() {
  const { settings, updateSetting } = useAppStore();
  const [microphones, setMicrophones] = useState<MicrophoneDevice[]>([]);

  useEffect(() => {
    // Device labels are only populated by the browser after microphone
    // permission has been granted at least once, so we request a throwaway
    // stream first purely to unlock the labels, then close it immediately.
    async function loadMicrophones() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices
          .filter((d) => d.kind === 'audioinput')
          .map((d) => ({ deviceId: d.deviceId, label: d.label || 'Microphone' }));
        setMicrophones(mics);
      } catch {
        setMicrophones([]);
      }
    }
    void loadMicrophones();
  }, []);

  const handleResetSettings = async () => {
    const defaults = await window.traderKeyboard.settings.reset();
    useAppStore.getState().setSettings(defaults);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <section className="mb-4">
        <SectionTitle>Appearance</SectionTitle>
        <Row label="Theme">
          <Select<ThemeMode>
            value={settings.theme}
            onChange={(v) => updateSetting('theme', v)}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
        <Row label="Window opacity">
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.05}
            value={settings.windowOpacity}
            onChange={(e) => updateSetting('windowOpacity', Number(e.target.value))}
            className="no-drag w-28 accent-accent"
          />
        </Row>
        <Row label="Key press sound">
          <Toggle checked={settings.keySoundEnabled} onChange={(v) => updateSetting('keySoundEnabled', v)} />
        </Row>
      </section>

      <section className="mb-4">
        <SectionTitle>Window Behavior</SectionTitle>
        <Row label="Always on top">
          <Toggle checked={settings.alwaysOnTop} onChange={(v) => updateSetting('alwaysOnTop', v)} />
        </Row>
        <Row label="Start with Windows">
          <Toggle checked={settings.startWithWindows} onChange={(v) => updateSetting('startWithWindows', v)} />
        </Row>
      </section>

      <section className="mb-4">
        <SectionTitle>Keyboard</SectionTitle>
        <Row label="Layout language">
          <Select
            value={settings.keyboardLanguage}
            onChange={(v) => updateSetting('keyboardLanguage', v)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'fa', label: 'Persian' },
            ]}
          />
        </Row>
      </section>

      <section className="mb-4">
        <SectionTitle>Voice Typing</SectionTitle>
        <Row label="Speech language">
          <Select
            value={settings.speechLanguage}
            onChange={(v) => updateSetting('speechLanguage', v)}
            options={[
              { value: 'en', label: 'English (US)' },
              { value: 'fa', label: 'Persian' },
            ]}
          />
        </Row>
        <Row label="Speech engine">
          <Select
            value={settings.speechEngine}
            onChange={(v) => updateSetting('speechEngine', v)}
            options={[
              { value: 'web-speech', label: 'Web Speech (online)' },
              { value: 'whisper-local', label: 'Whisper (offline) — coming soon' },
              { value: 'windows-speech', label: 'Windows Speech — coming soon' },
            ]}
          />
        </Row>
        <Row label="Microphone">
          <Select
            value={settings.microphoneDeviceId ?? 'default'}
            onChange={(v) => updateSetting('microphoneDeviceId', v === 'default' ? null : v)}
            options={[
              { value: 'default', label: 'System default' },
              ...microphones.map((m) => ({ value: m.deviceId, label: m.label })),
            ]}
          />
        </Row>
        <Row label="Silence timeout">
          <Select
            value={String(settings.voiceTimeoutMs)}
            onChange={(v) => updateSetting('voiceTimeoutMs', Number(v))}
            options={[
              { value: '4000', label: '4 seconds' },
              { value: '8000', label: '8 seconds' },
              { value: '15000', label: '15 seconds' },
              { value: '30000', label: '30 seconds' },
            ]}
          />
        </Row>
        <Row label="Auto punctuation">
          <Toggle checked={settings.autoPunctuation} onChange={(v) => updateSetting('autoPunctuation', v)} />
        </Row>
      </section>

      <section className="mb-4">
        <SectionTitle>Audio Processing</SectionTitle>
        <Row label="Noise suppression">
          <Toggle checked={settings.noiseSuppression} onChange={(v) => updateSetting('noiseSuppression', v)} />
        </Row>
        <Row label="Echo cancellation">
          <Toggle checked={settings.echoCancellation} onChange={(v) => updateSetting('echoCancellation', v)} />
        </Row>
        <Row label="Automatic gain control">
          <Toggle checked={settings.autoGainControl} onChange={(v) => updateSetting('autoGainControl', v)} />
        </Row>
      </section>

      <section className="mb-2">
        <SectionTitle>Privacy</SectionTitle>
        <p className="text-[11px] leading-relaxed text-white/40">
          Trader Keyboard sends no telemetry and shows no ads. Settings are stored only on this device. Voice audio
          is sent to your browser's speech engine only while actively listening.
        </p>
      </section>

      <button
        onClick={handleResetSettings}
        className="no-drag mt-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white"
      >
        Reset all settings
      </button>
    </div>
  );
}
