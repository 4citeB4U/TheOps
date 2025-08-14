
import React from 'react';
import { Assignment } from '../../types';
import GrindItemCard from './GrindItemCard';

interface GrindHorizonViewProps {
    assignments: Assignment[];
    onEdit: (assignment: Assignment) => void;
}

const GrindHorizonView: React.FC<GrindHorizonViewProps> = ({ assignments, onEdit }) => {
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    const getAssignmentsForDay = (day: Date) => {
        const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
        const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59).toISOString();
        return assignments
            .filter(a => a.dueISO && a.dueISO >= startOfDay && a.dueISO <= endOfDay)
            .sort((a,b) => (a.dueISO || '').localeCompare(b.dueISO || ''));
    };

    const isToday = (day: Date) => {
        const today = new Date();
        return day.getDate() === today.getDate() &&
               day.getMonth() === today.getMonth() &&
               day.getFullYear() === today.getFullYear();
    };

    return (
        <div className="p-4 flex overflow-x-auto">
            <div className="flex gap-4 min-w-max">
                {days.map(day => {
                    const dailyAssignments = getAssignmentsForDay(day);
                    const hasUrgent = dailyAssignments.some(a => a.priority === 'urgent' && a.status !== 'done');
                    
                    const dayHeaderClasses = [
                        'p-3', 'border-b', 'border-slate-700', 'rounded-t-lg', 'transition-all'
                    ];

                    if (isToday(day)) {
                        dayHeaderClasses.push('bg-indigo-600');
                    } else {
                        dayHeaderClasses.push('bg-slate-700/50');
                    }
                    if (hasUrgent) {
                        dayHeaderClasses.push('border-t-4 border-t-red-500/80');
                    }
                    
                    return (
                        <div key={day.toISOString()} className="w-80 bg-slate-800/70 rounded-lg flex flex-col shrink-0">
                            <div className={dayHeaderClasses.join(' ')}>
                                <h3 className="font-bold text-white text-center">
                                    {day.toLocaleDateString(undefined, { weekday: 'long' })}
                                </h3>
                                <p className="text-sm text-slate-300 text-center">
                                    {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="p-3 space-y-3 flex-grow">
                                {dailyAssignments.length > 0 ? (
                                    dailyAssignments.map(a => <GrindItemCard key={a.id} assignment={a} onEdit={onEdit} />)
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-slate-500 text-sm">No items due.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GrindHorizonView;
