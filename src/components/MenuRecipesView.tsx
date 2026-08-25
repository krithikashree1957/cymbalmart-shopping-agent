import React, { useState } from "react";
import {
  Utensils,
  Wine,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChefHat,
  X,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { MenuItem, PartyPlan } from "../types";

interface MenuRecipesViewProps {
  plan: PartyPlan;
}

export const MenuRecipesView: React.FC<MenuRecipesViewProps> = ({ plan }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [diyGuide, setDiyGuide] = useState<any | null>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState<boolean>(false);

  const menu = plan.menu || [];

  const handleOpenGuide = async (item: MenuItem) => {
    setSelectedItem(item);
    setIsLoadingGuide(true);
    setDiyGuide(null);

    try {
      const res = await fetch("/api/ai/diy-hack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: item.name,
          planContext: plan,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiyGuide(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGuide(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              Curated Menu & Batch Recipes
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
              {menu.length} Dishes & Drinks
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Batch-friendly cocktail recipes, crowd-pleasing mains, and dietary-aligned treats tailored for {plan.guestConfig.adultCount + plan.guestConfig.childCount} guests.
          </p>
        </div>

        {/* Playlist & Ambience Preview Chip */}
        {plan.playlistVibe && (
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl max-w-sm">
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">🎵 Music & Vibe</p>
            <p className="text-xs text-slate-200 font-medium mt-0.5 truncate">{plan.playlistVibe.genre}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {(plan.playlistVibe.sampleTracks || []).slice(0, 2).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {menu.map((dish) => (
          <div
            key={dish.id || dish.name}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Type Badge & Time */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 ${
                    dish.type === "Cocktail" || dish.type === "Mocktail"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : dish.type === "Dessert"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {dish.type === "Cocktail" ? <Wine className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                  {dish.type}
                </span>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {dish.prepTimeMinutes}m
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {dish.servings}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="font-bold text-base text-white">{dish.name}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{dish.description}</p>
              </div>

              {/* Dietary Tags */}
              {dish.dietaryInfo?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dish.dietaryInfo.map((d, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Key Ingredients */}
              {dish.keyIngredients?.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 mb-1">Key Ingredients:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dish.keyIngredients.map((ing, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action button */}
            <button
              onClick={() => handleOpenGuide(dish)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>View Batching Guide & Pro Tips</span>
            </button>
          </div>
        ))}
      </div>

      {/* Deep Dive Guide Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">{selectedItem.name}</h3>
                  <p className="text-xs text-slate-400">{selectedItem.type} • {selectedItem.servings} Servings</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-slate-200">
              {isLoadingGuide ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                  <p className="text-xs">Generating foolproof batching instructions & plating advice...</p>
                </div>
              ) : diyGuide ? (
                <div className="space-y-4">
                  {/* Yield & Time */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <div>
                      <span className="text-slate-400">Yield:</span>
                      <p className="font-bold text-white">{diyGuide.batchYield || `${selectedItem.servings} servings`}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Prep Time:</span>
                      <p className="font-bold text-white">{diyGuide.prepTime || `${selectedItem.prepTimeMinutes} mins`}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Step-by-Step Batching Method
                    </h4>
                    <div className="space-y-2">
                      {(diyGuide.steps || selectedItem.recipeHighlights || []).map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <p className="pt-0.5 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Presentation Tip */}
                  {diyGuide.presentationTip && (
                    <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Styling & Presentation Tip
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">{diyGuide.presentationTip}</p>
                    </div>
                  )}

                  {/* Budget Hack */}
                  {diyGuide.budgetHack && (
                    <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" /> Budget Saving Trick
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">{diyGuide.budgetHack}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Preparation Highlights</h4>
                  <ul className="space-y-2">
                    {(selectedItem.recipeHighlights || []).map((step, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
