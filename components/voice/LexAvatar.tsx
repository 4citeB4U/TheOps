
import React from 'react';
import { useVoiceControl } from '../../contexts/VoiceControlContext';

const StaticAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <radialGradient id="avatarGlowStatic" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0.4)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(59, 130, 246, 0)', stopOpacity: 1 }} />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#avatarGlowStatic)" />
        <circle cx="50" cy="50" r="40" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="28" fill="#e2e8f0" fontWeight="800">
            LΞX
        </text>
        <path d="M 20 50 A 30 30 0 0 1 80 50" stroke="#94a3b8" strokeWidth="0.5" fill="none" strokeDasharray="2 3" />
        <path d="M 30 50 A 20 20 0 0 1 70 50" stroke="#94a3b8" strokeWidth="0.5" fill="none" strokeDasharray="1 4" />
    </svg>
);

const AnimatedAvatar: React.FC = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <radialGradient id="avatarGlowAnimated" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{ stopColor: 'rgba(217, 70, 239, 0.6)' }}>
                     <animate attributeName="stop-color" values="rgba(217, 70, 239, 0.6);rgba(59, 130, 246, 0.6);rgba(217, 70, 239, 0.6)" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" style={{ stopColor: 'rgba(217, 70, 239, 0)', stopOpacity: 1 }} />
            </radialGradient>
             <filter id="glitch" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="1" result="warp" />
                <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="8" in="SourceGraphic" in2="warp" />
            </filter>
        </defs>
        
        {/* Pulsing Glow */}
        <circle cx="50" cy="50" r="48" fill="url(#avatarGlowAnimated)">
            <animate attributeName="r" values="48;50;48" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="50" cy="50" r="40" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
        
        {/* Glitching Text */}
        <g style={{ filter: "url(#glitch)", opacity: 0.1 }}>
             <animate attributeName="opacity" values="0.1;0.3;0.1;0.4;0.1" dur="1.5s" repeatCount="indefinite" />
            <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="28" fill="#d946ef" fontWeight="800">
                LΞX
            </text>
        </g>
        
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="28" fill="#e2e8f0" fontWeight="800">
            LΞX
        </text>

        {/* Orbiting Paths */}
        <path d="M 20 50 A 30 30 0 0 1 80 50" stroke="#d946ef" strokeWidth="0.7" fill="none" strokeDasharray="2 3">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
        </path>
        <path d="M 30 50 A 20 20 0 0 1 70 50" stroke="#3b82f6" strokeWidth="0.7" fill="none" strokeDasharray="4 2">
            <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="6s" repeatCount="indefinite" />
        </path>
    </svg>
);

const LexAvatar: React.FC = () => {
    const { phase } = useVoiceControl();
    const isSpeaking = phase === 'SPEAKING';

    return (
        <div className="aspect-square bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
           {isSpeaking ? <AnimatedAvatar /> : <StaticAvatar />}
        </div>
    );
};

export default LexAvatar;
