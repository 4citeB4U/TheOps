
import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { db } from '../../services/db';
import { Note } from '../../types';
import HighlightText from '../utils/HighlightText';
import { GLOBAL_HIGHLIGHTS } from '../../constants/highlights';

// This is a simplified version of the logic from geminiService, adapted for this component.
// It's better to have it here to handle the specific response with citations.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

const SchoolExplorer: React.FC = () => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string>('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setResponse('');
        setSources([]);
        setError('');

        if (!process.env.API_KEY) {
            setError("API key is not configured. Please contact the developer.");
            setIsLoading(false);
            return;
        }

        try {
            const result: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Provide a detailed overview of the following school: ${query}. Include information on its history, notable programs, campus life, and admission statistics.`,
                config: {
                    tools: [{ googleSearch: {} }],
                    systemInstruction: "You are an expert college guidance counselor. Provide comprehensive and well-structured information about schools based on the user's query. Use Google Search to find the most current data."
                },
            });
            
            const resultText = result.text;
            setResponse(resultText);

            const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
            let validSources: GroundingChunk[] = [];
            if (groundingMetadata?.groundingChunks) {
                validSources = (groundingMetadata.groundingChunks as any[]).filter(c => c.web?.uri);
                setSources(validSources);
            }
            
            // Automatically save the result to notes
            const newNote: Note = {
                id: `note_campus_${Date.now()}`,
                type: 'analysis',
                title: `Campus Intel: ${query}`,
                text: resultText,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                links: {},
                meta: {
                    source: 'research',
                    summary: `Sources: ${validSources.map(s => s.web.uri).join(', ')}`
                }
            };
            await db.notes.add(newNote);

        } catch (err) {
            console.error("Error fetching school data:", err);
            setError("Sorry, I couldn't fetch that information. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 flex flex-col">
            <h1 className="text-4xl font-extrabold text-white mb-2">The Campus</h1>
            <p className="text-lg text-slate-400 mb-8">Get detailed information about any college or university.</p>
            
            <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'University of California, Berkeley'"
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                />
                <button 
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="bg-indigo-500 text-white rounded-lg px-6 py-4 font-semibold hover:bg-indigo-600 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Searching...' : 'Search'}
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
                {error && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}
                {response && (
                    <div>
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            <HighlightText text={response} highlights={GLOBAL_HIGHLIGHTS} />
                        </div>
                        {sources.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-2">Sources:</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    {sources.map((source, index) => (
                                        <li key={index}>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {!isLoading && !response && !error && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-slate-500">Search for a school to see details here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolExplorer;