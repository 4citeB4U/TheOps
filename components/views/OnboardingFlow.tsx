
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import CUE from '../../services/cueRuntime';
import { guideTitle, guideContent, tourScript, finalWords } from '../../services/onboardingContent';
import Sidebar from '../layout/Sidebar';
import Workspace from '../layout/Workspace';
import RightRail from '../layout/RightRail';

type OnboardingStep = 'entry' | 'name' | 'permissions' | 'guide' | 'tour' | 'finishing' | 'skipped';

const LexCard: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center cursor-pointer group" onClick={onEnter}>
            <div className="lex-stage">
                <div className="lex-card">
                    <div className="lex-aura" aria-hidden="true"></div>
                    <div className="lex-glass" aria-hidden="true"></div>
                    <div className="lex-svg" dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 260" width="86%" height="86%" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="lexGradient" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--primary-blue)"/><stop offset="1" stop-color="var(--accent-fuchsia)"/></linearGradient><filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1"/><feColorMatrix in="b1" type="matrix" values="0 0 0 0 0 0 0 0 0.9 0 0 0 0 0.95 0 0 0 0 1 0" result="c1"/><feMerge><feMergeNode in="c1"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="160" letter-spacing="8" fill="url(#lexGradient)" filter="url(#glow)" font-weight="900">LΞX</text></g></svg>` }}></div>
                    <div className="lex-sheen" aria-hidden="true"></div>
                </div>
            </div>
            <h1 className="text-3xl font-bold text-white mt-8 group-hover:text-primary-blue transition-colors">Tap to Enter the Ops Center</h1>
        </div>
    );
};


const OnboardingFlow: React.FC = () => {
    const [step, setStep] = useState<OnboardingStep>('entry');
    const [name, setName] = useState('');
    const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
    const [tourIndex, setTourIndex] = useState(-1);
    const [isFadingOut, setIsFadingOut] = useState(false);
    
    const { completeOnboarding, setHighlightedNavItem } = useAppContext();
    
    const handleTransition = useCallback((nextStep: OnboardingStep) => {
        setIsFadingOut(true);
        setTimeout(() => {
            setStep(nextStep);
            setIsFadingOut(false);
        }, 500);
    }, []);
    
    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        handleTransition('permissions');
    };

    const handleRequestPermission = useCallback(async () => {
        CUE.tts.speak(`Thanks, ${name}. To give you the full voice-first experience, I'll need microphone access.`);
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStatus('granted');
            CUE.tts.speak("Aight, bet. Mic is live. Now for the playbook.");
        } catch (error) {
            console.error("Microphone permission denied:", error);
            setMicStatus('denied');
            CUE.tts.speak("That's cool. Voice features will be disabled. Let's continue with the playbook.");
        }
    }, [name]);
    
    const handleSkip = useCallback(() => {
        handleTransition('skipped');
        CUE.tts.cancel();
        CUE.tts.speak("Aight, bet. No time to waste. We can finish the full setup in The Garage later. For now, the Ops Center is yours. Let's get it.");
    }, [handleTransition]);

    useEffect(() => {
        const handleTtsEnd = () => {
            if (step === 'permissions' && micStatus !== 'unknown') {
                handleTransition('guide');
            } else if (step === 'guide') {
                handleTransition('tour');
                setTourIndex(0);
            } else if (step === 'tour' && tourIndex < tourScript.length - 1) {
                setTourIndex(i => i + 1);
            } else if (step === 'tour' && tourIndex === tourScript.length - 1) {
                setStep('finishing');
            } else if (step === 'finishing') {
                setHighlightedNavItem(null);
                completeOnboarding(name, false);
            } else if (step === 'skipped') {
                setHighlightedNavItem(null);
                completeOnboarding(name || 'Operator', true);
            }
        };
        
        window.addEventListener('lex.tts.end', handleTtsEnd);
        return () => window.removeEventListener('lex.tts.end', handleTtsEnd);
    }, [step, tourIndex, micStatus, name, completeOnboarding, setHighlightedNavItem, handleTransition]);
    
    useEffect(() => {
        if (step === 'tour' && tourIndex >= 0 && tourIndex < tourScript.length) {
            const currentTourStep = tourScript[tourIndex];
            setHighlightedNavItem(currentTourStep.view);
            CUE.page({ to: currentTourStep.view });
            CUE.tts.speak(currentTourStep.content);
        }
    }, [step, tourIndex, setHighlightedNavItem]);

    useEffect(() => {
        if (step === 'guide') {
            setIsFadingOut(false);
            const spokenGuideContent = `Alright, ${name}. ${guideContent}`;
            CUE.tts.speak(spokenGuideContent);
        } else if (step === 'finishing') {
            setHighlightedNavItem(null);
            CUE.page({ to: 'pulse' });
            CUE.tts.speak(finalWords);
        }
    }, [step, setHighlightedNavItem, name]);


    const renderContent = () => {
        switch (step) {
            case 'entry':
                return <LexCard onEnter={() => handleTransition('name')} />;
            case 'name':
                return (
                    <form onSubmit={handleNameSubmit} className="max-w-2xl text-center">
                        <h1 className="text-5xl font-extrabold text-white mb-4">First things first...</h1>
                        <p className="text-xl text-slate-300 mb-8">What should I call you?</p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-700 border border-border-color rounded-lg p-4 text-white placeholder-slate-400 text-2xl text-center mb-8 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            placeholder="Your Name"
                            autoFocus
                        />
                        <button type="submit" className="bg-primary-blue text-white rounded-lg px-8 py-4 font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!name.trim()}>Continue</button>
                    </form>
                );
            case 'permissions':
                 return (
                    <div className="max-w-2xl text-center">
                        <h1 className="text-5xl font-extrabold text-white mb-4">Mic Check, 1, 2...</h1>
                        <p className="text-xl text-slate-300 mb-12">
                            To use voice commands and dictation, I'll need access to your microphone.
                        </p>
                        <button
                            onClick={handleRequestPermission}
                            className="bg-primary-blue text-white rounded-lg px-8 py-4 font-semibold text-lg hover:opacity-90 transition-opacity disabled:bg-slate-600 disabled:cursor-not-allowed"
                            disabled={micStatus !== 'unknown'}
                        >
                            {micStatus === 'unknown' ? 'Allow Microphone' : 'Locking In...'}
                        </button>
                        {micStatus === 'denied' && <p className="text-warning-red mt-4 text-sm">Mic access denied. You'll have to type. We can still work.</p>}
                    </div>
                );
            case 'guide':
                 return (
                     <div className="max-w-3xl text-left bg-slate-800 p-8 rounded-2xl shadow-2xl">
                        <h1 className="text-4xl font-extrabold text-white mb-6">{guideTitle}</h1>
                        <div className="text-lg text-slate-300 space-y-4 whitespace-pre-line max-h-[60vh] overflow-y-auto pr-4">
                            {`Alright, ${name}.\n\n${guideContent}`}
                        </div>
                        <p className="text-teal-400 mt-8 animate-pulse">LEX is reading The Playbook...</p>
                    </div>
                )
            default:
                return null;
        }
    };

    const isOverlayVisible = step !== 'tour' && step !== 'finishing' && step !== 'skipped';

    return (
        <>
            <div className={`fixed inset-0 z-50 flex justify-center items-center transition-opacity duration-500
                ${isOverlayVisible && !isFadingOut ? 'bg-bg-main/80 backdrop-blur-md opacity-100' : 'opacity-0 pointer-events-none'}
                `}>
                <div className={`p-8 transition-all duration-500 ${isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    {renderContent()}
                </div>
            </div>
            
            {step !== 'entry' && step !== 'finishing' && step !== 'skipped' && (
                <button 
                    onClick={handleSkip}
                    className="fixed bottom-8 right-8 z-[60] bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg px-6 py-3 transition-all duration-300"
                >
                    Skip to the Ops Center
                </button>
            )}

            <div className={isOverlayVisible ? 'invisible' : ''}>
                 <div className="h-screen w-screen flex flex-col font-sans antialiased">
                    <div className="flex flex-grow overflow-hidden">
                        <Sidebar />
                        <Workspace />
                        <RightRail />
                    </div>
                </div>
            </div>
             <style>{`
                .lex-stage{--card-w:min(92vw,760px);--card-r:28px;--bg:#0a0f1a;--shadow:0 0 0 1px rgba(0,224,255,.12), 0 18px 60px rgba(0,0,0,.65);display:grid;place-items:center;perspective:1200px;}
                .lex-card{width:var(--card-w);aspect-ratio:16/9;position:relative;border-radius:var(--card-r);overflow:hidden;transform-style:preserve-3d;box-shadow:var(--shadow);background:radial-gradient(120% 140% at 50% 50%, #0b1220 0%, #060b14 65%, #02050a 100%);}
                .lex-aura{position:absolute;inset:-25%;background:conic-gradient(from 0deg, transparent 0 40%, rgba(0,224,255,.16) 50%, transparent 60% 100%);filter:blur(18px);animation:spin 6s linear infinite;z-index:0}
                @keyframes spin{to{transform:rotate(360deg)}}
                .lex-glass{position:absolute;inset:16px;border-radius:16px;background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.08));z-index:1}
                .lex-svg{position:absolute;inset:0;display:grid;place-items:center;z-index:2}
                .lex-sheen{position:absolute;inset:-10%;background:linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.08) 45%, rgba(255,255,255,0) 60%);transform:translateX(-40%) rotate(8deg);animation:sweep 2800ms ease-in-out 1200ms infinite;pointer-events:none;z-index:3;mix-blend-mode:screen}
                @keyframes sweep{0%{transform:translateX(-60%) rotate(8deg);opacity:0}15%{opacity:.35}35%{transform:translateX(30%) rotate(8deg)}45%{opacity:0}100%{transform:translateX(30%) rotate(8deg);opacity:0}}
            `}</style>
        </>
    );
};

export default OnboardingFlow;
