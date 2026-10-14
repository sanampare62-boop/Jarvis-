import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Clock, Trash2, Play } from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  steps: string[];
  completed: boolean;
  activeStep: number;
}

export const MissionsModule: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: '1',
      title: 'Master Quantum Physics Basics',
      steps: ['Read wave-particle duality notes', 'Solve 3 practice problems', 'Review summary with Mahi'],
      completed: false,
      activeStep: 0,
    },
    {
      id: '2',
      title: 'Build React Cyberpunk Landing Page',
      steps: ['Initialize Vite + Tailwind project', 'Create 3D holographic canvas component', 'Deploy and test voice integration'],
      completed: false,
      activeStep: 1,
    },
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newStep, setNewStep] = useState('');

  const addMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setMissions((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        steps: newStep.trim() ? newStep.split(',').map((s) => s.trim()) : ['Step 1: Plan goal', 'Step 2: Execute task'],
        completed: false,
        activeStep: 0,
      },
    ]);
    setNewTitle('');
    setNewStep('');
  };

  const advanceStep = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const nextStep = m.activeStep + 1;
        if (nextStep >= m.steps.length) {
          return { ...m, completed: true, activeStep: m.steps.length - 1 };
        }
        return { ...m, activeStep: nextStep };
      })
    );
  };

  const deleteMission = (id: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto glass-panel rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl bg-zinc-950/80 p-5">
      <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">MAHI Missions & Task Automation</h3>
            <p className="text-[10px] text-cyan-400 font-mono">Step-by-step goal execution & tracking</p>
          </div>
        </div>
      </div>

      <form onSubmit={addMission} className="mt-4 space-y-2.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New Mission Title (e.g. Prepare Study Plan)..."
          className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder="Steps separated by commas (Step 1, Step 2)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-semibold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mission</span>
          </button>
        </div>
      </form>

      <div className="flex-1 mt-4 overflow-y-auto space-y-3 pr-1">
        {missions.map((m) => (
          <div key={m.id} className="p-3.5 rounded-2xl glass-panel border border-white/10 bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>{m.title}</span>
                {m.completed && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                    Completed
                  </span>
                )}
              </h4>
              <button
                onClick={() => deleteMission(m.id)}
                className="text-zinc-500 hover:text-rose-400 p-1"
                title="Delete Mission"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 pl-5">
              {m.steps.map((step, sIdx) => {
                const isDone = sIdx < m.activeStep || m.completed;
                const isCurrent = sIdx === m.activeStep && !m.completed;
                return (
                  <div key={sIdx} className="flex items-center gap-2 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-zinc-600 flex-shrink-0" />
                    )}
                    <span className={isDone ? 'line-through text-zinc-500' : isCurrent ? 'text-cyan-200 font-medium' : 'text-zinc-400'}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {!m.completed && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => advanceStep(m.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-medium cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Complete Step</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
