
import React, { useState, useEffect } from 'react';
import { voiceOrchestrator } from '../../services/voiceOrchestrator';

interface VoiceWaveProps {
  isActive: boolean;
}

const VoiceWave: React.FC<VoiceWaveProps> = ({ isActive }) => {
  const [voiceInfo, setVoiceInfo] = useState(voiceOrchestrator.getVoiceInfo());
  const [showQuality, setShowQuality] = useState(false);

  useEffect(() => {
    const updateVoiceInfo = () => setVoiceInfo(voiceOrchestrator.getVoiceInfo());
    
    // Update voice info periodically
    const interval = setInterval(updateVoiceInfo, 5000);
    
    // Also update when voices change
    window.speechSynthesis.addEventListener('voiceschanged', updateVoiceInfo);
    
    return () => {
      clearInterval(interval);
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoiceInfo);
    };
  }, []);

  const getQualityColor = (score: number) => {
    if (score > 70) return 'text-green-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityLabel = (score: number) => {
    if (score > 70) return 'Excellent';
    if (score > 40) return 'Good';
    return 'Basic';
  };

  const barClasses = 'w-1 h-full bg-indigo-400 rounded-full transition-all duration-300 ease-in-out';
  
  return (
    <div className="relative">
      <div 
        className="flex justify-center items-center h-full space-x-1.5 cursor-pointer"
        onMouseEnter={() => setShowQuality(true)}
        onMouseLeave={() => setShowQuality(false)}
        onClick={() => voiceOrchestrator.testVoice()}
      >
        <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.1s', transform: isActive ? 'scaleY(0.5)' : 'scaleY(0.1)' }}></div>
        <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.2s', transform: isActive ? 'scaleY(1)' : 'scaleY(0.2)' }}></div>
        <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.3s', transform: isActive ? 'scaleY(0.75)' : 'scaleY(0.1)' }}></div>
        <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.4s', transform: isActive ? 'scaleY(1)' : 'scaleY(0.2)' }}></div>
        <div className={`${barClasses}`} style={{ animation: isActive ? 'wave 1.2s ease-in-out infinite' : 'none', animationDelay: '0.5s', transform: isActive ? 'scaleY(0.5)' : 'scaleY(0.1)' }}></div>
      </div>

      {/* Voice Quality Tooltip */}
      {showQuality && voiceInfo.currentVoice && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 whitespace-nowrap">
          <div className="text-xs space-y-1">
            <div className="font-medium text-slate-200">Voice Quality</div>
            <div className={`font-bold ${getQualityColor(voiceInfo.currentVoice.qualityScore)}`}>
              {getQualityLabel(voiceInfo.currentVoice.qualityScore)} ({voiceInfo.currentVoice.qualityScore})
            </div>
            <div className="text-slate-400">{voiceInfo.currentVoice.name}</div>
            <div className="text-slate-500 text-xs">Click to test voice</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
        </div>
      )}

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
