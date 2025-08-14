
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
import { geminiLiveVoice, GEMINI_VOICES, type GeminiVoice } from './geminiLiveVoice';

class VoiceOrchestrator {
  private currentPhase: Phase = 'IDLE';
  private currentView: View = 'pulse';
  private recognition: SpeechRecognition | null = null;
  private finalTranscript: string = '';
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private ttsQueue: SpeechSynthesisUtterance[] = [];
  private useGeminiLive: boolean = true; // Default to Gemini Live when available
  private geminiVoice: GeminiVoice = GEMINI_VOICES[0]; // Default to Marcus
  
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
    if (voices.length === 0) return;

    // Detect platform and browser for optimal voice selection
    const platform = this.detectPlatform();
    const browser = this.detectBrowser();
    
    console.log(`Platform: ${platform}, Browser: ${browser}`);
    console.log(`Available voices: ${voices.length}`);

    // Score and rank all available voices
    const scoredVoices = voices.map(voice => ({
      voice,
      score: this.scoreVoiceQuality(voice, platform, browser)
    })).sort((a, b) => b.score - a.score);

    // Log top 5 voices for debugging
    console.log('Top 5 voices by quality score:');
    scoredVoices.slice(0, 5).forEach((scored, index) => {
      console.log(`${index + 1}. ${scored.voice.name} (${scored.voice.voiceURI}) - Score: ${scored.score}`);
    });

    // Special logging for Apple devices
    if (this.isAppleDevice()) {
      console.log('🍎 Apple device detected - prioritizing premium voices');
      const appleVoices = scoredVoices.filter(scored => 
        scored.voice.name.includes('Siri') || 
        scored.voice.name.includes('Enhanced') || 
        scored.voice.name.includes('Premium') ||
        scored.voice.name.includes('Neural') ||
        ['Alex', 'Samantha', 'Daniel', 'Karen', 'Victoria', 'Tom', 'Fred', 'Ralph', 'Nicky', 'Susan', 'Aaron', 'Bella', 'Martha', 'Gordon'].some(name => scored.voice.name.includes(name))
      );
      
      if (appleVoices.length > 0) {
        console.log('🍎 Premium Apple voices found:');
        appleVoices.slice(0, 3).forEach((scored, index) => {
          console.log(`  ${index + 1}. ${scored.voice.name} - Score: ${scored.score}`);
        });
      } else {
        console.log('⚠️ No premium Apple voices detected. This may indicate a voice loading issue.');
      }
    }

    // Try to use saved preference first
    const savedVoiceURI = localStorage.getItem('lex_voice_preference');
    if (savedVoiceURI) {
      const savedVoice = voices.find(v => v.voiceURI === savedVoiceURI);
      if (savedVoice && this.scoreVoiceQuality(savedVoice, platform, browser) > 50) {
        this.preferredVoice = savedVoice;
        console.log(`Using saved voice preference: ${savedVoice.name}`);
        return;
      }
    }

    // Select the best available voice
    const bestVoice = scoredVoices[0];
    
    // Special handling for Apple devices - always try to get the best Apple voice
    if (this.isAppleDevice() && this.isSafari()) {
      // Look specifically for Apple's premium voices
      const appleVoice = scoredVoices.find(scored => 
        scored.voice.name.includes('Siri') || 
        scored.voice.name.includes('Enhanced') || 
        scored.voice.name.includes('Premium') ||
        scored.voice.name.includes('Neural') ||
        ['Alex', 'Samantha', 'Daniel', 'Karen', 'Victoria', 'Tom', 'Fred', 'Ralph', 'Nicky', 'Susan', 'Aaron', 'Bella', 'Martha', 'Gordon'].some(name => scored.voice.name.includes(name))
      );
      
      if (appleVoice && appleVoice.score > 50) {
        this.preferredVoice = appleVoice.voice;
        localStorage.setItem('lex_voice_preference', appleVoice.voice.voiceURI);
        console.log(`🎯 Selected premium Apple voice: ${appleVoice.voice.name} (Score: ${appleVoice.score})`);
        return;
      }
    }
    
    if (bestVoice && bestVoice.score > 30) {
      this.preferredVoice = bestVoice.voice;
      localStorage.setItem('lex_voice_preference', bestVoice.voice.voiceURI);
      console.log(`Selected best available voice: ${bestVoice.voice.name} (Score: ${bestVoice.score})`);
    } else {
      // Fallback to any available voice
      this.preferredVoice = voices[0];
      console.warn(`No high-quality voices found, using fallback: ${voices[0].name}`);
    }
  }

  private detectPlatform(): 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/macintosh|mac os x/.test(userAgent)) return 'macos';
    if (/windows/.test(userAgent)) return 'windows';
    if (/linux/.test(userAgent)) return 'linux';
    
    return 'unknown';
  }

  private isAppleDevice(): boolean {
    const platform = this.detectPlatform();
    return platform === 'ios' || platform === 'macos';
  }

  private isSafari(): boolean {
    return this.detectBrowser() === 'safari';
  }

  private detectBrowser(): 'chrome' | 'safari' | 'edge' | 'firefox' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/edg/.test(userAgent)) return 'edge';
    if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) return 'chrome';
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'safari';
    if (/firefox/.test(userAgent)) return 'firefox';
    
    return 'unknown';
  }

  private scoreVoiceQuality(voice: SpeechSynthesisVoice, platform: string, browser: string): number {
    let score = 0;
    
    // Base score for language match
    if (voice.lang.startsWith(this.lang)) {
      score += 20;
    } else if (voice.lang.startsWith('en')) {
      score += 15;
    }

    // Platform-specific scoring
    switch (platform) {
      case 'android':
        score += this.scoreAndroidVoice(voice, browser);
        break;
      case 'ios':
        score += this.scoreIOSVoice(voice, browser);
        break;
      case 'windows':
        score += this.scoreWindowsVoice(voice, browser);
        break;
      case 'macos':
        score += this.scoreMacOSVoice(voice, browser);
        break;
    }

    // Browser-specific scoring
    score += this.scoreBrowserVoice(voice, browser);

    // Voice quality indicators
    if (voice.localService) score += 10; // Local voices are usually better
    if (voice.default) score += 5; // Default voices are often good
    
    // Natural voice detection
    if (this.isNaturalVoice(voice)) score += 25;
    
    // Premium voice detection
    if (this.isPremiumVoice(voice)) score += 20;

    return score;
  }

  private scoreAndroidVoice(voice: SpeechSynthesisVoice, browser: string): number {
    let score = 0;
    
    // Android has excellent Google voices
    if (voice.name.includes('Google')) {
      score += 30;
      if (voice.name.includes('Natural')) score += 20;
      if (voice.name.includes('Enhanced')) score += 15;
    }
    
    // Samsung voices are also good
    if (voice.name.includes('Samsung')) score += 25;
    
    // Microsoft voices on Android
    if (voice.name.includes('Microsoft')) score += 20;
    
    return score;
  }

  private scoreIOSVoice(voice: SpeechSynthesisVoice, browser: string): number {
    let score = 0;
    
    // Apple's premium Siri voices are the best available
    if (voice.name.includes('Siri')) {
      score += 50; // Highest priority for Siri voices
      if (voice.name.includes('Enhanced')) score += 30;
      if (voice.name.includes('Premium')) score += 25;
      if (voice.name.includes('Neural')) score += 35;
    }
    
    // Apple's Enhanced voices (very high quality)
    if (voice.name.includes('Enhanced')) {
      score += 45;
      if (voice.name.includes('Premium')) score += 20;
    }
    
    // Apple's Premium voices
    if (voice.name.includes('Premium')) score += 40;
    
    // Apple's Neural voices
    if (voice.name.includes('Neural')) score += 45;
    
    // Apple's classic high-quality system voices
    if (voice.name.includes('Alex') || voice.name.includes('Samantha')) score += 40;
    if (voice.name.includes('Daniel') || voice.name.includes('Karen')) score += 40;
    if (voice.name.includes('Victoria') || voice.name.includes('Tom')) score += 40;
    if (voice.name.includes('Fred') || voice.name.includes('Ralph')) score += 40;
    
    // Apple's newer high-quality voices
    if (voice.name.includes('Nicky') || voice.name.includes('Susan')) score += 40;
    if (voice.name.includes('Aaron') || voice.name.includes('Bella')) score += 40;
    if (voice.name.includes('Martha') || voice.name.includes('Gordon')) score += 40;
    
    // Apple's international voices (often very high quality)
    if (voice.name.includes('Tessa') || voice.name.includes('Moira')) score += 35;
    if (voice.name.includes('Fiona') || voice.name.includes('Alice')) score += 35;
    
    // Safari-specific voice detection
    if (browser === 'safari') {
      score += 15; // Safari has better access to Apple voices
      if (voice.localService) score += 20; // Local Apple voices are premium
    }
    
    return score;
  }

  private scoreWindowsVoice(voice: SpeechSynthesisVoice, browser: string): number {
    let score = 0;
    
    // Windows has excellent Microsoft voices
    if (voice.name.includes('Microsoft')) {
      score += 30;
      if (voice.name.includes('Online')) score += 20;
      if (voice.name.includes('Natural')) score += 25;
      if (voice.name.includes('Neural')) score += 30;
    }
    
    // Windows system voices
    if (voice.name.includes('David') || voice.name.includes('Zira')) score += 20;
    
    return score;
  }

  private scoreMacOSVoice(voice: SpeechSynthesisVoice, browser: string): number {
    let score = 0;
    
    // macOS has the best voice quality available
    if (voice.name.includes('Siri')) {
      score += 50; // Siri voices on macOS are premium
      if (voice.name.includes('Enhanced')) score += 30;
      if (voice.name.includes('Premium')) score += 25;
      if (voice.name.includes('Neural')) score += 35;
    }
    
    // macOS Enhanced voices (very high quality)
    if (voice.name.includes('Enhanced')) {
      score += 45;
      if (voice.name.includes('Premium')) score += 20;
    }
    
    // macOS Premium voices
    if (voice.name.includes('Premium')) score += 40;
    
    // macOS Neural voices
    if (voice.name.includes('Neural')) score += 45;
    
    // macOS classic high-quality system voices
    if (voice.name.includes('Alex') || voice.name.includes('Samantha')) score += 40;
    if (voice.name.includes('Daniel') || voice.name.includes('Karen')) score += 40;
    if (voice.name.includes('Victoria') || voice.name.includes('Tom')) score += 40;
    if (voice.name.includes('Fred') || voice.name.includes('Ralph')) score += 40;
    
    // macOS newer high-quality voices
    if (voice.name.includes('Nicky') || voice.name.includes('Susan')) score += 40;
    if (voice.name.includes('Aaron') || voice.name.includes('Bella')) score += 40;
    if (voice.name.includes('Martha') || voice.name.includes('Gordon')) score += 40;
    
    // macOS international voices (often very high quality)
    if (voice.name.includes('Tessa') || voice.name.includes('Moira')) score += 35;
    if (voice.name.includes('Fiona') || voice.name.includes('Alice')) score += 35;
    if (voice.name.includes('Yuri') || voice.name.includes('Kyoko')) score += 35;
    
    // Safari on macOS has the best voice access
    if (browser === 'safari') {
      score += 20; // Safari has superior access to macOS voices
      if (voice.localService) score += 25; // Local macOS voices are premium
    }
    
    return score;
  }

  private scoreBrowserVoice(voice: SpeechSynthesisVoice, browser: string): number {
    let score = 0;
    
    switch (browser) {
      case 'chrome':
        // Chrome has access to system voices and Google voices
        if (voice.name.includes('Google')) score += 25;
        break;
      case 'safari':
        // Safari has superior access to system voices, especially on Apple devices
        if (voice.localService) score += 25;
        if (voice.name.includes('Siri') || voice.name.includes('Enhanced') || voice.name.includes('Premium')) score += 20;
        if (voice.name.includes('Alex') || voice.name.includes('Samantha') || voice.name.includes('Daniel') || voice.name.includes('Karen')) score += 15;
        break;
      case 'edge':
        // Edge has access to Microsoft voices
        if (voice.name.includes('Microsoft')) score += 20;
        break;
      case 'firefox':
        // Firefox has access to system voices
        if (voice.localService) score += 15;
        break;
    }
    
    return score;
  }

  private isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
    const naturalIndicators = [
      'natural', 'enhanced', 'premium', 'neural', 'ai', 'siri',
      'google', 'microsoft', 'samsung', 'apple'
    ];
    
    const voiceName = voice.name.toLowerCase();
    const voiceURI = voice.voiceURI.toLowerCase();
    
    return naturalIndicators.some(indicator => 
      voiceName.includes(indicator) || voiceURI.includes(indicator)
    );
  }

  private isPremiumVoice(voice: SpeechSynthesisVoice): boolean {
    const premiumIndicators = [
      'premium', 'enhanced', 'natural', 'neural', 'ai', 'siri',
      'online', 'cloud'
    ];
    
    const voiceName = voice.name.toLowerCase();
    const voiceURI = voice.voiceURI.toLowerCase();
    
    return premiumIndicators.some(indicator => 
      voiceName.includes(indicator) || voiceURI.includes(indicator)
    );
  }
  
  public reloadVoicePreference() {
    if (!window.speechSynthesis) return;
    this._updatePreferredVoice();
  }

  public refreshVoices() {
    if (!window.speechSynthesis) return;
    
    // Force voice refresh on some browsers
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged();
    }
    
    // Wait a bit for voices to load, then update
    setTimeout(() => {
      this._updatePreferredVoice();
    }, 100);
  }

  public forceAppleVoiceDiscovery() {
    if (!this.isAppleDevice()) {
      console.log('Not on Apple device, skipping Apple voice discovery');
      return;
    }
    
    console.log('🔍 Forcing Apple voice discovery...');
    
    // Force voice refresh multiple times to ensure all voices are loaded
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged();
    }
    
    // Multiple refresh attempts to catch all voices
    setTimeout(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged();
      }
    }, 200);
    
    setTimeout(() => {
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged();
      }
      this._updatePreferredVoice();
    }, 500);
    
    setTimeout(() => {
      this._updatePreferredVoice();
      console.log('✅ Apple voice discovery complete');
    }, 1000);
  }

  public forceSafariVoiceRefresh() {
    if (!this.isSafari()) {
      console.log('Not Safari, skipping Safari voice refresh');
      return;
    }
    
    console.log('🌐 Forcing Safari voice refresh...');
    
    // Safari needs multiple attempts to load voices properly
    const attemptVoiceLoad = (attempt: number = 1) => {
      if (attempt > 5) {
        console.log('Safari: Max voice load attempts reached');
        return;
      }
      
      console.log(`Safari: Voice load attempt ${attempt}`);
      
      if (window.speechSynthesis.onvoiceschanged) {
        window.speechSynthesis.onvoiceschanged();
      }
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log(`Safari: Successfully loaded ${voices.length} voices on attempt ${attempt}`);
        this._updatePreferredVoice();
      } else {
        setTimeout(() => attemptVoiceLoad(attempt + 1), 200 * attempt);
      }
    };
    
    attemptVoiceLoad();
  }

  public testVoice(text: string = "Hello, this is a test of the voice system. How does this sound?") {
    if (!this.preferredVoice) {
      this._updatePreferredVoice();
    }
    
    if (this.preferredVoice) {
      console.log(`Testing voice: ${this.preferredVoice.name}`);
      this.speak(text);
    } else {
      console.warn('No voice available for testing');
    }
  }

  public getVoiceInfo() {
    const voices = window.speechSynthesis.getVoices();
    const platform = this.detectPlatform();
    const browser = this.detectBrowser();
    
    return {
      platform,
      browser,
      totalVoices: voices.length,
      currentVoice: this.preferredVoice ? {
        name: this.preferredVoice.name,
        voiceURI: this.preferredVoice.voiceURI,
        lang: this.preferredVoice.lang,
        localService: this.preferredVoice.localService,
        default: this.preferredVoice.default,
        qualityScore: this.scoreVoiceQuality(this.preferredVoice, platform, browser)
      } : null,
      availableVoices: voices.map(voice => ({
        name: voice.name,
        voiceURI: voice.voiceURI,
        lang: voice.lang,
        localService: voice.localService,
        default: voice.default,
        qualityScore: this.scoreVoiceQuality(voice, platform, browser)
      })).sort((a, b) => b.qualityScore - a.qualityScore),
      geminiLive: {
        isAvailable: geminiLiveVoice.isServiceAvailable(),
        isEnabled: this.useGeminiLive,
        currentVoice: this.geminiVoice,
        availableVoices: GEMINI_VOICES
      }
    };
  }

  public setGeminiLiveVoice(voiceId: string): boolean {
    return geminiLiveVoice.setVoice(voiceId);
  }

  public toggleGeminiLive(enabled: boolean): void {
    this.useGeminiLive = enabled;
    console.log(`Gemini Live Voice: ${enabled ? 'enabled' : 'disabled'}`);
  }

  public isGeminiLiveAvailable(): boolean {
    return geminiLiveVoice.isServiceAvailable();
  }

  public getGeminiVoiceQuality(): 'gemini_live' | 'safari' | 'fallback' {
    return geminiLiveVoice.getVoiceQuality();
  }

  private initSpeechSynthesis() {
    if (!window.speechSynthesis) return;
    
    // Safari-specific voice loading fix
    if (this.isSafari()) {
      console.log('🍎 Safari detected - using enhanced voice loading');
      
      // Multiple voice loading attempts for Safari
      const loadVoicesForSafari = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Safari: Attempting to load voices, found:', voices.length);
        
        if (voices.length > 0) {
          this._updatePreferredVoice();
        } else {
          // Retry multiple times for Safari
          setTimeout(loadVoicesForSafari, 100);
          setTimeout(loadVoicesForSafari, 500);
          setTimeout(loadVoicesForSafari, 1000);
        }
      };
      
      // Initial load attempt
      loadVoicesForSafari();
      
      // Set up voice change handler
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('Safari: onvoiceschanged event fired');
        loadVoicesForSafari();
      };
    } else {
      // Standard voice loading for other browsers
      const setVoice = () => this._updatePreferredVoice();
      window.speechSynthesis.onvoiceschanged = setVoice;
      setVoice();
    }
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

  public async speak(text: string) {
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

    // Try Gemini Live first if enabled and available
    if (this.useGeminiLive && geminiLiveVoice.isServiceAvailable()) {
      try {
        console.log(`🎯 Using Gemini Live Voice: ${this.geminiVoice.name}`);
        this.dispatchPhaseChange('SPEAKING');
        window.dispatchEvent(new Event('lex.tts.start'));
        
        const success = await geminiLiveVoice.speak(sanitizedText);
        if (success) {
          // Gemini Live handled the speech
          window.dispatchEvent(new Event('lex.tts.end'));
          this.dispatchPhaseChange('IDLE');
          return;
        } else {
          console.log('Gemini Live failed, falling back to system TTS');
        }
      } catch (error) {
        console.error('Gemini Live error, falling back to system TTS:', error);
      }
    }

    // Fallback to system TTS
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis not supported.");
      this.dispatchPhaseChange('IDLE');
      return;
    }

    // Ensure we have the best voice selected
    if (!this.preferredVoice) {
      this._updatePreferredVoice();
    }

    const utterance = new SpeechSynthesisUtterance(sanitizedText);
    utterance.lang = this.lang;
    
    // Optimize voice settings based on platform and voice quality
    const platform = this.detectPlatform();
    const voiceQuality = this.preferredVoice ? this.scoreVoiceQuality(this.preferredVoice, platform, this.detectBrowser()) : 0;
    
    // Adjust rate and pitch based on voice quality
    if (voiceQuality > 70) {
      // High-quality voice - use natural settings
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    } else if (voiceQuality > 40) {
      // Medium-quality voice - slight adjustments
      utterance.rate = 0.9;
      utterance.pitch = 0.9;
      utterance.volume = 0.95;
    } else {
      // Lower-quality voice - more adjustments for clarity
      utterance.rate = 0.85;
      utterance.pitch = 0.8;
      utterance.volume = 0.9;
    }
    
    if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
        console.log(`Speaking with system voice: ${this.preferredVoice.name} (Quality: ${voiceQuality})`);
    } else {
        console.warn('No preferred voice set, using system default');
    }

    utterance.onstart = () => {
      this.dispatchPhaseChange('SPEAKING');
      window.dispatchEvent(new Event('lex.tts.start'));
      
      // Log voice performance metrics
      if (this.preferredVoice) {
        console.log(`Voice performance: ${this.preferredVoice.name} | Rate: ${utterance.rate} | Pitch: ${utterance.pitch} | Quality Score: ${voiceQuality}`);
      }
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
        console.error(`Voice: ${this.preferredVoice?.name || 'Unknown'}, Platform: ${platform}`);
        window.dispatchEvent(new Event('lex.tts.error'));
        
        // Try to recover by updating voice preference
        this._updatePreferredVoice();
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