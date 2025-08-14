
import React, { useMemo } from 'react';
import { Assignment, Priority } from '../../types';
import GrindItemCard from './GrindItemCard';

interface GrindMatrixViewProps {
    assignments: Assignment[];
    onEdit: (assignment: Assignment) => void;
}

type Quadrant = 'crush' | 'schedule' | 'quick' | 'backlog';

const categorizeAssignment = (assignment: Assignment): Quadrant => {
    if (assignment.status === 'done') return 'backlog'; // Or hide them entirely

    const isImportant = assignment.priority === 'high' || assignment.priority === 'urgent';
    
    let isUrgent = false;
    if (assignment.dueISO) {
        const dueDate = new Date(assignment.dueISO);
        const now = new Date();
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        isUrgent = hoursUntilDue <= 48; // Urgent if due in the next 48 hours
    }
    
    if (isImportant && isUrgent) return 'crush';
    if (isImportant && !isUrgent) return 'schedule';
    if (!isImportant && isUrgent) return 'quick';
    return 'backlog';
};

const QuadrantCard: React.FC<{
    title: string;
    description: string;
    assignments: Assignment[];
    onEdit: (assignment: Assignment) => void;
    className?: string;
}> = ({ title, description, assignments, onEdit, className }) => (
    <div className={`bg-slate-800/60 p-4 rounded-xl flex flex-col ${className}`}>
        <div className="mb-4">
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
        <div className="space-y-3 flex-grow pr-2">
            {assignments.length > 0 ? (
                assignments.map(a => <GrindItemCard key={a.id} assignment={a} onEdit={onEdit} />)
            ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">Empty</div>
            )}
        </div>
    </div>
);

const GrindMatrixView: React.FC<GrindMatrixViewProps> = ({ assignments, onEdit }) => {
    const matrix = useMemo(() => {
        const data: { [key in Quadrant]: Assignment[] } = {
            crush: [],
            schedule: [],
            quick: [],
            backlog: [],
        };
        assignments
            .filter(a => a.status !== 'done')
            .forEach(a => {
                const quadrant = categorizeAssignment(a);
                data[quadrant].push(a);
            });
        
        // Sort within each quadrant
        Object.values(data).forEach(quadrantAssignments => 
            quadrantAssignments.sort((a,b) => (a.dueISO || '').localeCompare(b.dueISO || ''))
        );

        return data;
    }, [assignments]);

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[calc(100vh-10rem)]">
                <QuadrantCard
                    title="Crush Now"
                    description="Urgent & Important"
                    assignments={matrix.crush}
                    onEdit={onEdit}
                    className="border-2 border-red-500/50"
                />
                <QuadrantCard
                    title="Schedule"
                    description="Not Urgent & Important"
                    assignments={matrix.schedule}
                    onEdit={onEdit}
                    className="border border-slate-700"
                />
                <QuadrantCard
                    title="Quick Hit"
                    description="Urgent & Not Important"
                    assignments={matrix.quick}
                    onEdit={onEdit}
                    className="border border-slate-700"
                />
                <QuadrantCard
                    title="Backlog"
                    description="Not Urgent & Not Important"
                    assignments={matrix.backlog}
                    onEdit={onEdit}
                    className="border border-slate-700"
                />
            </div>
        </div>
    );
};

export default GrindMatrixView;
