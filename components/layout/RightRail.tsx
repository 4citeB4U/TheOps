
import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useVoiceControl } from '../../contexts/VoiceControlContext';
import { ChatMessage, Phase } from '../../types';
import HighlightText from '../utils/HighlightText';
import { GLOBAL_HIGHLIGHTS } from '../../constants/highlights';

const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;

const PhaseIndicator: React.FC<{ phase: Phase, transcript: string }> = ({ phase, transcript }) => {
    const textClasses = "text-center text-sm text-slate-400";
    const phaseInfo: Record<Phase, { text: string; color: string }> = {
        IDLE: { text: "Tap mic to start", color: "border-slate-600" },
        LISTENING: { text: transcript || "Listening...", color: "border-indigo-500 animate-pulse" },
        SPEAKING: { text: "Speaking...", color: "border-teal-500" },
        THINKING: { text: "Thinking...", color: "border-amber-500" },
        PAUSED: { text: "Paused", color: "border-slate-500" },
    };

    const {text, color} = phaseInfo[phase];

    return (
        <div className={`p-4 border-b border-slate-700`}>
            <div className={`border-2 ${color} rounded-lg p-3 transition-all`}>
                <p className={textClasses}>{text}</p>
            </div>
        </div>
    );
};

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const bubbleClasses = isUser
        ? 'bg-indigo-500 self-end'
        : 'bg-slate-700 self-start';
    
    if (message.isThinking) {
        return (
            <div className="bg-slate-700 self-start rounded-lg p-3 max-w-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            </div>
        )
    }

    return (
        <div className={`rounded-lg p-3 max-w-sm break-words ${bubbleClasses}`}>
            <p className="text-white">
              <HighlightText text={message.text} highlights={GLOBAL_HIGHLIGHTS} />
            </p>
        </div>
    );
};

const RightRail: React.FC = () => {
  const { chatHistory, saveAndClearChat, isRightRailOpen } = useAppContext();
  const { phase, transcript } = useVoiceControl();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  const railClasses = [
    'right-rail',
    'w-80',
    'bg-slate-800/80 backdrop-blur-md',
    'flex',
    'flex-col',
    'h-screen',
    'border-l',
    'border-slate-700/50',
    'shrink-0',
    'ios-safe-area',
    isRightRailOpen ? 'right-rail-open' : ''
  ].join(' ');

  return (
    <aside className={railClasses}>
      <PhaseIndicator phase={phase} transcript={transcript} />
      <div className="flex-grow overflow-hidden">
        <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 scrollable">
          <div className="flex flex-col space-y-4">
            {chatHistory.length > 0 ? chatHistory.map((msg, index) => (
              <ChatBubble key={index} message={msg} />
            )) : (
              <div className="text-center text-slate-500 pt-10">
                  <p>Chat history is empty.</p>
                  <p className="text-xs mt-2">Conversations are saved to your notes.</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-700 space-y-3">
        {/* Chat Input Box */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue/50 text-base"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                // Handle sending message
                e.currentTarget.value = '';
              }
            }}
          />
          <button className="px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 active:bg-primary-blue/80 transition-colors min-h-[44px]">
            Send
          </button>
        </div>
        
        <button 
            onClick={saveAndClearChat}
            disabled={chatHistory.length === 0}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 active:bg-slate-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed min-h-[44px]"
        >
            <SaveIcon />
            Save & Clear Chat
        </button>
      </div>
    </aside>
  );
};

export default RightRail;