
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { View, ChatMessage, Phase, Audience, UserProfile, GreetingSettings, AppLayout } from '../types';
import { db } from '../services/db';
import { voiceOrchestrator } from '../services/voiceOrchestrator';

type QuickActionModalType = 'note' | 'intel' | null;

interface AppContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  chatHistory: ChatMessage[];
  saveAndClearChat: () => void;
  isOnboarding: boolean;
  completeOnboarding: (name: string, skipped: boolean) => void;
  resetOnboarding: () => Promise<void>;
  highlightedNavItem: View | null;
  setHighlightedNavItem: (view: View | null) => void;
  // Vernacular State
  flow: number;
  setFlow: (flow: number) => void;
  audience: Audience;
  setAudience: (audience: Audience) => void;
  // Personalization State
  userProfile: UserProfile | undefined;
  greetingSettings: GreetingSettings | undefined;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateGreetingSettings: (settings: Partial<GreetingSettings>) => void;
  // Quick Actions
  quickActionModal: QuickActionModalType;
  setQuickActionModal: (modal: QuickActionModalType) => void;
  // Mobile Layout State
  isSidebarOpen: boolean;
  isRightRailOpen: boolean;
  toggleSidebar: () => void;
  toggleRightRail: () => void;
  closeSidebars: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('pulse');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [highlightedNavItem, setHighlightedNavItem] = useState<View | null>(null);
  const [quickActionModal, setQuickActionModal] = useState<QuickActionModalType>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightRailOpen, setIsRightRailOpen] = useState(false);

  // --- Live Queries for Personalization Data ---
  const userProfile = useLiveQuery(() => db.userProfile.get('main'), []);
  const greetingSettings = useLiveQuery(() => db.appearanceSettings.get('main'), []);
  
  // Check if onboarding is needed - more robust check
  const isOnboarding = useMemo(() => {
    if (!userProfile) return true;
    if (userProfile.onboardingStatus === 'skipped' || userProfile.onboardingStatus === 'completed') return false;
    return true;
  }, [userProfile]);

  // Vernacular state with localStorage persistence
  const [flow, setFlowState] = useState<number>(() => Number(localStorage.getItem('lexFlow') || 50));
  const [audience, setAudienceState] = useState<Audience>(() => (localStorage.getItem('lexAudience') as Audience) || 'pg');

  const setFlow = useCallback((newFlow: number) => {
      localStorage.setItem('lexFlow', newFlow.toString());
      setFlowState(newFlow);
  }, []);
  
  const setAudience = useCallback((newAudience: Audience) => {
      localStorage.setItem('lexAudience', newAudience);
      setAudienceState(newAudience);
  }, []);
  
  // Mobile sidebar toggles
  const closeSidebars = useCallback(() => {
    setIsSidebarOpen(false);
    setIsRightRailOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(v => !v);
    setIsRightRailOpen(false); // Close other one
  }, []);

  const toggleRightRail = useCallback(() => {
    setIsRightRailOpen(v => !v);
    setIsSidebarOpen(false); // Close other one
  }, []);

  // Update voice orchestrator with personality and language settings
  useEffect(() => {
    voiceOrchestrator.setCurrentPersonality(flow, audience);
  }, [flow, audience]);

  useEffect(() => {
    if (userProfile?.language) {
      voiceOrchestrator.setLanguage(userProfile.language);
    }
  }, [userProfile?.language]);

  const completeOnboarding = useCallback(async (name: string, skipped: boolean) => {
    const now = new Date().toISOString();
    const profileData: UserProfile = {
      id: 'main',
      name,
      isDayOne: true,
      startDate: now,
      onboardingStatus: skipped ? 'skipped' : 'completed',
    };
    await db.userProfile.put(profileData, 'main');
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await db.userProfile.delete('main');
      console.log('Onboarding reset successfully');
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
    }
  }, []);

  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    await db.userProfile.update('main', profile);
  }, []);

  const updateGreetingSettings = useCallback(async (settings: Partial<GreetingSettings>) => {
    await db.appearanceSettings.update('main', settings);
  }, []);


  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  }, []);
  
  const saveAndClearChat = useCallback(async () => {
    if (chatHistory.length === 0) return;
    
    const now = new Date().toISOString();
    const title = `Conversation from ${new Date().toLocaleString()}`;
    
    await db.notes.add({
        id: `convo_${Date.now()}`,
        type: 'conversation',
        title: title,
        conversation: chatHistory,
        createdAt: now,
        updatedAt: now,
        links: {},
    });
    
    setChatHistory([]);
  }, [chatHistory]);

  const startAssistantThinking = useCallback(() => {
    addChatMessage({ role: 'assistant', text: '', isThinking: true });
  }, [addChatMessage]);

  const endAssistantThinking = useCallback((text: string) => {
      setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessageIndex = newHistory.map(m => m.isThinking).lastIndexOf(true);
          if(lastMessageIndex !== -1){
              newHistory[lastMessageIndex] = { role: 'assistant', text: text, isThinking: false };
              return newHistory;
          }
          return [...newHistory, {role: 'assistant', text: text}];
      });
  }, []);

  useEffect(() => {
    const handlePageChange = (event: CustomEvent<{ to: string }>) => {
      if (typeof event.detail.to === 'string') {
        setCurrentView(event.detail.to as View);
      }
    };
    
    const handleUserMessage = (event: CustomEvent<{text: string}>) => {
        addChatMessage({ role: 'user', text: event.detail.text });
    };
    const handleAssistantMessage = (event: CustomEvent<{role: 'assistant', text: string}>) => {
        endAssistantThinking(event.detail.text);
    };

    const handlePhaseChange = (event: CustomEvent<Phase>) => {
        if (event.detail === 'THINKING') {
            startAssistantThinking();
        }
    };

    window.addEventListener('cue.page.change', handlePageChange as EventListener);
    window.addEventListener('lex.chat.send', handleUserMessage as EventListener);
    window.addEventListener('lex.ui.chat.show', handleAssistantMessage as EventListener);
    window.addEventListener('lex.phase.change', handlePhaseChange as EventListener);

    return () => {
      window.removeEventListener('cue.page.change', handlePageChange as EventListener);
      window.removeEventListener('lex.chat.send', handleUserMessage as EventListener);
      window.removeEventListener('lex.ui.chat.show', handleAssistantMessage as EventListener);
      window.removeEventListener('lex.phase.change', handlePhaseChange as EventListener);
    };
  }, [addChatMessage, startAssistantThinking, endAssistantThinking]);

  return (
    <AppContext.Provider value={{ 
        currentView, setCurrentView, chatHistory, saveAndClearChat, 
        isOnboarding, completeOnboarding, resetOnboarding, highlightedNavItem, setHighlightedNavItem, 
        flow, setFlow, audience, setAudience,
        userProfile, greetingSettings,
        updateUserProfile, updateGreetingSettings,
        quickActionModal, setQuickActionModal,
        isSidebarOpen, isRightRailOpen, toggleSidebar, toggleRightRail, closeSidebars
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};