
import React from 'react';
import { Assignment } from '../../types';
import { ClockIcon, EnergyIcon, NoteIcon, ResearchIcon, GoalIcon } from './GrindIcons';

interface GrindItemCardProps {
    assignment: Assignment;
    onEdit: (assignment: Assignment) => void;
    isGhost?: boolean;
}

const priorityStyles: { [key: string]: string } = {
    low: 'border-l-blue-500',
    normal: 'border-l-green-500',
    high: 'border-l-yellow-500',
    urgent: 'border-l-red-500',
};

const formatDate = (isoString?: string) => {
    if (!isoString) return 'No due date';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const GrindItemCard: React.FC<GrindItemCardProps> = ({ assignment, onEdit, isGhost }) => {
    const hasLinks = (assignment.links.notes && assignment.links.notes.length > 0) ||
                     (assignment.links.research && assignment.links.research.length > 0);

    const now = new Date();
    const dueDate = assignment.dueISO ? new Date(assignment.dueISO) : null;
    const isDone = assignment.status === 'done';

    const isOverdue = dueDate ? dueDate < now && !isDone : false;
    const isWarning = dueDate ? !isOverdue && !isDone && ((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)) < 24 : false;

    const getCardStyle = () => {
        if (isOverdue) return 'border-l-warning-red bg-warning-red/10';
        if (isWarning) return 'border-l-yellow-500';
        return priorityStyles[assignment.priority];
    };
    
    return (
        <div
            onClick={() => onEdit(assignment)}
            className={`bg-slate-800 rounded p-3 border border-border-color border-l-4 cursor-pointer hover:bg-slate-700/50 transition-colors shadow-sm
            ${getCardStyle()} ${isGhost ? 'opacity-50' : ''} ${assignment.priority === 'urgent' && !isDone ? 'animate-pulse-border' : ''}`}
        >
            <h4 className="font-semibold text-white mb-2">{assignment.title}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dark">
                <div className="flex items-center gap-1.5" title="Due Date">
                    <ClockIcon />
                    <span className={isOverdue ? 'text-warning-red font-bold' : ''}>{formatDate(assignment.dueISO)}</span>
                </div>
                <div className="flex items-center gap-1.5 capitalize" title="Energy Level">
                    <EnergyIcon energy={assignment.energyLevel} />
                    <span>{assignment.energyLevel}</span>
                </div>
                {(hasLinks || assignment.goalId) && (
                    <div className="flex items-center gap-2" title="Linked Items">
                        {assignment.goalId && <GoalIcon />}
                        {assignment.links.notes && assignment.links.notes.length > 0 && <NoteIcon />}
                        {assignment.links.research && assignment.links.research.length > 0 && <ResearchIcon />}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse-border {
                    0%, 100% { border-left-color: var(--warning-red); }
                    50% { border-left-color: #f87171; } /* red-400 */
                }
                .animate-pulse-border {
                    animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default GrindItemCard;
