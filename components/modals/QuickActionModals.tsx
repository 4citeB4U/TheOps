
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../services/db';
import { Note, Research, IntelResult } from '../../types';
import CUE from '../../services/cueRuntime';
import { getIntel } from '../../services/geminiService';


const QuickNoteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSave = async () => {
        if (!title.trim() && !text.trim()) {
            onClose();
            return;
        }

        const newNote: Note = {
            id: `note_${Date.now()}`,
            type: 'text',
            title: title.trim() || `Quick Note ${new Date().toLocaleDateString()}`,
            text: text.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            links: {},
            archived: false,
        };
        await db.notes.add(newNote);
        CUE.tts.speak("Note saved to The Lab.");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-32"
            onClick={handleSave}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl border border-border-color p-6"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                initial={{ y: -30 }}
                animate={{ y: 0 }}
                exit={{ y: -30 }}
                transition={{ duration: 0.2 }}
            >
                <h2 className="text-xl font-bold text-white mb-4">Quick Note to The Lab</h2>
                <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                    onBlur={() => CUE.context.setDictationTarget(null)}
                    placeholder="Title (optional)"
                    className="w-full bg-slate-700 rounded-md p-2 mb-3 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                    onBlur={() => CUE.context.setDictationTarget(null)}
                    placeholder="Jot down a quick thought..."
                    className="w-full h-24 bg-slate-700 rounded-md p-2 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue resize-none"
                />
                <div className="text-right text-xs text-slate-500 mt-2">Press Enter to save, Esc to close.</div>
            </motion.div>
        </motion.div>
    );
};

const QuickIntelModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleRunIntel = async () => {
        if (!query.trim()) {
            onClose();
            return;
        }
        CUE.tts.speak(`Okay, I'm running intel on "${query}". Taking you to the Intel hub.`);
        onClose();
        CUE.page({ to: 'intel' }); // Navigate first for better UX

        try {
            const intelResult: IntelResult = await getIntel(query);
            const newResearch: Research = {
                id: `res_${Date.now()}`,
                query,
                createdAt: new Date().toISOString(),
                result: intelResult,
                type: 'intel',
                links: {}
            };
            await db.research.add(newResearch);
        } catch (e) {
            console.error(e);
            CUE.tts.speak("Sorry, I hit a snag running intel. Try again from the main hub.");
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRunIntel();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };
    
     return (
        <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start pt-32"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl border border-border-color p-6"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                initial={{ y: -30 }}
                animate={{ y: 0 }}
                exit={{ y: -30 }}
                transition={{ duration: 0.2 }}
            >
                <h2 className="text-xl font-bold text-white mb-4">Quick Intel Run</h2>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                    onBlur={() => CUE.context.setDictationTarget(null)}
                    placeholder="What topic do you need intel on?"
                    className="w-full bg-slate-700 rounded-md p-3 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                 <div className="text-right text-xs text-slate-500 mt-2">Press Enter to run intel, Esc to close.</div>
            </motion.div>
        </motion.div>
    );
}

const QuickActionModals: React.FC = () => {
    const { quickActionModal, setQuickActionModal } = useAppContext();

    if (!quickActionModal) return null;

    const closeModal = () => setQuickActionModal(null);

    switch (quickActionModal) {
        case 'note':
            return <QuickNoteModal onClose={closeModal} />;
        case 'intel':
            return <QuickIntelModal onClose={closeModal} />;
        default:
            return null;
    }
};

export default QuickActionModals;