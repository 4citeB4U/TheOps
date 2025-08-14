
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

const Garage: React.FC = () => {
    const { 
        flow, setFlow, 
        userProfile, updateUserProfile,
        greetingSettings, updateGreetingSettings
    } = useAppContext();
    
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
        if (userProfile && !isInitialized) {
            setFormData({
                profile: {
                    name: userProfile.name,
                    layout: userProfile.layout || 'sidebar_main_chat',
                    borderRadius: userProfile.borderRadius ?? 12,
                    emojiAmbiance: userProfile.emojiAmbiance || [],
                    backgroundImage: userProfile.backgroundImage,
                    language: userProfile.language || 'en-US'
                },
                greeting: greetingSettings || {
                    id: 'main',
                    fontFamily: 'Inter',
                    textColor: '#FFFFFF',
                    textEffect: 'none',
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: 0,
                }
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
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleProfileChange('backgroundImage', reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid PNG or JPG image.");
        }
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

    const saveAllSettings = async () => {
        if (!formData.profile.name) {
            CUE.tts.speak("Please enter a name for the operator.");
            return;
        }

        await updateUserProfile(formData.profile);
        
        const hasGreetingSettings = await db.appearanceSettings.get('main');
        if (hasGreetingSettings) {
            await updateGreetingSettings(formData.greeting);
        } else {
            await db.appearanceSettings.put({ id: 'main', ...formData.greeting });
        }
        
        CUE.tts.speak("Your settings have been locked in.");
    };
    
    const resetData = async () => {
        if (window.confirm("WARNING: This will permanently delete all your data. This action cannot be undone. Are you sure?")) {
            if (window.confirm("FINAL WARNING: Are you absolutely sure you want to erase everything?")) {
                window.location.href = '/?fresh=true';
            }
        }
    }
    
    if (!isInitialized) {
        return <div className="p-8 text-center">Loading Garage...</div>;
    }

    return (
        <div className="p-8">
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

                <Card title="Custom Background" className="lg:col-span-2">
                     <div className="flex items-center gap-4">
                        <div className="w-48 h-28 rounded-lg bg-slate-700 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${formData.profile.backgroundImage || ''})` }}></div>
                        <div className="flex-grow">
                            <label htmlFor="bg-upload" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-md px-4 py-2 text-sm text-center">
                                Upload Image (PNG/JPG)
                            </label>
                            <input id="bg-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} />
                            <p className="text-xs text-slate-500 mt-2">Personalize the app with a custom background.</p>
                            {formData.profile.backgroundImage && (
                                <button onClick={() => handleProfileChange('backgroundImage', '')} className="text-xs text-warning-red hover:underline mt-2">Remove Background</button>
                            )}
                        </div>
                    </div>
                </Card>
                
                <Card title="Background Ambiance">
                    <AmbianceSelector selected={formData.profile.emojiAmbiance || []} onChange={(val) => handleProfileChange('emojiAmbiance', val)} />
                </Card>
               
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
                     <p className="text-slate-400 mb-4 text-sm">Advanced voice settings for optimal speech quality across all platforms.</p>
                     
                     {/* Voice Quality Info */}
                     <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-sm font-medium text-slate-300">Current Voice Quality</span>
                           <button onClick={() => voiceOrchestrator.refreshVoices()} className="text-xs bg-primary-blue px-2 py-1 rounded hover:bg-primary-blue/80">
                              Refresh Voices
                           </button>
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                           <div>Platform: <span className="text-slate-300">{voiceOrchestrator.getVoiceInfo().platform}</span></div>
                           <div>Browser: <span className="text-slate-300">{voiceOrchestrator.getVoiceInfo().browser}</span></div>
                           <div>Available Voices: <span className="text-slate-300">{voiceOrchestrator.getVoiceInfo().totalVoices}</span></div>
                           {voiceOrchestrator.getVoiceInfo().currentVoice && (
                              <div>Current: <span className="text-slate-300">{voiceOrchestrator.getVoiceInfo().currentVoice.name}</span> (Score: {voiceOrchestrator.getVoiceInfo().currentVoice.qualityScore})</div>
                           )}
                        </div>
                     </div>

                     {/* Voice Selection */}
                     <div className="space-y-3">
                        <div>
                           <label className="block text-sm font-medium text-slate-400 mb-2">Voice Selection</label>
                           <div className="flex gap-2">
                              <select value={selectedVoice} onChange={handleVoiceChange} className="flex-1 bg-slate-700 rounded-md p-2 border border-slate-600 text-sm">
                                 <option value="">Auto-Select Best Voice</option>
                                 {voices.filter(v => v.lang.startsWith(formData.profile.language?.split('-')[0] || 'en'))
                                    .sort((a, b) => {
                                       const aScore = voiceOrchestrator.getVoiceInfo().availableVoices.find(v => v.voiceURI === a.voiceURI)?.qualityScore || 0;
                                       const bScore = voiceOrchestrator.getVoiceInfo().availableVoices.find(v => v.voiceURI === b.voiceURI)?.qualityScore || 0;
                                       return bScore - aScore;
                                    })
                                    .map(v => {
                                       const voiceInfo = voiceOrchestrator.getVoiceInfo().availableVoices.find(vi => vi.voiceURI === v.voiceURI);
                                       return (
                                          <option key={v.voiceURI} value={v.voiceURI}>
                                             {v.name} ({v.lang}) - Score: {voiceInfo?.qualityScore || 0}
                                          </option>
                                       );
                                    })}
                              </select>
                              <button onClick={testSelectedVoice} className="px-3 py-2 rounded-lg font-semibold bg-slate-600 hover:bg-slate-500 text-sm">Test</button>
                           </div>
                        </div>

                        {/* Voice Testing */}
                        <div className="flex gap-2">
                           <button onClick={() => voiceOrchestrator.testVoice()} className="flex-1 px-3 py-2 rounded-lg font-semibold bg-primary-blue hover:bg-primary-blue/80 text-sm">
                              Test Current Voice
                           </button>
                           <button onClick={() => voiceOrchestrator.testVoice("This is a test of the enhanced voice system. The voice should sound much more natural now.")} className="flex-1 px-3 py-2 rounded-lg font-semibold bg-accent-fuchsia hover:bg-accent-fuchsia/80 text-sm">
                              Test Natural Speech
                           </button>
                        </div>

                        {/* Apple Premium Voice Test */}
                        {(voiceOrchestrator.getVoiceInfo().platform === 'ios' || voiceOrchestrator.getVoiceInfo().platform === 'macos') && (
                           <button 
                              onClick={() => voiceOrchestrator.testVoice("Welcome to The Ops Center! I'm using Apple's premium voice technology to provide you with the most natural and engaging experience possible. This voice should sound incredibly human-like and clear.")} 
                              className="w-full px-3 py-2 rounded-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-sm text-white"
                           >
                              🍎 Test Apple Premium Voice
                           </button>
                        )}

                        {/* Gemini Live Voice Test */}
                        {voiceOrchestrator.getVoiceInfo().geminiLive.isAvailable && voiceOrchestrator.getVoiceInfo().geminiLive.isEnabled && (
                           <button 
                              onClick={() => voiceOrchestrator.testVoice("Welcome to The Ops Center! I'm using Gemini Live AI voice technology to provide you with the most natural and engaging experience possible. This voice should sound incredibly human-like and clear.")} 
                              className="w-full px-3 py-2 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-sm text-white"
                           >
                              🎯 Test Gemini Live Voice
                           </button>
                        )}

                        {/* Auto-Optimize Button */}
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                           <div className="flex items-center justify-between">
                              <div>
                                 <div className="text-sm font-medium text-blue-300">Auto-Optimize Voice</div>
                                 <div className="text-xs text-blue-400">Automatically select the best available voice for your platform</div>
                              </div>
                              <button onClick={() => {
                                 voiceOrchestrator.refreshVoices();
                                 voiceOrchestrator.reloadVoicePreference();
                                 setSelectedVoice('');
                              }} className="px-3 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500">
                                 Optimize
                              </button>
                           </div>
                        </div>

                        {/* Apple Voice Discovery */}
                        {(voiceOrchestrator.getVoiceInfo().platform === 'ios' || voiceOrchestrator.getVoiceInfo().platform === 'macos') && (
                           <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <div className="text-sm font-medium text-green-300">🍎 Apple Voice Discovery</div>
                                    <div className="text-xs text-green-400">Force discovery of all available Apple premium voices</div>
                                 </div>
                                 <button onClick={() => {
                                    voiceOrchestrator.forceAppleVoiceDiscovery();
                                    setTimeout(() => {
                                       voiceOrchestrator.reloadVoicePreference();
                                       setSelectedVoice('');
                                    }, 1200);
                                 }} className="px-3 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-500">
                                    Discover
                                 </button>
                              </div>
                           </div>
                        )}

                        {/* Safari Voice Refresh */}
                        {voiceOrchestrator.getVoiceInfo().browser === 'safari' && (
                           <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <div className="text-sm font-medium text-blue-300">🌐 Safari Voice Refresh</div>
                                    <div className="text-xs text-blue-400">Force Safari to load all available voices properly</div>
                                 </div>
                                 <button onClick={() => {
                                    voiceOrchestrator.forceSafariVoiceRefresh();
                                    setTimeout(() => {
                                       voiceOrchestrator.reloadVoicePreference();
                                       setSelectedVoice('');
                                    }, 1500);
                                 }} className="px-3 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500">
                                    Refresh
                                 </button>
                              </div>
                           </div>
                        )}

                        {/* Gemini Live Voice Controls */}
                        {voiceOrchestrator.getVoiceInfo().geminiLive.isAvailable && (
                           <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                              <div className="space-y-3">
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <div className="text-sm font-medium text-purple-300">🎯 Gemini Live Voice</div>
                                       <div className="text-xs text-purple-400">Premium AI voices including African American male options</div>
                                    </div>
                                    <button 
                                       onClick={() => voiceOrchestrator.toggleGeminiLive(!voiceOrchestrator.getVoiceInfo().geminiLive.isEnabled)}
                                       className={`px-3 py-1 rounded text-xs font-medium ${
                                          voiceOrchestrator.getVoiceInfo().geminiLive.isEnabled 
                                             ? 'bg-green-600 hover:bg-green-500' 
                                             : 'bg-purple-600 hover:bg-purple-500'
                                       }`}
                                    >
                                       {voiceOrchestrator.getVoiceInfo().geminiLive.isEnabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                 </div>
                                 
                                 {voiceOrchestrator.getVoiceInfo().geminiLive.isEnabled && (
                                    <div>
                                       <label className="block text-xs font-medium text-purple-300 mb-2">Select Voice</label>
                                       <select 
                                          value={voiceOrchestrator.getVoiceInfo().geminiLive.currentVoice.id}
                                          onChange={(e) => voiceOrchestrator.setGeminiLiveVoice(e.target.value)}
                                          className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-xs"
                                       >
                                          {voiceOrchestrator.getVoiceInfo().geminiLive.availableVoices.map(voice => (
                                             <option key={voice.id} value={voice.id}>
                                                {voice.name} - {voice.description}
                                             </option>
                                          ))}
                                       </select>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )}
                     </div>

                     {/* Language Selection */}
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Language</label>
                        <select value={formData.profile.language || 'en-US'} onChange={(e) => handleProfileChange('language', e.target.value)} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-sm">
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="en-AU">English (Australia)</option>
                            <option value="es-ES">Español (España)</option>
                            <option value="fr-FR">Français (France)</option>
                        </select>
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

export default Garage;
