
import React, { useEffect, useLayoutEffect, useRef, useState, TouchEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Workspace from './components/layout/Workspace';
import RightRail from './components/layout/RightRail';
import LexConsole from './components/voice/LexConsole';
import { useAppContext } from './contexts/AppContext';
import OnboardingFlow from './components/views/OnboardingFlow';
import { composeWelcome } from './services/lex-vernacular-patch';
import CUE from './services/cueRuntime';
import QuickActionModals from './components/modals/QuickActionModals';
import MobileHeader from './components/layout/MobileHeader';
import BackgroundAmbiance from './components/ambiance/BackgroundAmbiance';
import AppBackground from './components/layout/AppBackground';


const BackupReminder: React.FC<{ onDismiss: () => void; onBackup: () => void }> = ({ onDismiss, onBackup }) => (
    <div className="fixed top-0 left-0 right-0 bg-yellow-800/90 backdrop-blur-sm p-3 text-center text-sm text-white z-50 flex items-center justify-center gap-4">
        <span>Heads up! It's been a while since your last data backup. It's a good idea to save your work regularly.</span>
        <div className="flex gap-2">
            <button onClick={onBackup} className="px-3 py-1 bg-primary-blue rounded font-semibold">Go to Garage</button>
            <button onClick={onDismiss} className="px-3 py-1 bg-slate-600 rounded">Remind me Later</button>
        </div>
    </div>
);


function App() {
  const { 
      isOnboarding, currentView, flow, userProfile,
      isSidebarOpen, isRightRailOpen, closeSidebars, toggleSidebar, toggleRightRail,
      quickActionModal
  } = useAppContext();

  const [isReadyForConversation, setIsReadyForConversation] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const prevView = useRef(currentView);
  const touchStartRef = useRef<number | null>(null);

  // Apply layout and theme settings from user profile
  useLayoutEffect(() => {
    if(userProfile?.borderRadius !== undefined) {
        document.documentElement.style.setProperty('--border-radius', `${userProfile.borderRadius}px`);
    } else {
        document.documentElement.style.setProperty('--border-radius', '0.75rem');
    }
  }, [userProfile?.borderRadius]);
  
  // Backup Reminder Logic
  useEffect(() => {
    if(isOnboarding) return;

    const lastReminderTimestamp = localStorage.getItem('lexLastBackupTimestamp');
    if (!lastReminderTimestamp) {
      // If no timestamp, set it to now but show reminder in 14 days
      localStorage.setItem('lexLastBackupTimestamp', new Date().toISOString());
    } else {
      const lastReminderDate = new Date(lastReminderTimestamp);
      const now = new Date();
      const fourteenDaysInMillis = 14 * 24 * 60 * 60 * 1000;
      if (now.getTime() - lastReminderDate.getTime() > fourteenDaysInMillis) {
        setShowBackupReminder(true);
      }
    }
  }, [isOnboarding]);

  // Update Voice Orchestrator with current view context
  useEffect(() => {
    if (!isOnboarding) {
        CUE.context.setView(currentView);
    }
  }, [currentView, isOnboarding]);

  // Continuous Conversation Engine
  useEffect(() => {
    if (isOnboarding) return;

    if (!isReadyForConversation) {
      setIsReadyForConversation(true);
      return;
    }

    if (prevView.current !== currentView) {
      const timer = setTimeout(() => {
        if (window.speechSynthesis.speaking) return;
        const welcomeLine = composeWelcome(flow, currentView);
        CUE.tts.speak(welcomeLine);
      }, 200);

      prevView.current = currentView;
      return () => clearTimeout(timer);
    }
  }, [currentView, isOnboarding, flow, isReadyForConversation]);
  
  // Swipe gestures for mobile
  useEffect(() => {
      const handleTouchStart = (e: globalThis.TouchEvent) => {
          if (e.touches.length === 1) {
              touchStartRef.current = e.touches[0].clientX;
          }
      };
      
      const handleTouchEnd = (e: globalThis.TouchEvent) => {
          if (touchStartRef.current !== null && e.changedTouches.length === 1) {
              const touchEnd = e.changedTouches[0].clientX;
              const swipeDistance = touchEnd - touchStartRef.current;
              const startX = touchStartRef.current;
              
              const screenWidth = window.innerWidth;
              const edgeThreshold = 40; // Pixels from edge to trigger swipe

              // Swipe right to open left sidebar
              if (startX < edgeThreshold && swipeDistance > 50 && !isSidebarOpen) {
                  toggleSidebar();
              }
              // Swipe left to open right sidebar
              else if (startX > screenWidth - edgeThreshold && swipeDistance < -50 && !isRightRailOpen) {
                  toggleRightRail();
              }
          }
          touchStartRef.current = null;
      };

      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchend', handleTouchEnd);
      };
  }, [isSidebarOpen, isRightRailOpen, toggleSidebar, toggleRightRail]);
  
  if (isOnboarding) {
    return <OnboardingFlow />;
  }

  const layoutClass = userProfile?.layout === 'main_sidebar_chat' ? 'layout-main-sidebar-chat' : 'layout-sidebar-main-chat';

  const handleDismissReminder = () => {
      localStorage.setItem('lexLastBackupTimestamp', new Date().toISOString());
      setShowBackupReminder(false);
  };
  
  const handleGoToBackup = () => {
      CUE.page({to: 'garage'});
      handleDismissReminder();
  };

  const isBackdropVisible = isSidebarOpen || isRightRailOpen;

  return (
    <div className="min-h-screen w-screen flex flex-col font-sans antialiased">
      <AppBackground />
      <BackgroundAmbiance />
      {showBackupReminder && <BackupReminder onDismiss={handleDismissReminder} onBackup={handleGoToBackup} />}
      <MobileHeader onMenuClick={toggleSidebar} onChatClick={toggleRightRail} />

      <div className={`main-content-area flex-grow ${layoutClass} overflow-hidden`}>
        <Sidebar />
        <Workspace />
        <RightRail />
      </div>

      <LexConsole />
      <AnimatePresence>
        {quickActionModal && <QuickActionModals />}
      </AnimatePresence>
      {isBackdropVisible && <div className="backdrop" onClick={closeSidebars}></div>}

      <div className="fixed bottom-2 right-4 text-xs text-slate-700 pointer-events-none">
        This is a leeway Industries product. By rapidwebdevelop.com.
      </div>
      <style>{`
        @media (min-width: 769px) {
            .main-content-area { display: flex; }
            .workspace { flex-grow: 1; }
            .layout-main-sidebar-chat > .sidebar { order: 2; }
            .layout-main-sidebar-chat > .workspace { order: 1; }
            .layout-main-sidebar-chat > .right-rail { order: 3; }
        }
      `}</style>
    </div>
  );
}

export default App;
