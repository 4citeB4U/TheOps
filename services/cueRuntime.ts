
import { voiceOrchestrator } from './voiceOrchestrator';
import { View } from '../types';

const CUE = {
  mic: {
    on: () => voiceOrchestrator.micOn(),
    off: () => voiceOrchestrator.micOff(),
    toggle: () => voiceOrchestrator.toggleMic(),
    hardInterrupt: () => voiceOrchestrator.hardInterrupt(),
  },
  tts: {
    speak: (text: string) => voiceOrchestrator.speak(text),
    cancel: () => voiceOrchestrator.cancelTTS(),
    pause: () => console.warn('CUE.tts:pause not implemented'),
    resume: () => console.warn('CUE.tts:resume not implemented'),
  },
  page: (args: { to: string; action?: string }) => {
    console.log(`CUE: Navigating to ${args.to} with action ${args.action}`);
    window.dispatchEvent(new CustomEvent('cue.page.change', { detail: args }));
  },
  context: {
    setView: (view: View) => voiceOrchestrator.setCurrentContext(view),
    setDictationTarget: (element: HTMLInputElement | HTMLTextAreaElement | null) => voiceOrchestrator.setDictationTarget(element),
  }
};

declare global {
  interface Window {
    CUE: typeof CUE;
  }
}

window.CUE = CUE;

export default CUE;
