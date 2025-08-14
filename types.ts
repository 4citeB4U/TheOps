


export type Phase = 'IDLE' | 'LISTENING' | 'SPEAKING' | 'THINKING' | 'PAUSED';

export type View =
  | 'pulse' // The Pulse
  | 'magna_carta' // The Blueprint is now The Magna Carta
  | 'grind' // The Grind
  | 'lab' // The Lab
  | 'intel' // The Intel
  | 'analyzer' // The Scanner is now The Analyzer
  | 'campus' // The Campus
  | 'garage' // The Garage
  | 'playbook'; // The Playbook

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isThinking?: boolean;
}

export interface VoiceCommand {
    action: 'navigate' | 'talk' | 'contextual_command';
    page?: View;
    spokenResponse: string;
    command?: 'search' | 'analyze_camera_view';
    payload?: any;
}


// --- From Design Doc ---

export type AssignmentStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type NoteType = 'text' | 'audio' | 'conversation' | 'analysis';
export type Domain = 'personal' | 'academic' | 'activities' | 'career';
export type Horizon = 'short' | 'mid' | 'long';
export type Audience = 'pg' | 'general'; // For Vernacular Engine
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type EnergyLevel = 'low' | 'medium' | 'deep';
export type GoalStatus = 'not_started' | 'in_progress' | 'complete';
export type AppLayout = 'sidebar_main_chat' | 'main_sidebar_chat';


export interface Links {
    assignments?: string[];
    notes?: string[];
    research?: string[];
    planSteps?: string[];
    goals?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  course?: string;
  dueISO?: string;
  status: AssignmentStatus;
  links: Links;
  goalId?: string; // Direct link to a goal
  createdAt: string;
  updatedAt: string;
  priority: Priority;
  energyLevel: EnergyLevel;
}

export interface Note {
  id: string;
  type: NoteType;
  title?: string;
  text?: string;
  conversation?: ChatMessage[];
  audioBlobId?: string;
  createdAt: string;
  updatedAt: string;
  links: Links;
  archived?: boolean;
  meta?: {
    summary?: string;
    keywords?: string[];
    source?: 'lecture' | 'chat' | 'manual' | 'analyzer_image' | 'analyzer_doc' | 'research';
    durationSec?: number;
    originalFileName?: string;
  };
}

export interface Goal {
    id: string;
    title: string;
    domain: Domain;
    horizon: Horizon;
    description?: string;
    why?: string;
    status: GoalStatus;
    createdAt: string;
    updatedAt: string;
    links: Links;
}

export interface PlanStep {
    id: string;
    title: string;
    domain: Domain;
    horizon: Horizon;
    due?: string;
    completedAt?: string;
    goalId?: string;
    links: Links;
}

export interface Research {
  id: string;
  query: string;
  createdAt: string;
  result: IntelResult | CareerBlueprint;
  type: 'intel' | 'career_analysis';
  links: Links;
}

export interface DailyNote {
    id: string;
    dateISO: string;
    text?: string;
}

// --- Types for Garage & Onboarding ---

export interface UserProfile {
    id: 'main';
    name: string;
    isDayOne?: boolean;
    startDate?: string;
    onboardingStatus?: 'completed' | 'skipped';
    hasPrestige?: boolean;
    // Prestige Settings
    layout?: AppLayout;
    borderRadius?: number; // 0 to 16
    emojiAmbiance?: string[]; // Array of emojis
    backgroundImage?: string; // Base64 Data URL for custom background
    language?: string; // e.g., 'en-US'
}

export interface GreetingSettings {
    id: 'main';
    fontFamily?: string;
    textColor?: string;
    textEffect?: 'none' | 'fire' | 'electric' | 'glow';
    fontSize?: number;
    fontWeight?: number | string;
    letterSpacing?: number;
}

export interface SchoolInfo {
    id: string;
    name: string;
    details?: any; // Can be expanded later
}


// --- Types for Intelligence Suite ---

export interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

export interface IntelResult {
    text: string;
    sources: GroundingChunk[];
    images: string[];
    pdfs: string[];
}

// --- Types for Career Blueprint ---
export interface CollegeRec {
    name: string;
    url: string;
    reasoning: string;
}

export interface CareerPlanItem {
    title: string;
    category: 'education' | 'extracurricular' | 'community_service' | 'skill_development';
    description: string;
}

export interface SuggestedGoal {
    title: string;
    domain: Domain;
    horizon: Horizon;
    description: string;
}

export interface CareerBlueprint {
    key_responsibilities: string[];
    education_pathway: CareerPlanItem[];
    extracurricular_activities: CareerPlanItem[];
    community_service: CareerPlanItem[];
    required_skills: {
        hard: string[];
        soft: string[];
    };
    college_recommendations: CollegeRec[];
    suggested_goals: SuggestedGoal[];
}