
import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence } from 'framer-motion';
import { db } from '../../services/db';
import CUE from '../../services/cueRuntime';
import { Assignment, AssignmentStatus, EnergyLevel } from '../../types';
import GrindLanesView from './GrindLanesView';
import GrindHorizonView from './GrindHorizonView';
import GrindMatrixView from './GrindMatrixView';
import GrindLedgerView from './GrindLedgerView';
import GrindItemModal from './GrindItemModal';
import { PlusIcon, LineupIcon, LanesIcon, HorizonIcon, MatrixIcon, LedgerIcon } from './GrindIcons';

type Lens = 'lanes' | 'horizon' | 'matrix' | 'ledger';

const lensOptions: { id: Lens; label: string; icon: React.FC }[] = [
    { id: 'lanes', label: 'Lanes', icon: LanesIcon },
    { id: 'horizon', label: 'Horizon', icon: HorizonIcon },
    { id: 'matrix', label: 'Matrix', icon: MatrixIcon },
    { id: 'ledger', label: 'Ledger', icon: LedgerIcon },
];

const Assignments: React.FC = () => {
    const [currentLens, setCurrentLens] = useState<Lens>('lanes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    const assignments = useLiveQuery(() => db.assignments.toArray(), []);

    const openModalForEdit = useCallback((assignment: Assignment) => {
        setEditingAssignment(assignment);
        setIsModalOpen(true);
    }, []);

    const openModalForNew = useCallback(() => {
        setEditingAssignment(null);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingAssignment(null);
    }, []);

    const handleUpdateStatus = useCallback(async (assignmentId: string, newStatus: AssignmentStatus) => {
        await db.assignments.update(assignmentId, { status: newStatus, updatedAt: new Date().toISOString() });
    }, []);

    const handleLineupGrind = useCallback(() => {
        if (!assignments) return;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

        const todayTasks = assignments.filter(a =>
            a.dueISO && a.dueISO >= startOfToday && a.dueISO <= endOfToday && a.status !== 'done'
        );

        if (todayTasks.length === 0) {
            CUE.tts.speak("Looks like your plate is clear for today. Solid work. Nothing on The Grind right now.");
            return;
        }
        
        const energyOrder: EnergyLevel[] = ['deep', 'medium', 'low'];
        const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };

        const sortedTasks = todayTasks.sort((a, b) => {
             // Sort by energy level
            const energyDiff = energyOrder.indexOf(a.energyLevel) - energyOrder.indexOf(b.energyLevel);
            if (energyDiff !== 0) return energyDiff;

            // Then by priority
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by due date
            return (a.dueISO || '').localeCompare(b.dueISO || '');
        });

        const firstTask = sortedTasks[0];
        const spokenPlan = `Aight, here's the play for today's grind. We'll start by crushing ${firstTask.title}. That's a ${firstTask.energyLevel} work session. After that, we have ${sortedTasks.length - 1} more moves to make. You ready to get it? Let's go.`;

        CUE.tts.speak(spokenPlan);
    }, [assignments]);


    const renderLens = () => {
        if (!assignments) return <div className="flex-grow flex items-center justify-center text-slate-500">Loading Grind...</div>;

        switch (currentLens) {
            case 'lanes':
                return <GrindLanesView assignments={assignments} onUpdateStatus={handleUpdateStatus} onEdit={openModalForEdit} />;
            case 'horizon':
                return <GrindHorizonView assignments={assignments} onEdit={openModalForEdit}/>;
            case 'matrix':
                return <GrindMatrixView assignments={assignments} onEdit={openModalForEdit}/>;
            case 'ledger':
                return <GrindLedgerView assignments={assignments} onEdit={openModalForEdit}/>;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col bg-slate-900">
            <header className="p-4 border-b border-slate-700/80 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">The Grind</h1>
                        <div className="flex items-center bg-slate-800 rounded-lg p-1">
                            {lensOptions.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setCurrentLens(id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                        currentLens === id ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                                    }`}
                                    aria-label={`Switch to ${label} view`}
                                >
                                    <Icon />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleLineupGrind}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                            <LineupIcon />
                            Line Up My Grind
                        </button>
                        <button
                            onClick={openModalForNew}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                        >
                            <PlusIcon />
                            Add Grind Item
                        </button>
                    </div>
                </div>
            </header>
            <div className="flex-grow">
                {renderLens()}
            </div>
            <AnimatePresence>
                {isModalOpen && <GrindItemModal assignment={editingAssignment} onClose={closeModal} />}
            </AnimatePresence>
        </div>
    );
};

export default Assignments;
