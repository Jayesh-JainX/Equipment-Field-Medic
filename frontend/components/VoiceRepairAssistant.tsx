'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, ChevronRight, ChevronLeft,
  AlertTriangle, ShieldCheck, Clock, Save, Moon, BookOpen
} from 'lucide-react';
import { RepairProtocol, fetchAPI } from '../lib/api';

interface VoiceRepairAssistantProps {
  protocol: RepairProtocol;
  onReset: () => void;
  stealthMode: boolean;
  onToggleStealth: () => void;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
};
const NUM_PATTERN = `\\d{1,2}|${Object.keys(NUMBER_WORDS).join('|')}`;

// Command phrases (regex alternations). Order of checks matters, see handleTranscript.
const CMD = {
  stop: 'pause|stop|hold on|be quiet|quiet',
  volUp: 'volume up|louder|turn it up',
  volDown: 'volume down|quieter|softer|turn it down',
  undim: 'undo dim|undim|brighten|brighter|screen on|wake up',
  dim: 'dim screen|dim|battery mode|stealth',
  next: 'next step|next',
  prev: 'previous step|previous|previos|preiou step|preiou|go back|back',
  repeat: 'repeat|again|say that again|resume'
};

const normalize = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();

// Split long text into sentence-sized chunks (Chrome cuts off long utterances)
const chunkText = (text: string, max = 180): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + s).length > max) {
      out.push(cur.trim());
      cur = s;
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

const getCleanSpeech = (stepObj: any): string => {
  if (!stepObj) return '';
  let t: string = stepObj.instruction || '';
  t = t.replace(new RegExp(`^step\\s+(?:${NUM_PATTERN})\\s*[:.\\-–)]?\\s*`, 'i'), '');
  return `${stepObj.title || ''}. ${t}`.trim();
};

export const VoiceRepairAssistant: React.FC<VoiceRepairAssistantProps> = ({
  protocol,
  onReset,
  stealthMode,
  onToggleStealth
}) => {
  const steps: any[] = protocol?.steps ?? [];
  const hasSteps = steps.length > 0;

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [audioMode, setAudioModeState] = useState<boolean>(true);
  const [isSpeaking, setIsSpeakingState] = useState<boolean>(false);
  const [isListening, setIsListeningState] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');
  const [audioVolume, setAudioVolumeState] = useState<number>(1.0);
  const [micError, setMicError] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Refs hold the "live" values so long-lived speech callbacks never go stale
  const protocolRef = useRef(protocol);
  const stepIndexRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const audioVolumeRef = useRef(1.0);
  const stealthRef = useRef(stealthMode);
  const audioModeRef = useRef(true);
  const cooldownRef = useRef(0);
  const speakIdRef = useRef(0);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechEndedAtRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartDelayRef = useRef(300);
  const recognitionRunningRef = useRef(false);
  const suppressResultsRef = useRef(false);
  const latestRef = useRef<{ handleTranscript: (t: string) => boolean }>({
    handleTranscript: () => false
  });

  protocolRef.current = protocol;
  stealthRef.current = stealthMode;

  const safeIndex = hasSteps ? Math.min(currentStepIndex, steps.length - 1) : 0;
  const currentStep = steps[safeIndex];

  // ---------- small state+ref helpers ----------
  const setSpeaking = (v: boolean) => {
    isSpeakingRef.current = v;
    setIsSpeakingState(v);
  };
  const setListening = (v: boolean) => {
    isListeningRef.current = v;
    setIsListeningState(v);
  };
  const setAudioMode = (v: boolean) => {
    audioModeRef.current = v;
    setAudioModeState(v);
  };
  const setStep = (idx: number) => {
    stepIndexRef.current = idx;
    setCurrentStepIndex(idx);
  };

  // ---------- speech synthesis ----------
  const stopSpeaking = () => {
    speakIdRef.current++; // invalidates callbacks of any running utterance
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    if (synthRef.current) synthRef.current.cancel();
    setSpeaking(false);
  };

  const speakText = (text: string) => {
    const synth = synthRef.current;
    if (!synth || !text) return;

    const id = ++speakIdRef.current;
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    synth.cancel();
    setSpeaking(true);

    // Small delay: speak() immediately after cancel() is silently dropped in Chrome
    speakTimerRef.current = setTimeout(() => {
      if (id !== speakIdRef.current) return;
      if (synth.paused) synth.resume();

      const chunks = chunkText(text);
      chunks.forEach((chunk, i) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.rate = 0.95;
        u.pitch = 1.0;
        u.volume = audioVolumeRef.current;
        const finish = () => {
          if (id !== speakIdRef.current) return; // ignore stale/cancelled utterances
          setSpeaking(false);
          speechEndedAtRef.current = Date.now();
        };
        if (i === chunks.length - 1) u.onend = finish;
        u.onerror = finish;
        synth.speak(u);
      });
    }, 60);
  };

  // ---------- speech recognition ----------
  const startRecognition = () => {
    const r = recognitionRef.current;
    if (!r || recognitionRunningRef.current) return;
    try {
      r.start();
    } catch {
      // Already started / still stopping: onend will restart us if needed
    }
  };

  const startListening = () => {
    setMicError('');
    setListening(true);
    startRecognition();
  };

  const stopListening = () => {
    setListening(false);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    const r = recognitionRef.current;
    if (r) {
      try { r.abort(); } catch {}
    }
  };

  const toggleListening = () => {
    if (isListeningRef.current) stopListening();
    else startListening();
  };

  const handleToggleAudioMode = () => {
    if (audioModeRef.current) {
      setAudioMode(false);
      stopSpeaking();
      stopListening();
    } else {
      setAudioMode(true);
      startListening();
      speakText(`Step ${safeIndex + 1}. ${getCleanSpeech(currentStep)}`);
    }
  };

  // ---------- navigation ----------
  const goToStep = (idx: number) => {
    const list = protocolRef.current?.steps ?? [];
    if (idx < 0 || idx >= list.length) return;
    setStep(idx);
    speakText(`Step ${idx + 1}. ${getCleanSpeech(list[idx])}`);
  };

  const doNextStep = () => {
    const list = protocolRef.current?.steps ?? [];
    if (stepIndexRef.current < list.length - 1) {
      goToStep(stepIndexRef.current + 1);
    } else {
      speakText(`Final step complete! Your ${protocolRef.current.equipmentName} repair is secure. Stay safe out there!`);
    }
  };

  const doPrevStep = () => {
    if (stepIndexRef.current > 0) goToStep(stepIndexRef.current - 1);
    else speakText('You are already on the first step.');
  };

  const doRepeatStep = () => {
    const list = protocolRef.current?.steps ?? [];
    const i = stepIndexRef.current;
    speakText(`Repeating step ${i + 1}. ${getCleanSpeech(list[i])}`);
  };

  const changeVolume = (delta: number) => {
    const cur = audioVolumeRef.current;
    const nv = Math.round(Math.min(1, Math.max(0.1, cur + delta)) * 10) / 10;
    audioVolumeRef.current = nv;
    setAudioVolumeState(nv);
    if (nv === cur) speakText(delta > 0 ? 'Volume is already at maximum' : 'Volume is already at minimum');
    else speakText(delta > 0 ? 'Volume increased' : 'Volume decreased');
  };

  const setStealth = (want: boolean) => {
    if (stealthRef.current !== want) {
      stealthRef.current = want;
      onToggleStealth();
    }
  };

  // Returns true if a command was recognised and executed
  const handleTranscript = (lower: string): boolean => {
    const now = Date.now();
    if (now - cooldownRef.current < 1500) return false;

    const wordCount = lower.split(' ').length;
    // While the app is talking (or just finished), the mic can hear its own voice.
    // So we only accept an utterance that is EXACTLY a command, never a phrase merely containing one.
    const strict = isSpeakingRef.current || now - speechEndedAtRef.current < 600;
    if (!strict && wordCount > 8) return false; // long chatter, not a command

    const test = (p: string) =>
      (strict
        ? new RegExp(`^(?:please |ok |okay |hey )?(?:${p})(?: please)?$`)
        : new RegExp(`\\b(?:${p})\\b`)
      ).test(lower);

    const done = (label: string) => {
      cooldownRef.current = now;
      setLastCommand(label);
      return true;
    };

    if (test(CMD.stop)) { stopSpeaking(); return done('Pause Speech'); }
    if (test(CMD.volUp)) { changeVolume(0.2); return done('Volume Up'); }
    if (test(CMD.volDown)) { changeVolume(-0.2); return done('Volume Down'); }
    if (test(CMD.undim)) { setStealth(false); return done('Undo Dim'); }
    if (test(CMD.dim)) { setStealth(true); return done('Dim Screen'); }

    const jumpP = `(?:(?:go to|jump to|read) )?step (${NUM_PATTERN})`;
    const jumpMatch = lower.match(strict ? new RegExp(`^(?:please )?${jumpP}$`) : new RegExp(`\\b${jumpP}\\b`));
    if (jumpMatch) {
      const raw = jumpMatch[1];
      const num = /^\d+$/.test(raw) ? parseInt(raw, 10) : NUMBER_WORDS[raw];
      const total = protocolRef.current?.steps?.length ?? 0;
      if (num >= 1 && num <= total) {
        goToStep(num - 1);
        return done(`Jump to Step ${num}`);
      }
      speakText(`There is no step ${num}. This repair has ${total} steps.`);
      return done(`Invalid Step ${num}`);
    }

    if (test(CMD.next)) { doNextStep(); return done('Next Step'); }
    if (test(CMD.prev)) { doPrevStep(); return done('Previous Step'); }
    if (test(CMD.repeat)) { doRepeatStep(); return done('Repeat Step'); }

    return false;
  };

  // Always point to the newest closure so the recognition callback is never stale
  latestRef.current = { handleTranscript };

  // Create speech engines ONCE
  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis ?? null;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return () => stopSpeaking();
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      recognitionRunningRef.current = true;
      suppressResultsRef.current = false;
      restartDelayRef.current = 300;
      setMicError('');
    };

    recognition.onresult = (event: any) => {
      if (suppressResultsRef.current) return; // a command already fired for this session
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      const lower = normalize(transcript);
      if (!lower) return;
      setVoiceTranscript(lower);

      if (latestRef.current.handleTranscript(lower)) {
        suppressResultsRef.current = true;
        try { recognition.stop(); } catch {} // onend restarts a fresh session
      }
    };

    recognition.onerror = (err: any) => {
      switch (err?.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setMicError('Microphone permission is blocked. Allow mic access in your browser settings.');
          setListening(false);
          break;
        case 'audio-capture':
          setMicError('No microphone found.');
          setListening(false);
          break;
        case 'network':
          setMicError('Speech service unreachable. Retrying…');
          restartDelayRef.current = 2000;
          break;
        default:
          break; // 'no-speech' and 'aborted' are normal
      }
    };

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (isListeningRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isListeningRef.current) startRecognition();
        }, restartDelayRef.current);
      }
    };

    recognitionRef.current = recognition;
    startListening();

    return () => {
      isListeningRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch {}
      recognitionRef.current = null;
      recognitionRunningRef.current = false;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset + read intro whenever a different protocol is loaded
  const protocolKey = `${protocol?.equipmentName}|${protocol?.issueDescription}|${steps.length}`;
  useEffect(() => {
    setStep(0);
    setVoiceTranscript('');
    setLastCommand('');
    setIsSaved(false);
    setSaveError('');
    stopSpeaking();
    if (!hasSteps) return;

    if (!audioModeRef.current) return;

    const timer = setTimeout(() => {
      const p = protocolRef.current;
      const rawIntro = p.voiceIntro
        ? p.voiceIntro.replace(/say 'next step' to begin.*?$/i, '').trim()
        : '';
      const intro = rawIntro || `Repair protocol loaded for ${p.equipmentName}.`;
      speakText(`${intro} Step 1. ${getCleanSpeech(p.steps[0])}`);
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolKey]);

  // Auto-clear the live transcript after a few seconds
  useEffect(() => {
    if (!voiceTranscript) return;
    const t = setTimeout(() => setVoiceTranscript(''), 4000);
    return () => clearTimeout(t);
  }, [voiceTranscript]);

  const handleSaveProtocol = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await fetchAPI('/repairs', {
        method: 'POST',
        body: JSON.stringify({
          equipmentName: protocol.equipmentName,
          category: 'Wilderness Gear',
          identifiedMaterial: protocol.identifiedMaterial,
          confidenceScore: protocol.confidenceScore,
          issueDescription: protocol.issueDescription,
          durabilityRating: protocol.durabilityRating,
          requiredTools: protocol.requiredTools,
          steps: protocol.steps,
          batteryTips: protocol.batteryTips
        })
      });
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving repair:', err);
      setSaveError('Could not save. Check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- empty protocol guard ----------
  if (!hasSteps) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-slate-200 text-sm">No repair steps were generated for this diagnosis.</p>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold"
        >
          New Diagnosis
        </button>
      </div>
    );
  }

  const requiredTools: string[] = protocol.requiredTools ?? [];
  const confidencePct = Math.round((protocol.confidenceScore ?? 0) * 100);

  return (
    <div className="space-y-6">

      {/* Top Banner: Identified Gear & Durability Rating */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-xs font-mono font-bold px-2.5 py-1 rounded-md uppercase">
                {protocol.identifiedMaterial}
              </span>
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-700/60 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {confidencePct}% Match
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight mt-2">
              {protocol.equipmentName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Diagnosis: <span className="text-slate-200">{protocol.issueDescription}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveProtocol}
              disabled={isSaved || isSaving}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isSaved
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-60'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Saved to DB' : isSaving ? 'Saving…' : 'Save Protocol'}</span>
            </button>

            <button
              onClick={onReset}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold"
            >
              New Diagnosis
            </button>
          </div>
        </div>

        {saveError && <p className="mt-2 text-xs text-red-400">{saveError}</p>}

        {/* Required Tools Bar */}
        {requiredTools.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Required Pack Tools:</span>
            {requiredTools.map((tool, idx) => (
              <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
                🛠️ {tool}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hands-Free Voice Control Command Center */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Audio Mode Toggle Switcher at the top for Mobile */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 sm:hidden self-start">
              <button
                onClick={() => { if (!audioModeRef.current) handleToggleAudioMode(); }}
                className={`px-3 py-1.5 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
                  audioModeRef.current ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" /> Audio
              </button>
              <button
                onClick={() => { if (audioModeRef.current) handleToggleAudioMode(); }}
                className={`px-3 py-1.5 flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
                  !audioModeRef.current ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Read
              </button>
            </div>

            <div className="flex items-start sm:items-center gap-3">
              {/* Mic Toggle Button */}
              {audioModeRef.current ? (
                <button
                  onClick={toggleListening}
                  disabled={!speechSupported}
                  aria-label={isListening ? 'Turn voice control off' : 'Turn voice control on'}
                  className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none ${
                    isListening
                      ? 'bg-emerald-500 text-slate-950 mic-active shadow-lg shadow-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                  }`}
                  title={isListening ? 'Voice Control ACTIVE - Listening...' : 'Click to enable hands-free voice commands'}
                >
                  {isListening ? <Mic className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" /> : <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />}
                </button>
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full flex items-center justify-center bg-slate-800/50 text-slate-600 border border-slate-700/50">
                  <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                    {audioModeRef.current ? 'Hands-Free Guide' : 'Manual Read Mode'}
                  </h3>
                  
                  {audioModeRef.current && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isListening ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {!speechSupported ? 'UNSUPPORTED' : isListening ? 'LISTENING' : 'PAUSED'}
                    </span>
                  )}
                </div>
                
                {audioModeRef.current ? (
                  speechSupported ? (
                    <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">
                      Say <span className="text-emerald-400 font-bold">"Next step"</span>, <span className="text-cyan-400 font-bold">"Previous"</span>, <span className="text-amber-400 font-bold">"Repeat"</span>, or <span className="text-slate-300 font-bold">"Stop"</span> without touching your phone.
                    </p>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-amber-300 mt-1 leading-relaxed max-w-sm">
                      Voice commands aren't supported here. Use the manual buttons.
                    </p>
                  )
                ) : (
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">
                    Audio is muted. Read at your own pace and use the manual buttons below to navigate.
                  </p>
                )}
                
                {audioModeRef.current && micError && <p className="text-xs text-red-400 mt-1">{micError}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {/* Desktop / Tablet Segmented Switcher */}
            <div className="hidden sm:flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                onClick={() => { if (!audioModeRef.current) handleToggleAudioMode(); }}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide rounded-md transition-all ${
                  audioModeRef.current ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" /> Audio Mode
              </button>
              <button
                onClick={() => { if (audioModeRef.current) handleToggleAudioMode(); }}
                className={`px-3 py-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide rounded-md transition-all ${
                  !audioModeRef.current ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Read Mode
              </button>
            </div>

            {/* TTS Audio Controls (Hidden in Read Mode) */}
            {audioModeRef.current && (
              <div className="flex flex-wrap items-center gap-2">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0"
                  >
                    <VolumeX className="w-4 h-4" /> Stop Audio
                  </button>
                ) : (
                  <button
                    onClick={() => speakText(`Step ${safeIndex + 1}. ${getCleanSpeech(currentStep)}`)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-600/40 shrink-0"
                  >
                    <Volume2 className="w-4 h-4" /> Read Out Loud
                  </button>
                )}

                <input
                  type="range"
                  min={10}
                  max={100}
                  step={10}
                  value={Math.round(audioVolume * 100)}
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    audioVolumeRef.current = v;
                    setAudioVolumeState(v);
                  }}
                  aria-label="Speech volume"
                  title={`Speech volume ${Math.round(audioVolume * 100)}%`}
                  className="w-[70px] sm:w-20 accent-emerald-500"
                />

                <button
                  onClick={onToggleStealth}
                  className={`p-2 rounded-xl border text-xs shrink-0 ${
                    stealthMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-amber-400 border-slate-700'
                  }`}
                  title="Dim screen for battery saving"
                  aria-label="Toggle dim screen"
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Live Voice Transcript Feed */}
        {isListening && voiceTranscript && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2">
            <span className="italic text-slate-400">"{voiceTranscript}"</span>
            {lastCommand && (
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
                Command Triggered: {lastCommand}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Interactive Step Card */}
      <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative">

        {/* Step Progress Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/30">
              {safeIndex + 1}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Step {safeIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Est. Time: {currentStep.estimatedTimeMinutes || 3} mins</span>
          </div>
        </div>

        {/* Step Title & Instruction */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-100 mb-3">
            {currentStep.title}
          </h3>
          <p className="text-slate-200 text-base leading-relaxed bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl">
            {currentStep.instruction}
          </p>
        </div>

        {/* Safety Warning Alert */}
        {currentStep.safetyWarning && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300 block mb-0.5">Field Safety Tip</span>
              <span>{currentStep.safetyWarning}</span>
            </div>
          </div>
        )}

        {/* Next / Previous Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 gap-2">
          <button
            onClick={() => { setLastCommand('Previous Step (Manual)'); doPrevStep(); }}
            disabled={safeIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setLastCommand(`Jump to Step ${idx + 1} (Manual)`); goToStep(idx); }}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  idx === safeIndex
                    ? 'w-8 bg-emerald-400'
                    : 'w-2.5 bg-slate-800 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => { setLastCommand('Next Step (Manual)'); doNextStep(); }}
            disabled={safeIndex === steps.length - 1}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/60 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Battery & Field Tips */}
      {protocol.batteryTips && protocol.batteryTips.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Eyes-Free Battery Saver Tip:</span>
            <span>{protocol.batteryTips[0]}</span>
          </div>
        </div>
      )}

    </div>
  );
};