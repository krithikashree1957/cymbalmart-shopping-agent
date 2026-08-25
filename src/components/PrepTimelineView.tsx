import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  Square,
  Plus,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import confetti from "canvas-confetti";
import { PartyPlan, PrepTask } from "../types";

interface PrepTimelineViewProps {
  plan: PartyPlan;
  onUpdatePlan: (updated: PartyPlan) => void;
}

export const PrepTimelineView: React.FC<PrepTimelineViewProps> = ({ plan, onUpdatePlan }) => {
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<{
    phase: PrepTask["phase"];
    task: string;
    details: string;
  }>({
    phase: "Day Before",
    task: "",
    details: "",
  });

  const timeline = plan.prepTimeline || [];
  const completedCount = timeline.filter((t) => t.isDone).length;
  const progressPercent = timeline.length > 0 ? Math.round((completedCount / timeline.length) * 100) : 0;

  const phases: PrepTask["phase"][] = [
    "1 Week Before",
    "2-3 Days Before",
    "Day Before",
    "Party Morning",
    "2 Hours Before",
    "During Event",
  ];

  const handleToggleTask = (taskId: string) => {
    const updated = timeline.map((task) => {
      if (task.id === taskId) {
        const nextState = !task.isDone;
        if (nextState) {
          confetti({
            particleCount: 15,
            spread: 30,
            origin: { y: 0.8 },
            colors: ["#6366F1", "#10B981"],
          });
        }
        return { ...task, isDone: nextState };
      }
      return task;
    });

    onUpdatePlan({ ...plan, prepTimeline: updated });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim()) return;

    const created: PrepTask = {
      id: `task-${Date.now()}`,
      phase: newTask.phase,
      task: newTask.task.trim(),
      details: newTask.details.trim() || undefined,
      isDone: false,
    };

    onUpdatePlan({
      ...plan,
      prepTimeline: [...timeline, created],
    });

    setNewTask({ phase: "Day Before", task: "", details: "" });
    setShowAddTask(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Event Prep Timeline & Countdown
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
              {completedCount} of {timeline.length} Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-stress schedule ensuring food is hot, ice is stocked, drinks are batched, and music is rolling when guests arrive.
          </p>
        </div>

        <button
          onClick={() => setShowAddTask(true)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Task</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-300 font-medium">Preparation Progress</span>
          <span className="font-bold text-indigo-400">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline Phases */}
      <div className="space-y-5">
        {phases.map((phase) => {
          const phaseTasks = timeline.filter((t) => t.phase === phase);
          if (phaseTasks.length === 0) return null;

          return (
            <div
              key={phase}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Phase Header */}
              <div className="p-3.5 sm:p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <h3 className="font-bold text-sm text-white">{phase}</h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {phaseTasks.filter((t) => t.isDone).length}/{phaseTasks.length} Completed
                </span>
              </div>

              {/* Phase Task Items */}
              <div className="divide-y divide-slate-800/60">
                {phaseTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                      task.isDone ? "bg-slate-900/30 opacity-60" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-indigo-400 hover:text-indigo-300 transition-transform active:scale-90"
                    >
                      {task.isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-0.5 flex-1">
                      <p
                        className={`text-xs sm:text-sm font-semibold ${
                          task.isDone ? "line-through text-slate-400" : "text-white"
                        }`}
                      >
                        {task.task}
                      </p>
                      {task.details && (
                        <p className="text-[11px] text-slate-400 italic leading-relaxed">
                          💡 {task.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Prep Timeline Step
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Timing Phase</label>
                <select
                  value={newTask.phase}
                  onChange={(e) => setNewTask({ ...newTask, phase: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {phases.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Description *</label>
                <input
                  type="text"
                  required
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  placeholder="e.g. Chill white wine & beer in coolers"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pro Tip / Temperature Notes</label>
                <input
                  type="text"
                  value={newTask.details}
                  onChange={(e) => setNewTask({ ...newTask, details: e.target.value })}
                  placeholder="e.g. Add 2 cups of salt water to ice for rapid 15-minute chilling"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
