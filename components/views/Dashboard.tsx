
import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import type { Assignment, GreetingSettings } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { composeWelcome } from '../../services/lex-vernacular-patch';

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-slate-800 p-6 rounded-xl border border-slate-700 ${className}`}>
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        {children}
    </div>
);

const DashboardHero: React.FC = () => {
    const { flow, userProfile, greetingSettings } = useAppContext();
    const [welcomeMessage, setWelcomeMessage] = useState('');

    useEffect(() => {
        const hasSeenGreeting = localStorage.getItem('lexDayOneGreetingSeen');
        if (userProfile?.isDayOne && !hasSeenGreeting) {
            setWelcomeMessage(`Welcome back. Glad to have my Day One in the Ops Center. Let's get this grind started.`);
            localStorage.setItem('lexDayOneGreetingSeen', 'true');
        } else {
            setWelcomeMessage(composeWelcome(flow));
        }
    }, [userProfile, flow]);
    
    const heroStyle: React.CSSProperties = {
        fontFamily: greetingSettings?.fontFamily || 'inherit',
        fontSize: greetingSettings?.fontSize ? `${greetingSettings.fontSize}px` : undefined,
        fontWeight: greetingSettings?.fontWeight || undefined,
        letterSpacing: greetingSettings?.letterSpacing ? `${greetingSettings.letterSpacing}px` : undefined,
        color: greetingSettings?.textColor || undefined,
    };
    
    const heroClass = greetingSettings?.textEffect ? `text-effect-${greetingSettings.textEffect}` : '';

    return (
        <div className="mb-8">
            <h1 style={heroStyle} className={`text-4xl font-extrabold text-white mb-2 ${heroClass}`}>{welcomeMessage}</h1>
            <p className="text-lg text-slate-400">Here's your overview for today, {userProfile?.name || 'friend'}.</p>
        </div>
    );
}

const TodayStrip: React.FC<{ assignments?: Assignment[] }> = ({ assignments }) => (
    <Card title="Due Today" className="lg:col-span-2">
      <div className="space-y-4">
        {assignments && assignments.length > 0 ? assignments.map(assignment => (
          <div key={assignment.id} className="flex items-center justify-between bg-slate-700 p-4 rounded-lg">
            <div>
                <p className="font-semibold text-white">{assignment.title}</p>
                <p className="text-sm text-slate-400">{assignment.course}</p>
            </div>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors">View</button>
          </div>
        )) : <p className="text-slate-400">Nothing due today. Great job!</p>}
      </div>
    </Card>
);

const QuickActions: React.FC = () => (
     <Card title="Quick Actions">
        <div className="flex flex-col space-y-3">
            <button className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium">New Note (Voice)</button>
            <button className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium">New Assignment</button>
            <button className="w-full text-left p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium">Start Research</button>
        </div>
    </Card>
);

const UpcomingList: React.FC<{ assignments?: Assignment[] }> = ({ assignments }) => (
    <Card title="Upcoming & Overdue" className="lg:col-span-3">
        <div className="space-y-2">
        {assignments && assignments.length > 0 ? assignments.map(assignment => (
             <div key={assignment.id} className={`flex items-center justify-between p-3 rounded-lg ${new Date(assignment.dueISO!) < new Date() ? 'bg-red-900/50' : 'bg-slate-700/50'}`}>
                <p className="font-medium text-white">{assignment.title}</p>
                <p className="text-sm text-slate-400">Due: {new Date(assignment.dueISO!).toLocaleDateString()}</p>
             </div>
        )) : <p className="text-slate-400">No upcoming assignments in the next 7 days.</p>}
        </div>
    </Card>
);

const Dashboard: React.FC = () => {
  const { today, upcoming } = useLiveQuery(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const inAWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayPromise = db.assignments
        .where('dueISO').between(startOfToday.toISOString(), endOfToday.toISOString())
        .toArray();
    
    const upcomingPromise = db.assignments
        .where('dueISO').above(endOfToday.toISOString())
        .and(item => new Date(item.dueISO!) <= inAWeek)
        .sortBy('dueISO');

    return Promise.all([todayPromise, upcomingPromise]).then(([today, upcoming]) => ({ today, upcoming }));
  }, [], { today: [], upcoming: [] });

  return (
    <div className="p-8">
      <DashboardHero />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodayStrip assignments={today} />
        <QuickActions />
        <UpcomingList assignments={upcoming} />
      </div>
    </div>
  );
};

export default Dashboard;
