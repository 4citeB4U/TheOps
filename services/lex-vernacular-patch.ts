import { Audience, View } from '../types';

const WELCOME_LINES_NEUTRAL = [
    "Welcome back. Let's get to work.",
    "Ready to get started?",
    "Okay, system online. What's the plan?",
];

const WELCOME_LINES_MID = [
    "Alright, we're live. What's the move?",
    "Let's get it. What are we focusing on today?",
    "Back in the mix. Let's make some progress.",
];

const WELCOME_LINES_STREET_HUSTLE = [
    "Aight, we back in the lab. Time to cook.",
    "Let's get this hustle. What's the play?",
    "We live. Let's run it up.",
    "Time to get this paper. What's the first move?",
    "Ops Center is live. Let's run the traps.",
    "Locked in. What's the agenda?",
];

const PAGE_SPECIFIC_GREETINGS: Record<View, { neutral: string; mid: string; hustle: string }> = {
    pulse: {
        neutral: "The Pulse is active. All systems are go.",
        mid: "Checking the pulse. Let's see the overview.",
        hustle: "Aight, let's check the vitals. The Pulse is live."
    },
    magna_carta: {
        neutral: "Opening The Magna Carta. Let's review the master plan.",
        mid: "Time to look at the big picture. Here's The Magna Carta.",
        hustle: "Pullin' up the master plan. This is the whole play."
    },
    grind: {
        neutral: "The Grind is active. Time to manage tasks.",
        mid: "Let's get to work. Welcome to The Grind.",
        hustle: "The daily hustle. Let's see what's on the docket."
    },
    lab: {
        neutral: "Welcome to The Lab. Ready to capture some ideas?",
        mid: "The Lab is open. Let's cook up some new ideas.",
        hustle: "We in the lab now. Time to build."
    },
    intel: {
        neutral: "Intel suite is online. What are we researching?",
        mid: "The Intel desk is open. What's the target?",
        hustle: "Runnin' intel. What's the 4-1-1?"
    },
    analyzer: {
        neutral: "The Analyzer is ready. Let's process some data.",
        mid: "The Analyzer is online. Feed me some data.",
        hustle: "Let's break it down. The Analyzer is ready to cook."
    },
    campus: {
        neutral: "Campus Explorer is ready. Where are we looking?",
        mid: "Let's check out some schools. Campus Explorer is a go.",
        hustle: "Scouting the future. Campus mode, activated."
    },
    garage: {
        neutral: "Welcome to The Garage. Let's tune the engine.",
        mid: "Opening The Garage. Time for a tune-up.",
        hustle: "Poppin' the hood. Welcome to The Garage."
    },
    playbook: {
        neutral: "Opening The Playbook. All strategies are here.",
        mid: "Let's review the moves. Here's The Playbook.",
        hustle: "Time for the game plan. The Playbook is open."
    }
};


// A simple random selection utility
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const composeWelcome = (flow: number, view?: View): string => {
    if (view && PAGE_SPECIFIC_GREETINGS[view]) {
        const greetings = PAGE_SPECIFIC_GREETINGS[view];
        if (flow >= 90) return greetings.hustle;
        if (flow >= 40) return greetings.mid;
        return greetings.neutral;
    }

    // Fallback to generic if view is not provided or has no specific greeting
    if (flow >= 90) {
        return pick(WELCOME_LINES_STREET_HUSTLE);
    }
    if (flow >= 40) {
        return pick(WELCOME_LINES_MID);
    }
    return pick(WELCOME_LINES_NEUTRAL);
};


export const getVernacular = (key: string, flow: number, audience: Audience): string => {
    // This can be expanded into a much larger system as per the spec.
    // For now, this is a placeholder for the concept.
    const dictionary = {
        'REAL_TALK': {
            neutral: "To be frank,",
            mid: "Real talk,",
            hustle: "Aight, look..."
        },
        'PRAISE': {
            neutral: "Excellent work.",
            mid: "Nice one.",
            hustle: "That's a boss move."
        }
    }
    
    const term = dictionary[key as keyof typeof dictionary];
    if (!term) return '';
    
    if (flow >= 90) return term.hustle;
    if (flow >= 40) return term.mid;
    return term.neutral;
}