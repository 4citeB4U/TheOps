
import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../services/db';
import { GreetingSettings, UserProfile } from '../../types';
import { handleDownloadBackup, handleEncryptedExport, handleEncryptedImport, handleEmailBackup } from '../../services/dataService';
import CUE from '../../services/cueRuntime';
import { voiceOrchestrator } from '../../services/voiceOrchestrator';
import AmbianceSelector from '../settings/AmbianceSelector';

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string, titleClassName?: string }> = ({ title, children, className, titleClassName }) => (
    <div className={`bg-slate-800 p-6 rounded-xl border border-border-color flex flex-col ${className}`}>
        <h2 className={`text-xl font-bold text-white mb-4 ${titleClassName}`}>{title}</h2>
        {children}
    </div>
);

const GreetingPreview: React.FC<{ settings: Partial<GreetingSettings>, name: string }> = ({ settings, name }) => {
    const previewStyle: React.CSSProperties = {
        fontFamily: settings?.fontFamily || 'Inter',
        fontSize: settings?.fontSize ? `${settings.fontSize}px` : '2rem',
        fontWeight: settings?.fontWeight || 'bold',
        letterSpacing: settings?.letterSpacing ? `${settings.letterSpacing}px` : undefined,
        color: settings?.textColor || '#FFFFFF',
    };
    const previewClass = settings?.textEffect ? `text-effect-${settings.textEffect}` : '';
    
    return (
        <div className="h-full w-full bg-bg-main rounded-lg flex items-center justify-center p-4 min-h-[200px]">
            <span style={previewStyle} className={previewClass}>{name}</span>
        </div>
    );
};

const Settings: React.FC = () => {
    const { 
        flow, setFlow, 
        userProfile, updateUserProfile,
        greetingSettings, updateGreetingSettings
    } = useAppContext();
    
    // Consolidated state for all forms on this page to fix saving bugs
    const [formData, setFormData] = useState<{
        profile: Partial<UserProfile>,
        greeting: Partial<GreetingSettings>
    }>({
        profile: {},
        greeting: {}
    });
    
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem('lex_voice_preference') || '');
    const [isInitialized, setIsInitialized] = useState(false);

    const archivedNotes = useLiveQuery(() => db.notes.where('archived').equals(1).toArray(), []);
    
    useEffect(() => {
        // Initialize form data from context ONLY ONCE to prevent overwriting user input.
        if (userProfile && greetingSettings && !isInitialized) {
            setFormData({
                profile: {
                    name: userProfile.name,
                    layout: userProfile.layout || 'sidebar_main_chat',
                    borderRadius: userProfile.borderRadius ?? 12,
                    emojiAmbiance: userProfile.emojiAmbiance || []
                },
                greeting: greetingSettings
            });
            setIsInitialized(true);
        }
    }, [userProfile, greetingSettings, isInitialized]);

    useEffect(() => {
        const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, []);

    const handleProfileChange = (field: keyof UserProfile, value: any) => {
        setFormData(prev => ({ ...prev, profile: { ...prev.profile, [field]: value }}));
    };

    const handleGreetingChange = (field: keyof GreetingSettings, value: any) => {
        const processedValue = (field === 'fontSize' || field === 'letterSpacing' || field === 'fontWeight') ? Number(value) : value;
        setFormData(prev => ({ ...prev, greeting: { ...prev.greeting, [field]: processedValue }}));
    };

    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const voiceURI = e.target.value;
        setSelectedVoice(voiceURI);
        localStorage.setItem('lex_voice_preference', voiceURI);
        voiceOrchestrator.reloadVoicePreference();
    };

    const testSelectedVoice = () => {
        if (!selectedVoice) return;
        const utterance = new SpeechSynthesisUtterance("This is the selected voice for LEX.");
        const voice = voices.find(v => v.voiceURI === selectedVoice);
        if (voice) {
            utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
        }
    };
    
    const restoreNote = async (noteId: string) => {
        await db.notes.update(noteId, { archived: false });
        CUE.tts.speak("Note restored to The Lab.");
    };

    const saveAllSettings = () => {
        if (formData.profile.name) {
             updateUserProfile(formData.profile);
        }
        updateGreetingSettings(formData.greeting);
        CUE.tts.speak("Your settings have been locked in.");
    };
    
    const resetData = async () => {
        if (window.confirm("WARNING: This will permanently delete all your data. This action cannot be undone. Are you sure?")) {
            if (window.confirm("FINAL WARNING: Are you absolutely sure you want to erase everything?")) {
                window.location.href = '/?fresh=true';
            }
        }
    }
    
    return (
        <div className="p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-white">The Garage</h1>
                    <p className="text-lg text-text-dark">Tune the engine. Calibrate your co-pilot.</p>
                </div>
                <button onClick={saveAllSettings} className="px-6 py-3 rounded-lg font-semibold bg-primary-blue text-white hover:opacity-90 transition-opacity">
                    Save All Settings
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <Card title="Your Profile">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1">Operator Name</label>
                            <input id="name" type="text" value={formData.profile.name || ''} onChange={(e) => handleProfileChange('name', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600" />
                        </div>
                    </div>
                </Card>
                
                 <Card title="Prestige UI">
                    <div className="space-y-4">
                        <div>
                             <label htmlFor="layout" className="block text-sm font-medium text-slate-400 mb-1">App Layout</label>
                            <select id="layout" name="layout" value={formData.profile.layout || 'sidebar_main_chat'} onChange={(e) => handleProfileChange('layout', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600">
                                <option value="sidebar_main_chat">Sidebar | Main | Chat</option>
                                <option value="main_sidebar_chat">Main | Sidebar | Chat</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="borderRadius" className="block text-sm font-medium text-slate-400 mb-1">UI Roundness: {formData.profile.borderRadius}px</label>
                             <input type="range" id="borderRadius" name="borderRadius" min="0" max="24" value={formData.profile.borderRadius || 12} onChange={(e) => handleProfileChange('borderRadius', Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                </Card>

                <Card title="Lex Flow Meter">
                    <p className="text-slate-400 mb-2">Controls my personality and use of slang.</p>
                     <div className="flex items-center gap-4">
                        <input type="range" min="0" max="100" value={flow} onChange={(e) => setFlow(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="font-semibold text-white w-24 text-right text-sm">
                            {flow >= 90 ? "Hustle" : flow >= 40 ? "Mid" : "Pro"}
                        </span>
                    </div>
                </Card>

                <Card title="Background Ambiance" className="lg:col-span-3">
                    <AmbianceSelector selected={formData.profile.emojiAmbiance || []} onChange={(val) => handleProfileChange('emojiAmbiance', val)} />
                </Card>
               
                {/* Greeting Personalization */}
                <Card title="Enhanced Greeting Personalization" className="lg:col-span-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Font Family</label>
                                    <select name="fontFamily" value={formData.greeting.fontFamily || 'Inter'} onChange={(e) => handleGreetingChange('fontFamily', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600">
                                        <option>Inter</option><option>Poppins</option><option>JetBrains Mono</option><option>Georgia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Text Color</label>
                                    <input name="textColor" type="color" value={formData.greeting.textColor || '#FFFFFF'} onChange={(e) => handleGreetingChange('textColor', e.target.value)} className="w-full bg-slate-700 rounded-md p-1 border border-slate-600"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                               <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Font Size (px)</label>
                                    <input type="number" name="fontSize" value={formData.greeting.fontSize || 32} onChange={(e) => handleGreetingChange('fontSize', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Font Weight</label>
                                    <input type="number" step="100" name="fontWeight" value={formData.greeting.fontWeight || 700} onChange={(e) => handleGreetingChange('fontWeight', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Spacing (px)</label>
                                    <input type="number" name="letterSpacing" value={formData.greeting.letterSpacing || 0} onChange={(e) => handleGreetingChange('letterSpacing', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Text Effect</label>
                                <select name="textEffect" value={formData.greeting.textEffect || 'none'} onChange={(e) => handleGreetingChange('textEffect', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600">
                                    <option value="none">None</option><option value="glow">Glow</option><option value="fire">Fire</option><option value="electric">Electric</option>
                                </select>
                            </div>
                        </div>
                        <GreetingPreview settings={formData.greeting} name={formData.profile.name || "Operator"} />
                    </div>
                </Card>
                
                <Card title="Voice Narration">
                     <p className="text-slate-400 mb-4 text-sm">Select the system voice for read-aloud features.</p>
                     <div className="flex gap-2">
                        <select value={selectedVoice} onChange={handleVoiceChange} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-sm">
                            <option value="">System Default</option>
                            {voices.filter(v => v.lang.startsWith('en-')).map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                        </select>
                        <button onClick={testSelectedVoice} className="px-3 py-2 rounded-lg font-semibold bg-slate-600 hover:bg-slate-500 text-sm">Test</button>
                     </div>
                </Card>

                <Card title="Archived Notes" className="lg:col-span-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {archivedNotes && archivedNotes.length > 0 ? (
                            archivedNotes.map(note => (
                                <div key={note.id} className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                                    <span className="text-sm truncate">{note.title}</span>
                                    <button onClick={() => restoreNote(note.id)} className="text-xs font-semibold bg-indigo-500 px-2 py-1 rounded hover:bg-indigo-400">Restore</button>
                                </div>
                            ))
                        ) : <p className="text-sm text-slate-500 text-center py-4">No archived notes.</p>}
                    </div>
                </Card>
                
                <Card title="Data Management" className="lg:col-span-3">
                     <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-sm rounded-lg p-4 mb-4">
                        <p className="font-bold">Heads Up: Your data is stored only in this browser.</p>
                        <p className="mt-1">It is not backed up online. If you clear your browser data or use a different device, your information will be lost. Use the tools below to back up your data regularly.</p>
                    </div>
                     <div className="flex flex-wrap gap-4">
                        <button onClick={handleDownloadBackup} className="px-4 py-2 rounded-lg font-semibold bg-slate-600 text-slate-200 hover:bg-slate-500">Download Unencrypted JSON</button>
                        <button onClick={handleEncryptedExport} className="px-4 py-2 rounded-lg font-semibold bg-slate-600 text-slate-200 hover:bg-slate-500">Export Encrypted File</button>
                         <button onClick={handleEncryptedImport} className="px-4 py-2 rounded-lg font-semibold bg-slate-600 text-slate-200 hover:bg-slate-500">Import Encrypted File</button>
                         <button onClick={handleEmailBackup} className="px-4 py-2 rounded-lg font-semibold bg-slate-600 text-slate-200 hover:bg-slate-500">Email Backup</button>
                         <button onClick={resetData} className="px-4 py-2 rounded-lg font-semibold bg-warning-red/80 text-white hover:opacity-90">Reset All Data</button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
