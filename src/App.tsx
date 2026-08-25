/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShoppingBag,
  DollarSign,
  Utensils,
  Calculator,
  Clock,
  Bot,
  PlusCircle,
  CloudUpload,
  Printer,
  PartyPopper,
  Users,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";

import { PartyPlan, PartyFormInput, DrinkPortionGuide } from "./types";
import { Header } from "./components/Header";
import { PartyWizardModal } from "./components/PartyWizardModal";
import { ShoppingListView } from "./components/ShoppingListView";
import { BudgetAnalyticsView } from "./components/BudgetAnalyticsView";
import { MenuRecipesView } from "./components/MenuRecipesView";
import { PortionCalculatorView } from "./components/PortionCalculatorView";
import { PrepTimelineView } from "./components/PrepTimelineView";
import { AgentChatDrawer } from "./components/AgentChatDrawer";
import { GoogleDriveExportModal } from "./components/GoogleDriveExportModal";
import { formatPlanToMarkdown } from "./services/googleDriveService";

const STORAGE_KEY = "party_planner_saved_plans_v1";

export default function App() {
  const [plans, setPlans] = useState<PartyPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PartyPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"shopping" | "budget" | "menu" | "portions" | "timeline">("shopping");

  // Modals & Drawers
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isAgentChatOpen, setIsAgentChatOpen] = useState<boolean>(false);
  const [agentChatPrompt, setAgentChatPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Initialize with saved plan or bootstrap default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlans(parsed);
          setCurrentPlan(parsed[0]);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load saved plans from storage", e);
    }

    // Default bootstrap plan
    bootstrapDefaultPlan();
  }, []);

  const bootstrapDefaultPlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/plan-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Summer Fiesta & Margarita Bar",
          theme: "Vibrant Mexican street food, fresh citrus margaritas, colorful papel picado banners, upbeat Latin nu-disco",
          occasion: "Birthday Celebration",
          guestCount: 16,
          childCount: 0,
          budgetTotal: 350,
          venueType: "backyard",
          alcoholMode: "full_bar_cocktails",
          dietaryPreferences: ["Gluten-Free options", "Vegetarian friendly"],
        }),
      });

      if (res.ok) {
        const planData = await res.json();
        setPlans([planData]);
        setCurrentPlan(planData);
        savePlansToStorage([planData]);
      }
    } catch (e) {
      console.error("Bootstrap plan error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePlansToStorage = (updatedPlans: PartyPlan[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlans));
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  };

  const handleGeneratePlan = async (input: PartyFormInput) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/plan-party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const newPlan = await res.json();
        const updated = [newPlan, ...plans.filter((p) => p.id !== newPlan.id)];
        setPlans(updated);
        setCurrentPlan(newPlan);
        savePlansToStorage(updated);
        setIsWizardOpen(false);

        // Celebratory confetti
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#EF4444", "#6366F1", "#10B981"],
        });
      }
    } catch (e) {
      console.error("Error generating party plan", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateCurrentPlan = (updatedPlan: PartyPlan) => {
    setCurrentPlan(updatedPlan);
    const nextPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    setPlans(nextPlans);
    savePlansToStorage(nextPlans);
  };

  const handleUpdatePortions = (newGuide: DrinkPortionGuide) => {
    if (!currentPlan) return;
    const updated: PartyPlan = {
      ...currentPlan,
      portionGuide: newGuide,
    };
    handleUpdateCurrentPlan(updated);
    setActiveTab("shopping");
  };

  const handleOpenAgentWithPrompt = (prompt: string) => {
    setAgentChatPrompt(prompt);
    setIsAgentChatOpen(true);
  };

  const toggleVoiceControl = () => {
    const browserWindow = window as typeof window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      window.alert("Web Speech API is not supported in this browser. Try Chrome.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const name = event.results?.[0]?.[0]?.transcript?.trim();
      if (!name || !currentPlan) return;

      const item = {
        id: `voice-item-${Date.now()}`,
        name,
        category: "Voice additions",
        quantity: "1 item",
        estimatedCost: 10,
        storeType: "Supermarket / Grocery" as const,
        priority: "Recommended" as const,
        isChecked: false,
        isCustom: true,
        status: "to_buy" as const,
      };

      handleUpdateCurrentPlan({
        ...currentPlan,
        shoppingItems: [item, ...(currentPlan.shoppingItems || [])],
      });
    };
    recognition.start();
  };

  const handlePrintDossier = () => {
    if (!currentPlan) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const md = formatPlanToMarkdown(currentPlan);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentPlan.title} - Party Dossier</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            h2 { color: #334155; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            h3 { color: #475569; margin-top: 16px; }
            pre { background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <pre>${md}</pre>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        currentPlan={currentPlan}
        isListening={isListening}
        onToggleVoiceControl={toggleVoiceControl}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenDriveExport={() => setIsDriveModalOpen(true)}
        onPrintDossier={handlePrintDossier}
        savedPlans={plans}
        onSelectPlan={(p) => setCurrentPlan(p)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentPlan ? (
          <>
            {/* Event Hero Summary Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800 border border-slate-800 p-5 sm:p-7 shadow-xl">
              {/* Decorative Accent Glows */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <PartyPopper className="w-3.5 h-3.5" /> {currentPlan.occasion}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                      👥 {currentPlan.guestConfig.adultCount + currentPlan.guestConfig.childCount} Guests ({currentPlan.guestConfig.adultCount} Adults, {currentPlan.guestConfig.childCount} Kids)
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      💰 ${currentPlan.budgetTotal} Budget
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentPlan.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{currentPlan.tagline}"
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentPlan.vibeDescription}
                  </p>

                  {/* Color Palette Chips */}
                  {currentPlan.colorPalette?.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Palette:</span>
                      <div className="flex items-center gap-1.5">
                        {currentPlan.colorPalette.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700"
                            title={`${c.name} (${c.hex})`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-[10px] text-slate-300 font-medium">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action Badges / Agent Trigger */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsAgentChatOpen(true)}
                    id="btn-open-agent-chat"
                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Ask AI Shopping Agent</span>
                  </button>

                  <button
                    onClick={() => setIsDriveModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <CloudUpload className="w-4 h-4 text-indigo-400" />
                    <span>Sync to Google Drive</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs Bar */}
            <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
              <button
                id="tab-shopping"
                onClick={() => setActiveTab("shopping")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "shopping"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Master Shopping List</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "shopping" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-400"
                }`}>
                  {currentPlan.shoppingItems?.length || 0}
                </span>
              </button>

              <button
                id="tab-budget"
                onClick={() => setActiveTab("budget")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "budget"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Budget & Store Split</span>
              </button>

              <button
                id="tab-menu"
                onClick={() => setActiveTab("menu")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "menu"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Menu & Recipes</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "menu" ? "bg-slate-950 text-amber-400" : "bg-slate-800 text-slate-400"
                }`}>
                  {currentPlan.menu?.length || 0}
                </span>
              </button>

              <button
                id="tab-portions"
                onClick={() => setActiveTab("portions")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "portions"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Portion & Drink Math</span>
              </button>

              <button
                id="tab-timeline"
                onClick={() => setActiveTab("timeline")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "timeline"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Prep Timeline</span>
              </button>
            </div>

            {/* Active View Container */}
            <div className="pt-2">
              {activeTab === "shopping" && (
                <ShoppingListView
                  plan={currentPlan}
                  onUpdatePlan={handleUpdateCurrentPlan}
                  onOpenAgentChatWithPrompt={handleOpenAgentWithPrompt}
                />
              )}

              {activeTab === "budget" && (
                <BudgetAnalyticsView
                  plan={currentPlan}
                  onOpenAgentChatWithPrompt={handleOpenAgentWithPrompt}
                />
              )}

              {activeTab === "menu" && <MenuRecipesView plan={currentPlan} />}

              {activeTab === "portions" && (
                <PortionCalculatorView
                  plan={currentPlan}
                  onUpdatePortions={handleUpdatePortions}
                />
              )}

              {activeTab === "timeline" && (
                <PrepTimelineView
                  plan={currentPlan}
                  onUpdatePlan={handleUpdateCurrentPlan}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Your First AI Party Plan</h2>
            <p className="text-xs text-slate-400">
              Pick a theme, set your guest count, and let the Party Planner Shopping Agent generate store routes, recipes, and shopping lists!
            </p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Start Party Planner Wizard
            </button>
          </div>
        )}
      </main>

      {/* Floating AI Concierge Button */}
      {currentPlan && !isAgentChatOpen && (
        <button
          onClick={() => setIsAgentChatOpen(true)}
          title="Open AI Shopping Concierge"
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-rose-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Shopping Concierge</span>
        </button>
      )}

      {/* Wizard Modal */}
      <PartyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onGenerate={handleGeneratePlan}
        isLoading={isGenerating}
      />

      {/* Google Drive & Export Modal */}
      {currentPlan && (
        <GoogleDriveExportModal
          plan={currentPlan}
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          onPrintDossier={handlePrintDossier}
        />
      )}

      {/* AI Chat Agent Drawer */}
      {currentPlan && (
        <AgentChatDrawer
          plan={currentPlan}
          onUpdatePlan={handleUpdateCurrentPlan}
          isOpen={isAgentChatOpen}
          onClose={() => setIsAgentChatOpen(false)}
          initialPrompt={agentChatPrompt}
        />
      )}
    </div>
  );
}
