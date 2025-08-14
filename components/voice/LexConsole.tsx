import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceControl } from '../../contexts/VoiceControlContext';
import { useAppContext } from '../../contexts/AppContext';
import CUE from '../../services/cueRuntime';
import VoiceWave from './VoiceWave';
import { handleEmailBackup } from '../../services/dataService';

// --- Icons ---
const MicIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || 'text-white'}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IntelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>;
const AnalyzerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L4 9v12h16V9l-8-6z" /><path d="M8 9v12" /><path d="M16 9v12" /><path d="M4 9l8 6 8-6" /></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;

const LexConsole: React.FC = () => {
    const { phase } = useVoiceControl();
    const { setQuickActionModal } = useAppContext();
    const [isHovered, setIsHovered] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [bar1Active, setBar1Active] = useState(false);
    const [allBarsActive, setAllBarsActive] = useState(false);
    const clickTimeout = useRef<number | null>(null);

    const handleMicClick = () => {
        setClickCount(prev => prev + 1);
    };

    useEffect(() => {
        if (clickCount === 1) {
            clickTimeout.current = window.setTimeout(() => {
                CUE.mic.toggle();
                setBar1Active(true);
                setTimeout(() => setBar1Active(false), 300);
                setClickCount(0);
            }, 250);
        } else if (clickCount === 2) {
            if (clickTimeout.current) clearTimeout(clickTimeout.current);
            CUE.mic.hardInterrupt();
            setAllBarsActive(true);
            setTimeout(() => setAllBarsActive(false), 300);
            setClickCount(0);
        }
        return () => {
            if(clickTimeout.current) clearTimeout(clickTimeout.current);
        }
    }, [clickCount]);

    const phaseClasses = {
        IDLE: 'bg-accent-fuchsia hover:opacity-90 lex-console-idle-breathing',
        LISTENING: 'bg-warning-red lex-console-listening',
        THINKING: 'bg-slate-700',
        SPEAKING: 'bg-positive-green lex-console-speaking-pulse',
        PAUSED: 'bg-slate-600',
    };
    
    const iconColorClass = phase === 'THINKING' ? 'text-primary-blue animate-pulse' : 'text-white';
    const buttonClasses = `relative rounded-full flex items-center justify-center transition-all duration-300 ease-in-out w-20 h-20 shadow-2xl ${phaseClasses[phase]}`;

    const councilActions = [
        { label: 'Quick Note', icon: <NoteIcon />, action: () => setQuickActionModal('note') },
        { label: 'Quick Intel', icon: <IntelIcon />, action: () => setQuickActionModal('intel') },
        { label: 'Analyzer', icon: <AnalyzerIcon />, action: () => CUE.page({ to: 'analyzer' }) },
        { label: 'Email Backup', icon: <EmailIcon />, action: () => handleEmailBackup() },
    ];

    const councilContainerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        }
    };

    const councilItemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };
    
    return (
        <div 
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        className="flex gap-3 mb-4"
                        variants={councilContainerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {councilActions.map((item, index) => (
                             <motion.button 
                                key={item.label}
                                onClick={item.action}
                                variants={councilItemVariants}
                                className="w-14 h-14 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-full flex items-center justify-center text-white hover:bg-primary-blue transition-colors group"
                                title={item.label}
                            >
                               {item.icon}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <div className="relative">
                 <button
                    onClick={handleMicClick}
                    aria-label={phase === 'LISTENING' ? 'Stop listening' : 'Start listening'}
                    className={buttonClasses}
                >
                    {phase === 'THINKING' && <div className="lex-console-thinking-ring"></div>}
                    
                    <div className="absolute inset-0 p-6">
                        <VoiceWave isActive={phase === 'LISTENING'} />
                    </div>
                    {phase !== 'LISTENING' && <MicIcon className={iconColorClass} />}
                </button>
            </div>
            
            <div className="w-24 h-2 flex justify-between items-center mt-3" aria-hidden="true">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`w-4 h-1.5 rounded-full bg-slate-700 transition-all duration-200 ${
                        (bar1Active && i===0) ? 'bg-primary-blue' : ''
                    } ${
                        allBarsActive ? 'bg-accent-fuchsia' : ''
                    }`} />
                ))}
            </div>
        </div>
    );
};

export default LexConsole;