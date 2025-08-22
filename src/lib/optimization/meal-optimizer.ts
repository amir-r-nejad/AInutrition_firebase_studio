// Meal optimization using linear programming
export interface Ingredient {
  name: string;
  cal: number; // Calories per gram
  prot: number; // Protein per gram
  carb: number; // Carbs per gram
  fat: number; // Fat per gram
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OptimizationResult {
  feasible: boolean;
  result: number;
  ingredients: { [key: string]: number };
  achieved: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  error?: string; // Added for error handling
}

export interface MealSuggestionIngredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
}

export interface OptimizedMealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: MealSuggestionIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

// Fallback nutrition database (per 100g) - Updated with accurate USDA values
const NUTRITION_FALLBACKS: Record<
  string,
  { cal: number; prot: number; carb: number; fat: number }
> = {
  "greek yogurt": { cal: 59, prot: 10, carb: 3.6, fat: 0.4 }, // Non-fat
  "greek yogurt non-fat": { cal: 59, prot: 10, carb: 3.6, fat: 0.4 },
  quinoa: { cal: 368, prot: 14.1, carb: 64.2, fat: 6.1 }, // Raw quinoa
  chickpeas: { cal: 364, prot: 19.3, carb: 61, fat: 6.0 }, // Dried chickpeas
  "chickpeas dried": { cal: 364, prot: 19.3, carb: 61, fat: 6.0 },
  lentils: { cal: 352, prot: 24.6, carb: 63.4, fat: 1.1 }, // Dried lentils
  avocado: { cal: 160, prot: 2, carb: 8.5, fat: 14.7 },
  spinach: { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
  kale: { cal: 35, prot: 2.9, carb: 4.4, fat: 1.5 },
  "cherry tomatoes": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  tomatoes: { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "tomato raw": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "tomato paste": { cal: 82, prot: 4.3, carb: 18.9, fat: 0.5 },
  carrots: { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },
  "carrot raw": { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },
  // New vegetables with accurate USDA values
  "broccoli raw": { cal: 34, prot: 2.8, carb: 7.0, fat: 0.4 },
  "cucumber raw": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  "lettuce raw": { cal: 15, prot: 1.4, carb: 2.9, fat: 0.2 },
  "cabbage raw": { cal: 25, prot: 1.3, carb: 5.8, fat: 0.1 },
  "cauliflower raw": { cal: 25, prot: 1.9, carb: 5.0, fat: 0.3 },
  blueberries: { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },
  "sweet potatoes": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "sweet potato": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "sweet potato raw": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "potato raw": { cal: 77, prot: 2.0, carb: 17.5, fat: 0.1 },
  "olive oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
  eggs: { cal: 155, prot: 13, carb: 1.1, fat: 11 },
  "egg white": { cal: 52, prot: 10.9, carb: 1.1, fat: 0.2 },
  "chicken breast": { cal: 165, prot: 31, carb: 0, fat: 3.6 },
  // Updated rice to raw values
  "brown rice": { cal: 370, prot: 7.9, carb: 77, fat: 2.9 }, // Raw brown rice
  "brown rice raw": { cal: 370, prot: 7.9, carb: 77, fat: 2.9 },
  "white rice": { cal: 365, prot: 7.1, carb: 80, fat: 0.7 }, // Raw white rice
  "white rice raw": { cal: 365, prot: 7.1, carb: 80, fat: 0.7 },
  rice: { cal: 365, prot: 7.1, carb: 80, fat: 0.7 }, // Default to white rice raw
  // Pasta raw
  pasta: { cal: 371, prot: 13, carb: 75, fat: 1.5 }, // Raw pasta
  "pasta raw": { cal: 371, prot: 13, carb: 75, fat: 1.5 },
  // Bread types
  "white bread": { cal: 265, prot: 9, carb: 49, fat: 3.2 },
  "brown bread": { cal: 247, prot: 13, carb: 41, fat: 4.2 },
  "whole wheat bread": { cal: 247, prot: 13, carb: 41, fat: 4.2 },
  "whole grain bread": { cal: 247, prot: 13, carb: 41, fat: 4.2 },
  bread: { cal: 265, prot: 9, carb: 49, fat: 3.2 }, // Default to white bread
  // Updated ground beef to extra lean
  "ground beef": { cal: 137, prot: 30, carb: 0, fat: 2.6 }, // Extra lean 95/5
  "extra lean ground beef": { cal: 137, prot: 30, carb: 0, fat: 2.6 },
  "ground beef extra lean": { cal: 137, prot: 30, carb: 0, fat: 2.6 },
  oats: { cal: 389, prot: 16.9, carb: 66.3, fat: 6.9 },
  almonds: { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  broccoli: { cal: 34, prot: 2.8, carb: 7, fat: 0.4 },
  salmon: { cal: 208, prot: 20, carb: 0, fat: 13 },
  cashews: { cal: 553, prot: 18.2, carb: 30.2, fat: 43.8 },
  "red bell pepper": { cal: 31, prot: 1, carb: 7, fat: 0.3 },
  "soy sauce": { cal: 53, prot: 8, carb: 4.9, fat: 0.1 },
  "sesame oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
};

function getFallbackNutrition(ingredientName: string) {
  const name = ingredientName.toLowerCase().trim();

  // Try exact match first
  if (NUTRITION_FALLBACKS[name]) {
    return NUTRITION_FALLBACKS[name];
  }

  // Try partial matches
  for (const [key, value] of Object.entries(NUTRITION_FALLBACKS)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  // Default fallback for unknown ingredients
  return { cal: 100, prot: 5, carb: 15, fat: 3 };
}

// Classify ingredient to derive reasonable gram bounds
function classifyIngredient(
  name: string,
):
  | "oil"
  | "nuts_seeds"
  | "seed_chia"
  | "protein_dense"
  | "dairy_yogurt"
  | "grain_starch"
  | "leafy_veg"
  | "berries"
  | "sauce_condiment"
  | "fruit"
  | "vegetable"
  | "other" {
  const n = name.toLowerCase();
  if (/(olive oil|sesame oil|oil|butter|ghee)/.test(n)) return "oil";
  if (/(chia)/.test(n)) return "seed_chia";
  if (/(almond|walnut|cashew|peanut|pistachio|hazelnut|seed)/.test(n))
    return "nuts_seeds";
  if (
    /(chicken|beef|turkey|tofu|tempeh|yogurt|egg|cottage|salmon|tuna)/.test(n)
  ) {
    if (/(yogurt|cottage)/.test(n)) return "dairy_yogurt";
    return "protein_dense";
  }
  if (/(rice|quinoa|oat|pasta|bread|potato|sweet potato|barley|bulgur)/.test(n))
    return "grain_starch";
  if (/(spinach|kale|lettuce|arugula|chard)/.test(n)) return "leafy_veg";
  if (/(blueberry|strawberry|berry|raspberry|blackberry)/.test(n))
    return "berries";
  if (/(soy sauce|tomato paste|ketchup|mustard|mayo|sauce|tahini)/.test(n))
    return "sauce_condiment";
  if (/(apple|banana|orange|grape|avocado|tomato)/.test(n)) return "fruit";
  if (/(broccoli|pepper|carrot|cauliflower|zucchini|onion|pepper)/.test(n))
    return "vegetable";
  return "other";
}

function getIngredientBounds(name: string): { min: number; max: number } {
  switch (classifyIngredient(name)) {
    case "oil":
      return { min: 5, max: 15 };
    case "seed_chia":
      return { min: 5, max: 25 };
    case "nuts_seeds":
      return { min: 5, max: 30 };
    case "dairy_yogurt":
      return { min: 80, max: 300 };
    case "protein_dense":
      return { min: 60, max: 300 };
    case "grain_starch":
      return { min: 60, max: 250 };
    case "leafy_veg":
      return { min: 30, max: 250 };
    case "berries":
      return { min: 50, max: 150 };
    case "sauce_condiment":
      return { min: 5, max: 30 };
    case "fruit":
      return { min: 50, max: 200 };
    case "vegetable":
      return { min: 30, max: 200 };
    default:
      return { min: 10, max: 200 };
  }
}

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => {
    // Get nutrition values with fallback checking
    let calories =
      Number(
        ing.calories ??
          (ing as any).kcal ??
          (ing as any).cal ??
          (ing as any).energy_kcal ??
          0,
      ) || 0;
    let protein =
      Number(
        ing.protein ??
          (ing as any).prot ??
          (ing as any).proteins ??
          (ing as any).protein_g ??
          0,
      ) || 0;
    let carbs =
      Number(
        ing.carbs ??
          (ing as any).carb ??
          (ing as any).carbohydrates ??
          (ing as any).carbohydrates_g ??
          0,
      ) || 0;
    let fat =
      Number(ing.fat ?? (ing as any).fats ?? (ing as any).fat_g ?? 0) || 0;

    // If all values are zero, use fallback nutrition data
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      console.log(`Using fallback nutrition for: ${ing.name}`);
      const fallback = getFallbackNutrition(ing.name || "unknown");
      calories = fallback.cal;
      protein = fallback.prot;
      carbs = fallback.carb;
      fat = fallback.fat;
    }

    const amount =
      typeof ing.amount === "number" && isFinite(ing.amount) && ing.amount > 0
        ? ing.amount
        : typeof ing.quantity === "number" &&
            isFinite(ing.quantity) &&
            ing.quantity > 0
          ? ing.quantity
          : 100; // sensible fallback to avoid divide-by-zero

    console.log(`🔍 Converting ingredient: ${ing.name}`, {
      amount,
      calories,
      protein,
      carbs,
      fat,
      raw: ing
    });

    // Always assume values are totals for the given amount - convert to per-gram
    return {
      name: ing.name,
      cal: calories / amount,
      prot: protein / amount,
      carb: carbs / amount,
      fat: fat / amount,
    };
  });
}

// Create targets from macro splitter data
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

function getAmountBounds(ingredientName: string): { min: number; max: number } {
  const name = (ingredientName || "").toLowerCase();
  // Oils
  if (name.includes("oil")) return { min: 5, max: 20 };
  // Seeds (chia, flax, sesame)
  if (name.includes("seed") || name.includes("chia") || name.includes("flax"))
    return { min: 5, max: 25 };
  // Nuts
  if (
    name.includes("almond") ||
    name.includes("cashew") ||
    name.includes("walnut") ||
    name.includes("peanut")
  )
    return { min: 10, max: 30 };
  // Honey
  if (name.includes("honey")) return { min: 10, max: 30 };
  // Condiments / sauces (soy sauce, tomato paste)
  if (
    name.includes("sauce") ||
    name.includes("paste") ||
    name.includes("ketchup") ||
    name.includes("mustard")
  )
    return { min: 5, max: 20 };
  // Leafy greens / vegetables (spinach, kale, broccoli, pepper)
  if (
    name.includes("spinach") ||
    name.includes("kale") ||
    name.includes("broccoli") ||
    name.includes("pepper")
  )
    return { min: 30, max: 200 };
  // Berries/fruits
  if (
    name.includes("berry") ||
    name.includes("blueberry") ||
    name.includes("strawberry") ||
    name.includes("banana") ||
    name.includes("apple")
  )
    return { min: 100, max: 300 };
  // Starches (rice, quinoa, oats, potato)
  if (
    name.includes("rice") ||
    name.includes("quinoa") ||
    name.includes("oat") ||
    name.includes("potato")
  )
    return { min: 60, max: 300 };
  // Proteins (tofu, chicken, yogurt)
  if (
    name.includes("tofu") ||
    name.includes("chicken") ||
    name.includes("yogurt") ||
    name.includes("beef") ||
    name.includes("egg")
  )
    return { min: 50, max: 200 };
  // Default bounds
  return { min: 10, max: 200 };
}

// Enhanced optimization function with higher precision for AI meal plans
function optimizeMealEnhanced(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  console.log("Starting enhanced optimization with:", { ingredients, targets });

  // Create ingredient amounts map
  const amounts: Record<string, number> = {};
  const bounds: Record<string, { min: number; max: number }> = {};

  // Smart initial estimation
  ingredients.forEach((ing) => {
    const b = getIngredientBounds(ing.name);
    bounds[ing.name] = b;
    let baseAmount = 50; // Start with 50g

    // If ingredient is high in calories (like oil), start smaller
    if (ing.cal > 5) {
      // More than 500 cal per 100g
      baseAmount = Math.min(20, (targets.calories / (ing.cal * 100)) * 100);
    }

    // If ingredient is protein-rich, start with more
    if (ing.prot > 0.15) {
      // More than 15g protein per 100g
      baseAmount = Math.min(80, targets.protein / ing.prot);
    }

    amounts[ing.name] = Math.max(b.min, Math.min(b.max, baseAmount));
  });

  const maxIterations = 300;
  const tolerance = 2.0; // More precise tolerance (2% total error)

  let bestError = Infinity;
  let bestAmounts = { ...amounts };

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Calculate current macros
    let currentCalories = 0,
      currentProtein = 0,
      currentCarbs = 0,
      currentFat = 0;

    ingredients.forEach((ing) => {
      const amount = amounts[ing.name];
      currentCalories += (amount / 100) * ing.cal * 100;
      currentProtein += (amount / 100) * ing.prot * 100;
      currentCarbs += (amount / 100) * ing.carb * 100;
      currentFat += (amount / 100) * ing.fat * 100;
    });

    // Calculate errors
    const calorieError = targets.calories - currentCalories;
    const proteinError = targets.protein - currentProtein;
    const carbError = targets.carbs - currentCarbs;
    const fatError = targets.fat - currentFat;

    // Calculate total error with weighted priorities
    const totalError =
      Math.abs(calorieError) * 1.0 + // High priority for calories
      Math.abs(proteinError) * 1.2 + // Highest priority for protein
      Math.abs(carbError) * 0.9 + // Medium priority for carbs
      Math.abs(fatError) * 1.1; // High priority for fat

    // Track best solution
    if (totalError < bestError) {
      bestError = totalError;
      bestAmounts = { ...amounts };
    }

    // Check convergence
    if (totalError < tolerance) {
      console.log(
        `Enhanced optimization converged at iteration ${iteration} with error: ${totalError.toFixed(2)}`,
      );
      break;
    }

    // Adaptive learning rate (slower as we approach convergence)
    const learningRate = Math.max(0.005, 0.1 / (1 + iteration / 80));

    // Update amounts using enhanced gradients
    ingredients.forEach((ing) => {
      let gradient = 0;

      // Calculate contribution-weighted gradients
      if (ing.cal > 0) {
        gradient += ((calorieError * ing.cal) / 100) * learningRate * 0.8;
      }
      if (ing.prot > 0) {
        gradient += ((proteinError * ing.prot) / 100) * learningRate * 1.0;
      }
      if (ing.carb > 0) {
        gradient += ((carbError * ing.carb) / 100) * learningRate * 0.7;
      }
      if (ing.fat > 0) {
        gradient += ((fatError * ing.fat) / 100) * learningRate * 0.9;

        // Special handling for high-fat ingredients (like oils)
        if (ing.fat > 50 && amounts[ing.name] > 25) {
          gradient -= 0.1 * learningRate; // Prevent excessive oil amounts
        }
      }

      // Apply bounds and update; encourage non-zero contribution for all ingredients
      const b = bounds[ing.name];
      let next = amounts[ing.name] + gradient;
      if (next < b.min) next = b.min;
      amounts[ing.name] = Math.max(b.min, Math.min(b.max, next));
    });

    // Log progress every 50 iterations
    if (iteration % 50 === 0) {
      console.log(
        `Iteration ${iteration}: Total error = ${totalError.toFixed(2)}`,
      );
    }
  }

  // Use best solution found
  Object.assign(amounts, bestAmounts);

  // Calculate final achieved macros
  let achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  ingredients.forEach((ing) => {
    const amount = amounts[ing.name];
    achieved.calories += (amount / 100) * ing.cal * 100;
    achieved.protein += (amount / 100) * ing.prot * 100;
    achieved.carbs += (amount / 100) * ing.carb * 100;
    achieved.fat += (amount / 100) * ing.fat * 100;
  });

  // Final refinement using projected gradient (same as suggestion path behavior)
  try {
    const initialArray = ingredients.map((ing) => {
      const b = bounds[ing.name];
      const v = amounts[ing.name] || 50;
      return Math.max(b.min, Math.min(b.max, v));
    });
    const refined = refineWithProjectedGradient(
      ingredients as any,
      targets as any,
      initialArray as any,
      bounds as any,
    ) as number[];

    // Apply refined amounts if they improve error
    const refinedAchieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    refined.forEach((amt, i) => {
      refinedAchieved.calories += (amt / 100) * ingredients[i].cal * 100;
      refinedAchieved.protein += (amt / 100) * ingredients[i].prot * 100;
      refinedAchieved.carbs += (amt / 100) * ingredients[i].carb * 100;
      refinedAchieved.fat += (amt / 100) * ingredients[i].fat * 100;
    });

    const err = (v: number, t: number) => Math.abs(v - t);
    const prevError =
      err(achieved.calories, targets.calories) +
      err(achieved.protein, targets.protein) +
      err(achieved.carbs, targets.carbs) +
      err(achieved.fat, targets.fat);
    const newError =
      err(refinedAchieved.calories, targets.calories) +
      err(refinedAchieved.protein, targets.protein) +
      err(refinedAchieved.carbs, targets.carbs) +
      err(refinedAchieved.fat, targets.fat);

    // Accept if better or within 5% margin for all macros
    const within5 = (v: number, t: number) =>
      Math.abs(v - t) <= 0.05 * Math.max(50, t);
    const meetsAll =
      within5(refinedAchieved.calories, targets.calories) &&
      within5(refinedAchieved.protein, targets.protein) &&
      within5(refinedAchieved.carbs, targets.carbs) &&
      within5(refinedAchieved.fat, targets.fat);
    if (newError <= prevError || meetsAll) {
      ingredients.forEach((ing, i) => {
        const b = bounds[ing.name];
        amounts[ing.name] = Math.max(
          b.min,
          Math.min(b.max, Math.round(refined[i] * 100) / 100),
        );
      });
      achieved = {
        calories: Math.round(refinedAchieved.calories * 100) / 100,
        protein: Math.round(refinedAchieved.protein * 100) / 100,
        carbs: Math.round(refinedAchieved.carbs * 100) / 100,
        fat: Math.round(refinedAchieved.fat * 100) / 100,
      };
    }
  } catch (e) {
    console.warn("Refinement step failed, using enhanced result:", e);
  }

  console.log("Enhanced optimization result:", amounts);
  console.log("Achieved macros:", achieved);
  console.log("Target macros:", targets);

  return {
    feasible: true,
    result: 0,
    ingredients: Object.fromEntries(
      ingredients.map((ing) => [
        ing.name,
        Math.round(amounts[ing.name] * 100) / 100,
      ]),
    ),
    achieved: {
      calories: Math.round(achieved.calories * 100) / 100,
      protein: Math.round(achieved.protein * 100) / 100,
      carbs: Math.round(achieved.carbs * 100) / 100,
      fat: Math.round(achieved.fat * 100) / 100,
    },
  };
}

// Iterative Helper Selection Algorithm - Add helpers one by one based on deficits
export function optimizeMealIterative(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  console.log("🎯 Starting Iterative Helper Selection Algorithm");
  console.log("📊 Targets:", targets);
  console.log("🧪 Input ingredients:", ingredients.map(i => i.name));

  try {
    // Phase 1: Deduplicate base ingredients
    console.log("🔄 Phase 1: Deduplicating ingredients...");
    const baseIngredients = deduplicateIngredients(ingredients);
    console.log("🧪 Base ingredients:", baseIngredients.map(i => i.name));

    // Phase 2: Generate helper pool
    console.log("🔄 Phase 2: Generating helper pool...");
    const helperPool = generateHelperPool(baseIngredients);
    console.log("🆘 Helper pool size:", helperPool.length);
    console.log("🆘 Helper pool:", helperPool.map(h => h.name));

    // Phase 3: Iterative helper selection
    console.log("🔄 Phase 3: Starting iterative helper selection...");
    return iterativeHelperSelection(baseIngredients, helperPool, targets);

  } catch (error: any) {
    console.error("❌ Optimization failed:", error);
    console.error("❌ Error stack:", error?.stack);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error?.message || String(error)
    };
  }
}

// Iterative Helper Selection: Add best helper one by one until targets are met
function iterativeHelperSelection(
  baseIngredients: Ingredient[],
  helperPool: Ingredient[],
  targets: Targets
): OptimizationResult {
  let currentIngredients = [...baseIngredients];
  let iteration = 0;
  const maxIterations = 5; // Maximum 5 helpers
  const targetAccuracy = 0.05; // ±5% tolerance

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n🔄 === ITERATION ${iteration} ===`);

    // Step 1: Optimize with current ingredients
    console.log(`🧪 Current ingredients (${currentIngredients.length}):`, currentIngredients.map(i => i.name));
    const currentSolution = solveQuadraticSubproblem(currentIngredients, targets);

    if (!currentSolution) {
      console.log("❌ Failed to solve with current ingredients");
      break;
    }

    // Step 2: Analyze deficits
    const deficits = analyzeDeficits(currentSolution.achieved, targets);
    console.log("📊 Current deficits:", deficits);

    // Step 3: Check if we've reached target accuracy
    if (isWithinTargetAccuracy(currentSolution.achieved, targets, targetAccuracy)) {
      console.log("🎉 Target accuracy reached! No more helpers needed.");
      return currentSolution;
    }

    // Step 4: Find best helper to address biggest deficit
    const bestHelper = findBestHelper(helperPool, deficits, currentIngredients);

    if (!bestHelper) {
      console.log("⚠️ No suitable helper found, stopping iteration");
      return currentSolution;
    }

    console.log(`➕ Adding helper: ${bestHelper.name}`);
    console.log(`📈 Helper profile: cal=${bestHelper.cal.toFixed(3)}, prot=${bestHelper.prot.toFixed(3)}, carb=${bestHelper.carb.toFixed(3)}, fat=${bestHelper.fat.toFixed(3)}`);

    // Step 5: Add helper and continue
    currentIngredients.push(bestHelper);

    // Remove the used helper from pool to avoid duplicates
    const helperIndex = helperPool.findIndex(h => h.name === bestHelper.name);
    if (helperIndex >= 0) {
      helperPool.splice(helperIndex, 1);
    }
  }

  // Final optimization with all selected helpers
  console.log("\n🏁 Final optimization with all selected helpers...");
  const finalSolution = solveQuadraticSubproblem(currentIngredients, targets);

  if (finalSolution) {
    console.log("🏆 Final solution:");
    console.log("📈 Achieved macros:", finalSolution.achieved);
    console.log("🎯 Target accuracy:", calculateAccuracy(finalSolution.achieved, targets));
    return finalSolution;
  }

  throw new Error("Failed to find solution even with helpers");
}

// Analyze macro deficits and surpluses
function analyzeDeficits(achieved: any, targets: Targets) {
  const deficits = {
    cal: targets.calories - achieved.calories,
    prot: targets.protein - achieved.protein,
    carb: targets.carbs - achieved.carbs,
    fat: targets.fat - achieved.fat
  };

  const relativeDeficits = {
    cal: deficits.cal / targets.calories,
    prot: deficits.prot / targets.protein,
    carb: deficits.carb / targets.carbs,
    fat: deficits.fat / targets.fat
  };

  // Find the biggest deficit (most urgent need)
  const biggestDeficit = Object.entries(relativeDeficits)
    .filter(([_, value]) => value > 0) // Only positive deficits (shortages)
    .sort(([_, a], [__, b]) => Math.abs(b) - Math.abs(a))[0];

  return {
    absolute: deficits,
    relative: relativeDeficits,
    biggest: biggestDeficit ? { macro: biggestDeficit[0], value: biggestDeficit[1] } : null,
    urgentNeeds: Object.entries(relativeDeficits)
      .filter(([_, value]) => Math.abs(value) > 0.05) // >5% off target
      .map(([macro, value]) => ({ macro, value }))
  };
}

// Find the best helper to address current deficits
function findBestHelper(
  helperPool: Ingredient[],
  deficits: any,
  currentIngredients: Ingredient[]
): Ingredient | null {
  console.log(`🔍 Evaluating ${helperPool.length} potential helpers...`);

  let bestHelper: Ingredient | null = null;
  let bestScore = -1;

  // Avoid adding similar helpers
  const currentNames = new Set(currentIngredients.map(i => i.name.toLowerCase()));

  for (const helper of helperPool) {
    // Skip if we already have a similar ingredient
    if (currentNames.has(helper.name.toLowerCase())) {
      continue;
    }

    // Calculate score based on how well this helper addresses deficits
    const score = calculateHelperScore(helper, deficits);

    console.log(`📊 ${helper.name}: score = ${score.toFixed(3)}`);

    if (score > bestScore) {
      bestScore = score;
      bestHelper = helper;
    }
  }

  console.log(`🏆 Best helper: ${bestHelper?.name} (score: ${bestScore.toFixed(3)})`);
  return bestHelper;
}

// Calculate how good a helper is for addressing current deficits
function calculateHelperScore(helper: Ingredient, deficits: any): number {
  let score = 0;

  // Score based on addressing urgent needs
  for (const need of deficits.urgentNeeds) {
    const macro = need.macro;
    const deficit = need.value; // Relative deficit

    if (deficit > 0) { // We need more of this macro
      switch (macro) {
        case 'cal':
          score += helper.cal * Math.abs(deficit) * 10; // High calorie content helps
          break;
        case 'prot':
          score += helper.prot * Math.abs(deficit) * 100; // Protein is very important
          break;
        case 'carb':
          score += helper.carb * Math.abs(deficit) * 50; // Carbs are important
          break;
        case 'fat':
          score += helper.fat * Math.abs(deficit) * 20; // Fat helps but less priority
          break;
      }
    } else { // We have too much of this macro, prefer helpers with less of it
      switch (macro) {
        case 'cal':
          score -= helper.cal * Math.abs(deficit) * 5;
          break;
        case 'prot':
          score -= helper.prot * Math.abs(deficit) * 10;
          break;
        case 'carb':
          score -= helper.carb * Math.abs(deficit) * 15;
          break;
        case 'fat':
          score -= helper.fat * Math.abs(deficit) * 30; // Strongly avoid high fat if we have excess
          break;
      }
    }
  }

  // Bonus for balanced helpers (no extreme macro profiles)
  const isBalanced = helper.cal > 0.5 && helper.cal < 4.0 && 
                     helper.prot > 0.05 && helper.prot < 0.4 &&
                     helper.carb > 0.05 && helper.carb < 0.8 &&
                     helper.fat < 0.3;

  if (isBalanced) {
    score += 10; // Small bonus for balanced helpers
  }

  return Math.max(0, score); // Never negative
}

// Check if achieved macros are within target accuracy
function isWithinTargetAccuracy(achieved: any, targets: Targets, tolerance: number): boolean {
  const accuracies = [
    Math.abs(achieved.calories - targets.calories) / targets.calories,
    Math.abs(achieved.protein - targets.protein) / targets.protein,
    Math.abs(achieved.carbs - targets.carbs) / targets.carbs,
    Math.abs(achieved.fat - targets.fat) / targets.fat
  ];

  const allWithinTolerance = accuracies.every(acc => acc <= tolerance);

  console.log(`🎯 Accuracy check: ${accuracies.map(a => (a * 100).toFixed(1) + '%').join(', ')} (target: ±${(tolerance * 100).toFixed(1)}%)`);
  console.log(`✅ Within tolerance: ${allWithinTolerance}`);

  return allWithinTolerance;
}

// Deduplicate ingredients
function deduplicateIngredients(ingredients: Ingredient[]): Ingredient[] {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/\([^)]*\)/g, "").trim();
  const seen = new Set<string>();
  const unique: Ingredient[] = [];

  for (const ing of ingredients) {
    const key = normalize(ing.name);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ing);
    }
  }

  return unique;
}

// Generate strategic helper pool
function generateHelperPool(baseIngredients: Ingredient[]): Ingredient[] {
  const helpers: Ingredient[] = [];
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/\([^)]*\)/g, "").trim();
  const existing = new Set(baseIngredients.map(i => normalize(i.name)));

  // Strategic helpers categorized by primary function
  const helperDefinitions = [
    // High-protein, low-fat helpers
    { name: "Chicken Breast", key: "chicken breast", priority: 1 },
    { name: "Egg White", key: "egg white", priority: 1 },
    { name: "Greek Yogurt Non-Fat", key: "greek yogurt non-fat", priority: 2 },

    // High-carb helpers
    { name: "White Rice Raw", key: "white rice raw", priority: 1 },
    { name: "Brown Rice Raw", key: "brown rice raw", priority: 2 },
    { name: "Sweet Potato Raw", key: "sweet potato raw", priority: 2 },
    { name: "Pasta Raw", key: "pasta raw", priority: 3 },

    // Low-cal, high-volume helpers
    { name: "Broccoli Raw", key: "broccoli raw", priority: 2 },
    { name: "Spinach", key: "spinach", priority: 2 },
    { name: "Cucumber Raw", key: "cucumber raw", priority: 3 },

    // Controlled fat helpers
    { name: "Olive Oil", key: "olive oil", priority: 3 },
    { name: "Avocado", key: "avocado", priority: 3 }
  ];

  // Add helpers that aren't already in base ingredients
  for (const def of helperDefinitions) {
    if (!existing.has(normalize(def.name))) {
      const fb = getFallbackNutrition(def.key);
      helpers.push({
        name: def.name,
        cal: fb.cal / 100,
        prot: fb.prot / 100,
        carb: fb.carb / 100,
        fat: fb.fat / 100
      });
    }
  }

  return helpers;
}

// Preprocessing: Create comprehensive ingredient pool
function preprocessIngredients(baseIngredients: Ingredient[]) {
  // Deduplicate base ingredients
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/\([^)]*\)/g, "").trim();
  const seen = new Set<string>();
  const unique: Ingredient[] = [];

  for (const ing of baseIngredients) {
    const key = normalize(ing.name);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ing);
    }
  }

  // Generate strategic helpers based on scientific nutritional profiles
  const strategicHelpers: Ingredient[] = [];

  // High-carb helpers (for rapid carb adjustment)
  const carbHelpers = [
    { name: "White Rice Raw", key: "white rice raw" },
    { name: "Brown Rice Raw", key: "brown rice raw" },
    { name: "Pasta Raw", key: "pasta raw" },
    { name: "Sweet Potato Raw", key: "sweet potato raw" },
    { name: "Oats Raw", key: "oats" }
  ];

  // High-protein helpers (for protein optimization)
  const proteinHelpers = [
    { name: "Chicken Breast", key: "chicken breast" },
    { name: "Egg White", key: "egg white" },
    { name: "Greek Yogurt Non-Fat", key: "greek yogurt non-fat" },
    { name: "Extra Lean Ground Beef", key: "extra lean ground beef" }
  ];

  // Low-cal, high-volume helpers (for satiety without excess calories)
  const volumeHelpers = [
    { name: "Broccoli Raw", key: "broccoli raw" },
    { name: "Spinach", key: "spinach" },
    { name: "Cucumber Raw", key: "cucumber raw" },
    { name: "Lettuce Raw", key: "lettuce raw" }
  ];

  // High-fat helpers (for precise fat control)
  const fatHelpers = [
    { name: "Olive Oil", key: "olive oil" },
    { name: "Almonds", key: "almonds" },
    { name: "Avocado", key: "avocado" }
  ];

  [...carbHelpers, ...proteinHelpers, ...volumeHelpers, ...fatHelpers].forEach(h => {
    if (!seen.has(normalize(h.name))) {
      const fb = getFallbackNutrition(h.key);
      strategicHelpers.push({
        name: h.name,
        cal: fb.cal / 100,
        prot: fb.prot / 100,
        carb: fb.carb / 100,
        fat: fb.fat / 100
      });
      seen.add(normalize(h.name));
    }
  });

  return { baseIngredients: unique, allHelpers: strategicHelpers };
}

// Branch & Bound Algorithm with Helper Selection
function branchAndBoundOptimize(
  baseIngredients: Ingredient[],
  helpers: Ingredient[],
  targets: Targets
): OptimizationResult | null {
  console.log("🌳 Starting Branch & Bound optimization...");

  let bestSolution: OptimizationResult | null = null;
  let bestError = Infinity;
  let nodesExplored = 0;
  const maxNodes = 1000; // Computational limit

  // Priority queue for branch & bound
  interface BranchNode {
    ingredients: Ingredient[];
    lowerBound: number;
    depth: number;
  }

  const queue: BranchNode[] = [{ 
    ingredients: [...baseIngredients], 
    lowerBound: 0, 
    depth: 0 
  }];

  while (queue.length > 0 && nodesExplored < maxNodes) {
    // Sort by lower bound (best-first search)
    queue.sort((a, b) => a.lowerBound - b.lowerBound);
    const node = queue.shift()!;
    nodesExplored++;

    // Solve current subproblem with Quadratic Programming
    const solution = solveQuadraticSubproblem(node.ingredients, targets);

    if (solution) {
      const error = calculateObjectiveError(solution.achieved, targets);

      if (error < bestError) {
        bestError = error;
        bestSolution = solution;
        console.log(`🎯 New best solution at depth ${node.depth}: error = ${error.toFixed(2)}`);
      }

      // Early termination if solution is very good
      if (error < 2.0) {
        console.log("🏁 Early termination: excellent solution found");
        break;
      }
    }

    // Branch: try adding each helper
    if (node.depth < 3) { // Limit branching depth
      for (let i = 0; i < helpers.length; i++) {
        const helper = helpers[i];

        // Check if helper could improve solution
        if (couldHelperImprove(node.ingredients, helper, targets)) {
          const newIngredients = [...node.ingredients, helper];
          const lowerBound = calculateLowerBound(newIngredients, targets);

          // Prune if lower bound is worse than current best
          if (lowerBound < bestError * 1.5) {
            queue.push({
              ingredients: newIngredients,
              lowerBound,
              depth: node.depth + 1
            });
          }
        }
      }
    }
  }

  console.log(`🔍 Explored ${nodesExplored} nodes`);
  return bestSolution;
}

// Quadratic Programming solver for subproblems
function solveQuadraticSubproblem(ingredients: Ingredient[], targets: Targets): OptimizationResult | null {
  const n = ingredients.length;
  if (n === 0) return null;

  // Initialize with smart starting point
  let x = ingredients.map(() => 30); // Start with 30g each

  // Quadratic objective: minimize ||Ax - b||² + λ||x||²
  const lambda = 0.001; // Regularization parameter
  const maxIter = 200;
  const tolerance = 1e-6;

  // Build constraint matrix A and target vector b
  const A = [
    ingredients.map(ing => ing.cal),   // calories constraint
    ingredients.map(ing => ing.prot),  // protein constraint  
    ingredients.map(ing => ing.carb),  // carbs constraint
    ingredients.map(ing => ing.fat)    // fat constraint
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Weights for different macro priorities
  const weights = [1.0, 1.5, 1.2, 2.0]; // Higher weight on fat accuracy

  for (let iter = 0; iter < maxIter; iter++) {
    // Compute gradient: ∇f = 2A^T W (Ax - b) + 2λx
    const Ax = A.map(row => row.reduce((sum, a, j) => sum + a * x[j], 0));
    const residual = Ax.map((val, i) => weights[i] * (val - b[i]));

    const gradient = x.map((_, j) => {
      let grad = 2 * lambda * x[j]; // Regularization term
      for (let i = 0; i < 4; i++) {
        grad += 2 * A[i][j] * residual[i];
      }
      return grad;
    });

    // Adaptive step size with line search
    let stepSize = 0.1;
    for (let lsIter = 0; lsIter < 10; lsIter++) {
      const newX = x.map((val, j) => {
        const updated = val - stepSize * gradient[j];
        const bounds = getAmountBounds(ingredients[j].name);
        return Math.max(bounds.min, Math.min(bounds.max, updated));
      });

      const newObjective = evaluateObjective(newX, A, b, weights, lambda);
      const oldObjective = evaluateObjective(x, A, b, weights, lambda);

      if (newObjective < oldObjective) {
        x = newX;
        break;
      }
      stepSize *= 0.5;
    }

    // Check convergence
    const gradNorm = Math.sqrt(gradient.reduce((sum, g) => sum + g * g, 0));
    if (gradNorm < tolerance) break;
  }

  // Build result
  const achieved = {
    calories: A[0].reduce((sum, a, j) => sum + a * x[j], 0),
    protein: A[1].reduce((sum, a, j) => sum + a * x[j], 0),
    carbs: A[2].reduce((sum, a, j) => sum + a * x[j], 0),
    fat: A[3].reduce((sum, a, j) => sum + a * x[j], 0)
  };

  const result: OptimizationResult = {
    feasible: true,
    result: 0,
    ingredients: {},
    achieved: {
      calories: Math.round(achieved.calories * 100) / 100,
      protein: Math.round(achieved.protein * 100) / 100,
      carbs: Math.round(achieved.carbs * 100) / 100,
      fat: Math.round(achieved.fat * 100) / 100
    }
  };

  // Filter out ingredients with negligible amounts
  ingredients.forEach((ing, j) => {
    if (x[j] >= 5) { // Minimum 5g threshold
      result.ingredients[ing.name] = Math.round(x[j] * 100) / 100;
    }
  });

  return result;
}

// Helper functions for Branch & Bound
function calculateObjectiveError(achieved: any, targets: Targets): number {
  const relativeErrors = [
    Math.abs(achieved.calories - targets.calories) / targets.calories,
    Math.abs(achieved.protein - targets.protein) / targets.protein,
    Math.abs(achieved.carbs - targets.carbs) / targets.carbs,
    Math.abs(achieved.fat - targets.fat) / targets.fat
  ];

  // Weighted error (fat gets higher priority)
  return relativeErrors[0] * 1.0 + relativeErrors[1] * 1.5 + 
         relativeErrors[2] * 1.2 + relativeErrors[3] * 2.0;
}

function calculateLowerBound(ingredients: Ingredient[], targets: Targets): number {
  // Optimistic lower bound assuming perfect macro distribution
  const totalCal = ingredients.reduce((sum, ing) => sum + ing.cal * 30, 0);
  const totalProt = ingredients.reduce((sum, ing) => sum + ing.prot * 30, 0);
  const totalCarb = ingredients.reduce((sum, ing) => sum + ing.carb * 30, 0);
  const totalFat = ingredients.reduce((sum, ing) => sum + ing.fat * 30, 0);

  return Math.abs(totalCal - targets.calories) / targets.calories * 0.5;
}

function couldHelperImprove(currentIngredients: Ingredient[], helper: Ingredient, targets: Targets): boolean {
  // Use realistic serving sizes for current macro calculation
  const current = calculateRealisticMacros(currentIngredients, targets);

  const deficits = {
    cal: targets.calories - current.calories,
    prot: targets.protein - current.protein,
    carb: targets.carbs - current.carbs,
    fat: targets.fat - current.fat
  };

  // Calculate relative deficits (percentage)
  const relativeDeficits = {
    cal: Math.abs(deficits.cal) / targets.calories,
    prot: Math.abs(deficits.prot) / targets.protein,
    carb: Math.abs(deficits.carb) / targets.carbs,
    fat: Math.abs(deficits.fat) / targets.fat
  };

  console.log(`🔍 Evaluating helper: ${helper.name}`);
  console.log(`📊 Current deficits:`, deficits);
  console.log(`📈 Relative deficits:`, relativeDeficits);

  // Helper is useful if it addresses a >5% deficit and has strong macro content
  const isUseful = (
    (relativeDeficits.prot > 0.05 && helper.prot > 0.15) || // >5% protein deficit + high protein helper
    (relativeDeficits.carb > 0.05 && helper.carb > 0.3) ||  // >5% carb deficit + high carb helper
    (relativeDeficits.fat > 0.05 && helper.fat > 0.1) ||    // >5% fat deficit + high fat helper
    (relativeDeficits.cal > 0.05 && helper.cal > 1.5)       // >5% calorie deficit + calorie-dense helper
  );

  console.log(`✅ Helper ${helper.name} useful: ${isUseful}`);
  return isUseful;
}

// Calculate realistic macros based on optimized amounts, not fixed 30g
function calculateRealisticMacros(ingredients: Ingredient[], targets: Targets) {
  // Quick optimization to get realistic serving sizes
  let amounts: Record<string, number> = {};

  ingredients.forEach(ing => {
    // Smart initial amount based on macro density
    let amount = 30; // Default

    if (ing.carb > 0.3) {
      // High-carb: calculate based on carb needs
      amount = Math.min(100, targets.carbs * 0.4 / ing.carb);
    } else if (ing.prot > 0.15) {
      // High-protein: calculate based on protein needs
      amount = Math.min(150, targets.protein * 0.4 / ing.prot);
    } else if (ing.fat > 0.1) {
      // High-fat: calculate based on fat needs
      amount = Math.min(50, targets.fat * 0.4 / ing.fat);
    }

    const bounds = getAmountBounds(ing.name);
    amounts[ing.name] = Math.max(bounds.min, Math.min(bounds.max, amount));
  });

  return calculateMacros(ingredients, amounts);
}

function calculateMacrosForIngredients(ingredients: Ingredient[], defaultAmount: number) {
  return {
    calories: ingredients.reduce((sum, ing) => sum + ing.cal * defaultAmount, 0),
    protein: ingredients.reduce((sum, ing) => sum + ing.prot * defaultAmount, 0),
    carbs: ingredients.reduce((sum, ing) => sum + ing.carb * defaultAmount, 0),
    fat: ingredients.reduce((sum, ing) => sum + ing.fat * defaultAmount, 0)
  };
}

function evaluateObjective(x: number[], A: number[][], b: number[], weights: number[], lambda: number): number {
  const Ax = A.map(row => row.reduce((sum, a, j) => sum + a * x[j], 0));
  const residual = Ax.map((val, i) => weights[i] * (val - b[i]));
  const residualNorm = residual.reduce((sum, r) => sum + r * r, 0);
  const regularization = lambda * x.reduce((sum, val) => sum + val * val, 0);
  return residualNorm + regularization;
}

function calculateAccuracy(achieved: any, targets: Targets) {
  return {
    calories: `${((achieved.calories / targets.calories) * 100).toFixed(1)}%`,
    protein: `${((achieved.protein / targets.protein) * 100).toFixed(1)}%`,
    carbs: `${((achieved.carbs / targets.carbs) * 100).toFixed(1)}%`,
    fat: `${((achieved.fat / targets.fat) * 100).toFixed(1)}%`
  };
}

// Helper function to calculate macros from ingredients and amounts
function calculateMacros(ingredients: Ingredient[], amounts: Record<string, number>) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;

  ingredients.forEach(ing => {
    const amount = amounts[ing.name] || 0;
    calories += amount * ing.cal;
    protein += amount * ing.prot;
    carbs += amount * ing.carb;
    fat += amount * ing.fat;
  });

  return {
    calories: Math.round(calories * 100) / 100,
    protein: Math.round(protein * 100) / 100,
    carbs: Math.round(carbs * 100) / 100,
    fat: Math.round(fat * 100) / 100
  };
}

// Old functions removed - using new MIQP optimizer

// Fallback LP optimization
function optimizeMealWithLP(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  // Check if solver is properly loaded
  if (
    typeof window === "undefined" ||
    !(window as any).solver ||
    typeof (window as any).solver.Solve !== "function"
  ) {
    console.error("Solver not available:", {
      window: typeof window,
      solver: !!(window as any).solver,
      solveMethod: typeof (window as any).solver?.Solve,
    });
    return {
      feasible: false,
      result: -1,
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ingredients: {},
      error:
        "Linear programming solver not properly loaded. Please refresh the page and try again.",
    };
  }

  // Set up the linear programming model with target tolerance (±5%)
  const calMin = targets.calories * 0.95;
  const calMax = targets.calories * 1.05;
  const protMin = targets.protein * 0.95;
  const protMax = targets.protein * 1.05;
  const carbMin = targets.carbs * 0.95;
  const carbMax = targets.carbs * 1.05;
  const fatMin = targets.fat * 0.95;
  const fatMax = targets.fat * 1.05;

  const model: any = {
    // Feasibility within bands, then minimize total grams slightly
    optimize: "weight",
    opType: "min",
    constraints: {
      calories: { min: calMin, max: calMax },
      protein: { min: protMin, max: protMax },
      carbs: { min: carbMin, max: carbMax },
      fat: { min: fatMin, max: fatMax },
    },
    variables: {},
  };

  // Ingredient variables with per-variable bounds
  ingredients.forEach((ing) => {
    const varName = ing.name;
    const isOilLike = ing.fat >= 0.8; // e.g., olive oil
    const isHighFatWhole = ing.fat >= 0.12 && ing.fat < 0.8; // e.g., avocado/nuts

    model.variables[varName] = {
      calories: ing.cal,
      protein: ing.prot,
      carbs: ing.carb,
      fat: ing.fat,
      // Use self-constraint key to impose min/max bounds
      [varName]: 1,
      // tiny weight to slightly discourage overuse, keeps LP bounded
      weight: 0.001,
    } as any;

    // Combine min/max into one constraint using the same key as variable
    const maxCap = isOilLike ? 20 : isHighFatWhole ? 80 : 350;
    model.constraints[varName] = { min: 5, max: maxCap };
  });

  // No deviation variables in range-based model

  console.log("Final model:", model);

  // Solve the model using javascript-lp-solver
  try {
    // @ts-ignore - solver is loaded globally
    const results = (window as any).solver.Solve(model);

    // Build achieved macros from solver output
    let achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach((ing) => {
      const amount =
        results && typeof results[ing.name] === "number"
          ? results[ing.name]
          : 0;
      achieved.calories += amount * ing.cal;
      achieved.protein += amount * ing.prot;
      achieved.carbs += amount * ing.carb;
      achieved.fat += amount * ing.fat;
    });

    // Check if refinement needed - more lenient since we have ±5% tolerance
    const amountsVector = ingredients.map((ing) =>
      results && typeof results[ing.name] === "number" ? results[ing.name] : 0,
    );
    const hasZeros = amountsVector.some((v) => v < 2); // Any ingredient less than 2g is problematic
    const isAllSame = amountsVector.every(
      (v) => Math.abs(v - amountsVector[0]) < 1e-6,
    );
    const totalCal = achieved.calories;

    // Check if we're outside ±5% tolerance
    const calOutside = totalCal < calMin || totalCal > calMax;
    const protOutside =
      achieved.protein < protMin || achieved.protein > protMax;
    const carbOutside = achieved.carbs < carbMin || achieved.carbs > carbMax;
    const fatOutside = achieved.fat < fatMin || achieved.fat > fatMax;

    const clearlyPoor =
      calOutside ||
      protOutside ||
      carbOutside ||
      fatOutside ||
      isAllSame ||
      hasZeros;

    if (!results?.feasible || clearlyPoor) {
      console.warn(
        "Primary LP solve infeasible or outside tolerance. Running bounded least squares refinement...",
      );
      const optimized = solveWithBVLS(ingredients, targets, amountsVector);

      achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      ingredients.forEach((ing, i) => {
        achieved.calories += optimized[i] * ing.cal;
        achieved.protein += optimized[i] * ing.prot;
        achieved.carbs += optimized[i] * ing.carb;
        achieved.fat += optimized[i] * ing.fat;
      });

      const optimizedObj: Record<string, number> = {};
      ingredients.forEach((ing, i) => {
        optimizedObj[ing.name] = optimized[i];
      });

      // Prune impractically small amounts and refit
      const pruned = pruneAndRefit(ingredients, targets, optimized);
      achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      ingredients.forEach((ing, i) => {
        achieved.calories += pruned[i] * ing.cal;
        achieved.protein += pruned[i] * ing.prot;
        achieved.carbs += pruned[i] * ing.carb;
        achieved.fat += pruned[i] * ing.fat;
      });

      return {
        feasible: true,
        result: results?.result ?? 0,
        ingredients: Object.fromEntries(
          ingredients.map((ing, i) => [ing.name, pruned[i]]),
        ),
        achieved,
      };
    }

    // Also apply prune/refit on the direct LP result for practicality
    const prunedDirect = pruneAndRefit(ingredients, targets, amountsVector);
    achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach((ing, i) => {
      achieved.calories += prunedDirect[i] * ing.cal;
      achieved.protein += prunedDirect[i] * ing.prot;
      achieved.carbs += prunedDirect[i] * ing.carb;
      achieved.fat += prunedDirect[i] * ing.fat;
    });

    return {
      feasible: true,
      result: results?.result ?? 0,
      ingredients: Object.fromEntries(
        ingredients.map((ing, i) => [ing.name, prunedDirect[i]]),
      ),
      achieved,
    };
  } catch (error) {
    console.error("Linear programming solver error:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: "An error occurred during linear programming optimization.",
    };
  }
}

// BVLS (Bounded-Variable Least Squares) via cyclic coordinate descent with bounds
function solveWithBVLS(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
) {
  const n = ingredients.length;
  if (n === 0) return [] as number[];

  // Build A (4 x n) and b (4)
  const A: number[][] = [
    ingredients.map((ing) => ing.cal),
    ingredients.map((ing) => ing.prot),
    ingredients.map((ing) => ing.carb),
    ingredients.map((ing) => ing.fat),
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Weights to emphasize fat/carbs fit
  const rowWeights = [1.0, 1.2, 1.6, 1.8];
  for (let i = 0; i < 4; i++) {
    const s = Math.sqrt(rowWeights[i]);
    for (let j = 0; j < n; j++) A[i][j] *= s;
    b[i] *= s;
  }

  // Bounds per variable
  const { lower, upper } = getPerVariableBounds(ingredients);

  // Initialize x and residual r = A x - b
  const x = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    const init =
      initial && isFinite(initial[j]) ? initial[j] : (lower[j] + upper[j]) / 2;
    x[j] = Math.min(upper[j], Math.max(lower[j], init));
  }
  const r = new Array(4).fill(0);
  for (let i = 0; i < 4; i++) {
    let sum = -b[i];
    for (let j = 0; j < n; j++) sum += A[i][j] * x[j];
    r[i] = sum;
  }

  // Precompute column norms ||a_j||^2
  const colNorm2 = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < 4; i++) s += A[i][j] * A[i][j];
    colNorm2[j] = Math.max(s, 1e-12);
  }

  const maxOuter = 400;
  const tol = 1e-2;
  for (let iter = 0; iter < maxOuter; iter++) {
    let maxDelta = 0;
    for (let j = 0; j < n; j++) {
      // Gradient aj^T r; optimal unconstrained step: xj_new = xj - (aj^T r)/||aj||^2
      let grad = 0;
      for (let i = 0; i < 4; i++) grad += A[i][j] * r[i];
      const xOld = x[j];
      let xNew = xOld - grad / colNorm2[j];
      // Project to bounds
      xNew = Math.min(upper[j], Math.max(lower[j], xNew));
      const dx = xNew - xOld;
      if (Math.abs(dx) > 0) {
        // Update residual r <- r + aj * dx
        for (let i = 0; i < 4; i++) r[i] += A[i][j] * dx;
        x[j] = xNew;
        if (Math.abs(dx) > maxDelta) maxDelta = Math.abs(dx);
      }
    }
    if (maxDelta < tol) break;
  }

  // Clip and round to 2 decimals
  for (let j = 0; j < n; j++)
    x[j] = Math.round(Math.min(upper[j], Math.max(lower[j], x[j])) * 100) / 100;
  return x;
}

function getPerVariableBounds(ingredients: Ingredient[]) {
  const n = ingredients.length;
  const lower = new Array(n).fill(20); // Practical minimum default
  const upper = new Array(n).fill(350);
  for (let j = 0; j < n; j++) {
    const ing = ingredients[j];
    const fat = ing.fat;
    if (fat >= 0.8)
      upper[j] = 20; // oils
    else if (fat >= 0.12)
      upper[j] = 80; // avocado/nuts
    else upper[j] = 350; // others
  }
  return { lower, upper };
}

// Hybrid optimization: PSO + SQP refinement without hard bounds
function solveWithHybridOptimization(
  ingredients: Ingredient[],
  targets: Targets,
): number[] {
  const n = ingredients.length;
  if (n === 0) return [];

  console.log("Starting hybrid PSO + SQP optimization...");

  // Phase 1: Particle Swarm Optimization for global search
  const psoResult = solveWithPSO(ingredients, targets);

  // Phase 2: Sequential Quadratic Programming refinement for precision
  const sqpResult = solveWithSQP(ingredients, targets, psoResult);

  return sqpResult;
}

// Particle Swarm Optimization - global search without hard bounds
function solveWithPSO(ingredients: Ingredient[], targets: Targets): number[] {
  const n = ingredients.length;
  const swarmSize = 30;
  const maxIterations = 100;

  // PSO parameters
  const w = 0.7; // inertia weight
  const c1 = 1.5; // cognitive parameter
  const c2 = 1.5; // social parameter

  // Initialize swarm
  const particles: Array<{
    position: number[];
    velocity: number[];
    bestPosition: number[];
    bestFitness: number;
  }> = [];

  let globalBestPosition = new Array(n).fill(0);
  let globalBestFitness = Infinity;

  // Initialize particles with reasonable ranges
  for (let i = 0; i < swarmSize; i++) {
    const position = new Array(n);
    const velocity = new Array(n);

    for (let j = 0; j < n; j++) {
      // Natural ranges based on ingredient type
      const ing = ingredients[j];
      let maxAmount = 300; // default max

      if (ing.fat >= 0.8)
        maxAmount = 30; // oils
      else if (ing.fat >= 0.12)
        maxAmount = 100; // nuts/avocado
      else if (ing.prot >= 0.15) maxAmount = 200; // protein sources

      position[j] = Math.random() * maxAmount + 10; // min 10g
      velocity[j] = (Math.random() - 0.5) * 20;
    }

    const fitness = calculateFitness(ingredients, targets, position);

    particles.push({
      position: [...position],
      velocity: [...velocity],
      bestPosition: [...position],
      bestFitness: fitness,
    });

    if (fitness < globalBestFitness) {
      globalBestFitness = fitness;
      globalBestPosition = [...position];
    }
  }

  // PSO iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < swarmSize; i++) {
      const particle = particles[i];

      // Update velocity
      for (let j = 0; j < n; j++) {
        const r1 = Math.random();
        const r2 = Math.random();

        particle.velocity[j] =
          w * particle.velocity[j] +
          c1 * r1 * (particle.bestPosition[j] - particle.position[j]) +
          c2 * r2 * (globalBestPosition[j] - particle.position[j]);
      }

      // Update position
      for (let j = 0; j < n; j++) {
        particle.position[j] += particle.velocity[j];

        // Soft bounds - allow exploration but penalize extremes
        if (particle.position[j] < 0)
          particle.position[j] = Math.abs(particle.position[j]);
        if (particle.position[j] > 500)
          particle.position[j] = 500 - (particle.position[j] - 500);
      }

      // Evaluate fitness
      const fitness = calculateFitness(ingredients, targets, particle.position);

      // Update personal best
      if (fitness < particle.bestFitness) {
        particle.bestFitness = fitness;
        particle.bestPosition = [...particle.position];
      }

      // Update global best
      if (fitness < globalBestFitness) {
        globalBestFitness = fitness;
        globalBestPosition = [...particle.position];
      }
    }
  }

  console.log(`PSO completed. Best fitness: ${globalBestFitness}`);
  return globalBestPosition;
}

// Sequential Quadratic Programming refinement
function solveWithSQP(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
): number[] {
  const n = ingredients.length;
  let x = [...initial];
  const maxIterations = 50;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate gradient and Hessian approximation
    const grad = calculateGradient(ingredients, targets, x);
    const hessian = calculateHessianApprox(ingredients, targets, x);

    // Solve quadratic subproblem: min 0.5 * d^T * H * d + grad^T * d
    const direction = solveQuadraticSubproblemSQP(hessian, grad);

    // Line search
    const stepSize = lineSearch(ingredients, targets, x, direction);

    // Update solution
    for (let i = 0; i < n; i++) {
      x[i] += stepSize * direction[i];
      // Ensure positive amounts
      if (x[i] < 0) x[i] = 0;
    }

    // Check convergence
    const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
    if (gradNorm < tolerance) break;
  }

  return x.map((v) => Math.round(v * 100) / 100);
}

// Fitness function for PSO - penalizes deviation from targets
function calculateFitness(
  ingredients: Ingredient[],
  targets: Targets,
  amounts: number[],
): number {
  let calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0;

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const amt = amounts[i];
    calories += amt * ing.cal;
    protein += amt * ing.prot;
    carbs += amt * ing.carb;
    fat += amt * ing.fat;
  }

  // Weighted squared errors
  const calError = Math.pow(
    (calories - targets.calories) / targets.calories,
    2,
  );
  const protError = Math.pow((protein - targets.protein) / targets.protein, 2);
  const carbError = Math.pow((carbs - targets.carbs) / targets.carbs, 2);
  const fatError = Math.pow((fat - targets.fat) / targets.fat, 2);

  // Add penalty for unrealistic amounts
  let penaltySum = 0;
  for (let i = 0; i < amounts.length; i++) {
    const amt = amounts[i];
    const ing = ingredients[i];

    // Penalty for very small amounts
    if (amt > 0 && amt < 5) penaltySum += Math.pow(5 - amt, 2) * 0.1;

    // Penalty for excessive oil
    if (ing.fat >= 0.8 && amt > 25) penaltySum += Math.pow(amt - 25, 2) * 0.01;
  }

  return calError + protError + carbError + fatError + penaltySum;
}

// Calculate gradient for SQP
function calculateGradient(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
): number[] {
  const n = ingredients.length;
  const grad = new Array(n).fill(0);
  const epsilon = 1e-6;

  const f0 = calculateFitness(ingredients, targets, x);

  for (let i = 0; i < n; i++) {
    const xPlus = [...x];
    xPlus[i] += epsilon;
    const fPlus = calculateFitness(ingredients, targets, xPlus);
    grad[i] = (fPlus - f0) / epsilon;
  }

  return grad;
}

// Approximate Hessian using BFGS-like update
function calculateHessianApprox(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
): number[][] {
  const n = ingredients.length;
  const H = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Initialize as identity matrix
  for (let i = 0; i < n; i++) {
    H[i][i] = 1.0;
  }

  return H;
}

// Solve quadratic subproblem using conjugate gradient (renamed to avoid conflict)
function solveQuadraticSubproblemSQP(H: number[][], grad: number[]): number[] {
  const n = grad.length;
  const direction = new Array(n).fill(0);

  // Simple steepest descent direction
  for (let i = 0; i < n; i++) {
    direction[i] = -grad[i];
  }

  return direction;
}

// Line search using backtracking
function lineSearch(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
  direction: number[],
): number {
  let alpha = 1.0;
  const c1 = 1e-4;
  const rho = 0.5;

  const f0 = calculateFitness(ingredients, targets, x);
  const grad = calculateGradient(ingredients, targets, x);
  const gradDotDir = grad.reduce((sum, g, i) => sum + g * direction[i], 0);

  for (let iter = 0; iter < 20; iter++) {
    const xNew = x.map((xi, i) => xi + alpha * direction[i]);
    const fNew = calculateFitness(ingredients, targets, xNew);

    if (fNew <= f0 + c1 * alpha * gradDotDir) {
      return alpha;
    }

    alpha *= rho;
  }

  return alpha;
}

// Remove tiny amounts (< 20g) and refit remaining variables with BVLS to maintain macros
function pruneAndRefit(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
) {
  const keep = x.map((v) => v >= 20); // keep only >= 20g
  if (keep.every((k) => k)) return x.map((v) => Math.round(v * 100) / 100);

  const keptIngredients: Ingredient[] = [];
  const keptInitial: number[] = [];
  for (let i = 0; i < ingredients.length; i++) {
    if (keep[i]) {
      keptIngredients.push(ingredients[i]);
      keptInitial.push(x[i]);
    }
  }
  // Refit only with kept ingredients
  const refit = solveWithBVLS(keptIngredients, targets, keptInitial);

  // Map back to full vector, pruned ones = 0
  const full = new Array(ingredients.length).fill(0);
  let idx = 0;
  for (let i = 0; i < ingredients.length; i++) {
    if (keep[i]) {
      full[i] = refit[idx++];
    } else {
      full[i] = 0;
    }
  }
  return full.map((v) => Math.round(v * 100) / 100);
}

// Advanced Particle Swarm Optimization for precise macro targeting
function solveWithAdvancedPSO(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
) {
  console.log("Starting Advanced Particle Swarm Optimization...");

  const n = ingredients.length;
  const lower = 5; // Minimum 5g for each ingredient
  const upper = 300; // Maximum 300g for each ingredient

  // PSO Parameters
  const numParticles = 50;
  const maxIterations = 500;
  const w = 0.729; // Inertia weight
  const c1 = 1.494; // Cognitive coefficient
  const c2 = 1.494; // Social coefficient

  // Initialize particles
  const particles: Particle[] = [];
  let globalBest: number[] = new Array(n).fill(50);
  let globalBestFitness = Infinity;

  // Create initial swarm
  for (let i = 0; i < numParticles; i++) {
    const particle: Particle = {
      position: new Array(n),
      velocity: new Array(n),
      personalBest: new Array(n),
      personalBestFitness: Infinity,
    };

    // Initialize position with smart distribution
    for (let j = 0; j < n; j++) {
      if (i === 0 && initial && initial.length === n && initial[j] > 0) {
        // Use initial solution as first particle
        particle.position[j] = Math.min(upper, Math.max(lower, initial[j]));
      } else {
        // Smart initialization based on ingredient type
        const ing = ingredients[j];
        let smartAmount = 50;

        if (ing.prot > 15) {
          // High protein ingredient
          smartAmount = 50 + Math.random() * 100;
        } else if (ing.carb > 15) {
          // High carb ingredient
          smartAmount = 80 + Math.random() * 120;
        } else if (ing.fat > 10) {
          // High fat ingredient - conservative
          smartAmount = 10 + Math.random() * 40;
        } else {
          // Vegetables
          smartAmount = 30 + Math.random() * 70;
        }

        particle.position[j] = Math.min(upper, Math.max(lower, smartAmount));
      }

      particle.velocity[j] = (Math.random() - 0.5) * 20; // Small initial velocity
      particle.personalBest[j] = particle.position[j];
    }

    particle.personalBestFitness = calculateFitness(
      ingredients,
      targets,
      particle.position,
    );

    if (particle.personalBestFitness < globalBestFitness) {
      globalBestFitness = particle.personalBestFitness;
      globalBest = [...particle.position];
    }

    particles.push(particle);
  }

  console.log(`Initial best fitness: ${globalBestFitness.toFixed(4)}`);

  // PSO main loop
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < numParticles; i++) {
      const particle = particles[i];

      // Update velocity and position
      for (let j = 0; j < n; j++) {
        const r1 = Math.random();
        const r2 = Math.random();

        // Update velocity
        particle.velocity[j] =
          w * particle.velocity[j] +
          c1 * r1 * (particle.personalBest[j] - particle.position[j]) +
          c2 * r2 * (globalBest[j] - particle.position[j]);

        // Update position
        particle.position[j] += particle.velocity[j];

        // Apply bounds
        particle.position[j] = Math.min(
          upper,
          Math.max(lower, particle.position[j]),
        );
      }

      // Evaluate fitness
      const fitness = calculateFitness(ingredients, targets, particle.position);

      // Update personal best
      if (fitness < particle.personalBestFitness) {
        particle.personalBestFitness = fitness;
        particle.personalBest = [...particle.position];

        // Update global best
        if (fitness < globalBestFitness) {
          globalBestFitness = fitness;
          globalBest = [...particle.position];
        }
      }
    }

    // Log progress
    if (iter % 50 === 0) {
      console.log(
        `PSO iteration ${iter}: Best fitness = ${globalBestFitness.toFixed(4)}`,
      );
      if (globalBestFitness < 1.0) {
        console.log("PSO converged to excellent solution!");
        break;
      }
    }
  }

  console.log(`Final PSO fitness: ${globalBestFitness.toFixed(4)}`);

  // Apply final local optimization
  const refined = localRefinement(globalBest, ingredients, targets);

  return refined.map((v) => Math.round(v * 100) / 100);
}

// Particle interface for PSO
interface Particle {
  position: number[];
  velocity: number[];
  personalBest: number[];
  personalBestFitness: number;
}

// Local refinement using gradient descent
function localRefinement(
  solution: number[],
  ingredients: Ingredient[],
  targets: Targets,
): number[] {
  console.log("Applying local refinement...");

  let x = [...solution];
  const n = x.length;
  const learningRate = 0.5;
  const maxIter = 100;

  for (let iter = 0; iter < maxIter; iter++) {
    // Calculate current macros
    let totalCal = 0,
      totalProt = 0,
      totalCarb = 0,
      totalFat = 0;
    for (let i = 0; i < n; i++) {
      const ing = ingredients[i];
      totalCal += ing.cal * x[i];
      totalProt += ing.prot * x[i];
      totalCarb += ing.carb * x[i];
      totalFat += ing.fat * x[i];
    }

    // Calculate errors
    const calError = totalCal - targets.calories;
    const protError = totalProt - targets.protein;
    const carbError = totalCarb - targets.carbs;
    const fatError = totalFat - targets.fat;

    // Check convergence
    const totalError =
      Math.abs(calError) +
      Math.abs(protError) +
      Math.abs(carbError) +
      Math.abs(fatError);
    if (totalError < 2.0) {
      console.log(`Local refinement converged after ${iter} iterations`);
      break;
    }

    // Update amounts using gradients
    for (let i = 0; i < n; i++) {
      const ing = ingredients[i];

      // Calculate gradient for this ingredient
      const gradient =
        calError * ing.cal * 0.001 +
        protError * ing.prot * 0.002 +
        carbError * ing.carb * 0.003 +
        fatError * ing.fat * 0.004;

      // Update with bounds
      x[i] = Math.min(300, Math.max(5, x[i] - learningRate * gradient));
    }
  }

  return x;
}

// Projected gradient descent to minimize ||A x - b||^2 subject to 10 <= x_i <= 200
function refineWithProjectedGradient(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
  perIngredientBounds?: Record<string, { min: number; max: number }>,
) {
  const n = ingredients.length;
  const lower = 0;
  const upper = 300;

  // Build A (4 x n) and b (4)
  const A: number[][] = [
    ingredients.map((ing) => ing.cal),
    ingredients.map((ing) => ing.prot),
    ingredients.map((ing) => ing.carb),
    ingredients.map((ing) => ing.fat),
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Initialize x
  let x =
    initial && initial.length === n ? [...initial] : new Array(n).fill(50);
  x = x.map((v, i) => {
    const vSafe = Math.min(upper, Math.max(lower, isFinite(v) ? v : 50));
    if (perIngredientBounds) {
      const b = perIngredientBounds[ingredients[i].name];
      if (b) return Math.max(b.min, Math.min(b.max, vSafe));
    }
    return vSafe;
  });

  // Step size based on simple estimate of spectral norm of A^T A
  const lipschitz = estimateLipschitz(A);
  const baseAlpha = 1 / Math.max(lipschitz, 1e-3);

  // Macro weights: prioritize reducing fat error and meeting protein
  const weightCal = 1.0;
  const weightProt = 2.0;
  const weightCarb = 1.5;
  const weightFat = 4.0;

  const maxIter = 600;
  for (let iter = 0; iter < maxIter; iter++) {
    // residuals
    const Ax = matVec(A, x);
    const rRaw = Ax.map((v, i) => v - b[i]);
    const fatExcess = Math.max(0, Ax[3] - targets.fat * 1.0); // penalize being over fat target
    const protDeficit = Math.max(0, targets.protein * 1.0 - Ax[1]);

    // weighted residuals to emphasize fat control and protein attainment
    const r = [
      weightCal * rRaw[0],
      weightProt * rRaw[1] - 0.5 * protDeficit, // nudge up protein if under
      weightCarb * rRaw[2],
      weightFat * rRaw[3] + 2.0 * fatExcess, // strongly push fat down if over
    ];

    // gradient = 2 A^T r
    const grad = AtVec(A, r).map((g) => 2 * g);

    // adaptive step to avoid overshoot
    const alpha = baseAlpha * (0.5 + 0.5 / (1 + iter / 100));

    // gradient step then projection
    for (let j = 0; j < n; j++) {
      let v = x[j] - alpha * grad[j];
      v = Math.min(upper, Math.max(lower, v));
      if (perIngredientBounds) {
        const b = perIngredientBounds[ingredients[j].name];
        if (b) v = Math.max(b.min, Math.min(b.max, v));
      }
      x[j] = v;
    }

    // Additional corrective step if fat is still above max: project along fat coefficients
    const fatNow = matVec(A, x)[3];
    const fatMax = targets.fat * 1.05; // keep within LP tolerance upper bound
    if (fatNow > fatMax) {
      const fatCoeffs = A[3];
      const denom = fatCoeffs.reduce((s, c) => s + c * c, 1e-6);
      const step = (fatNow - fatMax) / denom;
      for (let j = 0; j < n; j++) {
        let v = x[j] - step * fatCoeffs[j];
        v = Math.min(upper, Math.max(lower, v));
        if (perIngredientBounds) {
          const b = perIngredientBounds[ingredients[j].name];
          if (b) v = Math.max(b.min, Math.min(b.max, v));
        }
        x[j] = v;
      }
    }
  }

  // Round to two decimals for stability
  return x.map((v) => Math.round(v * 100) / 100);
}

function matVec(A: number[][], x: number[]) {
  return A.map((row) => row.reduce((s, aij, j) => s + aij * x[j], 0));
}

function AtVec(A: number[][], y: number[]) {
  const m = A.length;
  const n = A[0].length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) out[j] += A[i][j] * y[i];
  }
  return out;
}

function estimateLipschitz(A: number[][]) {
  // crude upper bound: max row norm squared sum
  const n = A[0].length;
  const G = new Array(n).fill(0).map(() => new Array(n).fill(0));
  // G = A^T A
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        G[j][k] += A[i][j] * A[i][k];
      }
    }
  }
  // estimate spectral norm by power iterations (few steps)
  let v = new Array(n).fill(1 / Math.sqrt(n));
  for (let t = 0; t < 10; t++) {
    const w = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) w[j] += G[j][k] * v[k];
    }
    const norm = Math.sqrt(w.reduce((s, val) => s + val * val, 0)) || 1;
    v = w.map((val) => val / norm);
  }
  // Rayleigh quotient v^T G v
  let rq = 0;
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += G[j][k] * v[k];
    rq += v[j] * sum;
  }
  return Math.max(rq, 1);
}

// Convert optimization result back to meal suggestion format
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  console.log("🔄 convertOptimizationToMeal - Input optimization result:", optimizationResult);
  console.log("🔄 convertOptimizationToMeal - Available ingredients:", ingredients.map(i => i.name));
  
  // Create optimized ingredients list from ALL ingredients that have amounts > 0
  const optimizedIngredients: MealSuggestionIngredient[] = [];
  
  // Process each ingredient in the optimization result
  Object.entries(optimizationResult.ingredients).forEach(([ingredientName, amount]) => {
    if (amount > 0) {
      console.log(`🔍 Processing ingredient: ${ingredientName} with amount: ${amount}`);
      
      // Find the ingredient data
      const ingredientData = ingredients.find(ing => 
        ing.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
      );
      
      if (ingredientData) {
        const calories = amount * ingredientData.cal;
        const protein = amount * ingredientData.prot;
        const carbs = amount * ingredientData.carb;
        const fat = amount * ingredientData.fat;

        optimizedIngredients.push({
          name: ingredientData.name,
          amount: Math.round(amount * 100) / 100,
          unit: "g",
          calories: Math.round(calories * 100) / 100,
          protein: Math.round(protein * 100) / 100,
          carbs: Math.round(carbs * 100) / 100,
          fat: Math.round(fat * 100) / 100,
          macrosString: `${Math.round(calories)} cal, ${Math.round(protein)}g protein, ${Math.round(carbs)}g carbs, ${Math.round(fat)}g fat`,
        });
        
        console.log(`✅ Added ingredient: ${ingredientData.name} - ${amount}g`);
      } else {
        console.warn(`⚠️ Ingredient data not found for: ${ingredientName}`);
      }
    }
  });

  console.log(`🧮 Final optimized ingredients count: ${optimizedIngredients.length}`);
  console.log("🧮 Final optimized ingredients:", optimizedIngredients.map(i => `${i.name}: ${i.amount}g`));

  return {
    mealTitle: originalMeal.mealTitle,
    description: `Optimized version of ${originalMeal.mealTitle} - adjusted ingredient quantities to match your exact macro targets using iterative helper selection.`,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions || "Cook ingredients according to preference. Season to taste and serve.",
  };
}
