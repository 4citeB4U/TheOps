import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import CUE from '../../services/cueRuntime';
import { View } from '../../types';
import LexAvatar from '../voice/LexAvatar';
import LexWaveEmitter from '../voice/LexWaveEmitter';
import UserDisplay from './UserDisplayIframe';
import { db } from '../../services/db';

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3 shrink-0">{children}</svg>;
const PulseIcon = () => <Icon><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Icon>;
const MagnaCartaIcon = () => <Icon><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M9 18v-6" /><path d="M15 18v-6" /></Icon>;
const GrindIcon = () => <Icon><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></Icon>;
const LabIcon = () => <Icon><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><path d="M14 2v6h6" /><path d="M10 16s-1-2-3-2-3 2-3 2" /><path d="M18 16s-1-2-3-2-3 2-3 2" /></Icon>;
const AnalyzerIcon = () => <Icon><path d="M12 3L4 9v12h16V9l-8-6z"/><path d="M8 9v12"/><path d="M16 9v12"/><path d="M4 9l8 6 8-6"/></Icon>;
const IntelIcon = () => <Icon><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></Icon>;
const CampusIcon = () => <Icon><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Icon>;
const GarageIcon = () => <Icon><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>;
const PlaybookIcon = () => <Icon><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></Icon>;
const BookOpenIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;

const navItems: { view: View; label: string; icon: React.ElementType }[] = [
  { view: 'pulse', label: 'The Pulse', icon: PulseIcon },
  { view: 'magna_carta', label: 'The Magna Carta', icon: MagnaCartaIcon },
  { view: 'grind', label: 'The Grind', icon: GrindIcon },
  { view: 'lab', label: 'The Lab', icon: LabIcon },
  { view: 'analyzer', label: 'The Analyzer', icon: AnalyzerIcon },
  { view: 'intel', label: 'The Intel', icon: IntelIcon },
  { view: 'campus', label: 'The Campus', icon: CampusIcon },
];

const bottomNavItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'playbook', label: 'The Playbook', icon: PlaybookIcon },
    { view: 'garage', label: 'The Garage', icon: GarageIcon },
];

const Sidebar: React.FC = () => {
  const { currentView, highlightedNavItem, closeSidebars, isSidebarOpen, userProfile, greetingSettings } = useAppContext();

  const handleNav = (view: View) => {
    CUE.page({ to: view });
    closeSidebars();
  };

  const NavButton: React.FC<{view: View, label: string, icon: React.ElementType}> = ({view, label, icon: NavIcon}) => {
    const isHighlighted = highlightedNavItem === view;
    const isActive = currentView === view;
    return (
        <li className="mb-1">
            <button
                onClick={() => handleNav(view)}
                className={`w-full flex items-center p-2.5 rounded-lg text-left text-base transition-all duration-200 group
                ${isActive ? 'bg-primary-blue text-white font-semibold' : 'text-text-dark hover:bg-bg-surface hover:text-text-light'}
                ${isHighlighted ? 'ring-2 ring-offset-2 ring-offset-bg-main ring-accent-fuchsia' : ''}`}
            >
                <NavIcon/>
                <span className="group-hover:translate-x-1 transition-transform duration-200">{label}</span>
            </button>
        </li>
    );
  }

  const sidebarClasses = [
    'sidebar',
    'w-64',
    'bg-gray-900/80 backdrop-blur-md',
    'p-4',
    'flex',
    'flex-col',
    'h-screen',
    'border-r',
    'border-border-color/50',
    'shrink-0',
    isSidebarOpen ? 'sidebar-open' : ''
  ].join(' ');

  return (
    <aside className={sidebarClasses}>
      <div className="flex items-center mb-8 pl-1">
        <div className="bg-primary-blue p-2 rounded-lg mr-3 text-white">
            <BookOpenIcon />
        </div>
        <h1 className="text-xl font-bold text-white">LΞX Ops Center</h1>
      </div>
      
      <div className="flex-grow flex flex-col justify-between overflow-y-auto">
        <nav>
          <ul>
            {navItems.map((item) => <NavButton key={item.view} {...item} />)}
          </ul>
        </nav>

        <div>
           <div className="my-4 px-1 space-y-3">
              <LexAvatar />
              <LexWaveEmitter />
           </div>
           <nav>
             <ul>
                {bottomNavItems.map((item) => <NavButton key={item.view} {...item} />)}
             </ul>
           </nav>
           
           {/* Reset Onboarding Button */}
           <div className="mt-4 px-1">
             <button
               onClick={async () => {
                 if (confirm('Reset onboarding? This will clear your profile and show the onboarding flow again.')) {
                   try {
                     await db.userProfile.delete('main');
                     window.location.reload();
                   } catch (error) {
                     console.error('Failed to reset onboarding:', error);
                     alert('Failed to reset onboarding. Please try again.');
                   }
                 }
               }}
               className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-red-700/50 transition-colors group border border-red-700/30 text-red-300 hover:text-red-200"
             >
               <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               <span>Reset Onboarding</span>
             </button>
           </div>
        </div>
      </div>
      
      <div className="mt-auto px-4 pb-2 pt-2 shrink-0">
        <UserDisplay userProfile={userProfile} greetingSettings={greetingSettings} />
      </div>
    </aside>
  );
};

export default Sidebar;