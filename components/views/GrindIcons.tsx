
import React from 'react';
import { EnergyLevel } from '../../types';

export const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
export const LineupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 6 8 18"></polyline><polyline points="16 6 16 18"></polyline><polyline points="12 21 12 3"></polyline></svg>;

// Lens Icons
export const LanesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="4" height="20"></rect><rect x="14" y="2" width="4" height="20"></rect></svg>;
export const HorizonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
export const MatrixIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12H3M12 21V3"/></svg>;
export const LedgerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;

// Card Icons
export const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
export const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
export const ResearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
export const GoalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;

const energyColors: Record<EnergyLevel, string> = {
    low: "text-blue-400",
    medium: "text-green-400",
    deep: "text-yellow-400",
};
export const EnergyIcon: React.FC<{ energy: EnergyLevel }> = ({ energy }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="-1 -1 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={energyColors[energy]}>
        <path d="M17 18a5 5 0 0 0-10 0"></path><path d="M12 2v11"></path><path d="M12 22v-3"></path>
        <path d={energy === 'low' ? "" : (energy === 'medium' ? "M20 13h-4" : "M20 13h-4M4 13H8")}></path>
        <path d={energy === 'deep' ? "m19.4 8.6-.4.4M5 8.2l.4.4" : ""}></path>
    </svg>
);
