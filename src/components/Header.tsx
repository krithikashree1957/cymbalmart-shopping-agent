import React from "react";
import { Sparkles, Calendar, PlusCircle, CloudUpload, Share2, Printer, CheckCircle2 } from "lucide-react";
import { PartyPlan } from "../types";

interface HeaderProps {
  currentPlan: PartyPlan | null;
  onOpenWizard: () => void;
  onOpenDriveExport: () => void;
  onPrintDossier: () => void;
  savedPlans: PartyPlan[];
  onSelectPlan: (plan: PartyPlan) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlan,
  onOpenWizard,
  onOpenDriveExport,
  onPrintDossier,
  savedPlans,
  onSelectPlan,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Party Planner <span className="text-amber-400 font-semibold">Shopping Agent</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Curated grocery lists, portion math & Google Drive sync
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {savedPlans.length > 1 && (
            <div className="relative hidden md:block">
              <select
                aria-label="Switch Saved Party Plan"
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={currentPlan?.id || ""}
                onChange={(e) => {
                  const target = savedPlans.find((p) => p.id === e.target.value);
                  if (target) onSelectPlan(target);
                }}
              >
                {savedPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    🎉 {p.title} ({p.guestConfig.adultCount + p.guestConfig.childCount} guests)
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentPlan && (
            <>
              <button
                id="btn-print-dossier"
                onClick={onPrintDossier}
                title="Print or Save as PDF"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                id="btn-export-drive"
                onClick={onOpenDriveExport}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow-indigo-500/25"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Google Drive</span>
              </button>
            </>
          )}

          <button
            id="btn-new-party-plan"
            onClick={onOpenWizard}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Party</span>
          </button>
        </div>
      </div>
    </header>
  );
};
