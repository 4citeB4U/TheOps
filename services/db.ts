


import Dexie, { type Table } from 'dexie';
import type { Note, Assignment, PlanStep, Research, DailyNote, Goal, UserProfile, SchoolInfo, GreetingSettings, CareerBlueprint, IntelResult } from '../types';

interface ILexDatabase {
  notes: Table<Note, string>;
  assignments: Table<Assignment, string>;
  planSteps: Table<PlanStep, string>;
  research: Table<Research, string>;
  dailyNotes: Table<DailyNote, string>;
  goals: Table<Goal, string>;
  // New tables for Garage
  userProfile: Table<UserProfile, string>;
  schoolInfo: Table<SchoolInfo, string>;
  appearanceSettings: Table<GreetingSettings, string>;
}

export class LexDatabase extends Dexie implements ILexDatabase {
  notes!: Table<Note, string>;
  assignments!: Table<Assignment, string>;
  planSteps!: Table<PlanStep, string>;
  research!: Table<Research, string>;
  dailyNotes!: Table<DailyNote, string>;
  goals!: Table<Goal, string>;
  // New tables for Garage
  userProfile!: Table<UserProfile, string>;
  schoolInfo!: Table<SchoolInfo, string>;
  appearanceSettings!: Table<GreetingSettings, string>;

  constructor() {
    super('lex-database');
    this.version(7).stores({
      notes: 'id, type, createdAt, updatedAt, archived, *links.assignments, *links.goals',
      assignments: 'id, dueISO, status, createdAt, updatedAt, priority, energyLevel',
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, type, query, createdAt, *links.goals',
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt, *links.research, *links.notes',
      userProfile: 'id',
      schoolInfo: 'id',
      appearanceSettings: 'id',
    });

    this.version(6).stores({
      notes: 'id, type, createdAt, updatedAt, archived, *links.assignments',
      assignments: 'id, dueISO, status, createdAt, updatedAt, priority, energyLevel',
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, type, query, createdAt, *links.goals', // Added type index
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt, *links.research',
      userProfile: 'id',
      schoolInfo: 'id',
      appearanceSettings: 'id',
    });

    this.version(5).stores({
      notes: 'id, type, createdAt, updatedAt, archived, *links.assignments',
      assignments: 'id, dueISO, status, createdAt, updatedAt, priority, energyLevel',
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, query, createdAt, *links.goals',
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt, *links.research',
      userProfile: 'id',
      schoolInfo: 'id',
      appearanceSettings: 'id',
    });
    
    this.version(4).stores({
      notes: 'id, type, createdAt, updatedAt, archived, *links.assignments',
      assignments: 'id, dueISO, status, createdAt, updatedAt, priority, energyLevel', // Added priority and energyLevel indexes
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, query, createdAt',
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt',
      userProfile: 'id',
      schoolInfo: 'id',
      appearanceSettings: 'id',
    });

    this.version(3).stores({
      notes: 'id, type, createdAt, updatedAt, archived, *links.assignments', 
      assignments: 'id, dueISO, status, createdAt, updatedAt',
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, query, createdAt',
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt',
      userProfile: 'id',
      schoolInfo: 'id',
      appearanceSettings: 'id',
    }).upgrade(tx => {
        console.log("Upgrading database to version 3. New tables for user settings will be created.");
    });
    
    // Previous versions for migration path
    this.version(2).stores({
      notes: 'id, type, createdAt, updatedAt, *links.assignments',
      assignments: 'id, dueISO, status, createdAt, updatedAt',
      planSteps: 'id, domain, horizon, due, completedAt, goalId',
      research: 'id, createdAt, query',
      dailyNotes: 'id, dateISO',
      goals: 'id, domain, horizon, createdAt'
    });
    this.version(1).stores({
      notes: 'id, type, createdAt, updatedAt, *links.assignments',
      assignments: 'id, dueISO, status, createdAt, updatedAt',
      planSteps: 'id, domain, horizon, due, completedAt',
      research: 'id, createdAt, query',
      dailyNotes: 'id, dateISO'
    });
  }
}

export const db = new LexDatabase();

export async function seedDatabase() {
  const assignmentCount = await db.assignments.count();
  if (assignmentCount === 0) {
    console.log("Seeding database with initial data for The Grind...");
    const now = new Date().toISOString();
    const assignment1Id = `as_${Date.now()}`;
    const assignment2Id = `as_${Date.now() + 1}`;
    const goal1Id = `goal_${Date.now()}`;

    await db.goals.bulkAdd([
        { id: goal1Id, title: 'Graduate with Honors', domain: 'academic', horizon: 'long', description: 'Finish my degree with a GPA above 3.7.', status: 'not_started', createdAt: now, updatedAt: now, links: {} },
    ]);
    
    await db.planSteps.bulkAdd([
        { id: `ps_${Date.now()}`, title: 'Outline thesis proposal', domain: 'academic', horizon: 'mid', goalId: goal1Id, links: {} },
    ]);

    await db.assignments.bulkAdd([
        { id: assignment1Id, title: 'Physics Lab Report', course: 'Physics 101', dueISO: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'in_progress', links: {}, createdAt: now, updatedAt: now, priority: 'high', energyLevel: 'deep' },
        { id: assignment2Id, title: 'History Midterm Prep', course: 'History 202', dueISO: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'todo', links: {}, createdAt: now, updatedAt: now, priority: 'normal', energyLevel: 'medium' },
        { id: `as_${Date.now() + 2}`, title: 'Review Spanish Vocab', course: 'Spanish 102', dueISO: new Date().toISOString(), status: 'todo', links: {}, createdAt: now, updatedAt: now, priority: 'low', energyLevel: 'low' },
        { id: `as_${Date.now() + 3}`, title: 'Submit Final Thesis Draft', course: 'Capstone Project', dueISO: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: 'todo', links: {}, createdAt: now, updatedAt: now, priority: 'urgent', energyLevel: 'deep' },
        { id: `as_${Date.now() + 4}`, title: 'Complete Calculus Worksheet', course: 'Math 210', dueISO: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'done', links: {}, createdAt: now, updatedAt: now, priority: 'normal', energyLevel: 'medium' },
    ]);
     await db.notes.bulkAdd([
        { id: `note_${Date.now()}`, type: 'text', title: 'Initial thoughts on lab', text: 'The experiment on momentum seems straightforward. Need to collect data on Friday.', createdAt: now, updatedAt: now, links: { assignments: [assignment1Id] } }
    ]);
  }
}

export async function exportAllData() {
    const allTables = db.tables.map(table => table.name);
    const data: { [key: string]: any[] } = {};
    for (const tableName of allTables) {
        data[tableName] = await db.table(tableName).toArray();
    }
    return JSON.stringify(data, null, 2);
}