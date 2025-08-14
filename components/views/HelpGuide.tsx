
import React from 'react';
import CUE from '../../services/cueRuntime';
import { View } from '../../types';

const HelpGuide: React.FC = () => {

    const handleTryIt = (view: View, command: string) => {
        CUE.tts.speak(`Okay, I'll navigate to ${command}. Just say, "Lex, go to ${command}."`);
        setTimeout(() => CUE.page({ to: view }), 3000);
    }

    return (
        <div className="p-8 flex flex-col">
            <h1 className="text-4xl font-extrabold text-white mb-2">The Playbook</h1>
            <p className="text-lg text-slate-400 mb-8">Learn the moves to run the Ops Center.</p>
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-8 max-w-3xl">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">The "One Mic" System</h2>
                    <p className="text-slate-300 mb-4">
                        You can control the entire app using the microphone button at the bottom of the screen. Here are the core commands:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        <li><span className="font-semibold text-white">Single Tap:</span> Start listening for a command.</li>
                        <li><span className="font-semibold text-white">Double Tap:</span> Hard interrupt. Immediately stops me from speaking and starts listening.</li>
                        <li><span className="font-semibold text-white">"Stop, Lex" or "Pause":</span> While I'm speaking, say this to make me stop.</li>
                    </ul>
                </div>
                
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Navigation Commands</h2>
                    <p className="text-slate-300 mb-4">
                        To move between tools, just tell me where you want to go. For example: "Go to The Pulse."
                    </p>
                     <div className="flex gap-4">
                        <button 
                            onClick={() => handleTryIt('pulse', 'The Pulse')}
                            className="px-4 py-2 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600"
                        >
                           Try It: Go to The Pulse
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Taking Notes</h2>
                    <p className="text-slate-300 mb-4">
                        You can dictate notes directly in The Lab. Just say "Take a note," followed by what you want to write down.
                    </p>
                     <div className="flex gap-4">
                        <button
                            onClick={() => CUE.tts.speak('Try saying: "Lex, take a note: the mitochondria is the powerhouse of the cell."')} 
                            className="px-4 py-2 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600">
                           Try It: Take a Note
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Data & Privacy</h2>
                    <p className="text-slate-300 mb-4">
                        Your data lives only on your device; it's never sent to a server. This is private, but it means you need to back it up. Go to The Garage to download or email your data.
                    </p>
                    <button 
                        onClick={() => CUE.page({ to: 'garage'})}
                        className="px-4 py-2 rounded-lg font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600">
                       Go to The Garage
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpGuide;
