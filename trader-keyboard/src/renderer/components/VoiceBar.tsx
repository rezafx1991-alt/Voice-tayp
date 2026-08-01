import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function VoiceBar() {
  const { voiceStatus, voiceError, interimTranscript, settings } = useAppStore();
  const { isSupported, start, stop } = useSpeechRecognition();

  const isListening = voiceStatus === 'listening';

  const handleMicClick = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="no-drag flex items-center gap-2 border-b border-white/10 px-3 py-2">
      <button
        onClick={handleMicClick}
        disabled={!isSupported}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
          isListening
            ? 'mic-pulsing bg-red-500 text-white'
            : 'bg-accent/20 text-accent hover:bg-accent/30'
        } ${!isSupported ? 'cursor-not-allowed opacity-40' : ''}`}
        title={isSupported ? (isListening ? 'Stop listening' : 'Start voice typing') : 'Voice typing unavailable'}
      >
        {isListening ? <Mic size={15} /> : <MicOff size={15} />}
      </button>

      <div className="min-w-0 flex-1 text-xs">
        {voiceStatus === 'error' ? (
          <span className="flex items-center gap-1 text-red-300">
            <AlertCircle size={12} />
            {voiceError ?? 'Voice recognition error'}
          </span>
        ) : isListening ? (
          <span className="truncate text-white/70">
            {interimTranscript || `Listening in ${settings.speechLanguage === 'fa' ? 'Persian' : 'English'}…`}
          </span>
        ) : (
          <span className="text-white/40">
            {isSupported ? 'Tap the mic to start voice typing' : 'Voice typing requires an internet connection'}
          </span>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/40">
        {settings.speechLanguage === 'fa' ? 'FA' : 'EN'}
      </span>
    </div>
  );
}
