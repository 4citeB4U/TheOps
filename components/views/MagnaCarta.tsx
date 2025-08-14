
import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { db } from '../../services/db';
import { Goal, Domain, Horizon } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import GoalModal from './GoalModal';
import CareerAdvisor from './CareerAdvisor';

const ProfileHeader: React.FC = () => {
    const { userProfile } = useAppContext();
    if (!userProfile) return null;

    return (
        <div className="mb-8 flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-border-color">
            <div>
                <h2 className="text-2xl font-bold text-white">Operator: {userProfile.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    {userProfile.isDayOne && (
                        <span className="text-xs font-bold text-teal-300 bg-teal-800/50 px-3 py-1 rounded-full animate-pulse">
                           ⭐ Day One
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const MagnaCartaView: React.FC<{ goals: Goal[], onEditGoal: (goal: Goal) => void }> = ({ goals, onEditGoal }) => {
    const domains: Domain[] = ['academic', 'career', 'activities', 'personal'];
    const horizons: Horizon[] = ['long', 'mid', 'short'];
    return (
        <div className="space-y-8 mt-8 pt-8 border-t border-border-color">
            {domains.map(domain => (
                <div key={domain}>
                    <h2 className="text-2xl font-bold capitalize text-white mb-4">{domain}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {horizons.map(horizon => {
                            const filteredGoals = goals.filter(g => g.domain === domain && g.horizon === horizon);
                            return (
                                <div key={horizon} className="bg-slate-800 rounded-xl p-4 border border-border-color">
                                    <h3 className="font-semibold capitalize text-slate-400 mb-3">{horizon}-Term</h3>
                                    <div className="space-y-2">
                                        {filteredGoals.length > 0 ? filteredGoals.map(g => (
                                            <button key={g.id} onClick={() => onEditGoal(g)} className="w-full text-left bg-slate-700 p-3 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                                                <p className="font-semibold text-white">{g.title}</p>
                                                {g.description && <p className="text-xs text-slate-400 mt-1 truncate">{g.description}</p>}
                                            </button>
                                        )) : <p className="text-xs text-slate-500">No goals set.</p>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
};

const MagnaCarta: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    
    const goals = useLiveQuery(() => db.goals.toArray(), []);

    const openModalForNew = useCallback(() => {
        setEditingGoal(null);
        setIsModalOpen(true);
    }, []);

    const openModalForEdit = useCallback((goal: Goal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingGoal(null);
    }, []);
    
    return (
        <div className="p-8 flex flex-col">
            <ProfileHeader />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-white">The Magna Carta</h1>
                    <p className="text-lg text-text-dark">Your master strategy. The vision for your entire operation.</p>
                </div>
                <button onClick={openModalForNew} className="px-6 py-3 rounded-lg font-semibold bg-primary-blue text-white hover:opacity-90 transition-opacity">
                    Add Goal
                </button>
            </div>

            <CareerAdvisor />

            <MagnaCartaView goals={goals || []} onEditGoal={openModalForEdit}/>
            
            <AnimatePresence>
                {isModalOpen && <GoalModal goal={editingGoal} onClose={closeModal} />}
            </AnimatePresence>
        </div>
    );
};

export default MagnaCarta;
