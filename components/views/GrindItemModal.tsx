
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { Assignment, Priority, EnergyLevel, AssignmentStatus } from '../../types';
import CUE from '../../services/cueRuntime';

interface GrindItemModalProps {
    assignment: Assignment | null;
    onClose: () => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
      {...props}
      onFocus={(e) => CUE.context.setDictationTarget(e.target as HTMLInputElement)}
      onBlur={() => CUE.context.setDictationTarget(null)}
      className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
);

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-400 mb-1">{children}</label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <select {...props} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-white capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {children}
    </select>
);


const GrindItemModal: React.FC<GrindItemModalProps> = ({ assignment, onClose }) => {
    const [formData, setFormData] = useState<Partial<Assignment>>({
        title: '',
        course: '',
        dueISO: new Date().toISOString().split('T')[0],
        status: 'todo',
        priority: 'normal',
        energyLevel: 'medium',
        links: {},
    });

    const linkedNotes = useLiveQuery(() => {
        if (assignment?.links?.notes?.length) {
            return db.notes.bulkGet(assignment.links.notes);
        }
        return [];
    }, [assignment]);

    useEffect(() => {
        if (assignment) {
            setFormData({
                ...assignment,
                dueISO: assignment.dueISO ? new Date(assignment.dueISO).toISOString().split('T')[0] : '',
            });
        } else {
             setFormData({
                title: '',
                course: '',
                dueISO: new Date().toISOString().split('T')[0],
                status: 'todo',
                priority: 'normal',
                energyLevel: 'medium',
                links: {},
            });
        }
    }, [assignment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString();
        const dataToSave: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; updatedAt: string; createdAt?: string } = {
            title: formData.title || 'Untitled',
            course: formData.course,
            dueISO: formData.dueISO ? new Date(formData.dueISO).toISOString() : undefined,
            status: formData.status!,
            priority: formData.priority!,
            energyLevel: formData.energyLevel!,
            links: formData.links || {},
            updatedAt: now,
        };

        try {
            if (assignment) {
                await db.assignments.update(assignment.id, dataToSave);
            } else {
                await db.assignments.add({
                    ...dataToSave,
                    id: `as_${Date.now()}`,
                    createdAt: now,
                } as Assignment);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save assignment:", error);
            alert("Could not save the assignment. Check the console for details.");
        }
    };
    
    return (
        <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700 p-6"
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
            >
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold text-white mb-6">{assignment ? 'Edit Grind Item' : 'New Grind Item'}</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="course">Course / Subject</Label>
                                <Input id="course" name="course" type="text" value={formData.course} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="dueISO">Due Date</Label>
                                <Input id="dueISO" name="dueISO" type="date" value={formData.dueISO} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                                    {(['backlog', 'todo', 'in_progress', 'done'] as AssignmentStatus[]).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                                    {(['low', 'normal', 'high', 'urgent'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="energyLevel">Energy Level</Label>
                                <Select id="energyLevel" name="energyLevel" value={formData.energyLevel} onChange={handleChange}>
                                    {(['low', 'medium', 'deep'] as EnergyLevel[]).map(e => <option key={e} value={e}>{e}</option>)}
                                </Select>
                            </div>
                        </div>

                        {linkedNotes && linkedNotes.filter(Boolean).length > 0 && (
                            <div>
                                <Label htmlFor="linked-notes">Linked Notes</Label>
                                <div id="linked-notes" className="bg-slate-700/50 rounded-md p-3 border border-slate-600 space-y-2 max-h-24 overflow-y-auto">
                                    {linkedNotes.map(note => note && (
                                        <div key={note.id} className="text-sm text-slate-300 p-1 bg-slate-900/50 rounded">
                                            - {note.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                            {assignment ? 'Save Changes' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default GrindItemModal;