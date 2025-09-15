
import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;


interface MobileHeaderProps {
    onMenuClick: () => void;
    onChatClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, onChatClick }) => {
    const { userProfile } = useAppContext();
    
    return (
        <header className="mobile-header ios-safe-area">
            <button 
                onClick={onMenuClick} 
                className="p-3 text-text-light hover:text-white active:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
                aria-label="Open menu"
            >
                <MenuIcon />
            </button>
            <div className="text-lg font-bold text-white flex items-center gap-2">
                <span>LΞX</span>
                {userProfile?.name && (
                    <span className="text-sm text-slate-400 hidden sm:inline">
                        | {userProfile.name}
                    </span>
                )}
            </div>
            <button 
                onClick={onChatClick} 
                className="p-3 text-text-light hover:text-white active:bg-slate-700 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" 
                aria-label="Open chat"
            >
                <ChatIcon />
            </button>
        </header>
    );
};

export default MobileHeader;
