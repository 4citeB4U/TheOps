
import React, { useMemo, useState } from 'react';
import { Assignment, AssignmentStatus } from '../../types';
import GrindItemCard from './GrindItemCard';

interface GrindLanesViewProps {
    assignments: Assignment[];
    onUpdateStatus: (id: string, newStatus: AssignmentStatus) => void;
    onEdit: (assignment: Assignment) => void;
}

const LANE_CONFIG: { id: AssignmentStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-700' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-indigo-900/50' },
    { id: 'done', title: 'Done', color: 'bg-green-900/50' },
];

const Lane: React.FC<{
    title: string;
    status: AssignmentStatus;
    color: string;
    assignments: Assignment[];
    onDragStart: (e: React.DragEvent<HTMLDivElement>, assignment: Assignment) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, status: AssignmentStatus) => void;
    onEdit: (assignment: Assignment) => void;
    isOver: boolean;
}> = ({ title, status, color, assignments, onDragStart, onDragOver, onDrop, onEdit, isOver }) => {
    
    return (
        <div
            className={`w-full md:w-1/3 p-2 rounded-lg flex flex-col ${isOver ? 'bg-slate-600/50' : ''} transition-colors`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
        >
            <div className={`flex items-center justify-between p-3 rounded-t-lg ${color}`}>
                <h3 className="font-bold text-white">{title}</h3>
                <span className="text-sm font-semibold text-slate-300 bg-black/20 px-2 py-0.5 rounded-full">{assignments.length}</span>
            </div>
            <div className="p-2 space-y-3">
                {assignments.map(a => (
                    <div key={a.id} draggable onDragStart={(e) => onDragStart(e, a)}>
                        <GrindItemCard assignment={a} onEdit={onEdit} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const GrindLanesView: React.FC<GrindLanesViewProps> = ({ assignments, onUpdateStatus, onEdit }) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverLane, setDragOverLane] = useState<AssignmentStatus | null>(null);
    
    const lanes = useMemo(() => {
        return LANE_CONFIG.map(config => ({
            ...config,
            assignments: assignments
                .filter(a => a.status === config.id)
                .sort((a, b) => {
                    const priorityOrder = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }),
        }));
    }, [assignments]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignment: Assignment) => {
        setDraggedItemId(assignment.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', assignment.id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const target = (e.target as HTMLElement).closest('[data-lane-status]');
        if (target) {
            setDragOverLane(target.getAttribute('data-lane-status') as AssignmentStatus);
        }
    };
    
    const handleDragLeave = () => {
        setDragOverLane(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: AssignmentStatus) => {
        e.preventDefault();
        if (draggedItemId) {
            const assignment = assignments.find(a => a.id === draggedItemId);
            if (assignment && assignment.status !== newStatus) {
                onUpdateStatus(draggedItemId, newStatus);
            }
        }
        setDraggedItemId(null);
        setDragOverLane(null);
    };

    return (
        <div className="flex flex-col md:flex-row p-4 gap-4" onDragLeave={handleDragLeave}>
            {lanes.map(lane => (
                <div key={lane.id} className="w-full md:w-1/3 flex flex-col" data-lane-status={lane.id}>
                    <Lane
                        title={lane.title}
                        status={lane.id}
                        color={lane.color}
                        assignments={lane.assignments}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onEdit={onEdit}
                        isOver={dragOverLane === lane.id}
                    />
                </div>
            ))}
        </div>
    );
};

export default GrindLanesView;
