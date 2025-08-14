

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { getIntel } from '../../services/geminiService';
import CUE from '../../services/cueRuntime';
import type { Note, ChatMessage, Assignment, Research, IntelResult, Goal } from '../../types';
import HighlightText from '../utils/HighlightText';
import { GLOBAL_HIGHLIGHTS } from '../../constants/highlights';

// Helper icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12"x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const ArchiveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>;
const ActionIcon: React.FC<{children: React.ReactNode}> = ({children}) => <div className="w-4 h-4 mr-2">{children}</div>;
const CreateAssignmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>;
const SendToIntelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const LinkToMagnaCartaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M9 18v-6" /><path d="M15 18v-6" /></svg>;

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const bubbleClasses = isUser ? 'bg-primary-blue self-end' : 'bg-slate-700 self-start';
    return (
        <div className={`rounded-lg p-3 max-w-md break-words ${bubbleClasses}`}>
            <p className="text-white text-base">
                <HighlightText text={message.text} highlights={GLOBAL_HIGHLIGHTS} />
            </p>
        </div>
    );
};

const ConversationView: React.FC<{note: Note}> = ({note}) => (
    <div className="h-full w-full bg-bg-main p-6 overflow-y-auto">
        <div className="flex flex-col space-y-4">
            {note.conversation?.map((msg, index) => <ChatBubble key={index} message={msg} />)}
        </div>
    </div>
);

const TextEditorView: React.FC<{note: Note, onUpdate: (field: 'title' | 'text', value: string) => void}> = ({ note, onUpdate }) => (
    <textarea
        key={note.id} // Re-mount textarea when note changes to prevent stale state
        value={note.text || ''}
        onChange={(e) => onUpdate('text', e.target.value)}
        className="h-full w-full bg-bg-main p-6 text-text-light text-lg leading-relaxed focus:outline-none resize-none"
        placeholder="Start writing..."
    />
);


const Notes: React.FC = () => {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showGoalLinker, setShowGoalLinker] = useState(false);
  const goalLinkerRef = useRef<HTMLDivElement>(null);

  const notes = useLiveQuery(() => 
    db.notes.filter(note => note.archived !== true)
      .sortBy('updatedAt')
      .then(sortedNotes => sortedNotes.reverse()), 
    []
  );
  const goals = useLiveQuery(() => db.goals.toArray(), []);

  useEffect(() => {
    if (!activeNoteId && notes && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
    if (activeNoteId && notes && !notes.find(n => n.id === activeNoteId)) {
       setActiveNoteId(notes.length > 0 ? notes[0].id : null);
    }
    if (notes && notes.length === 0) {
        setActiveNoteId(null);
    }
  }, [notes, activeNoteId]);

  const activeNote = useMemo(() => {
    if (!activeNoteId || !notes) return undefined;
    return notes.find(note => note.id === activeNoteId);
  }, [notes, activeNoteId]);

  const createNewNote = async (type: 'text' | 'analysis' = 'text', title: string = 'Untitled Note', text: string = '', source?: Note['meta']['source'], originalFileName?: string) => {
    const newNote: Note = {
      id: `note_${Date.now()}`,
      type,
      title,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      links: {},
      archived: false,
      meta: { source, originalFileName }
    };
    const newId = await db.notes.add(newNote);
    setActiveNoteId(newId.toString());
  };

  const deleteNote = (idToDelete: string) => {
    db.notes.delete(idToDelete);
  };
  
  const archiveNote = (idToArchive: string) => {
    db.notes.update(idToArchive, { archived: true, updatedAt: new Date().toISOString() });
  }

  const updateNote = (field: 'title' | 'text', value: string) => {
    if (!activeNoteId) return;
    const changes: Partial<Note> = {
      updatedAt: new Date().toISOString(),
    };
    changes[field] = value;
    db.notes.update(activeNoteId, changes);
  };

  const handleCreateAssignment = async () => {
    if (!activeNote) return;
    const newAssignmentId = `as_${Date.now()}`;
    const newAssignment: Assignment = {
      id: newAssignmentId,
      title: activeNote.title || 'New Task from Note',
      status: 'todo',
      priority: 'normal',
      energyLevel: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      links: { notes: [activeNote.id] },
    };
    await db.assignments.add(newAssignment);
    const existingLinks = activeNote.links.assignments || [];
    await db.notes.update(activeNote.id, {
      'links.assignments': [...existingLinks, newAssignmentId]
    });
    CUE.tts.speak(`I've added "${newAssignment.title}" to The Grind for you.`);
    CUE.page({ to: 'grind' });
  };

  const handleSendToIntel = async () => {
    if (!activeNote) return;
    const query = `${activeNote.title || ''}\n${(activeNote.text || '').substring(0, 500)}`.trim();
    if (!query) {
        CUE.tts.speak("There's nothing in this note to analyze.");
        return;
    }
    CUE.tts.speak("Okay, running intel based on this note. This may take a moment. I'll take you to The Intel to see the results.");
    
    try {
        const intelResult: IntelResult = await getIntel(query);
        const newResearchId = `res_${Date.now()}`;
        const newResearch: Research = {
            id: newResearchId,
            query: `From Note: ${activeNote.title}`,
            createdAt: new Date().toISOString(),
            result: intelResult,
            type: 'intel',
            links: { notes: [activeNote.id] }
        };
        await db.research.add(newResearch);
        const existingLinks = activeNote.links.research || [];
        await db.notes.update(activeNote.id, {
            'links.research': [...existingLinks, newResearchId]
        });
        CUE.page({ to: 'intel' });
    } catch (e) {
        console.error("Failed to send to intel", e);
        CUE.tts.speak("Sorry, I hit a snag while running intel. Please try again.");
    }
  };

  const handleLinkGoal = async (goalId: string) => {
    if (!activeNote) return;

    await db.transaction('rw', db.notes, db.goals, async () => {
      // Add goalId to note's links
      const noteLinks = activeNote.links.goals || [];
      if (!noteLinks.includes(goalId)) {
        await db.notes.update(activeNote.id, { 'links.goals': [...noteLinks, goalId] });
      }

      // Add noteId to goal's links
      const goal = await db.goals.get(goalId);
      if (goal) {
          const goalLinks = goal.links.notes || [];
          if (!goalLinks.includes(activeNote.id)) {
            await db.goals.update(goalId, { 'links.notes': [...goalLinks, activeNote.id] });
          }
      }
    });
    
    setShowGoalLinker(false);
    CUE.tts.speak("Note linked to your Magna Carta.");
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (goalLinkerRef.current && !goalLinkerRef.current.contains(event.target as Node)) {
        setShowGoalLinker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex bg-bg-main">
      <aside className="w-1/3 max-w-xs h-screen sticky top-0 bg-gray-900 border-r border-border-color flex flex-col shrink-0">
        <div className="p-4 border-b border-border-color flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">The Lab</h1>
          <button onClick={() => createNewNote()} className="p-2 rounded-lg bg-primary-blue text-white hover:opacity-90 transition-opacity" aria-label="Create new note">
            <PlusIcon />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {notes && notes.length > 0 ? (
            <ul>
              {notes.map(note => (
                <li key={note.id} className={`border-b border-border-color last:border-b-0 ${activeNoteId === note.id ? 'bg-slate-700/75' : ''}`}>
                  <button onClick={() => setActiveNoteId(note.id)} className="w-full text-left p-4 hover:bg-slate-700/50 transition-colors">
                    <h3 className="font-semibold text-white truncate flex items-center">
                        {note.type === 'conversation' && <MicIcon />}
                        {note.title || "Untitled Note"}
                    </h3>
                    <p className="text-sm text-text-dark truncate mt-1">
                      {note.type === 'conversation' 
                        ? `${note.conversation?.length || 0} messages`
                        : note.text?.substring(0, 40) || 'No content yet...'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-slate-500">
              <p>No notes yet. Create one!</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-grow flex flex-col">
        {activeNote ? (
          <>
            <div className="p-4 border-b border-border-color flex items-center shrink-0">
              <input
                type="text"
                value={activeNote.title || ''}
                onChange={(e) => updateNote('title', e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
                placeholder="Note Title"
                disabled={activeNote.type === 'conversation'}
              />
               <button onClick={() => archiveNote(activeNote.id)} className="ml-4 p-2 rounded-lg text-slate-400 hover:bg-yellow-500/80 hover:text-white transition-colors shrink-0" aria-label="Archive note">
                <ArchiveIcon />
              </button>
               <button onClick={() => deleteNote(activeNote.id)} className="ml-2 p-2 rounded-lg text-slate-400 hover:bg-red-500/80 hover:text-white transition-colors shrink-0" aria-label="Delete note">
                <TrashIcon />
              </button>
            </div>
            <div className="flex-grow min-h-0">
              {activeNote.type === 'conversation' 
                  ? <ConversationView note={activeNote} /> 
                  : <TextEditorView note={activeNote} onUpdate={updateNote} />
              }
            </div>
            <div className="p-4 border-t border-border-color bg-gray-900/80 shrink-0">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Actions</h3>
              <div className="flex flex-wrap items-center gap-2">
                  <button onClick={handleCreateAssignment} className="flex items-center text-sm px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                    <ActionIcon><CreateAssignmentIcon/></ActionIcon>Create Grind Item
                  </button>
                  <button onClick={handleSendToIntel} className="flex items-center text-sm px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                    <ActionIcon><SendToIntelIcon/></ActionIcon>Send to Intel
                  </button>
                  <div className="relative" ref={goalLinkerRef}>
                    <button onClick={() => setShowGoalLinker(s => !s)} className="flex items-center text-sm px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors">
                      <ActionIcon><LinkToMagnaCartaIcon/></ActionIcon>Link to Magna Carta
                    </button>
                    {showGoalLinker && (
                      <div className="absolute bottom-full mb-2 w-64 bg-slate-600 border border-border-color rounded-lg shadow-2xl z-10 max-h-60 overflow-y-auto">
                        <div className="p-2 text-white font-semibold text-sm">Select a Goal to Link</div>
                        {goals && goals.length > 0 ? (
                           goals.map(goal => (
                              <button 
                                key={goal.id} 
                                onClick={() => handleLinkGoal(goal.id)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-primary-blue hover:text-white transition-colors"
                              >
                                {goal.title}
                              </button>
                           ))
                        ) : (
                           <div className="p-3 text-sm text-slate-400">No goals found.</div>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[calc(100vh-8rem)] flex justify-center items-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-500">Select a note or create a new one.</h2>
              <button onClick={() => createNewNote()} className="mt-4 bg-primary-blue text-white rounded-lg px-6 py-3 font-semibold hover:opacity-90 transition-opacity">
                Create First Note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notes;