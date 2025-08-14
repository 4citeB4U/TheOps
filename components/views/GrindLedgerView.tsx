import React, { useState, useMemo } from 'react';
import { Assignment, AssignmentStatus, Priority, EnergyLevel } from '../../types';

interface GrindLedgerViewProps {
    assignments: Assignment[];
    onEdit: (assignment: Assignment) => void;
}

const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString();
};

const priorityClasses: Record<Priority, string> = {
    low: "bg-blue-600/50 text-blue-300",
    normal: "bg-green-600/50 text-green-300",
    high: "bg-yellow-600/50 text-yellow-300",
    urgent: "bg-red-600/50 text-red-300",
};

const statusClasses: Record<AssignmentStatus, string> = {
    backlog: "bg-slate-600 text-slate-300",
    todo: "bg-sky-600/80 text-sky-200",
    in_progress: "bg-indigo-600/80 text-indigo-200",
    done: "bg-emerald-600/70 text-emerald-200",
}

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);


const GrindLedgerView: React.FC<GrindLedgerViewProps> = ({ assignments, onEdit }) => {
    const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

    const filteredAssignments = useMemo(() => {
        return assignments
            .filter(a => statusFilter === 'all' || a.status === statusFilter)
            .filter(a => priorityFilter === 'all' || a.priority === priorityFilter)
            .sort((a,b) => (a.dueISO || 'z').localeCompare(b.dueISO || 'z')); // sort by due date, with no date at the end
    }, [assignments, statusFilter, priorityFilter]);

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Status:</span>
                    <FilterButton label="All" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                    {(Object.keys(statusClasses) as AssignmentStatus[]).map(s => <FilterButton key={s} label={s} isActive={statusFilter === s} onClick={() => setStatusFilter(s)} />)}
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-400">Priority:</span>
                    <FilterButton label="All" isActive={priorityFilter === 'all'} onClick={() => setPriorityFilter('all')} />
                    {(Object.keys(priorityClasses) as Priority[]).map(p => <FilterButton key={p} label={p} isActive={priorityFilter === p} onClick={() => setPriorityFilter(p)} />)}
                </div>
            </div>
            <div className="overflow-y-auto flex-grow bg-slate-800/50 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                        <tr>
                            <th className="p-3">Title</th>
                            <th className="p-3">Course</th>
                            <th className="p-3">Due Date</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Priority</th>
                            <th className="p-3">Energy</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filteredAssignments.map(a => (
                            <tr key={a.id} onClick={() => onEdit(a)} className="hover:bg-slate-700/50 cursor-pointer transition-colors">
                                <td className="p-3 font-semibold text-white">{a.title}</td>
                                <td className="p-3 text-slate-400">{a.course}</td>
                                <td className="p-3 text-slate-400">{formatDate(a.dueISO)}</td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${statusClasses[a.status]}`}>{a.status.replace('_', ' ')}</span></td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${priorityClasses[a.priority]}`}>{a.priority}</span></td>
                                <td className="p-3 text-slate-400 capitalize">{a.energyLevel}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAssignments.length === 0 && (
                    <div className="flex items-center justify-center p-8">
                        <p className="text-slate-500">No matching assignments.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrindLedgerView;
