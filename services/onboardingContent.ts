
import { View } from '../types';

export const guideTitle = "The Playbook";
export const guideContent = `Welcome to your Ops Center. I'm LEX, your personal academic co-pilot. I'm here to help you manage your grind, lock in your plans, and explore your future.

I run completely in your browser. All your data—your notes, plans, and intel—is stored securely on your own device. It's all private.

You can interact with me using your voice. Just tap the mic and tell me what you need. You can ask me to navigate between tools, take a note, or even run intel on a topic for you.

Let's take a quick tour of your arsenal so you know your way around.`;

export const tourScript: { view: View, content: string }[] = [
    {
        view: 'pulse',
        content: "We'll start here, at The Pulse. This is your command center, showing today's grind, upcoming deadlines, and quick actions to get you started."
    },
    {
        view: 'magna_carta',
        content: "This is The Magna Carta. Think of it as your high-level roadmap. Track academic, personal, and career goals here, from short-term tasks to long-term ambitions."
    },
    {
        view: 'grind',
        content: "The Grind is where you manage your day-to-day. Keep track of all your coursework, update your progress, and link tasks to your notes and intel."
    },
    {
        view: 'lab',
        content: "The Lab is your digital notebook. Cook up ideas, capture audio notes from lectures, or save summaries from our conversations."
    },
    {
        view: 'analyzer',
        content: "The Analyzer is a powerful tool. Upload a PDF or snap a picture of a document, and I'll help you summarize it or pull key info."
    },
    {
        view: 'intel',
        content: "The Intel tool helps you explore topics for your projects. Just ask a question, and I'll find relevant information and sources for you."
    },
    {
        view: 'campus',
        content: "Planning for the future? The Campus tool uses Google Search to pull up-to-date information about colleges and universities."
    },
    {
        view: 'garage',
        content: "Finally, The Garage is where you can tune the engine. Calibrate my voice, manage your data with email or file backups, and make the app yours."
    }
];

export const finalWords = "That's the tour of the Ops Center. You're all set. Remember, tap the mic and I'm here to help. Let's get it.";