
import React from 'react';

interface VoiceWaveProps {
  isActive: boolean;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive }) => {
  const barClasses = 'w-1 h-full bg-indigo-400 rounded-full transition-all duration-300 ease-in-out';
  
  return (
    <div className="flex justify-center items-center h-full space-x-1.5">
      <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.1s', transform: isActive ? 'scaleY(0.5)' : 'scaleY(0.1)' }}></div>
      <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.2s', transform: isActive ? 'scaleY(1)' : 'scaleY(0.2)' }}></div>
      <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.3s', transform: isActive ? 'scaleY(0.75)' : 'scaleY(0.1)' }}></div>
      <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.4s', transform: isActive ? 'scaleY(1)' : 'scaleY(0.2)' }}></div>
      <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.5s', transform: isActive ? 'scaleY(0.5)' : 'scaleY(0.1)' }}></div>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default VoiceWave;
