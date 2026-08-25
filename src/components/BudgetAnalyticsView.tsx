import React from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Store,
  Lightbulb,
  CheckCircle,
  PieChart,
  ShoppingBag,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PartyPlan } from "../types";

interface BudgetAnalyticsViewProps {
  plan: PartyPlan;
  onOpenAgentChatWithPrompt: (prompt: string) => void;
}

export const BudgetAnalyticsView: React.FC<BudgetAnalyticsViewProps> = ({
  plan,
  onOpenAgentChatWithPrompt,
}) => {
  const items = plan.shoppingItems || [];
  const targetBudget = plan.budgetTotal || 300;
  const guestCount = Math.max(1, plan.guestConfig.adultCount + plan.guestConfig.childCount);

  // Calculate actual costs
  const activeItems = items.filter((i) => i.status !== "already_have");
  const totalEstimatedCost = activeItems.reduce((sum, i) => sum + i.estimatedCost, 0);
  const costPerGuest = totalEstimatedCost / guestCount;
  const variance = targetBudget - totalEstimatedCost;
  const isUnderBudget = variance >= 0;

  // Aggregate by store
  const storeMap: Record<string, { cost: number; count: number; items: typeof items }> = {};
  activeItems.forEach((item) => {
    const store = item.storeType || "General Store";
    if (!storeMap[store]) {
      storeMap[store] = { cost: 0, count: 0, items: [] };
    }
    storeMap[store].cost += item.estimatedCost;
    storeMap[store].count += 1;
    storeMap[store].items.push(item);
  });

  const storeBreakdown = Object.entries(storeMap)
    .map(([name, data]) => ({
      name,
      cost: data.cost,
      count: data.count,
      percent: totalEstimatedCost > 0 ? Math.round((data.cost / totalEstimatedCost) * 100) : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Aggregate by category
  const categoryMap: Record<string, number> = {};
  activeItems.forEach((item) => {
    const cat = item.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + item.estimatedCost;
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([cat, cost]) => ({
      cat,
      cost,
      percent: totalEstimatedCost > 0 ? Math.round((cost / totalEstimatedCost) * 100) : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Budget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Budget</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">${targetBudget.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Set by party organizer</p>
        </div>

        {/* Estimated Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Total</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">${totalEstimatedCost.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Across {activeItems.length} shopping items</p>
        </div>

        {/* Budget Status / Variance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Variance</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isUnderBudget ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}
            >
              {isUnderBudget ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${isUnderBudget ? "text-emerald-400" : "text-rose-400"}`}>
            {isUnderBudget ? `+$${variance.toFixed(2)} Left` : `-$${Math.abs(variance).toFixed(2)} Over`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {isUnderBudget ? "✨ Safe buffer available" : "⚠️ Needs minor trimming"}
          </p>
        </div>

        {/* Cost Per Guest */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost per Guest</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">${costPerGuest.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">For {guestCount} confirmed guests</p>
        </div>
      </div>

      {/* Store Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Store */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-400" />
              Expenditure by Recommended Store
            </h3>
            <span className="text-xs text-slate-400">{storeBreakdown.length} Store Stops</span>
          </div>

          <div className="space-y-3.5">
            {storeBreakdown.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">
                    {s.name} <span className="text-slate-400 font-normal">({s.count} items)</span>
                  </span>
                  <span className="font-bold text-white">
                    ${s.cost.toFixed(2)} <span className="text-slate-400 text-[10px]">({s.percent}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Department / Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Budget Split by Category
            </h3>
            <span className="text-xs text-slate-400">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="space-y-3.5">
            {categoryBreakdown.map((c) => (
              <div key={c.cat} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{c.cat}</span>
                  <span className="font-bold text-white">
                    ${c.cost.toFixed(2)} <span className="text-slate-400 text-[10px]">({c.percent}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Smart Cost-Saving Tips */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AI Cost-Optimization Strategies</h3>
              <p className="text-xs text-slate-400">Actionable tips tailored to your specific menu & guest count</p>
            </div>
          </div>

          <button
            onClick={() => onOpenAgentChatWithPrompt("Give me 3 clever substitutions to lower my party food & beverage costs by 20%.")}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Ask AI for more hacks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(plan.budgetSummary?.moneySavingTips || [
            "Batch cocktails in a large glass beverage dispenser to cut liquor waste and bartender fatigue by 30%.",
            "Purchase block cheeses and meats to slice at home rather than pre-assembled party platters.",
            "Buy bulk lemons, limes, and ice bags at a wholesale club like Costco or Sam's Club."
          ]).map((tip, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <p className="text-xs text-slate-200 leading-relaxed">{tip}</p>
              </div>
              <button
                onClick={() => onOpenAgentChatWithPrompt(`Apply this saving tip: "${tip}" to my shopping list.`)}
                className="text-[11px] text-amber-400 hover:underline pt-2 text-left font-medium"
              >
                Apply to plan →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
