import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

// The Web Speech API's SpeechRecognition constructor isn't in TypeScript's
// default DOM lib, so we declare the minimal shape we actually use here.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const LANG_CODE: Record<'fa' | 'en', string> = {
  fa: 'fa-IR',
  en: 'en-US',
};

// Light heuristic auto-punctuation: capitalizes the first letter of each
// final segment (English only — Persian has no case) and appends a period
// if the segment doesn't already end with terminal punctuation. This runs
// client-side with no network call, unlike full NLP punctuation models.
function autoPunctuate(text: string, lang: 'fa' | 'en'): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const terminalPunctuation = ['.', '!', '?', '\u061f', '\u06d4'];
  const endsWithPunctuation = terminalPunctuation.some((p) => trimmed.endsWith(p));

  let result = trimmed;
  if (lang === 'en') {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  if (!endsWithPunctuation) {
    result += '.';
  }
  return result;
}

interface UseSpeechRecognitionResult {
  isSupported: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadErrorRef = useRef(false);

  const { settings, setVoiceStatus, setInterimTranscript, voiceStatus } = useAppStore();

  const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const isSupported = Boolean(RecognitionCtor);

  const clearTimeout_ = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetSilenceTimeout = useCallback(() => {
    clearTimeout_();
    timeoutRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, settings.voiceTimeoutMs);
  }, [clearTimeout_, settings.voiceTimeoutMs]);

  const commitFinalSegment = useCallback(
    async (rawText: string) => {
      const text = settings.autoPunctuation ? autoPunctuate(rawText, settings.speechLanguage) : rawText.trim();
      if (!text) return;
      await window.traderKeyboard.input.injectText({ text: text + ' ' });
    },
    [settings.autoPunctuation, settings.speechLanguage]
  );

  const stop = useCallback(() => {
    clearTimeout_();
    recognitionRef.current?.stop();
  }, [clearTimeout_]);

  // Starts the actual SpeechRecognition session. Declared before `start` so
  // `start`'s async getUserMedia callback can call it directly with no
  // forward-reference / temporal-dead-zone concerns.
  const beginRecognition = useCallback(() => {
    if (!RecognitionCtor) return;

    const recognition = new RecognitionCtor();
    recognition.lang = LANG_CODE[settings.speechLanguage];
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceStatus('listening');
      resetSilenceTimeout();
    };

    recognition.onresult = (event) => {
      resetSilenceTimeout();
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          void commitFinalSegment(transcript);
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // "no-speech" fires routinely during natural pauses; it isn't a real
      // error and shouldn't surface to the user as one.
      if (event.error === 'no-speech') return;
      hadErrorRef.current = true;
      setVoiceStatus('error', event.error);
    };

    recognition.onend = () => {
      clearTimeout_();
      setInterimTranscript('');
      if (!hadErrorRef.current) {
        setVoiceStatus('idle');
      }
      hadErrorRef.current = false;
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [RecognitionCtor, settings.speechLanguage, resetSilenceTimeout, commitFinalSegment, setVoiceStatus, setInterimTranscript, clearTimeout_]);

  const start = useCallback(() => {
    if (!RecognitionCtor) {
      setVoiceStatus('error', 'Speech recognition is not supported in this build.');
      return;
    }
    if (voiceStatus === 'listening') {
      stop();
      return;
    }

    // The SpeechRecognition API always captures from the OS default input
    // device with default audio processing — it does not accept a
    // MediaStream or device selector. To honor the user's chosen
    // microphone and noise-suppression/echo-cancellation/AGC settings, we
    // first request a constrained getUserMedia stream (which primes/selects
    // that input path in Chromium), release it immediately, then start
    // recognition against the now-configured input.
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: settings.microphoneDeviceId ? { exact: settings.microphoneDeviceId } : undefined,
          noiseSuppression: settings.noiseSuppression,
          echoCancellation: settings.echoCancellation,
          autoGainControl: settings.autoGainControl,
        },
      })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        beginRecognition();
      })
      .catch((error: unknown) => {
        setVoiceStatus('error', error instanceof Error ? error.message : 'Microphone access denied.');
      });
  }, [RecognitionCtor, voiceStatus, stop, setVoiceStatus, settings.microphoneDeviceId, settings.noiseSuppression, settings.echoCancellation, settings.autoGainControl, beginRecognition]);

  useEffect(() => {
    return () => {
      clearTimeout_();
      recognitionRef.current?.abort();
    };
  }, [clearTimeout_]);

  return { isSupported, start, stop };
}
