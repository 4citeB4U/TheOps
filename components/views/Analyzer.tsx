

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeFile } from '../../services/geminiService';
import { db } from '../../services/db';
import CUE from '../../services/cueRuntime';
import { Note, VoiceCommand } from '../../types';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;

type FileItem = { id: string; file: File; base64: string; previewUrl: string; };

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const Analyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [queue, setQueue] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            if (videoRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Camera access denied. Please enable camera permissions in your browser settings.");
        }
    }, []);

    const captureFrameAsBase64 = useCallback(async (): Promise<string | null> => {
        if (videoRef.current && canvasRef.current && isCameraActive) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            return dataUrl.split(',')[1];
        }
        return null;
    }, [isCameraActive]);

    const snapPhoto = useCallback(async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            const base64 = dataUrl.split(',')[1];
            const newItem: FileItem = { id: file.name, file, base64, previewUrl: dataUrl };
            setQueue(prev => [newItem, ...prev]);
        }
    }, []);
    
    const handleLiveAnalysis = useCallback(async () => {
        if (!isCameraActive) {
            CUE.tts.speak("Camera isn't active. Let me start it for you.");
            await startCamera();
            // Give camera a moment to initialize
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        CUE.tts.speak("Analyzing live view.");
        const base64 = await captureFrameAsBase64();
        if (!base64) {
            CUE.tts.speak("I couldn't capture an image from the camera.");
            return;
        }

        window.dispatchEvent(new CustomEvent('lex.chat.send', { detail: { text: "What do you see?" } }));
        window.dispatchEvent(new CustomEvent('lex.phase.change', { detail: 'THINKING' }));

        try {
            const analysisResult = await analyzeFile("Describe what you see in this image.", base64, 'image/jpeg');
            CUE.tts.speak(analysisResult);
        } catch (e) {
            console.error("Live analysis failed", e);
            CUE.tts.speak("Sorry, I had trouble analyzing the view.");
        }

    }, [isCameraActive, startCamera, captureFrameAsBase64]);

    useEffect(() => {
        const handleContextualCommand = (event: CustomEvent<VoiceCommand>) => {
            if (event.detail.command === 'analyze_camera_view') {
                handleLiveAnalysis();
            }
        };

        window.addEventListener('cue.contextual.command', handleContextualCommand as EventListener);
        return () => {
            window.removeEventListener('cue.contextual.command', handleContextualCommand as EventListener);
        }
    }, [handleLiveAnalysis]);


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newItems = await Promise.all(Array.from(e.target.files).map(async file => {
                const base64 = await toBase64(file);
                return { id: file.name, file, base64, previewUrl: URL.createObjectURL(file) };
            }));
            setQueue(prev => [...newItems, ...prev]);
        }
    };
    
    const analyzeAll = async () => {
        if (queue.length === 0 || isLoading) return;
        setIsLoading(true);
        setError('');
        
        let successCount = 0;
        for (const item of queue) {
            try {
                const analysisResult = await analyzeFile(prompt || "Summarize and extract key information from this file.", item.base64, item.file.type);
                const newNote: Note = {
                    id: `note_an_${Date.now()}`,
                    type: 'analysis',
                    title: `Analysis: ${item.file.name}`,
                    text: analysisResult,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    links: {},
                    meta: {
                        source: item.file.type.startsWith('image') ? 'analyzer_image' : 'analyzer_doc',
                        originalFileName: item.file.name,
                    }
                };
                await db.notes.add(newNote);
                successCount++;
            } catch (err) {
                console.error(`Failed to analyze ${item.file.name}:`, err);
                setError(prev => prev + `\nFailed to analyze ${item.file.name}.`);
            }
        }
        setIsLoading(false);
        setQueue([]);
        setPrompt('');
        CUE.tts.speak(`Analysis complete. I've created ${successCount} new notes in The Lab for you.`);
        CUE.page({ to: 'lab' });
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {/* Header Section */}
            <div className="flex-shrink-0 p-6 border-b border-slate-700/50">
                <h1 className="text-4xl font-extrabold text-white mb-2">The Analyzer</h1>
                <p className="text-lg text-slate-400">Turn images and documents into structured intelligence.</p>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                    {/* Left Column: Image Intake */}
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-white">Image Intake (The Eye)</h2>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded-lg object-cover mb-4" onCanPlay={e => (e.target as HTMLVideoElement).play()}></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        <div className="flex gap-4">
                            <button onClick={startCamera} className="flex-1 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors text-white">Start Camera</button>
                            <button onClick={snapPhoto} className="flex-1 p-3 bg-primary-blue hover:opacity-90 rounded-lg font-semibold transition-colors text-white">Snap Photo</button>
                        </div>
                    </div>

                    {/* Right Column: Document Intake & Queue */}
                    <div className="bg-slate-800 rounded-xl p-6 flex flex-col border border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-white">Intake Queue</h2>
                        <label htmlFor="file-upload" className="w-full cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg p-4 transition-colors flex items-center justify-center gap-3 mb-4">
                            <UploadIcon />
                            Upload Documents or Images
                        </label>
                        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                        <div className="space-y-2 pr-2 max-h-48 overflow-y-auto">
                            {queue.map(item => (
                                <div key={item.id} className="flex items-center gap-3 bg-slate-700/50 p-2 rounded-lg">
                                    <img src={item.previewUrl} alt="preview" className="w-10 h-10 object-cover rounded"/>
                                    <span className="font-mono text-sm truncate flex-grow text-white">{item.file.name}</span>
                                    <button onClick={() => setQueue(q => q.filter(i => i.id !== item.id))} className="text-xs text-red-400 hover:text-red-300">X</button>
                                </div>
                            ))}
                             {queue.length === 0 && <p className="text-center text-slate-500 pt-8">Queue is empty.</p>}
                        </div>
                    </div>
                </div>

                {/* Analysis Controls - Fixed at Bottom */}
                <div className="flex-shrink-0">
                    <textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        placeholder="Analysis prompt (e.g., 'Summarize this document'). If left blank, I'll provide a general analysis." 
                        className="w-full h-20 bg-slate-700 rounded-lg p-3 mb-4 border border-slate-600 focus:ring-2 focus:ring-primary-blue focus:outline-none text-white resize-none"
                    />
                    <button 
                        onClick={analyzeAll} 
                        disabled={isLoading || queue.length === 0} 
                        className="w-full p-4 bg-accent-fuchsia text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analyzing...' : `Analyze ${queue.length} Item(s)`}
                    </button>
                    {error && <p className="text-red-400 text-center mt-2 text-sm">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Analyzer;
