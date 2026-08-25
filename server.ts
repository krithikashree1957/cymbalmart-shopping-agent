import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google Gen AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    timestamp: new Date().toISOString()
  });
});

// Party Planning AI Endpoint
app.post("/api/ai/plan-party", async (req, res) => {
  try {
    const input = req.body;
    const ai = getGeminiClient();

    const guestCount = Number(input.guestCount) || 12;
    const childCount = Number(input.childCount) || 0;
    const budget = Number(input.budgetTotal) || 300;
    const theme = input.theme || "Celebration";
    const occasion = input.occasion || "Party";
    const venue = input.venueType || "indoor_home";
    const alcoholMode = input.alcoholMode || "full_bar_cocktails";
    const dietaryList = Array.isArray(input.dietaryPreferences) ? input.dietaryPreferences.join(", ") : "None specified";
    const customDietary = input.customDietaryNote || "";
    const activities = Array.isArray(input.activityPreferences) ? input.activityPreferences.join(", ") : "Casual socializing";
    const customNotes = input.customNotes || "";

    const prompt = `
You are the world's top professional Party Planner & Grocery Shopping Concierge.
Create a comprehensive, mathematically accurate, store-categorized Party & Shopping Plan for:
- Event: "${input.title || `${theme} ${occasion}`}"
- Occasion: ${occasion}
- Theme & Vibe: ${theme}
- Venue: ${venue}
- Total Guests: ${guestCount} (Adults: ${guestCount - childCount}, Children: ${childCount})
- Target Budget: $${budget} (Tier: ${input.budgetTier || "moderate_balanced"})
- Alcohol/Beverage Mode: ${alcoholMode}
- Dietary Needs: ${dietaryList} ${customDietary ? `(Special: ${customDietary})` : ""}
- Key Activities: ${activities}
- Extra Notes: ${customNotes}

Generate a complete JSON response with EXACTLY the following structure:
{
  "tagline": "A snappy catchy 1-line event subtitle",
  "vibeDescription": "3-4 sentences describing the mood, lighting, aesthetic, and sensory experience",
  "colorPalette": [
    { "name": "Color Name", "hex": "#HEXCODE" },
    { "name": "Color Name", "hex": "#HEXCODE" },
    { "name": "Color Name", "hex": "#HEXCODE" },
    { "name": "Color Name", "hex": "#HEXCODE" }
  ],
  "portionGuide": {
    "totalEstimatedDrinks": number,
    "cocktailsCount": number,
    "beerWineBottles": number,
    "nonAlcoholicServings": number,
    "iceBagsRequiredLbs": number,
    "mainProteinLbs": number,
    "appetizerPiecesTotal": number,
    "snackBowlsCount": number
  },
  "shoppingItems": [
    {
      "id": "unique-slug-1",
      "name": "Item name with specifics (e.g., Fresh Limes, Organic Ground Beef 80/20, Heavy Duty 9-inch Compostable Plates)",
      "category": "One of: Beverages & Bar, Fresh Produce & Herbs, Proteins & Mains, Bakery & Sweets, Snacks & Pantry, Decorations & Lighting, Tableware & Disposables, Games & Activities, Ice & Essentials",
      "quantity": "Calculated quantity with units (e.g. '12 limes', '4 lbs', '3 packs of 24', '20 lbs')",
      "unit": "lbs/bottles/packs/units",
      "estimatedCost": number (realistic US dollar amount),
      "storeType": "One of: Costco/Wholesale, Supermarket / Grocery, Liquor / Beverage Store, Party City / Dollar Store, Target / Amazon / Online, Specialty / Bakery",
      "dietaryTag": "Optional dietary notes like Vegan, Gluten-Free, Nut-Free, Alcohol-Free, or null",
      "notes": "Smart shopping tip (e.g., 'Buy in bulk for 30% savings', 'Get chilled morning of party')",
      "priority": "Must Have OR Recommended OR Optional",
      "status": "to_buy"
    }
  ],
  "menu": [
    {
      "id": "menu-1",
      "name": "Name of signature dish/drink",
      "type": "One of: Cocktail, Mocktail, Appetizer, Main Dish, Side Dish, Dessert, Snack",
      "dietaryInfo": ["GF", "Vegan", etc],
      "prepTimeMinutes": number,
      "servings": number,
      "description": "Appetizing 1-2 sentence description",
      "recipeHighlights": ["Step 1 / Key technique", "Step 2", "Step 3"],
      "keyIngredients": ["Ingredient 1", "Ingredient 2", "Ingredient 3"]
    }
  ],
  "prepTimeline": [
    {
      "id": "prep-1",
      "phase": "One of: 1 Week Before, 2-3 Days Before, Day Before, Party Morning, 2 Hours Before, During Event",
      "task": "Specific actionable preparation step",
      "details": "Helpful timing or temperature advice",
      "isDone": false
    }
  ],
  "budgetSummary": {
    "totalEstimatedCost": number (sum of all shoppingItems estimatedCost),
    "costPerGuest": number,
    "status": "Under Budget OR On Target OR Over Budget",
    "variance": number (difference from target budget),
    "moneySavingTips": [
      "Concrete cost-saving tip 1",
      "Concrete cost-saving tip 2",
      "Concrete cost-saving tip 3"
    ]
  },
  "playlistVibe": {
    "genre": "Musical genre & tempo style",
    "sampleTracks": ["Track 1 - Artist", "Track 2 - Artist", "Track 3 - Artist", "Track 4 - Artist"],
    "lightingTip": "Practical atmospheric lighting advice",
    "icebreakerIdea": "An engaging, low-pressure game or arrival ritual"
  }
}

Ensure the shopping items cover all essential categories (drinks, food ingredients, tableware, ice, decorations, trash bags, napkins) tailored to the guest count of ${guestCount}.
Ensure accurate cost estimates so total items reflect the target budget. Output valid JSON only.
`;

    if (!ai) {
      // Return a rich pre-computed template if API key is not provided
      const fallbackPlan = generateFallbackPartyPlan(input);
      return res.json(fallbackPlan);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);

    // Compute store breakdown
    const storeMap: Record<string, { cost: number; count: number }> = {};
    (parsedData.shoppingItems || []).forEach((item: any) => {
      const store = item.storeType || "Supermarket / Grocery";
      if (!storeMap[store]) storeMap[store] = { cost: 0, count: 0 };
      storeMap[store].cost += Number(item.estimatedCost) || 0;
      storeMap[store].count += 1;
    });

    const storeBreakdown = Object.entries(storeMap).map(([store, val]) => ({
      store,
      estimatedCost: Math.round(val.cost * 100) / 100,
      itemCount: val.count,
    }));

    if (parsedData.budgetSummary) {
      parsedData.budgetSummary.targetBudget = budget;
      parsedData.budgetSummary.storeBreakdown = storeBreakdown;
    }

    const fullPlan = {
      id: `party-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: input.title || `${theme} ${occasion}`,
      theme,
      occasion,
      venueType: venue,
      budgetTotal: budget,
      guestConfig: {
        adultCount: guestCount - childCount,
        childCount,
        dietaryRestrictions: Array.isArray(input.dietaryPreferences) ? input.dietaryPreferences : [],
        customDietaryNote: customDietary,
      },
      ...parsedData,
    };

    res.json(fullPlan);
  } catch (error: any) {
    console.error("Error generating party plan:", error);
    // Fallback gracefully on any failure
    const fallback = generateFallbackPartyPlan(req.body);
    res.json(fallback);
  }
});

// AI Chat Agent for Plan Adjustments & Dynamic Shopping Queries
app.post("/api/ai/chat-agent", async (req, res) => {
  try {
    const { message, currentPlan, chatHistory } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `I received your request: "${message}". To unlock live real-time Gemini AI adjustments, make sure your GEMINI_API_KEY is configured in Settings! Here's a tip: You can manually check off items, toggle 'Already Have', or click any shopping item to customize quantity and price.`,
        suggestedModifications: null,
      });
    }

    const prompt = `
You are the AI Party Planner & Shopping Assistant for an active party plan.
Current Party Plan Context:
- Title: ${currentPlan?.title || "Party"}
- Theme: ${currentPlan?.theme || "Party"}
- Guests: ${currentPlan?.guestConfig?.adultCount || 10} adults, ${currentPlan?.guestConfig?.childCount || 0} kids
- Current Target Budget: $${currentPlan?.budgetTotal || 250}
- Current Total Estimated Cost: $${currentPlan?.budgetSummary?.totalEstimatedCost || 200}
- Shopping List Summary: ${(currentPlan?.shoppingItems || []).slice(0, 15).map((i: any) => `${i.name} ($${i.estimatedCost})`).join(", ")}

User message: "${message}"

Respond naturally, concisely, and helpfully as an expert event planner and smart grocery shopper.
If the user is asking to add an item, swap a dish, reduce budget, or adjust for dietary needs:
Include a structured JSON object in your response under the key "actionSuggested" if applicable.

Return JSON formatted as:
{
  "reply": "Conversational, enthusiastic, and direct response with specific tips or answers.",
  "actionSuggested": null or {
    "type": "ADD_ITEM" | "UPDATE_BUDGET" | "REMOVE_ITEMS" | "SWAP_ITEMS",
    "label": "Short button label (e.g. 'Add 3 Items to Cart', 'Trim $45 from Bar')",
    "itemsToAdd": [
      {
        "name": "Item name",
        "category": "Category",
        "quantity": "Quantity",
        "estimatedCost": 12,
        "storeType": "Supermarket / Grocery",
        "priority": "Recommended",
        "dietaryTag": "Optional"
      }
    ]
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in party chat agent:", error);
    res.json({
      reply: "I understood your request! You can easily adjust your shopping list by adding custom items with the '+ Add Item' button, or recalculating portions using the Portions Calculator tab.",
      suggestedModifications: null,
    });
  }
});

// Deep Dive DIY or Recipe Step Generator
app.post("/api/ai/diy-hack", async (req, res) => {
  try {
    const { topic, planContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        title: `Pro Guide for ${topic}`,
        content: `Here is a master tip for ${topic}: Prep in batches 24 hours in advance. Keep cold items chilled until 15 minutes before guest arrival, and set out self-serve garnishes so guests can customize their own experience!`,
      });
    }

    const prompt = `
Provide an expert, highly practical, step-by-step master guide for "${topic}" in the context of a ${planContext?.theme || "celebration"} party for ${planContext?.guestConfig?.adultCount || 12} guests.
Include:
1. Quick Prep Time & Batching math
2. Step-by-step foolproof execution
3. Pro presentation / plating / styling trick
4. Budget hack to save 30% on supplies

Return JSON:
{
  "title": "Snappy title",
  "batchYield": "Serving amount",
  "prepTime": "Minutes",
  "steps": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
  "presentationTip": "Visual flair advice",
  "budgetHack": "How to save money"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to generate DIY guide" });
  }
});

// Helper for generating high quality fallback plans when API key is not provided
function generateFallbackPartyPlan(input: any) {
  const guestCount = Number(input.guestCount) || 12;
  const childCount = Number(input.childCount) || 0;
  const budget = Number(input.budgetTotal) || 280;
  const theme = input.theme || "Summer Fiesta";
  const occasion = input.occasion || "Birthday Celebration";

  const shoppingItems = [
    {
      id: "item-1",
      name: "Fresh Limes (Bag of 15)",
      category: "Fresh Produce & Herbs",
      quantity: "2 bags (30 limes)",
      unit: "bags",
      estimatedCost: 8.50,
      storeType: "Costco/Wholesale",
      dietaryTag: "Vegan",
      notes: "Crucial for fresh cocktail mixers and taco bar garnishes",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-2",
      name: "Fresh Cilantro & Mint Bunches",
      category: "Fresh Produce & Herbs",
      quantity: "4 bunches",
      unit: "bunches",
      estimatedCost: 4.00,
      storeType: "Supermarket / Grocery",
      dietaryTag: "Vegan",
      notes: "Store stems in cold water glass until ready to chop",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-3",
      name: "Avocados for Fresh Guacamole",
      category: "Fresh Produce & Herbs",
      quantity: "8 large ripe avocados",
      unit: "pieces",
      estimatedCost: 10.00,
      storeType: "Costco/Wholesale",
      dietaryTag: "Vegan",
      notes: "Buy 2 days early so they reach optimal softness",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-4",
      name: "Pre-marinated Carne Asada & Pollo Asado",
      category: "Proteins & Mains",
      quantity: `${Math.round(guestCount * 0.45 * 10) / 10} lbs`,
      unit: "lbs",
      estimatedCost: 38.00,
      storeType: "Costco/Wholesale",
      dietaryTag: "Gluten-Free",
      notes: "Grill 30 mins before party; slice against grain",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-5",
      name: "Artisan Tortilla Chips & Street Corn Dip",
      category: "Snacks & Pantry",
      quantity: "3 large bags",
      unit: "bags",
      estimatedCost: 12.50,
      storeType: "Costco/Wholesale",
      dietaryTag: "Gluten-Free",
      notes: "Great crowd-pleaser for early arrivals",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-6",
      name: "Tequila Blanco (750ml) / Agave Nectar",
      category: "Beverages & Bar",
      quantity: "2 bottles + 1 agave bottle",
      unit: "bottles",
      estimatedCost: 44.00,
      storeType: "Liquor / Beverage Store",
      dietaryTag: "Alcohol",
      notes: "Use 100% Blue Agave for smooth crowd-pleasing margaritas",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-7",
      name: "Artisanal Sparkling Water & Mexican Sodas (Jarritos)",
      category: "Beverages & Bar",
      quantity: "18 bottles assorted",
      unit: "bottles",
      estimatedCost: 18.00,
      storeType: "Supermarket / Grocery",
      dietaryTag: "Vegan",
      notes: "Perfect non-alcoholic and mocktail base for all ages",
      priority: "Recommended",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-8",
      name: "Party Ice Bags (10 lb bags)",
      category: "Ice & Essentials",
      quantity: `${Math.max(2, Math.ceil(guestCount * 1.5 / 10))} bags (${Math.max(20, Math.ceil(guestCount * 1.5))} lbs)`,
      unit: "bags",
      estimatedCost: 9.00,
      storeType: "Supermarket / Grocery",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-9",
      name: "Heavy-Duty Compostable Plates, Bowls & Cutlery Set",
      category: "Tableware & Disposables",
      quantity: "50-pack set",
      unit: "pack",
      estimatedCost: 14.00,
      storeType: "Target / Amazon / Online",
      notes: "Sturdy sugarcane fiber plates that won't bend with juicy food",
      priority: "Must Have",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-10",
      name: "Festive Papel Picado Banner & Warm String Fairy Lights",
      category: "Decorations & Lighting",
      quantity: "2 banner sets + 1 light strand",
      unit: "sets",
      estimatedCost: 16.00,
      storeType: "Party City / Dollar Store",
      notes: "Instant high-impact atmosphere transforms any space",
      priority: "Recommended",
      isChecked: false,
      status: "to_buy",
    },
    {
      id: "item-11",
      name: "Cinnamon Sugar Churro Bites & Chocolate Drizzle",
      category: "Bakery & Sweets",
      quantity: "24 mini bites",
      unit: "pieces",
      estimatedCost: 15.00,
      storeType: "Specialty / Bakery",
      dietaryTag: "Vegetarian",
      notes: "Serve warm from the oven on a wooden platter",
      priority: "Recommended",
      isChecked: false,
      status: "to_buy",
    }
  ];

  const totalCost = shoppingItems.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  return {
    id: `party-${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: input.title || `${theme} ${occasion}`,
    theme,
    occasion,
    venueType: input.venueType || "indoor_home",
    budgetTotal: budget,
    tagline: `Vibrant Flavors & Carefree Vibes for ${guestCount} Guests`,
    vibeDescription: `An energetic, warm, and inviting atmosphere filled with rhythmic upbeat acoustic tunes, ambient string lighting, fresh lime aromas, and interactive self-serve stations that keep guests mingling effortlessly.`,
    colorPalette: [
      { name: "Sunburst Ochre", hex: "#E76F51" },
      { name: "Agave Turquoise", hex: "#2A9D8F" },
      { name: "Warm Terracotta", hex: "#F4A261" },
      { name: "Midnight Charcoal", hex: "#264653" }
    ],
    guestConfig: {
      adultCount: guestCount - childCount,
      childCount,
      dietaryRestrictions: input.dietaryPreferences || ["Gluten-Free options", "Vegetarian friendly"],
      customDietaryNote: input.customDietaryNote || "",
    },
    portionGuide: {
      totalEstimatedDrinks: guestCount * 3,
      cocktailsCount: Math.round(guestCount * 1.8),
      beerWineBottles: Math.round(guestCount * 1.2),
      nonAlcoholicServings: guestCount * 2,
      iceBagsRequiredLbs: Math.max(20, guestCount * 1.5),
      mainProteinLbs: Math.round(guestCount * 0.45 * 10) / 10,
      appetizerPiecesTotal: guestCount * 5,
      snackBowlsCount: 4,
    },
    shoppingItems,
    menu: [
      {
        id: "menu-1",
        name: "Smoky Hibiscus Margarita & Sparking Citrus Mocktail",
        type: "Cocktail",
        dietaryInfo: ["Vegan", "Gluten-Free"],
        prepTimeMinutes: 15,
        servings: guestCount,
        description: "Batch-crafted 100% blue agave tequila infused with tart hibiscus syrup, fresh lime juice, and smoked sea salt rim.",
        recipeHighlights: ["Mix 4 parts tequila, 2 parts lime, 2 parts hibiscus in a dispenser", "Keep chilled on ice", "Provide chili-lime salt rimming station"],
        keyIngredients: ["Tequila Blanco", "Fresh Limes", "Hibiscus Tea Syrup", "Agave Nectar", "Smoked Sea Salt"]
      },
      {
        id: "menu-2",
        name: "Interactive Street Taco Platter & Charred Corn Salsa",
        type: "Main Dish",
        dietaryInfo: ["Gluten-Free", "Nut-Free"],
        prepTimeMinutes: 35,
        servings: guestCount,
        description: "Tender grilled citrus-marinated carne asada and pollo asado with warm corn tortillas and fresh toppings.",
        recipeHighlights: ["Grill meats on high heat for char", "Rest 5 mins before dicing", "Warm tortillas in dry skillet and wrap in cloth"],
        keyIngredients: ["Carne Asada", "Pollo Asado", "Corn Tortillas", "Cilantro", "White Onions", "Cotija Cheese"]
      },
      {
        id: "menu-3",
        name: "Golden Churro Bites with Mexican Spiced Chocolate Dip",
        type: "Dessert",
        dietaryInfo: ["Vegetarian"],
        prepTimeMinutes: 20,
        servings: guestCount,
        description: "Crispy cinnamon-sugar pastry bites served with warm cinnamon dark chocolate sauce.",
        recipeHighlights: ["Bake till crispy gold", "Toss immediately in cinnamon sugar", "Serve with warm dipping cups"],
        keyIngredients: ["Churro dough", "Cinnamon", "Turbinado Sugar", "Dark Chocolate", "Mexican Vanilla"]
      }
    ],
    prepTimeline: [
      {
        id: "prep-1",
        phase: "1 Week Before",
        task: "Send RSVPs, confirm headcount, and order party banners & tableware",
        details: "Check delivery dates to avoid last-minute store rushes",
        isDone: true
      },
      {
        id: "prep-2",
        phase: "2-3 Days Before",
        task: "Complete Costco & liquor store wholesale run",
        details: "Buy non-perishables, ice coupons, and spirits",
        isDone: false
      },
      {
        id: "prep-3",
        phase: "Day Before",
        task: "Batch signature cocktail syrup, squeeze fresh citrus, and marinate meats",
        details: "Store pre-chopped garnishes in airtight glass containers",
        isDone: false
      },
      {
        id: "prep-4",
        phase: "Party Morning",
        task: "Pick up ice bags, arrange string lights, and set up drink station",
        details: "Chill glassware and place ice tubs in shaded cool spots",
        isDone: false
      },
      {
        id: "prep-5",
        phase: "2 Hours Before",
        task: "Fire up grill / warm food, queue Spotify playlist, and light candles",
        details: "Pour welcome drinks 10 mins before first arrival",
        isDone: false
      }
    ],
    budgetSummary: {
      totalEstimatedCost: Math.round(totalCost * 100) / 100,
      targetBudget: budget,
      costPerGuest: Math.round((totalCost / guestCount) * 100) / 100,
      status: totalCost <= budget ? "Under Budget" : "Over Budget",
      variance: Math.round((budget - totalCost) * 100) / 100,
      moneySavingTips: [
        "Buy limes and meat proteins at a wholesale club like Costco for 40% per-pound savings.",
        "Batch cocktails in a self-serve 2-gallon dispenser instead of single-serving to reduce liquor waste by 25%.",
        "Use multi-purpose festive fairy lights that you can reuse for future gatherings."
      ],
      storeBreakdown: [
        { store: "Costco/Wholesale", estimatedCost: 60.50, itemCount: 4 },
        { store: "Supermarket / Grocery", estimatedCost: 31.00, itemCount: 3 },
        { store: "Liquor / Beverage Store", estimatedCost: 44.00, itemCount: 1 },
        { store: "Target / Amazon / Online", estimatedCost: 14.00, itemCount: 1 },
        { store: "Party City / Dollar Store", estimatedCost: 16.00, itemCount: 1 },
        { store: "Specialty / Bakery", estimatedCost: 15.00, itemCount: 1 }
      ]
    },
    playlistVibe: {
      genre: "Tropical Nu-Disco & Upbeat Latin Cumbia Fusion",
      sampleTracks: [
        "Bomba Estéreo - Soy Yo",
        "Polo & Pan - Canopée",
        "Jungle - Keep Moving",
        "Calexico - Cumbia de Donde"
      ],
      lightingTip: "Dimmable warm amber 2700K fairy string lights with low-hanging paper lanterns create an intimate resort atmosphere.",
      icebreakerIdea: "Self-serve Margarita Customizer bar where guests pick their salt rim (smoked salt, tajin, hibiscus sugar) and garnish pick."
    }
  };
}

// Start Server and Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Party Planner Shopping Agent running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
