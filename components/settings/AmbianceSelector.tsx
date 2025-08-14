
import React from 'react';

const ambiances = [
    { emoji: '🔥', name: 'Ember' },
    { emoji: '✨', name: 'Stardust' },
    { emoji: '💻', name: 'Digital Rain' },
    { emoji: '❄️', name: 'Snowfall' },
];

interface AmbianceSelectorProps {
    selected: string[];
    onChange: (selected: string[]) => void;
}

const AmbianceSelector: React.FC<AmbianceSelectorProps> = ({ selected, onChange }) => {
    
    const handleToggle = (emoji: string) => {
        const newSelection = selected.includes(emoji)
            ? selected.filter(item => item !== emoji)
            : [...selected, emoji];
        onChange(newSelection);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ambiances.map(ambiance => {
                const isActive = selected.includes(ambiance.emoji);
                return (
                    <button
                        key={ambiance.emoji}
                        type="button"
                        onClick={() => handleToggle(ambiance.emoji)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-center
                        ${isActive 
                            ? 'bg-accent-fuchsia/20 border-accent-fuchsia text-white' 
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                        }`}
                    >
                        <span className="text-2xl">{ambiance.emoji}</span>
                        <span className="block text-sm font-semibold mt-1">{ambiance.name}</span>
                    </button>
                )
            })}
        </div>
    );
};

export default AmbianceSelector;
