import React, { useState } from "react";
import {
  Calculator,
  Wine,
  Beer,
  Sparkles,
  Utensils,
  Clock,
  Users,
  RefreshCw,
  CheckCircle2,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { PartyPlan, DrinkPortionGuide } from "../types";

interface PortionCalculatorViewProps {
  plan: PartyPlan;
  onUpdatePortions: (updatedGuide: DrinkPortionGuide) => void;
}

export const PortionCalculatorView: React.FC<PortionCalculatorViewProps> = ({
  plan,
  onUpdatePortions,
}) => {
  const totalGuests = plan.guestConfig.adultCount + plan.guestConfig.childCount;

  const [guestCount, setGuestCount] = useState<number>(totalGuests || 14);
  const [durationHours, setDurationHours] = useState<number>(4);
  const [drinkingIntensity, setDrinkingIntensity] = useState<"light" | "moderate" | "festive">("moderate");
  const [foodType, setFoodType] = useState<"heavy_dinner" | "cocktail_appetizers" | "dessert_only">("heavy_dinner");

  // Portion formulas
  // Standard bar formula: First hour 2 drinks/adult, subsequent hours 1 drink/adult
  const multiplier = drinkingIntensity === "light" ? 0.7 : drinkingIntensity === "moderate" ? 1.0 : 1.35;
  const adults = Math.max(1, guestCount - (plan.guestConfig.childCount || 0));

  const baseDrinksPerAdult = (2 + Math.max(0, durationHours - 1) * 1) * multiplier;
  const totalDrinks = Math.round(adults * baseDrinksPerAdult);

  // Split: 45% wine/beer, 40% cocktails, 15% non-alcoholic
  const beerWineTotal = Math.round(totalDrinks * 0.45);
  const wineBottles = Math.ceil(beerWineTotal * 0.5 / 5); // 5 glasses per 750ml bottle
  const beerCans = Math.ceil(beerWineTotal * 0.5);

  const cocktailsCount = Math.round(totalDrinks * 0.45);
  const spiritBottles750ml = Math.ceil(cocktailsCount / 15); // ~15-16 drinks per bottle

  const nonAlcServings = Math.round((guestCount * (durationHours * 0.8) + (plan.guestConfig.childCount || 0) * 3));
  const iceWeightLbs = Math.ceil(guestCount * 1.5 + (durationHours > 4 ? 10 : 5));

  // Food portions
  const proteinLbsPerGuest = foodType === "heavy_dinner" ? 0.45 : foodType === "cocktail_appetizers" ? 0.25 : 0.1;
  const proteinTotalLbs = Math.round(guestCount * proteinLbsPerGuest * 10) / 10;

  const appPiecesPerGuest = foodType === "cocktail_appetizers" ? 8 : foodType === "heavy_dinner" ? 4 : 2;
  const appPiecesTotal = Math.round(guestCount * appPiecesPerGuest);

  const handleApplyToPlan = () => {
    const newGuide: DrinkPortionGuide = {
      totalEstimatedDrinks: totalDrinks,
      cocktailsCount,
      beerWineBottles: wineBottles + Math.ceil(beerCans / 6),
      nonAlcoholicServings: nonAlcServings,
      iceBagsRequiredLbs: iceWeightLbs,
      mainProteinLbs: proteinTotalLbs,
      appetizerPiecesTotal: appPiecesTotal,
      snackBowlsCount: Math.ceil(guestCount / 4),
    };
    onUpdatePortions(newGuide);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Scientific Portion & Drink Calculator
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                Catering Math
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Never run out of ice, mixers, or main proteins. Calculated using hospitality standard event formulas.
            </p>
          </div>

          <button
            onClick={handleApplyToPlan}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Math with Active Plan</span>
          </button>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
          {/* Guest Count */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Total Guests
              </span>
              <span className="font-bold text-amber-400">{guestCount}</span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Event Length
              </span>
              <span className="font-bold text-indigo-400">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Drinker Profile */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Wine className="w-3.5 h-3.5 text-rose-400" /> Drinking Vibe
            </label>
            <select
              value={drinkingIntensity}
              onChange={(e) => setDrinkingIntensity(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="light">🍷 Casual / Light (0.7x)</option>
              <option value="moderate">🍸 Social Standard (1.0x)</option>
              <option value="festive">🎉 High-Energy Party (1.35x)</option>
            </select>
          </div>

          {/* Food Meal Style */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Meal Type
            </label>
            <select
              value={foodType}
              onChange={(e) => setFoodType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="heavy_dinner">🥩 Full Dinner & Taco Bar</option>
              <option value="cocktail_appetizers">🍢 Heavy Appetizers & Tapas</option>
              <option value="dessert_only">🍰 Drinks & Desserts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calculated Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Beverages & Alcohol */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Wine className="w-4 h-4 text-indigo-400" />
              Bar & Alcohol Estimates
            </h3>
            <span className="text-xs font-bold text-indigo-400">~{totalDrinks} Drinks Total</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🍾 Wine Bottles (750ml)</span>
              <span className="font-bold text-white">{wineBottles} Bottles (~{wineBottles * 5} glasses)</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🍺 Beer & Hard Seltzers</span>
              <span className="font-bold text-white">{beerCans} Cans / Bottles</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🍸 750ml Liquor / Spirits</span>
              <span className="font-bold text-white">{spiritBottles750ml} Bottles (~{cocktailsCount} drinks)</span>
            </div>
          </div>
        </div>

        {/* Ice & Non-Alcoholic */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Ice & Hydration Math
            </h3>
            <span className="text-xs font-bold text-amber-400">{iceWeightLbs} lbs Ice</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🧊 Party Ice Bags (10lb bags)</span>
              <span className="font-bold text-white">{Math.ceil(iceWeightLbs / 10)} Bags ({iceWeightLbs} lbs)</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🧃 Mocktails & Soft Drinks</span>
              <span className="font-bold text-white">~{nonAlcServings} Servings</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">💧 Table Water Pitchers / Jugs</span>
              <span className="font-bold text-white">{Math.ceil(guestCount / 4)} Gallons</span>
            </div>
          </div>
        </div>

        {/* Food & Serving Portions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-400" />
              Food & Protein Quantity
            </h3>
            <span className="text-xs font-bold text-emerald-400">{proteinTotalLbs} lbs Meat/Protein</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🥩 Total Meats / Main Protein</span>
              <span className="font-bold text-white">{proteinTotalLbs} lbs raw</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🍢 Appetizer Bites / Pieces</span>
              <span className="font-bold text-white">~{appPiecesTotal} Pieces Total</span>
            </div>
            <div className="flex justify-between items-center bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-300">🍽️ Disposable Plates & Cups</span>
              <span className="font-bold text-white">{Math.ceil(guestCount * 2.5)} of each (safe buffer)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Rule Box */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-300">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>The 10% Hospitality Buffer Rule:</strong> We automatically factor a 10% safety cushion into disposables, ice, and mixers so you never run dry midway through your event.
        </p>
      </div>
    </div>
  );
};
