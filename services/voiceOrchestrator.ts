
// --- START: Web API Type Definitions ---
// This block adds necessary type definitions for the Web Speech and Speech Synthesis APIs,
// which are not always included by default in TypeScript's DOM library.
// This resolves compilation errors about missing types like 'SpeechRecognition'.
declare global {
  // --- Web Speech API (Speech Recognition) ---
  interface SpeechRecognition extends EventTarget {
    grammars: any; // SpeechGrammarList
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    start(): void;
    stop(): void;
    abort(): void;

    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  // --- Web Speech Synthesis API ---
  interface SpeechSynthesisUtterance extends EventTarget {
    text: string;
    lang: string;
    voice: SpeechSynthesisVoice | null;
    volume: number;
    rate: number;
    pitch: number;
    onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
    onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
    onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  }

  var SpeechSynthesisUtterance: {
    prototype: SpeechSynthesisUtterance;
    new (text?: string): SpeechSynthesisUtterance;
  };

  interface SpeechSynthesisVoice {
    readonly voiceURI: string;
    readonly name: string;
    readonly lang: string;
    readonly localService: boolean;
    readonly default: boolean;
  }

  interface SpeechSynthesis extends EventTarget {
    readonly pending: boolean;
    readonly speaking: boolean;
    readonly paused: boolean;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
    getVoices(): SpeechSynthesisVoice[];
    speak(utterance: SpeechSynthesisUtterance): void;
    cancel(): void;
    pause(): void;
    resume(): void;
  }
  
  // The SpeechSynthesisErrorCode and SpeechSynthesisErrorEvent types are now part of standard DOM libraries,
  // so their definitions have been removed from here to avoid conflicts. The built-in types will be used.


  // Augment the Window interface
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  }
}
// --- END: Web API Type Definitions ---

import { Phase, View, Audience, Note } from '../types';
import { processVoiceCommand } from './geminiService';
import { db } from './db';

class VoiceOrchestrator {
  private currentPhase: Phase = 'IDLE';
  private currentView: View = 'pulse';
  private recognition: SpeechRecognition | null = null;
  private finalTranscript: string = '';
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private ttsQueue: SpeechSynthesisUtterance[] = [];
  
  private dictationTarget: HTMLInputElement | HTMLTextAreaElement | null = null;
  private speechEndTimeout: number | null = null;
  private readonly SPEECH_PAUSE_DURATION = 4000; // 4 seconds

  // Personality context
  private flow: number = 50;
  private audience: Audience = 'pg';
  private lang: string = 'en-US';

  constructor() {
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  public setLanguage(lang: string) {
      if (this.lang === lang) return;
      this.lang = lang;
      this.micOff();
      this.initSpeechRecognition();
      this.reloadVoicePreference();
      console.log(`LEX language set to: ${lang}`);
  }

  public setCurrentContext(view: View) {
    this.currentView = view;
  }

  public setCurrentPersonality(flow: number, audience: Audience) {
    this.flow = flow;
    this.audience = audience;
  }

  public setDictationTarget(element: HTMLInputElement | HTMLTextAreaElement | null) {
      this.dictationTarget = element;
      if (this.currentPhase === 'LISTENING' && this.dictationTarget) {
          window.dispatchEvent(new Event('lex.dictation.started'));
      }
  }

  private _updatePreferredVoice() {
    const voices = window.speechSynthesis.getVoices();
     if (voices.length > 0) {
      const preferredVoiceURI = localStorage.getItem('lex_voice_preference');
      if (preferredVoiceURI) {
          this.preferredVoice = voices.find(v => v.voiceURI === preferredVoiceURI) || null;
      }

      if (!this.preferredVoice) {
          let selectedVoice = voices.find(voice => voice.name === "Microsoft Andrew Online (Natural) - English (United States)" && voice.lang === this.lang);
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === this.lang && voice.name.includes('Google'));
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === this.lang && voice.name.includes('David'));
          if (!selectedVoice) selectedVoice = voices.find(voice => voice.lang === this.lang);
          this.preferredVoice = selectedVoice || null;
      }
      
      if(this.preferredVoice) {
          console.log(`Preferred voice for lang ${this.lang} set: ${this.preferredVoice.name}`);
      } else {
          console.warn(`Could not find a suitable voice for ${this.lang}. The assistant will use the system's default voice.`);
      }
    }
  }
  
  public reloadVoicePreference() {
    if (!window.speechSynthesis) return;
    this._updatePreferredVoice();
  }

  private initSpeechSynthesis() {
    if (!window.speechSynthesis) return;
    const setVoice = () => this._updatePreferredVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;
    setVoice();
  }

  private dispatchPhaseChange(phase: Phase) {
    if (this.currentPhase === phase) return;
    this.currentPhase = phase;
    window.dispatchEvent(new CustomEvent<Phase>('lex.phase.change', { detail: phase }));
  }

  private initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.dispatchPhaseChange('LISTENING');
        window.dispatchEvent(new Event('lex.stt.start'));
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (this.speechEndTimeout) {
            clearTimeout(this.speechEndTimeout);
            this.speechEndTimeout = null;
        }

        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            this.finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullTranscript = (this.finalTranscript + interimTranscript).trim();

        if (this.dictationTarget) {
            this.dictationTarget.value = fullTranscript;
            this.dictationTarget.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        } else {
            window.dispatchEvent(new CustomEvent('lex.stt.interim', { detail: { transcript: fullTranscript } }));
        }

        this.speechEndTimeout = window.setTimeout(() => this.processFinalTranscript(), this.SPEECH_PAUSE_DURATION);
      };

      this.recognition.onend = () => {
        window.dispatchEvent(new Event('lex.stt.stop'));
        if (this.speechEndTimeout) {
            clearTimeout(this.speechEndTimeout);
            this.processFinalTranscript();
        }
        if (this.currentPhase === 'LISTENING') {
            this.dispatchPhaseChange('IDLE');
        }
      };
      
      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          this.dispatchPhaseChange('IDLE');
      }
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }

  private processFinalTranscript() {
    const transcriptToProcess = this.finalTranscript.trim();
    this.finalTranscript = '';
    this.speechEndTimeout = null;
    
    if (!transcriptToProcess) {
        if (!this.dictationTarget) {
            this.dispatchPhaseChange('IDLE');
        }
        return;
    }

    if (this.dictationTarget) {
        this.micOff();
    } else {
        this.handleFinalCommand(transcriptToProcess);
    }
  }

  private async handleFinalCommand(transcript: string) {
      if (!transcript) return;
      this.micOff();
      window.dispatchEvent(new CustomEvent('lex.chat.send', { detail: { text: transcript } }));
      this.dispatchPhaseChange('THINKING');

      const command = await processVoiceCommand(transcript, this.currentView, this.flow, this.audience);

      // --- Universal Note Saving ---
      if (command.action === 'talk' || command.action === 'contextual_command') {
          const now = new Date().toISOString();
          const note: Note = {
              id: `note_convo_${Date.now()}`,
              type: 'conversation',
              title: `Voice Query: ${transcript.substring(0, 40)}...`,
              conversation: [
                  { role: 'user', text: transcript },
                  { role: 'assistant', text: command.spokenResponse }
              ],
              createdAt: now,
              updatedAt: now,
              links: {},
              meta: { source: 'chat' },
              archived: false,
          };
          await db.notes.add(note);
      }

      if (command.action === 'navigate' && command.page) {
          window.CUE.page({ to: command.page });
      } else if (command.action === 'contextual_command' && command.command) {
          window.dispatchEvent(new CustomEvent('cue.contextual.command', { detail: { command: command.command, payload: command.payload } }));
      }

      this.speak(command.spokenResponse);
  }

  public micOn() {
    if (this.currentPhase !== 'IDLE' || !this.recognition) return;
    this.finalTranscript = '';
    if (this.speechEndTimeout) clearTimeout(this.speechEndTimeout);
    
    try {
      this.recognition.start();
    } catch(e) {
      console.error("Mic start error:", e);
      this.dispatchPhaseChange('IDLE');
    }
  }

  public micOff() {
    this.recognition?.stop();
    if(this.currentPhase === 'LISTENING') {
        this.dispatchPhaseChange('IDLE');
    }
  }

  public toggleMic() {
    if (this.currentPhase === 'IDLE') {
      this.micOn();
    } else if (this.currentPhase === 'LISTENING') {
      this.micOff();
    } else if (this.currentPhase === 'SPEAKING') {
      this.cancelTTS();
      // Allow the 'onend' event from cancelTTS to set the phase to IDLE before starting the mic.
      setTimeout(() => this.micOn(), 50);
    }
  }

  public hardInterrupt() {
    if (window.speechSynthesis?.speaking || this.ttsQueue.length > 0) {
      this.cancelTTS();
    }
    if (this.currentPhase === 'LISTENING') {
      this.micOff();
    }
    
    // After stopping ongoing processes, turn the mic on.
    // A small delay allows event handlers from cancel/off to complete and set the phase to IDLE.
    setTimeout(() => {
        this.micOn();
    }, 100);
  }

  private processTtsQueue() {
    if (window.speechSynthesis.speaking || this.ttsQueue.length === 0) {
      return;
    }
    const utterance = this.ttsQueue.shift()!;
    window.speechSynthesis.speak(utterance);
  }

  private sanitizeTextForSpeech(text: string): string {
    if (!text) return '';
    let sanitized = text.replace(/[*#_`]/g, '');
    const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
    sanitized = sanitized.replace(emojiRegex, '');
    return sanitized.trim();
  }

  public speak(text: string) {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported.");
      window.dispatchEvent(new CustomEvent('lex.ui.chat.show', { detail: { role: 'assistant', text } }));
      this.dispatchPhaseChange('IDLE');
      return;
    }
    
    if (!text || text.trim().length === 0) {
      console.warn("TTS speak() called with empty text. Aborting.");
      return;
    }

    const sanitizedText = this.sanitizeTextForSpeech(text);
    if (!sanitizedText) {
        console.warn("TTS speak() called with text that became empty after sanitization.");
        this.dispatchPhaseChange('IDLE');
        return;
    }
    
    window.dispatchEvent(new CustomEvent('lex.ui.chat.show', { detail: { role: 'assistant', text } }));

    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.lang = this.lang;
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    
    if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
    }

    utterance.onstart = () => {
      this.dispatchPhaseChange('SPEAKING');
      window.dispatchEvent(new Event('lex.tts.start'));
    };
    
    utterance.onend = () => {
      if (this.ttsQueue.length === 0) {
        window.dispatchEvent(new Event('lex.tts.end'));
        this.dispatchPhaseChange('IDLE');
      } else {
        this.processTtsQueue();
      }
    };
    
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (e.error !== 'interrupted') {
        console.error(`TTS Error: ${e.error}. For text: "${e.utterance.text.substring(0, 100)}..."`);
        window.dispatchEvent(new Event('lex.tts.error'));
      } else {
        console.log('TTS utterance was intentionally interrupted.');
      }
      
      this.ttsQueue = []; 
      window.dispatchEvent(new Event('lex.tts.end'));
      this.dispatchPhaseChange('IDLE');
    };

    this.ttsQueue.push(utterance);
    this.processTtsQueue();
  }
  
  public cancelTTS() {
    if (window.speechSynthesis?.speaking || this.ttsQueue.length > 0) {
      this.ttsQueue = [];
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceOrchestrator = new VoiceOrchestrator();