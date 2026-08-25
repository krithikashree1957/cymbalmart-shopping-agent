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

import { PartyPlan, PartyFormInput, DrinkPortionGuide, ShoppingItem } from "./types";
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
          theme: "Vibrant Mexican street food, fresh citrus margaritas, colorful papel picado banners",
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

  // Task 2: Dynamic Budget Recalculation Handler
  const handleUpdateCurrentPlan = (updatedPlan: PartyPlan) => {
    // Dynamically recalculate total budget sum whenever items change
    const recalculatedTotal = updatedPlan.shoppingItems?.reduce((sum, item) => {
      const cost = Number(item.estimatedCost) || 0;
      return sum + cost;
    }, 0);

    const planWithUpdatedBudget: PartyPlan = {
      ...updatedPlan,
      budgetTotal: recalculatedTotal !== undefined && recalculatedTotal > 0
        ? recalculatedTotal
        : updatedPlan.budgetTotal,
    };

    setCurrentPlan(planWithUpdatedBudget);
    const nextPlans = plans.map((p) => (p.id === planWithUpdatedBudget.id ? planWithUpdatedBudget : p));
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

  // Task 3: Voice Control API implementation
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

      const item: ShoppingItem = {
        id: `voice-item-${Date.now()}`,
        name,
        category: "Voice additions",
        quantity: "1 item",
        estimatedCost: 10,
        storeType: "Supermarket / Grocery",
        priority: "Recommended",
        isChecked: false,
        isCustom: true,
        status: "to_buy",
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
            pre { background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
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
      {/* Header with Task 3 Voice Control Toggle */}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentPlan ? (
          <>
            {/* Event Hero Summary Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-800 border border-slate-800 p-5 sm:p-7 shadow-xl">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <PartyPopper className="w-3.5 h-3.5" /> {currentPlan.occasion}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                      👥 {currentPlan.guestConfig.adultCount + currentPlan.guestConfig.childCount} Guests
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      💰 ${currentPlan.budgetTotal} Dynamic Budget Total
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {currentPlan.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                    "{currentPlan.tagline}"
                  </p>
                </div>

                {/* Task 2: Chatbot Trigger Button */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsAgentChatOpen(true)}
                    id="btn-open-agent-chat"
                    className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95"
                  >
                    <Bot className="w-4 h-4" />
                    <span>CymbalMart Assistant</span>
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

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
              <button
                id="tab-shopping"
                onClick={() => setActiveTab("shopping")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "shopping"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Master Shopping List</span>
              </button>

              <button
                id="tab-budget"
                onClick={() => setActiveTab("budget")}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === "budget"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Budget Analytics</span>
              </button>
            </div>

            {/* Views */}
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
            </div>
          </>
        ) : (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Create Your First AI Party Plan</h2>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Start Party Planner Wizard
            </button>
          </div>
        )}
      </main>

      {/* Task 2: Floating Chatbot Assistant Drawer */}
      {currentPlan && (
        <AgentChatDrawer
          plan={currentPlan}
          onUpdatePlan={handleUpdateCurrentPlan}
          isOpen={isAgentChatOpen}
          onClose={() => setIsAgentChatOpen(false)}
          initialPrompt={agentChatPrompt}
        />
      )}

      {/* Wizard and Drive Modals */}
      <PartyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onGenerate={handleGeneratePlan}
        isLoading={isGenerating}
      />

      {currentPlan && (
        <GoogleDriveExportModal
          plan={currentPlan}
          isOpen={isDriveModalOpen}
          onClose={() => setIsDriveModalOpen(false)}
          onPrintDossier={handlePrintDossier}
        />
      )}
    </div>
  );
}