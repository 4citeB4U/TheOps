
import React from 'react';
import { useVoiceControl } from '../../contexts/VoiceControlContext';

const LexWaveEmitter: React.FC = () => {
    const { phase } = useVoiceControl();
    const isSpeaking = phase === 'SPEAKING';

    const bars = [
        { color: 'bg-primary-blue', delay: '0s' },
        { color: 'bg-accent-fuchsia', delay: '0.1s' },
        { color: 'bg-teal-500', delay: '0.2s' },
        { color: 'bg-primary-blue', delay: '0.3s' },
        { color: 'bg-accent-fuchsia', delay: '0.4s' },
        { color: 'bg-teal-500', delay: '0.5s' },
        { color: 'bg-primary-blue', delay: '0.6s' },
    ];

    return (
        <div className="h-16 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 flex justify-around items-center overflow-hidden">
            {bars.map((bar, index) => (
                 <div
                    key={index}
                    className={`w-3 h-full rounded-full ${bar.color}`}
                    style={{
                        animation: isSpeaking ? `wave-pulse 1s ${bar.delay} infinite ease-in-out` : 'none',
                        transform: 'scaleY(0.1)'
                    }}
                />
            ))}
            <style>{`
                @keyframes wave-pulse {
                    0%, 100% { transform: scaleY(0.1); opacity: 0.5; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LexWaveEmitter;
