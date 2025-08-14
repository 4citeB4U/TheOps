
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../services/db';
import { Goal, Domain, Horizon, GoalStatus } from '../../types';
import CUE from '../../services/cueRuntime';

interface GoalModalProps {
    goal: Goal | null;
    onClose: () => void;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-400 mb-1">{children}</label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <select {...props} className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-white capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500">
        {children}
    </select>
);

const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose }) => {
    const [formData, setFormData] = useState<Partial<Goal>>({
        title: '',
        description: '',
        domain: 'academic',
        horizon: 'short',
        status: 'not_started',
        links: {},
    });

    useEffect(() => {
        if (goal) {
            setFormData(goal);
        } else {
            setFormData({
                title: '',
                description: '',
                domain: 'academic',
                horizon: 'short',
                status: 'not_started',
                links: {},
            });
        }
    }, [goal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString();
        const dataToSave: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; updatedAt: string; createdAt?: string } = {
            title: formData.title || 'Untitled Goal',
            description: formData.description,
            domain: formData.domain!,
            horizon: formData.horizon!,
            status: formData.status!,
            why: formData.why,
            links: formData.links || {},
            updatedAt: now,
        };

        try {
            if (goal) {
                await db.goals.update(goal.id, dataToSave);
            } else {
                await db.goals.add({
                    ...dataToSave,
                    id: `goal_${Date.now()}`,
                    createdAt: now,
                    links: {}, // Ensure new goals have the links property
                } as Goal);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save goal:", error);
            alert("Could not save the goal. Check the console for details.");
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
                    <h2 className="text-2xl font-bold text-white mb-6">{goal ? 'Edit Goal' : 'New Goal'}</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Goal Title</Label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={formData.title}
                                onChange={handleChange}
                                onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                                onBlur={() => CUE.context.setDictationTarget(null)}
                                className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                         <div>
                            <Label htmlFor="description">Description / Why</Label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                                onBlur={() => CUE.context.setDictationTarget(null)}
                                rows={3}
                                className="w-full bg-slate-700 rounded-md p-2 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="What is this goal and why does it matter?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="domain">Domain</Label>
                                <Select id="domain" name="domain" value={formData.domain} onChange={handleChange}>
                                    {(['academic', 'career', 'activities', 'personal'] as Domain[]).map(d => <option key={d} value={d}>{d}</option>)}
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="horizon">Horizon</Label>
                                <Select id="horizon" name="horizon" value={formData.horizon} onChange={handleChange}>
                                    {(['short', 'mid', 'long'] as Horizon[]).map(h => <option key={h} value={h}>{h}</option>)}
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
                            {goal ? 'Save Changes' : 'Add Goal'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default GoalModal;