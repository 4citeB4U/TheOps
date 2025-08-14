
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Phase } from '../types';

interface VoiceControlContextType {
  phase: Phase;
  transcript: string;
}

const VoiceControlContext = createContext<VoiceControlContextType | undefined>(undefined);

export const VoiceControlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const handlePhaseChange = (event: CustomEvent<Phase>) => {
      setPhase(event.detail);
    };
    const handleTranscriptUpdate = (event: CustomEvent<{ transcript: string }>) => {
      setTranscript(event.detail.transcript);
    };
    
    const handleSttStop = () => {
        setTranscript('');
    }

    window.addEventListener('lex.phase.change', handlePhaseChange as EventListener);
    window.addEventListener('lex.stt.interim', handleTranscriptUpdate as EventListener);
    window.addEventListener('lex.stt.final', handleTranscriptUpdate as EventListener);
    window.addEventListener('lex.stt.stop', handleSttStop as EventListener);

    return () => {
      window.removeEventListener('lex.phase.change', handlePhaseChange as EventListener);
      window.removeEventListener('lex.stt.interim', handleTranscriptUpdate as EventListener);
      window.removeEventListener('lex.stt.final', handleTranscriptUpdate as EventListener);
      window.removeEventListener('lex.stt.stop', handleSttStop as EventListener);
    };
  }, []);

  return (
    <VoiceControlContext.Provider value={{ phase, transcript }}>
      {children}
    </VoiceControlContext.Provider>
  );
};

export const useVoiceControl = (): VoiceControlContextType => {
  const context = useContext(VoiceControlContext);
  if (!context) {
    throw new Error('useVoiceControl must be used within a VoiceControlProvider');
  }
  return context;
};
