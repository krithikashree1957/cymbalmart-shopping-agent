import React, { useState } from "react";
import { Sparkles, X, Users, DollarSign, Wine, Utensils, MapPin, Check, Wand2, Loader2, Music, PartyPopper } from "lucide-react";
import { PartyFormInput } from "../types";

interface PartyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (input: PartyFormInput) => Promise<void>;
  isLoading: boolean;
}

const PRESET_THEMES = [
  {
    name: "Summer Fiesta & Margarita Bar",
    occasion: "Adult Birthday / Social",
    theme: "Vibrant Mexican street food, fresh citrus margaritas, colorful papel picado banners, upbeat Latin nu-disco",
    venue: "backyard" as const,
    budget: 350,
    guests: 16,
    alcohol: "full_bar_cocktails" as const,
    dietary: ["Gluten-Free options", "Vegetarian friendly"],
    icon: "🍹",
  },
  {
    name: "80s Neon Retro Disco",
    occasion: "Milestone Birthday",
    theme: "Neon colors, glow sticks, retro finger snacks, synthwave pop hits, retro cocktail punch bowl",
    venue: "indoor_home" as const,
    budget: 280,
    guests: 14,
    alcohol: "full_bar_cocktails" as const,
    dietary: ["Nut-Free"],
    icon: "🪩",
  },
  {
    name: "Artisan Wood-Fired Pizza & Craft Beer",
    occasion: "Casual Get-Together",
    theme: "DIY personal gourmet pizzas with custom toppings, local IPA & cider pairings, Italian dessert cannolis",
    venue: "backyard" as const,
    budget: 300,
    guests: 12,
    alcohol: "beer_wine_only" as const,
    dietary: ["Vegetarian friendly", "Dairy-Free options"],
    icon: "🍕",
  },
  {
    name: "Wine, Cheese & Charcuterie Soiree",
    occasion: "Dinner Party / Anniversary",
    theme: "Curated artisanal cheese boards, cured meats, fig jams, sourdough baguettes, sommelier-style wine pairings",
    venue: "indoor_home" as const,
    budget: 400,
    guests: 10,
    alcohol: "beer_wine_only" as const,
    dietary: ["Gluten-Free crackers"],
    icon: "🍷",
  },
  {
    name: "Kids Superhero Quest & Snack Station",
    occasion: "Kids Birthday Party",
    theme: "Hero power juice punches, mini sliders, colorful cupcakes, photo backdrop, superhero cape favors",
    venue: "park_outdoor" as const,
    budget: 250,
    guests: 18,
    alcohol: "mocktails_nonalcoholic" as const,
    dietary: ["Nut-Free", "Kid-friendly"],
    icon: "🦸",
  },
  {
    name: "Cozy Garden High Tea & Mimosa Brunch",
    occasion: "Bridal / Baby Shower or Morning Gathering",
    theme: "Floral centerpieces, cucumber dill finger sandwiches, fresh scones with clotted cream, sparkling prosecco mimosas",
    venue: "backyard" as const,
    budget: 320,
    guests: 14,
    alcohol: "beer_wine_only" as const,
    dietary: ["Vegetarian friendly"],
    icon: "🌸",
  },
];

const DIETARY_OPTIONS = [
  "Gluten-Free",
  "Vegetarian",
  "Vegan",
  "Nut-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "Keto / Low-Carb",
  "Non-Alcoholic Drinkers",
];

const ACTIVITY_OPTIONS = [
  "DJ / Curated Playlist & Dancing",
  "Cocktail / Mocktail DIY Bar",
  "Board Games & Trivia",
  "Backyard Lawn Games (Cornhole, etc)",
  "Photo Booth with Props",
  "Karaoke Station",
  "Gift Unwrapping / Cake Cutting",
];

export const PartyWizardModal: React.FC<PartyWizardModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
}) => {
  const [formData, setFormData] = useState<PartyFormInput>({
    title: "Summer Fiesta & Margarita Bar",
    theme: "Vibrant Mexican street food, fresh citrus margaritas, colorful papel picado banners, upbeat Latin nu-disco",
    occasion: "Birthday Celebration",
    date: new Date().toISOString().split("T")[0],
    time: "18:00",
    durationHours: 4,
    venueType: "backyard",
    guestCount: 16,
    childCount: 0,
    budgetTotal: 350,
    budgetTier: "moderate_balanced",
    alcoholMode: "full_bar_cocktails",
    dietaryPreferences: ["Gluten-Free options", "Vegetarian friendly"],
    customDietaryNote: "",
    activityPreferences: ["Cocktail / Mocktail DIY Bar", "Backyard Lawn Games (Cornhole, etc)"],
    customNotes: "Make sure there are enough fresh limes for drinks and food!",
  });

  const [generationStep, setGenerationStep] = useState(0);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_THEMES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.name,
      occasion: preset.occasion,
      theme: preset.theme,
      venueType: preset.venue,
      budgetTotal: preset.budget,
      guestCount: preset.guests,
      alcoholMode: preset.alcohol,
      dietaryPreferences: preset.dietary,
    }));
  };

  const handleToggleDietary = (item: string) => {
    setFormData((prev) => {
      const exists = prev.dietaryPreferences.includes(item);
      return {
        ...prev,
        dietaryPreferences: exists
          ? prev.dietaryPreferences.filter((d) => d !== item)
          : [...prev.dietaryPreferences, item],
      };
    });
  };

  const handleToggleActivity = (act: string) => {
    setFormData((prev) => {
      const exists = prev.activityPreferences.includes(act);
      return {
        ...prev,
        activityPreferences: exists
          ? prev.activityPreferences.filter((a) => a !== act)
          : [...prev.activityPreferences, act],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerationStep(1);
    const timer1 = setTimeout(() => setGenerationStep(2), 1200);
    const timer2 = setTimeout(() => setGenerationStep(3), 2600);
    try {
      await onGenerate(formData);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerationStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Party Planning & Shopping Agent</h2>
              <p className="text-xs text-slate-400">AI calculates exact shopping lists, store routes & portion math</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Quick Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <PartyPopper className="w-3.5 h-3.5" /> Instant Party Theme Presets
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2 ${
                    formData.title === preset.name
                      ? "bg-amber-500/15 border-amber-500/50 text-white shadow-sm"
                      : "bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">{preset.name}</p>
                    <p className="text-[10px] text-slate-400">{preset.guests} guests • ${preset.budget}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form id="party-wizard-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Event Name & Occasion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Event Title / Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Alex's 30th Birthday Bash"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Occasion / Event Type
                </label>
                <input
                  type="text"
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  placeholder="e.g. Birthday, Anniversary, Game Night"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Theme & Vibe description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Theme, Aesthetic & Vibe Instructions
              </label>
              <textarea
                rows={2}
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="e.g. Tropical Mexican fiesta with taco bar, festive lanterns, signature mezcal cocktail, upbeat playlist..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Guest Count & Budget Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-amber-400" /> Total Guests
                  </label>
                  <span className="text-xs font-bold text-amber-400">{formData.guestCount}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="60"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Intimate (4)</span>
                  <span>Medium (20)</span>
                  <span>Huge (50+)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Children / Kids</label>
                  <span className="text-xs font-bold text-slate-200">{formData.childCount}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.min(30, formData.guestCount)}
                  value={formData.childCount}
                  onChange={(e) => setFormData({ ...formData, childCount: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formData.guestCount - formData.childCount} Adults, {formData.childCount} Kids
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Target Budget ($)
                  </label>
                  <span className="text-xs font-bold text-emerald-400">${formData.budgetTotal}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={formData.budgetTotal}
                  onChange={(e) => setFormData({ ...formData, budgetTotal: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  ~${Math.round(formData.budgetTotal / Math.max(1, formData.guestCount))} / guest
                </p>
              </div>
            </div>

            {/* Venue & Alcohol Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Venue / Setting
                </label>
                <select
                  value={formData.venueType}
                  onChange={(e) => setFormData({ ...formData, venueType: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="indoor_home">🏠 Living Room / Indoor Home</option>
                  <option value="backyard">🌳 Backyard & Patio</option>
                  <option value="park_outdoor">🌲 Public Park / Outdoor Lawn</option>
                  <option value="event_hall">🏛️ Rented Event Hall / Club</option>
                  <option value="beach">🏖️ Beach / Lakefront</option>
                  <option value="rooftop">🏙️ Rooftop Lounge</option>
                  <option value="office">🏢 Office / Workspace</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Wine className="w-3.5 h-3.5 text-indigo-400" /> Bar & Beverage Setup
                </label>
                <select
                  value={formData.alcoholMode}
                  onChange={(e) => setFormData({ ...formData, alcoholMode: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="full_bar_cocktails">🍸 Signature Cocktails + Full Bar + Mocktails</option>
                  <option value="beer_wine_only">🍷 Craft Beer, Seltzers & Curated Wine Only</option>
                  <option value="mocktails_nonalcoholic">🧃 100% Non-Alcoholic & Artisanal Mocktails</option>
                  <option value="byob_mixers_provided">🧊 BYOB (Host provides Mixers, Ice & Garnishes)</option>
                </select>
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-amber-400" /> Dietary Preferences & Accommodations
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map((item) => {
                  const isChecked = formData.dietaryPreferences.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleDietary(item)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        isChecked
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-semibold"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {isChecked && "✓ "}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities & Custom Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-rose-400" /> Desired Party Elements & Activities
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ACTIVITY_OPTIONS.map((act) => {
                  const isChecked = formData.activityPreferences.includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => handleToggleActivity(act)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                        isChecked
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50 font-medium"
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-300"
                      }`}
                    >
                      {act}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="party-wizard-form"
            disabled={isLoading}
            id="btn-generate-ai-plan"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:via-rose-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {generationStep === 1
                    ? "Calculating Portion Math..."
                    : generationStep === 2
                    ? "Categorizing Grocery Stores..."
                    : "Finalizing Party Dossier..."}
                </span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Smart Shopping Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
