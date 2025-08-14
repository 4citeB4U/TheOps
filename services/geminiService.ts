
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { View, IntelResult, GroundingChunk, VoiceCommand, Audience, CareerBlueprint, CareerPlanItem, SuggestedGoal, CollegeRec, Domain, Horizon, Note, Research } from '../types';
import { db } from './db';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getPersonalityInstruction = (flow: number): string => {
    if (flow >= 90) return "You must adopt a street-hustle, confident, and slang-heavy tone. Be direct and use modern slang naturally. You are a sharp, savvy co-pilot from the streets who knows how to get things done.";
    if (flow >= 40) return "You must adopt a casual, encouraging, and slightly informal tone. Be a friendly and approachable partner.";
    return "You must adopt a professional, formal, and academic tone. Be a helpful and respectful assistant.";
}

// --- REGULAR CHAT FUNCTIONS ---

export const lexRespond = async (prompt: string, flow: number, audience: Audience): Promise<string> => {
  if (!process.env.API_KEY) {
    return "I'm sorry, the application is not configured with an API key for the AI service. Please contact the developer.";
  }
  const personality = getPersonalityInstruction(flow);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are LEX, a helpful academic co-pilot for students. ${personality} Keep your answers concise, informative, and encouraging. Your audience setting is '${audience}', adjust content appropriately. Do not use asterisks for emphasis in your response.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I encountered an error while trying to find an answer. Please check the console for details.";
  }
};

// --- VOICE COMMAND PROCESSING ---

const commandSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, description: "Action to perform: 'navigate', 'talk', or 'contextual_command'." },
        page: { type: Type.STRING, description: "Required if action is 'navigate'. Valid pages: pulse, magna_carta, grind, lab, intel, analyzer, campus, garage, playbook.", nullable: true },
        spokenResponse: { type: Type.STRING, description: "The text to be spoken back to the user." },
        command: { type: Type.STRING, description: "Required if action is 'contextual_command'. E.g., 'search' or 'analyze_camera_view'.", nullable: true },
        payload: { type: Type.OBJECT, description: "Data for the contextual command, e.g., { query: 'Nike' }.", nullable: true, properties: { query: {type: Type.STRING } } },
    },
    required: ["action", "spokenResponse"],
};

export const processVoiceCommand = async (prompt: string, currentView: View, flow: number, audience: Audience): Promise<VoiceCommand> => {
    if (!process.env.API_KEY) return { action: 'talk', spokenResponse: "I'm sorry, the application is not configured with an API key." };
    const personality = getPersonalityInstruction(flow);
    try {
        const systemInstruction = `You are the brain of a voice assistant named LEX, integrated into an academic operations app. ${personality} Your current view is '${currentView}'. Your audience setting is '${audience}', adjust your spoken response content appropriately. Your job is to understand a user's request and return a JSON object that determines the application's response according to the provided schema. Do not use asterisks or any markdown for emphasis in your spokenResponse.

- **Navigation**: Only trigger navigation if the user uses an explicit command like "take me to", "let's go to", "navigate to", or "open". The spokenResponse should confirm the action, e.g., "Navigating to The Intel." Valid pages are: 'pulse', 'magna_carta', 'grind', 'lab', 'intel', 'analyzer', 'campus', 'garage', 'playbook'. If a page name is mentioned without a navigation command, do not navigate.

- **Contextual Commands**: If the user is on a specific page, interpret their request in that context.
  - If on 'intel' and they want to search (e.g., "look up Nike"), set action to 'contextual_command', command to 'search', and payload to { "query": "Nike" }.
  - If on 'analyzer' and they ask what you see (e.g., "analyze what you see", "what's in front of me?"), set action to 'contextual_command', command to 'analyze_camera_view'.

- **General Talk**: If the request is a question or statement not covered above, set action to 'talk' and provide a helpful, concise answer. If you can't do something like an "investigation," offer a helpful alternative like an intel search.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `User request: "${prompt}"`,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: commandSchema }
        });

        const result = JSON.parse(response.text) as VoiceCommand;
        if (result.action === 'navigate' && !result.page) {
             return { action: 'talk', spokenResponse: "I'm not sure where you wanted to go. Could you say that again?" };
        }
        return result;
    } catch (error) {
        console.error("Error processing voice command with Gemini:", error);
        const fallbackText = await lexRespond(prompt, flow, audience);
        return { action: 'talk', spokenResponse: fallbackText };
    }
};

// --- INTEL & BLUEPRINT SUITE ---

export const getIntel = async (query: string): Promise<IntelResult> => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    
    const prompt = `Provide a comprehensive overview of "${query}". Your response should be well-structured for a student. In your text, also try to include markdown links for relevant images and direct links to academic papers or PDFs on the topic.`;
    
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are an expert research assistant. You provide detailed, accurate information backed by web sources. You also find relevant images and documents (PDFs) to create a rich, multi-format dossier for the user."
        },
    });
    
    const text = result.text;
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;
    const sources = (Array.isArray(groundingMetadata?.groundingChunks) ? groundingMetadata.groundingChunks : [])
        .filter((c): c is GroundingChunk => !!(c && typeof c === 'object' && 'web' in c && (c as any).web?.uri));

    const imageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|svg|webp)[^\s)]*)\)|(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|gif|svg|webp)[^\s)]*)/gi;
    const pdfRegex = /https?:\/\/[^\s)]+\.pdf/gi;

    const images = [...text.matchAll(imageRegex)]
        .map(match => match[1] || match[2])
        .filter((url): url is string => !!url);
    
    const pdfMatches = text.match(pdfRegex);
    const pdfs = pdfMatches ? [...new Set(pdfMatches)] : [];

    return { text, sources, images, pdfs };
};

const formatBlueprintAsText = (blueprint: CareerBlueprint, careerTitle: string): string => {
    let text = `## Career Blueprint: ${careerTitle}\n\n`;
    text += `### Key Responsibilities\n- ${blueprint.key_responsibilities.join('\n- ')}\n\n`;
    
    text += `### Required Skills\n`;
    text += `**Hard Skills:**\n- ${blueprint.required_skills.hard.join('\n- ')}\n`;
    text += `**Soft Skills:**\n- ${blueprint.required_skills.soft.join('\n- ')}\n\n`;

    const formatPlanItems = (title: string, items: CareerPlanItem[]) => {
        if (items.length === 0) return '';
        let section = `### ${title}\n`;
        items.forEach(item => {
            section += `- **${item.title}:** ${item.description}\n`;
        });
        return section + '\n';
    };

    text += formatPlanItems('Educational Pathway', blueprint.education_pathway);
    text += formatPlanItems('Extracurricular Activities', blueprint.extracurricular_activities);
    text += formatPlanItems('Community Service', blueprint.community_service);

    text += `### College Recommendations\n`;
    blueprint.college_recommendations.forEach(rec => {
        text += `- **[${rec.name}](${rec.url})**: ${rec.reasoning}\n`;
    });
    text += '\n';

    text += `### Suggested Goals\n`;
    blueprint.suggested_goals.forEach(goal => {
        text += `- **${goal.title} (${goal.horizon}, ${goal.domain}):** ${goal.description}\n`;
    });

    return text;
};

export const generateCareerBlueprint = async (careerTitle: string, description: string): Promise<CareerBlueprint> => {
    if (!process.env.API_KEY) throw new Error("API key not configured.");
    
    const prompt = `Analyze the career path for a "${careerTitle}". The user's goal is: "${description}".
Provide a detailed breakdown. Your response must be a single, valid JSON object and nothing else. Do not wrap it in markdown like \`\`\`json. The JSON object must have the following structure:
{
  "key_responsibilities": ["A list of typical day-to-day responsibilities."],
  "education_pathway": [{"title": "Course/Degree Name", "category": "education", "description": "Why this is important."}],
  "extracurricular_activities": [{"title": "Club/Activity Name", "category": "extracurricular", "description": "Relevance to the career."}],
  "community_service": [{"title": "Volunteer Opportunity", "category": "community_service", "description": "How it helps build profile."}],
  "required_skills": {
    "hard": ["List of essential technical skills"],
    "soft": ["List of essential interpersonal skills"]
  },
  "college_recommendations": [{"name": "University Name", "url": "https://university.edu", "reasoning": "Why this university is recommended."}],
  "suggested_goals": [{"title": "Actionable Goal Title", "domain": "academic" | "personal" | "activities" | "career", "horizon": "short" | "mid" | "long", "description": "Brief description of the goal."}]
}`;

    const systemInstruction = `You are an expert career and academic advisor. Your task is to generate a comprehensive, structured blueprint for a career. Use Google Search for up-to-date information. Your entire response MUST be a single JSON object that can be parsed directly. Do not add any commentary or introductory text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            systemInstruction, 
            tools: [{ googleSearch: {} }] 
        }
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json') && jsonString.endsWith('```')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
         jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    try {
        const blueprint = JSON.parse(jsonString) as CareerBlueprint;
        
        // --- Save results to DB ---
        const now = new Date().toISOString();
        const researchId = `res_career_${Date.now()}`;
        const noteId = `note_career_${Date.now()}`;

        const newResearch: Research = {
            id: researchId,
            query: `Career Analysis: ${careerTitle}`,
            createdAt: now,
            result: blueprint,
            type: 'career_analysis',
            links: { notes: [noteId] }
        };

        const noteText = formatBlueprintAsText(blueprint, careerTitle);

        const newNote: Note = {
            id: noteId,
            type: 'analysis',
            title: `Career Blueprint: ${careerTitle}`,
            text: noteText,
            createdAt: now,
            updatedAt: now,
            links: { research: [researchId] },
            meta: { source: 'research' }
        };

        await db.transaction('rw', db.research, db.notes, async () => {
            await db.research.add(newResearch);
            await db.notes.add(newNote);
        });

        return blueprint;
    } catch (e) {
        console.error("Failed to parse or save career blueprint JSON:", e);
        console.error("Received text from Gemini:", response.text);
        throw new Error("The AI returned an invalid data format for the career blueprint. Please check the console for details.");
    }
};


// --- ANALYZER (DOCUMENT/IMAGE ANALYSIS) ---

export const analyzeFile = async (prompt: string, base64Data: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "I'm sorry, the application is not configured with an API key for the AI service.";
    }
    
    try {
        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, filePart] },
            config: {
                systemInstruction: "You are an expert document and image analyst. The user has uploaded a file and asked a question about it. Provide a clear, detailed, and accurate analysis based on the file's content.",
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error analyzing file with Gemini:", error);
        return "I'm sorry, I encountered an error while trying to analyze the file. Please check the console for details.";
    }
};