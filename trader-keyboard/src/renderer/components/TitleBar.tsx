import { Keyboard, Settings, Minus, X, Pin, PinOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function TitleBar() {
  const { activePanel, setActivePanel, settings, updateSetting, foregroundAppName } = useAppStore();

  const handleMinimize = () => void window.traderKeyboard.window.minimize();
  const handleClose = () => void window.traderKeyboard.window.close();

  const toggleAlwaysOnTop = () => {
    const next = !settings.alwaysOnTop;
    updateSetting('alwaysOnTop', next);
    void window.traderKeyboard.window.toggleAlwaysOnTop(next);
  };

  return (
    <div className="drag-region flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
        <span className="text-white/90">Trader Keyboard</span>
        {foregroundAppName && (
          <span className="no-drag rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
            → {foregroundAppName}
          </span>
        )}
      </div>

      <div className="no-drag flex items-center gap-1">
        <button
          className={`rounded-md p-1.5 transition hover:bg-white/10 ${
            activePanel === 'keyboard' ? 'bg-white/10 text-accent' : 'text-white/60'
          }`}
          onClick={() => setActivePanel('keyboard')}
          title="Keyboard"
        >
          <Keyboard size={14} />
        </button>
        <button
          className={`rounded-md p-1.5 transition hover:bg-white/10 ${
            activePanel === 'settings' ? 'bg-white/10 text-accent' : 'text-white/60'
          }`}
          onClick={() => setActivePanel('settings')}
          title="Settings"
        >
          <Settings size={14} />
        </button>
        <button
          className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10"
          onClick={toggleAlwaysOnTop}
          title={settings.alwaysOnTop ? 'Unpin (allow behind windows)' : 'Pin (always on top)'}
        >
          {settings.alwaysOnTop ? <Pin size={14} className="text-accent" /> : <PinOff size={14} />}
        </button>
        <div className="mx-1 h-4 w-px bg-white/10" />
        <button
          className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10"
          onClick={handleMinimize}
          title="Minimize to tray"
        >
          <Minus size={14} />
        </button>
        <button
          className="rounded-md p-1.5 text-white/60 transition hover:bg-red-500/80 hover:text-white"
          onClick={handleClose}
          title="Hide (keeps running in tray)"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
