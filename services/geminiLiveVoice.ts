import { GoogleGenAI } from "@google/genai";

// Gemini Live voice options
export interface GeminiVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  accent?: string;
  quality: 'standard' | 'premium';
}

// Available Gemini Live voices
export const GEMINI_VOICES: GeminiVoice[] = [
  {
    id: 'en-US-Neural2-A',
    name: 'Marcus',
    description: 'Deep, clear African American male voice',
    gender: 'male',
    accent: 'African American',
    quality: 'premium'
  },
  {
    id: 'en-US-Neural2-B',
    name: 'David',
    description: 'Warm, professional African American male voice',
    gender: 'male',
    accent: 'African American',
    quality: 'premium'
  },
  {
    id: 'en-US-Neural2-C',
    name: 'James',
    description: 'Confident, engaging African American male voice',
    gender: 'male',
    accent: 'African American',
    quality: 'premium'
  },
  {
    id: 'en-US-Neural2-D',
    name: 'Sarah',
    description: 'Clear, friendly female voice',
    gender: 'female',
    quality: 'premium'
  },
  {
    id: 'en-US-Neural2-E',
    name: 'Emma',
    description: 'Professional, articulate female voice',
    gender: 'female',
    quality: 'premium'
  }
];

class GeminiLiveVoiceService {
  private ai: GoogleGenAI;
  private isAvailable: boolean = false;
  private currentVoice: GeminiVoice = GEMINI_VOICES[0]; // Default to Marcus
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;

  constructor() {
    if (process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      this.isAvailable = true;
      this.initAudioContext();
    } else {
      console.warn('Gemini Live Voice: API key not configured');
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Gemini Live Voice: AudioContext not supported');
    }
  }

  public getAvailableVoices(): GeminiVoice[] {
    return GEMINI_VOICES;
  }

  public getCurrentVoice(): GeminiVoice {
    return this.currentVoice;
  }

  public setVoice(voiceId: string): boolean {
    const voice = GEMINI_VOICES.find(v => v.id === voiceId);
    if (voice) {
      this.currentVoice = voice;
      console.log(`Gemini Live Voice: Set to ${voice.name}`);
      return true;
    }
    return false;
  }

  public isServiceAvailable(): boolean {
    return this.isAvailable && this.audioContext !== null;
  }

  public async speak(text: string): Promise<boolean> {
    if (!this.isServiceAvailable()) {
      console.warn('Gemini Live Voice: Service not available');
      return false;
    }

    if (this.isPlaying) {
      console.log('Gemini Live Voice: Already playing, stopping current audio');
      this.stop();
    }

    try {
      console.log(`Gemini Live Voice: Speaking "${text}" with voice ${this.currentVoice.name}`);
      this.isPlaying = true;

      // Use Gemini Live for text-to-speech with correct API structure
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Convert this text to speech using voice ${this.currentVoice.name}: ${text}` }]
        }],
        generationConfig: {
          responseMimeType: 'audio/mpeg',
          audioConfig: {
            voiceId: this.currentVoice.id,
            audioEncoding: 'MP3',
            sampleRateHertz: 24000
          }
        }
      });

      // Check for audio response
      if (response.response && response.response.audio) {
        // Convert audio data to playable format
        const audioBlob = new Blob([response.response.audio], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Play the audio
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = (error) => {
          console.error('Gemini Live Voice: Audio playback error:', error);
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
        return true;
      } else {
        console.warn('Gemini Live Voice: No audio data received, falling back to system TTS');
        this.isPlaying = false;
        return false;
      }
    } catch (error) {
      console.error('Gemini Live Voice: Error during speech synthesis:', error);
      
      // Log specific error details for debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      this.isPlaying = false;
      return false;
    }
  }

  // Add method to test API connectivity
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'Test connection' }] }]
      });
      return !!response.response;
    } catch (error) {
      console.error('Gemini Live Voice: Connection test failed:', error);
      return false;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    // Note: We can't stop Gemini Live audio directly, but we can track the state
  }

  public getVoiceQuality(): 'gemini_live' | 'safari' | 'fallback' {
    if (this.isServiceAvailable()) {
      return 'gemini_live';
    }
    // This will be determined by the voice orchestrator
    return 'fallback';
  }
}

// Export singleton instance
export const geminiLiveVoice = new GeminiLiveVoiceService();

// Fallback function for when Gemini Live is not available
export const createFallbackAudio = (text: string, voice: GeminiVoice): HTMLAudioElement | null => {
  try {
    // Create a simple fallback using Web Speech API with enhanced settings
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a similar voice in the system
    const voices = window.speechSynthesis.getVoices();
    const fallbackVoice = voices.find(v => 
      v.lang.startsWith('en-US') && 
      (voice.gender === 'male' ? v.name.includes('David') || v.name.includes('Alex') : v.name.includes('Samantha') || v.name.includes('Victoria'))
    ) || voices.find(v => v.lang.startsWith('en-US')) || null;
    
    if (fallbackVoice) {
      utterance.voice = fallbackVoice;
    }
    
    // Optimize for clarity
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    return new Audio(); // Placeholder - actual implementation would use Web Speech API
  } catch (error) {
    console.error('Fallback audio creation failed:', error);
    return null;
  }
};
