import React from 'react';
import { UserProfile, GreetingSettings } from '../../types';

interface UserDisplayProps {
    userProfile: UserProfile | undefined;
    greetingSettings: GreetingSettings | undefined;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ userProfile, greetingSettings }) => {
    if (!userProfile) return null;

    const name = userProfile.name;
    const settings: Partial<GreetingSettings> = greetingSettings || {};

    const nameStyle: React.CSSProperties = {
        fontFamily: settings.fontFamily || 'inherit',
        fontWeight: settings.fontWeight || 700,
        color: settings.textColor || 'inherit',
        letterSpacing: settings.letterSpacing ? `${settings.letterSpacing}px` : undefined,
    };

    const getEffectClass = () => {
        switch (settings.textEffect) {
            case 'fire': return 'text-effect-fire';
            case 'electric': return 'text-effect-electric';
            case 'glow': return 'text-effect-glow';
            default: return '';
        }
    };

    return (
        <div className="max-w-full">
            <div className="text-xs font-semibold text-text-dark tracking-wider uppercase mb-0.5">Operator</div>
            <div 
                style={nameStyle} 
                className={`text-base leading-tight text-text-light break-words ${getEffectClass()}`}
            >
                {name}
            </div>
        </div>
    );
};

export default UserDisplay;