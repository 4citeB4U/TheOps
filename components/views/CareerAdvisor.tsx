
import React, { useState } from 'react';
import { db } from '../../services/db';
import { generateCareerBlueprint } from '../../services/geminiService';
import type { Goal, Research, CareerBlueprint, SuggestedGoal, CareerPlanItem } from '../../types';
import CUE from '../../services/cueRuntime';
import HighlightText from '../utils/HighlightText';
import { GLOBAL_HIGHLIGHTS } from '../../constants/highlights';

// --- Reusable Icons ---
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.94.44c-.45-.88-.13-1.9.8-2.68.9-.75 1.57-1.78 1.64-2.9.06-1.08-.34-2.12-1.12-2.82-1.07-.95-2.2-1.5-3.38-1.5H3.5A2.5 2.5 0 0 1 1 20.5v-16A2.5 2.5 0 0 1 3.5 2h6Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.94.44c.45-.88.13-1.9-.8-2.68-.9-.75-1.57-1.78-1.64-2.9-.06-1.08.34-2.12 1.12-2.82 1.07-.95 2.2-1.5 3.38-1.5h1.5A2.5 2.5 0 0 0 23 20.5v-16A2.5 2.5 0 0 0 20.5 2h-6Z"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// --- Sub-Components ---

const GoalGenerator: React.FC<{ suggestedGoals: SuggestedGoal[] }> = ({ suggestedGoals }) => {
    const [selectedGoals, setSelectedGoals] = useState<SuggestedGoal[]>(suggestedGoals);

    const handleToggleGoal = (goal: SuggestedGoal) => {
        setSelectedGoals(prev => 
            prev.some(g => g.title === goal.title)
                ? prev.filter(g => g.title !== goal.title)
                : [...prev, goal]
        );
    };

    const handleAddGoals = async () => {
        if (selectedGoals.length === 0) return;

        const newGoals: Goal[] = selectedGoals.map(sg => ({
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'not_started',
            links: {},
            ...sg
        }));

        await db.goals.bulkAdd(newGoals);
        CUE.tts.speak(`Locked in. I've added ${newGoals.length} new goals to your Magna Carta.`);
        setSelectedGoals([]); // Clear after adding
    };

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg mt-6 border border-border-color">
            <h3 className="text-lg font-bold text-white mb-3">Suggested Goals</h3>
            <div className="space-y-2 mb-4">
                {suggestedGoals.map((goal, i) => (
                    <div key={i} onClick={() => handleToggleGoal(goal)} className="flex items-center gap-3 p-2 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700/50">
                        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${selectedGoals.some(g => g.title === goal.title) ? 'bg-accent-fuchsia border-accent-fuchsia' : 'border-slate-600'}`}>
                            {selectedGoals.some(g => g.title === goal.title) && <CheckIcon />}
                        </div>
                        <div>
                            <p className="font-semibold text-white text-sm">{goal.title}</p>
                            <p className="text-xs text-slate-400">
                                <HighlightText text={goal.description} highlights={GLOBAL_HIGHLIGHTS} />
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleAddGoals} disabled={selectedGoals.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-accent-fuchsia text-white hover:opacity-90 transition-colors disabled:opacity-50">
                <PlusIcon /> Add {selectedGoals.length} Goal(s) to Magna Carta
            </button>
        </div>
    );
};


const CareerBlueprintDisplay: React.FC<{ blueprint: CareerBlueprint }> = ({ blueprint }) => {
    const renderPlanItems = (items: CareerPlanItem[]) => (
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="text-sm text-slate-300">
                    - {item.title}: <HighlightText text={item.description} highlights={GLOBAL_HIGHLIGHTS} />
                </li>
            ))}
        </ul>
    );

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-3">
            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-headings:font-semibold prose-headings:text-lg">
                <h4>Key Responsibilities</h4>
                <ul>{blueprint.key_responsibilities.map((item, i) => <li key={i}><HighlightText text={item} highlights={GLOBAL_HIGHLIGHTS} /></li>)}</ul>

                <h4>Required Skills</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>Hard Skills:</strong><ul>{blueprint.required_skills.hard.map((item, i) => <li key={i}><HighlightText text={item} highlights={GLOBAL_HIGHLIGHTS} /></li>)}</ul></div>
                    <div><strong>Soft Skills:</strong><ul>{blueprint.required_skills.soft.map((item, i) => <li key={i}><HighlightText text={item} highlights={GLOBAL_HIGHLIGHTS} /></li>)}</ul></div>
                </div>

                <h4>Educational Pathway</h4>
                {renderPlanItems(blueprint.education_pathway)}

                <h4>Extracurricular Activities</h4>
                {renderPlanItems(blueprint.extracurricular_activities)}

                <h4>Community Service</h4>
                {renderPlanItems(blueprint.community_service)}

                <h4>College Recommendations</h4>
                <ul className="space-y-2">
                    {blueprint.college_recommendations.map((rec, i) => (
                        <li key={i}>
                            <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold">{rec.name}</a>: <HighlightText text={rec.reasoning} highlights={GLOBAL_HIGHLIGHTS} />
                        </li>
                    ))}
                </ul>
            </div>
            <GoalGenerator suggestedGoals={blueprint.suggested_goals} />
        </div>
    );
};


const CareerAdvisor: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [activeBlueprint, setActiveBlueprint] = useState<CareerBlueprint | null>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isAnalyzing) return;

        setIsAnalyzing(true);
        setError('');
        setActiveBlueprint(null);
        CUE.tts.speak(`Analyzing career path for ${query}. This may take a moment.`);

        try {
            const blueprint = await generateCareerBlueprint(query, `User is exploring the career of a ${query}.`);
            setActiveBlueprint(blueprint);
            CUE.tts.speak(`Analysis complete. Here is the blueprint for becoming a ${query}.`);

        } catch (err: any) {
            console.error("Career analysis failed:", err);
            const errorMessage = "Sorry, I encountered an error during the analysis. Please try again.";
            setError(errorMessage);
            CUE.tts.speak(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const renderContent = () => {
        if (isAnalyzing) {
            return (
                <div className="flex justify-center items-center h-48">
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="lex-console-thinking-ring border-t-accent-fuchsia w-8 h-8 !border-2"></div>
                        <span>Analyzing career trajectory...</span>
                    </div>
                </div>
            );
        }
        
        if (error) {
            return (
                 <div className="text-center text-warning-red py-8">
                    <p>{error}</p>
                </div>
            )
        }
        
        if (activeBlueprint) {
            return <CareerBlueprintDisplay blueprint={activeBlueprint} />;
        }

        return (
            <div className="text-center text-slate-400 py-8">
                <p>What career path should I analyze for you?</p>
            </div>
        );
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-border-color">
            <h2 className="text-xl font-bold text-white mb-4">Career Blueprint</h2>

            <form onSubmit={handleAnalyze} className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={(e) => CUE.context.setDictationTarget(e.target)}
                    onBlur={() => CUE.context.setDictationTarget(null)}
                    placeholder="e.g., Doctor, Software Engineer, Graphic Designer"
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-fuchsia"
                    disabled={isAnalyzing}
                />
                <button 
                    type="submit"
                    disabled={isAnalyzing || !query.trim()}
                    className="flex items-center gap-3 px-6 py-3 rounded-lg font-semibold bg-accent-fuchsia text-white hover:opacity-90 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    <BrainIcon/>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
            </form>

            {renderContent()}
        </div>
    );
};

export default CareerAdvisor;