
import React from 'react';

const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;


interface MobileHeaderProps {
    onMenuClick: () => void;
    onChatClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, onChatClick }) => {
    return (
        <header className="mobile-header">
            <button onClick={onMenuClick} className="p-2 text-text-light hover:text-white" aria-label="Open menu">
                <MenuIcon />
            </button>
            <div className="text-lg font-bold text-white">LΞX</div>
            <button onClick={onChatClick} className="p-2 text-text-light hover:text-white" aria-label="Open chat">
                <ChatIcon />
            </button>
        </header>
    );
};

export default MobileHeader;
