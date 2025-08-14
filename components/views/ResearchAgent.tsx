

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getIntel } from '../../services/geminiService';
import { db } from '../../services/db';
import type { IntelResult, Research, VoiceCommand, CareerBlueprint, Note } from '../../types';
import CUE from '../../services/cueRuntime';
import HighlightText from '../utils/HighlightText';
import { GLOBAL_HIGHLIGHTS } from '../../constants/highlights';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;

const ResearchAgent: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [activeResearch, setActiveResearch] = useState<Research | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const history = useLiveQuery(() => 
        db.research.where('type').equals('intel').reverse().sortBy('createdAt'), 
    []);

    const handleNewSearch = async (searchQuery: string) => {
        if (!searchQuery.trim() || isLoading) return;
        
        setIsLoading(true);
        setActiveResearch(null);
        setError('');

        try {
            const intelResult = await getIntel(searchQuery);
            const now = new Date().toISOString();
            const noteId = `note_intel_${Date.now()}`;
            const researchId = `res_intel_${Date.now()}`;

            const newNote: Note = {
                id: noteId,
                type: 'analysis',
                title: `Research: ${searchQuery}`,
                text: intelResult.text,
                createdAt: now,
                updatedAt: now,
                links: {
                    research: [researchId]
                },
                meta: {
                    source: 'research'
                }
            };

            const newResearch: Research = {
                id: researchId,
                query: searchQuery,
                createdAt: now,
                result: intelResult,
                type: 'intel',
                links: {
                    notes: [noteId]
                }
            };
            
            await db.transaction('rw', db.notes, db.research, async () => {
                await db.notes.add(newNote);
                await db.research.add(newResearch);
            });

            setActiveResearch(newResearch);
            setPrompt('');
        } catch (err: any) {
            console.error("Error fetching intel:", err);
            setError(err.message || "Sorry, I couldn't fetch that information. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        handleNewSearch(prompt);
    }
    
    useEffect(() => {
        const handleContextualCommand = (event: CustomEvent<VoiceCommand>) => {
            if (event.detail.command === 'search' && event.detail.payload?.query) {
                setPrompt(event.detail.payload.query);
                handleNewSearch(event.detail.payload.query);
            }
        };

        window.addEventListener('cue.contextual.command', handleContextualCommand as EventListener);
        return () => {
            window.removeEventListener('cue.contextual.command', handleContextualCommand as EventListener);
        }
    }, [isLoading]); // Re-add listener if isLoading changes

    useEffect(() => {
        // If there's no active research and history exists, select the most recent one.
        if (!activeResearch && history && history.length > 0) {
            setActiveResearch(history[0]);
        }
    }, [history, activeResearch]);


    const result = activeResearch?.result as IntelResult;

    return (
        <div className="flex bg-slate-900">
            <aside className="w-1/3 max-w-xs h-screen sticky top-0 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-700">
                    <h1 className="text-xl font-bold text-white">Intel History</h1>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {history && history.length > 0 ? (
                        <ul>
                            {history.map(item => (
                                <li key={item.id} className={`border-b border-slate-700 last:border-b-0 ${activeResearch?.id === item.id ? 'bg-slate-700/75' : ''}`}>
                                    <button onClick={() => setActiveResearch(item)} className="w-full text-left p-4 hover:bg-slate-600/50 transition-colors">
                                        <h3 className="font-semibold text-white truncate">{item.query}</h3>
                                        <p className="text-sm text-slate-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="p-4 text-center text-slate-500">No history yet.</div>
                    )}
                </div>
            </aside>
            <main className="p-8 flex flex-col flex-grow">
                <h1 className="text-4xl font-extrabold text-white mb-2">The Intel</h1>
                <p className="text-lg text-slate-400 mb-8">Gathering multi-format intelligence on any topic.</p>
                
                <form onSubmit={handleSubmitForm} className="flex gap-4 mb-8">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                        onBlur={() => CUE.context.setDictationTarget(null)}
                        placeholder="e.g., Explain the trade routes of the Viking age"
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="bg-indigo-500 text-white rounded-lg px-6 py-4 font-semibold hover:bg-indigo-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <SearchIcon/>
                        {isLoading ? 'Gathering...' : 'New Search'}
                    </button>
                </form>

                <div className="flex-grow bg-slate-800 border border-slate-700 rounded-xl p-6">
                    {isLoading && (
                        <div className="flex justify-center items-center h-full">
                             <div className="w-4 h-4 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                             <div className="w-4 h-4 ml-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                             <div className="w-4 h-4 ml-2 bg-slate-400 rounded-full animate-pulse"></div>
                        </div>
                    )}
                    {error && <div className="flex justify-center items-center h-full"><p className="text-red-400">{error}</p></div>}
                    {result && (
                        <div className="space-y-8">
                            {result.images.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">Image Gallery</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4">
                                        {result.images.map((src, index) => (
                                            <img key={index} src={src} alt={`Intel result image ${index + 1}`} className="h-40 rounded-lg object-cover" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                 <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
                                 <div className="text-slate-300 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white">
                                    <HighlightText text={result.text} highlights={GLOBAL_HIGHLIGHTS} />
                                </div>
                            </div>

                            {result.pdfs.length > 0 && (
                                 <div>
                                    <h3 className="text-xl font-bold text-white mb-4">From the Stacks (PDFs)</h3>
                                    <ul className="space-y-2">
                                        {result.pdfs.map((pdfUrl, index) => (
                                            <li key={index} className="bg-slate-700/50 p-3 rounded-lg">
                                                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center">
                                                    <FileIcon/>
                                                    <span className="truncate">{pdfUrl.split('/').pop()}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.sources.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">Web Sources</h3>
                                    <ul className="space-y-2">
                                        {result.sources.map((source, index) => (
                                            <li key={index} className="bg-slate-700/50 p-3 rounded-lg">
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                                    <h4 className="font-semibold text-white truncate"><LinkIcon />{source.web.title || source.web.uri}</h4>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    {!isLoading && !result && !error && (
                        <div className="flex justify-center items-center h-full">
                            <p className="text-slate-500">Select an item from history or start a new search.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ResearchAgent;