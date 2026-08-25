export interface DietaryPreference {
  id: string;
  label: string;
  count: number;
}

export interface GuestConfig {
  adultCount: number;
  childCount: number;
  dietaryRestrictions: string[];
  customDietaryNote: string;
}

export interface PartyFormInput {
  title: string;
  theme: string;
  occasion: string;
  date: string;
  time: string;
  durationHours: number;
  venueType: 'indoor_home' | 'backyard' | 'park_outdoor' | 'event_hall' | 'beach' | 'rooftop' | 'office';
  guestCount: number;
  childCount: number;
  budgetTotal: number;
  budgetTier: 'budget_friendly' | 'moderate_balanced' | 'luxury_lavish';
  alcoholMode: 'full_bar_cocktails' | 'beer_wine_only' | 'mocktails_nonalcoholic' | 'byob_mixers_provided';
  dietaryPreferences: string[];
  customDietaryNote: string;
  activityPreferences: string[];
  customNotes: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit?: string;
  estimatedCost: number;
  actualCost?: number;
  storeType: 'Costco/Wholesale' | 'Supermarket / Grocery' | 'Liquor / Beverage Store' | 'Party City / Dollar Store' | 'Target / Amazon / Online' | 'Specialty / Bakery';
  dietaryTag?: string;
  notes?: string;
  priority: 'Must Have' | 'Recommended' | 'Optional';
  isChecked: boolean;
  isCustom?: boolean;
  status: 'to_buy' | 'already_have' | 'diy_substitute';
}

export interface MenuItem {
  id: string;
  name: string;
  type: 'Cocktail' | 'Mocktail' | 'Appetizer' | 'Main Dish' | 'Side Dish' | 'Dessert' | 'Snack';
  dietaryInfo: string[];
  prepTimeMinutes: number;
  servings: number;
  description: string;
  recipeHighlights: string[];
  keyIngredients: string[];
}

export interface PrepTask {
  id: string;
  phase: '1 Week Before' | '2-3 Days Before' | 'Day Before' | 'Party Morning' | '2 Hours Before' | 'During Event';
  task: string;
  details?: string;
  isDone: boolean;
  assignedTo?: string;
}

export interface DrinkPortionGuide {
  totalEstimatedDrinks: number;
  cocktailsCount: number;
  beerWineBottles: number;
  nonAlcoholicServings: number;
  iceBagsRequiredLbs: number;
  mainProteinLbs: number;
  appetizerPiecesTotal: number;
  snackBowlsCount: number;
}

export interface BudgetSummary {
  totalEstimatedCost: number;
  targetBudget: number;
  costPerGuest: number;
  status: 'Under Budget' | 'On Target' | 'Over Budget';
  variance: number;
  moneySavingTips: string[];
  storeBreakdown: {
    store: string;
    estimatedCost: number;
    itemCount: number;
  }[];
}

export interface PartyPlan {
  id: string;
  createdAt: string;
  title: string;
  theme: string;
  occasion: string;
  tagline: string;
  vibeDescription: string;
  colorPalette: { name: string; hex: string }[];
  guestConfig: GuestConfig;
  budgetTotal: number;
  venueType: string;
  portionGuide: DrinkPortionGuide;
  shoppingItems: ShoppingItem[];
  menu: MenuItem[];
  prepTimeline: PrepTask[];
  budgetSummary: BudgetSummary;
  playlistVibe: {
    genre: string;
    sampleTracks: string[];
    lightingTip: string;
    icebreakerIdea: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  actionSuggested?: {
    type: 'ADD_ITEM' | 'UPDATE_BUDGET' | 'SWAP_MENU' | 'APPLY_DISCOUNT';
    payload: any;
    label: string;
  };
}
