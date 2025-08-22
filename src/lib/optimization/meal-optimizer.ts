
// Advanced Meal Optimization using Mathematical Programming with Context Intelligence
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
  error?: string;
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

// Enhanced nutrition database with research-based values (per 100g)
const NUTRITION_DATABASE: Record<string, { cal: number; prot: number; carb: number; fat: number }> = {
  // Protein Powders & Supplements
  "whey protein powder": { cal: 412, prot: 85.0, carb: 4.0, fat: 5.0 },
  "casein protein powder": { cal: 380, prot: 80.0, carb: 4.0, fat: 2.0 },
  "plant protein powder": { cal: 390, prot: 75.0, carb: 8.0, fat: 6.0 },

  // Nuts and Seeds (snack-friendly additions)
  "almonds": { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  "walnuts": { cal: 654, prot: 15.2, carb: 13.7, fat: 65.2 },
  "pistachios": { cal: 560, prot: 20.2, carb: 27.2, fat: 45.3 },
  "cashews": { cal: 553, prot: 18.2, carb: 30.2, fat: 43.8 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },
  "flax seeds": { cal: 534, prot: 18.3, carb: 28.9, fat: 42.2 },
  "hemp hearts": { cal: 553, prot: 31.6, carb: 8.7, fat: 48.8 },
  "pumpkin seeds": { cal: 559, prot: 30.2, carb: 10.7, fat: 49.1 },

  // Dairy & Protein Sources
  "greek yogurt non-fat": { cal: 59, prot: 10.0, carb: 3.6, fat: 0.4 },
  "cottage cheese low-fat": { cal: 72, prot: 12.4, carb: 4.3, fat: 1.0 },
  "mozzarella cheese": { cal: 280, prot: 22.2, carb: 2.2, fat: 22.4 },
  "parmesan cheese": { cal: 431, prot: 38.5, carb: 4.1, fat: 29.0 },
  "feta cheese": { cal: 264, prot: 14.2, carb: 4.1, fat: 21.3 },
  "egg whites": { cal: 52, prot: 10.9, carb: 0.7, fat: 0.2 },
  "whole eggs": { cal: 155, prot: 13.0, carb: 1.1, fat: 11.0 },

  // Healthy Fats & Oils
  "olive oil extra virgin": { cal: 884, prot: 0, carb: 0, fat: 100 },
  "avocado oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
  "coconut oil": { cal: 862, prot: 0, carb: 0, fat: 100 },
  "avocado": { cal: 160, prot: 2.0, carb: 8.5, fat: 14.7 },
  "tahini": { cal: 595, prot: 17.0, carb: 21.2, fat: 53.8 },

  // Herbs, Spices & Flavor Enhancers (minimal calories)
  "fresh herbs": { cal: 36, prot: 3.0, carb: 6.3, fat: 0.7 },
  "garlic": { cal: 149, prot: 6.4, carb: 33.1, fat: 0.5 },
  "lemon juice": { cal: 22, prot: 0.4, carb: 6.9, fat: 0.2 },
  "balsamic vinegar": { cal: 88, prot: 0.5, carb: 17.0, fat: 0.0 },

  // Light Carb Additions
  "quinoa": { cal: 368, prot: 14.1, carb: 64.2, fat: 6.1 },
  "brown rice": { cal: 370, prot: 7.9, carb: 77.0, fat: 2.9 },
  "bulgur wheat": { cal: 342, prot: 12.3, carb: 75.9, fat: 1.3 },
  "couscous": { cal: 376, prot: 12.8, carb: 77.4, fat: 0.6 },

  // Vegetables (for volume & nutrients)
  "spinach": { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
  "kale": { cal: 35, prot: 2.9, carb: 4.4, fat: 1.5 },
  "arugula": { cal: 25, prot: 2.6, carb: 3.7, fat: 0.7 },
  "cucumber": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  "bell peppers": { cal: 31, prot: 1.0, carb: 7.0, fat: 0.3 },
  "cherry tomatoes": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "red onion": { cal: 40, prot: 1.1, carb: 9.3, fat: 0.1 },

  // Fruits (for natural sweetness)
  "berries mixed": { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  "apple": { cal: 52, prot: 0.3, carb: 13.8, fat: 0.2 },
  "banana": { cal: 89, prot: 1.1, carb: 22.8, fat: 0.3 },
  "dates": { cal: 277, prot: 1.8, carb: 75.0, fat: 0.2 },

  // Persian/Middle Eastern Specific
  "pomegranate seeds": { cal: 83, prot: 1.7, carb: 18.7, fat: 1.2 },
  "sumac": { cal: 329, prot: 4.6, carb: 71.2, fat: 13.8 },
  "saffron": { cal: 310, prot: 11.4, carb: 65.4, fat: 5.9 },
  "dried mint": { cal: 285, prot: 24.8, carb: 52.0, fat: 6.8 },
  "persian cucumber": { cal: 15, prot: 0.6, carb: 3.6, fat: 0.1 },
  "barberries": { cal: 316, prot: 4.0, carb: 73.8, fat: 3.2 },
};

// Intelligent meal analysis for contextual helper selection
interface MealAnalysis {
  cuisineType: string;
  mainProtein: string[];
  cookingMethod: string[];
  mealStructure: 'rice-based' | 'bread-based' | 'salad-based' | 'soup-based' | 'mixed';
  flavorProfile: 'mediterranean' | 'persian' | 'arabic' | 'indian' | 'neutral';
  servingStyle: 'hot' | 'cold' | 'mixed';
}

function analyzeMealIntelligently(mealTitle: string, ingredients: Ingredient[]): MealAnalysis {
  const title = mealTitle.toLowerCase();
  const ingredientNames = ingredients.map(i => i.name.toLowerCase()).join(' ');

  // Detect cuisine
  let cuisineType = 'neutral';
  if (/kabab|persian|iranian|kebab|polo|tahdig|ghormeh/i.test(title)) cuisineType = 'persian';
  else if (/mediterranean|greek|italian/i.test(title)) cuisineType = 'mediterranean';
  else if (/arabic|lebanese|hummus|falafel/i.test(title)) cuisineType = 'arabic';

  // Detect main proteins
  const mainProteins: string[] = [];
  if (/beef|kabab|koobideh/i.test(ingredientNames)) mainProteins.push('beef');
  if (/chicken|joojeh/i.test(ingredientNames)) mainProteins.push('chicken');
  if (/fish|salmon|cod/i.test(ingredientNames)) mainProteins.push('seafood');
  if (/lamb/i.test(ingredientNames)) mainProteins.push('lamb');

  // Detect cooking methods
  const cookingMethods: string[] = [];
  if (/grill/i.test(title + ingredientNames)) cookingMethods.push('grilled');
  if (/baked|roast/i.test(title + ingredientNames)) cookingMethods.push('baked');
  if (/fried|crispy/i.test(title + ingredientNames)) cookingMethods.push('fried');

  // Detect meal structure
  let mealStructure: MealAnalysis['mealStructure'] = 'mixed';
  if (/rice|basmati|polo/i.test(ingredientNames)) mealStructure = 'rice-based';
  else if (/bread|pita|naan/i.test(ingredientNames)) mealStructure = 'bread-based';
  else if (/salad|mixed greens/i.test(ingredientNames)) mealStructure = 'salad-based';

  // Detect flavor profile
  let flavorProfile: MealAnalysis['flavorProfile'] = 'neutral';
  if (cuisineType === 'persian') flavorProfile = 'persian';
  else if (cuisineType === 'mediterranean') flavorProfile = 'mediterranean';
  else if (cuisineType === 'arabic') flavorProfile = 'arabic';

  // Detect serving style
  let servingStyle: MealAnalysis['servingStyle'] = 'hot';
  if (/salad|cold|chilled/i.test(title + ingredientNames)) servingStyle = 'cold';

  return {
    cuisineType,
    mainProtein: mainProteins,
    cookingMethod: cookingMethods,
    mealStructure,
    flavorProfile,
    servingStyle
  };
}

// Context-intelligent helper generation
function generateIntelligentHelpers(
  mealAnalysis: MealAnalysis, 
  baseIngredients: Ingredient[],
  targets: Targets,
  mealName: string
): Ingredient[] {
  const existing = new Set(baseIngredients.map(i => i.name.toLowerCase().trim()));
  const helpers: Ingredient[] = [];

  console.log("🧠 Intelligent meal analysis:", mealAnalysis);
  
  // Calculate macro deficits to prioritize helper types
  const currentMacros = calculateCurrentMacros(baseIngredients);
  const deficits = {
    protein: Math.max(0, targets.protein - currentMacros.protein),
    carbs: Math.max(0, targets.carbs - currentMacros.carbs),
    fat: Math.max(0, targets.fat - currentMacros.fat),
    calories: Math.max(0, targets.calories - currentMacros.calories)
  };

  console.log("📊 Calculated deficits:", deficits);

  // Helper categories based on meal analysis and deficits
  const helperCategories: string[] = [];

  // PERSIAN/MIDDLE EASTERN CUISINE HELPERS
  if (mealAnalysis.flavorProfile === 'persian') {
    console.log("🏛️ Adding Persian-specific helpers");
    
    // High-protein helpers that work with Persian kabab/meat dishes
    if (deficits.protein > 5) {
      helperCategories.push('greek yogurt non-fat', 'cottage cheese low-fat', 'feta cheese');
      helperCategories.push('almonds', 'pistachios', 'walnuts'); // Traditional Persian nuts
    }
    
    // Persian-compatible carbs
    if (deficits.carbs > 10) {
      helperCategories.push('brown rice', 'quinoa'); // Don't compete with bread
    }
    
    // Traditional Persian additions
    helperCategories.push('pomegranate seeds', 'fresh herbs', 'sumac');
    
    // Healthy fats compatible with Persian cuisine
    if (deficits.fat > 2) {
      helperCategories.push('olive oil extra virgin', 'tahini');
    }
  }

  // PROTEIN DEFICIT HELPERS (aggressive for lunch meals)
  if (deficits.protein > 10) {
    console.log("💪 Major protein deficit - adding protein-rich helpers");
    
    if (mealName.toLowerCase().includes('snack')) {
      helperCategories.push('greek yogurt non-fat', 'cottage cheese low-fat', 'almonds', 'hemp hearts');
    } else {
      // For meals, add high-protein helpers that won't conflict
      helperCategories.push('greek yogurt non-fat', 'cottage cheese low-fat', 'parmesan cheese', 'egg whites');
      
      // Add protein-rich nuts/seeds
      helperCategories.push('almonds', 'hemp hearts', 'chia seeds');
    }
  }

  // MODERATE PROTEIN DEFICIT 
  else if (deficits.protein > 5) {
    helperCategories.push('greek yogurt non-fat', 'almonds', 'cottage cheese low-fat');
  }

  // FAT DEFICIT HELPERS
  if (deficits.fat > 3) {
    if (mealAnalysis.servingStyle === 'cold' || mealAnalysis.mealStructure === 'salad-based') {
      helperCategories.push('olive oil extra virgin', 'avocado', 'tahini');
    } else {
      helperCategories.push('olive oil extra virgin', 'almonds', 'cashews', 'walnuts');
    }
  }

  // CARB DEFICIT HELPERS
  if (deficits.carbs > 15) {
    // For bread-based meals, add complementary carbs
    helperCategories.push('brown rice', 'quinoa', 'sweet potato raw');
    helperCategories.push('dates', 'berries mixed'); // Natural sugars
  }

  // FLAVOR ENHANCERS (always helpful)
  helperCategories.push('fresh herbs', 'garlic', 'lemon juice');

  // PERSIAN-SPECIFIC FLAVOR HELPERS
  if (mealAnalysis.flavorProfile === 'persian') {
    helperCategories.push('sumac', 'dried mint', 'persian cucumber', 'barberries');
  }

  // Convert categories to ingredients, prioritizing by deficit severity
  const prioritizedCategories = [...new Set(helperCategories)];
  
  for (const category of prioritizedCategories.slice(0, 10)) { // Allow more helpers
    if (!existing.has(category)) {
      const nutrition = NUTRITION_DATABASE[category];
      if (nutrition) {
        helpers.push({
          name: formatIngredientName(category),
          cal: nutrition.cal / 100,
          prot: nutrition.prot / 100,
          carb: nutrition.carb / 100,
          fat: nutrition.fat / 100
        });
        existing.add(category);
      }
    }
  }

  console.log("🎯 Generated intelligent helpers:", helpers.map(h => h.name));
  console.log(`📊 Helper count: ${helpers.length} (protein-rich: ${helpers.filter(h => h.prot > 0.05).length})`);
  
  return helpers;
}

function calculateCurrentMacros(ingredients: Ingredient[]): { protein: number; carbs: number; fat: number; calories: number } {
  // Estimate current macros assuming average portion sizes
  const avgPortionSize = 80; // grams average
  return ingredients.reduce((total, ing) => ({
    protein: total.protein + (ing.prot * avgPortionSize),
    carbs: total.carbs + (ing.carb * avgPortionSize),
    fat: total.fat + (ing.fat * avgPortionSize),
    calories: total.calories + (ing.cal * avgPortionSize)
  }), { protein: 0, carbs: 0, fat: 0, calories: 0 });
}

// High-precision mathematical optimization using advanced algorithms
export function optimizeMealAdvanced(
  ingredients: Ingredient[],
  targets: Targets,
  mealName: string = 'meal'
): OptimizationResult {
  console.log("🎯 Starting Advanced Precision Meal Optimization");
  console.log("📊 Targets:", targets);
  console.log("🧪 Input ingredients:", ingredients.map(i => i.name));

  try {
    // Phase 1: Intelligent meal analysis
    const baseIngredients = deduplicateIngredients(ingredients);
    const mealAnalysis = analyzeMealIntelligently(mealName, baseIngredients);
    console.log("🧠 Meal analysis completed");

    // Phase 2: Generate intelligent helpers
    const intelligentHelpers = generateIntelligentHelpers(mealAnalysis, baseIngredients, targets, mealName);
    console.log("🎯 Intelligent helpers generated:", intelligentHelpers.length);

    // Phase 3: High-precision optimization
    return performHighPrecisionOptimization(baseIngredients, intelligentHelpers, targets, mealAnalysis);

  } catch (error: any) {
    console.error("❌ Advanced optimization failed:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error?.message || String(error)
    };
  }
}

// High-precision optimization using advanced mathematical programming
function performHighPrecisionOptimization(
  baseIngredients: Ingredient[],
  helpers: Ingredient[],
  targets: Targets,
  mealAnalysis: MealAnalysis
): OptimizationResult {
  console.log("\n🔬 === HIGH-PRECISION MATHEMATICAL OPTIMIZATION ===");

  // Step 1: Try base ingredients with ultra-high precision
  console.log("📊 Phase 1: Ultra-High Precision Base Optimization");
  let bestSolution = solveUltraHighPrecisionProblem(baseIngredients, targets, mealAnalysis);

  if (!bestSolution) {
    throw new Error("Failed to solve base optimization problem");
  }

  const baseAccuracy = calculatePrecisionScore(bestSolution.achieved, targets);
  console.log("📈 Base solution precision score:", baseAccuracy.toFixed(4));

  // Step 2: Ultra-tight precision check (±2% for all macros)
  const ultraPrecisionThreshold = 0.02;
  if (isWithinUltraPrecisionThreshold(bestSolution.achieved, targets, ultraPrecisionThreshold)) {
    console.log("✅ Base ingredients meet ultra-precision requirements!");
    return bestSolution;
  }

  // Step 3: Intelligent helper optimization
  console.log("📊 Phase 2: Intelligent Helper Optimization");
  const enhancedSolution = performIntelligentHelperOptimization(
    baseIngredients, 
    helpers, 
    targets, 
    mealAnalysis,
    bestSolution
  );

  if (enhancedSolution && calculatePrecisionScore(enhancedSolution.achieved, targets) > baseAccuracy) {
    console.log("🎉 Helper optimization achieved better precision!");
    return enhancedSolution;
  }

  console.log("🏁 Returning base solution as optimal");
  return bestSolution;
}

// Ultra-high precision quadratic programming solver
function solveUltraHighPrecisionProblem(
  ingredients: Ingredient[],
  targets: Targets,
  mealAnalysis: MealAnalysis
): OptimizationResult | null {
  const n = ingredients.length;
  if (n === 0) return null;

  console.log("🔢 Solving with", n, "ingredients for ultra-high precision");

  // Build enhanced constraint matrix
  const A = [
    ingredients.map(ing => ing.cal),   // Calories
    ingredients.map(ing => ing.prot),  // Protein  
    ingredients.map(ing => ing.carb),  // Carbs
    ingredients.map(ing => ing.fat)    // Fat
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Intelligent bounds based on meal analysis
  const bounds = ingredients.map(ing => getIntelligentBounds(ing, mealAnalysis, targets));

  // Ultra-smart initialization using target decomposition
  let x = ingredients.map((ing, i) => {
    const estimate = estimateOptimalContribution(ing, targets, ingredients, i);
    const bounds_i = bounds[i];
    return Math.max(bounds_i.min, Math.min(bounds_i.max, estimate));
  });

  // Ultra-high precision parameters
  const maxIterations = 1000;
  const tolerance = 1e-10;  // Ultra-tight tolerance
  const precisionWeights = [1.0, 3.0, 2.0, 4.0]; // [cal, prot, carb, fat] - prioritize protein & fat accuracy

  let bestSolution: number[] | null = null;
  let bestError = Infinity;

  // Advanced iterative solver with adaptive learning
  for (let iter = 0; iter < maxIterations; iter++) {
    const current = calculateAchievement(A, x);
    
    // Ultra-high precision error calculation
    const errors = [
      (current[0] - targets.calories) / Math.max(targets.calories, 1),
      (current[1] - targets.protein) / Math.max(targets.protein, 1),
      (current[2] - targets.carbs) / Math.max(targets.carbs, 1),
      (current[3] - targets.fat) / Math.max(targets.fat, 1)
    ];

    const weightedError = errors.reduce((sum, err, i) => sum + precisionWeights[i] * err * err, 0);

    // Track best solution
    if (weightedError < bestError) {
      bestError = weightedError;
      bestSolution = [...x];
    }

    // Ultra-tight convergence check
    const gradientNorm = calculateGradientNorm(A, b, x, precisionWeights);
    if (gradientNorm < tolerance) {
      console.log("✅ Converged at iteration", iter, "with gradient norm", gradientNorm.toFixed(12));
      break;
    }

    // Adaptive learning with momentum and regularization
    const learningRate = 0.05 / (1 + iter / 200);  // More conservative learning
    const gradient = calculateGradient(A, b, x, precisionWeights);
    
    // Apply gradient descent with bound constraints
    for (let j = 0; j < n; j++) {
      const newValue = x[j] - learningRate * gradient[j];
      x[j] = Math.max(bounds[j].min, Math.min(bounds[j].max, newValue));
    }

    // Every 50 iterations, add small random perturbation to escape local minima
    if (iter % 50 === 49 && iter < maxIterations - 100) {
      for (let j = 0; j < n; j++) {
        const perturbation = (Math.random() - 0.5) * 2.0; // ±1g perturbation
        const bounds_j = bounds[j];
        x[j] = Math.max(bounds_j.min, Math.min(bounds_j.max, x[j] + perturbation));
      }
    }
  }

  if (bestSolution) {
    const finalAchieved = calculateAchievement(A, bestSolution);
    const precisionScore = calculatePrecisionScore(finalAchieved, [targets.calories, targets.protein, targets.carbs, targets.fat]);
    
    console.log("🎯 Final precision score:", precisionScore.toFixed(6));
    console.log("📊 Final macros achieved:", {
      calories: finalAchieved[0].toFixed(2),
      protein: finalAchieved[1].toFixed(2), 
      carbs: finalAchieved[2].toFixed(2),
      fat: finalAchieved[3].toFixed(2)
    });

    return {
      feasible: true,
      result: bestError,
      ingredients: Object.fromEntries(
        ingredients.map((ing, i) => [ing.name, Math.round(bestSolution![i] * 100) / 100])
      ),
      achieved: {
        calories: Math.round(finalAchieved[0] * 100) / 100,
        protein: Math.round(finalAchieved[1] * 100) / 100,
        carbs: Math.round(finalAchieved[2] * 100) / 100,
        fat: Math.round(finalAchieved[3] * 100) / 100
      }
    };
  }

  return null;
}

// Intelligent helper optimization with culinary logic
function performIntelligentHelperOptimization(
  baseIngredients: Ingredient[],
  helpers: Ingredient[],
  targets: Targets,
  mealAnalysis: MealAnalysis,
  baseSolution: OptimizationResult
): OptimizationResult | null {

  const deficits = analyzeNutritionalDeficits(baseSolution.achieved, targets);
  console.log("🔍 Nutritional deficits:", deficits);

  // Identify critical deficits (>15% off target)
  const criticalDeficits = [];
  if (Math.abs(deficits.protein.relative) > 0.15) criticalDeficits.push('protein');
  if (Math.abs(deficits.carbs.relative) > 0.15) criticalDeficits.push('carbs');  
  if (Math.abs(deficits.fat.relative) > 0.15) criticalDeficits.push('fat');
  if (Math.abs(deficits.calories.relative) > 0.15) criticalDeficits.push('calories');

  console.log("🚨 Critical deficits needing helpers:", criticalDeficits);

  // If we have critical deficits, be more aggressive about adding helpers
  const shouldForceHelpers = criticalDeficits.length > 0;

  // Score helpers with culinary intelligence
  const scoredHelpers = helpers
    .map(helper => ({
      ingredient: helper,
      score: calculateIntelligentHelperScore(helper, deficits, mealAnalysis, baseIngredients),
      reason: getHelperReason(helper, deficits, mealAnalysis),
      addresses: getDeficitsAddressed(helper, deficits)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Consider top 3 helpers

  console.log("🏆 Top intelligent helpers:", 
    scoredHelpers.map(h => `${h.ingredient.name}: ${h.score.toFixed(3)} (${h.reason}) - addresses: ${h.addresses.join(', ')}`)
  );

  // For Persian kabab meals with protein deficit, add specific helpers
  if (mealAnalysis.flavorProfile === 'persian' && deficits.protein.relative > 0.2) {
    console.log("🎯 Persian meal with major protein deficit - adding contextual protein helpers");
    
    // Add yogurt-based helpers for Persian meals
    const proteinHelpers = [
      { name: 'Greek Yogurt Non-Fat', cal: 0.59, prot: 0.10, carb: 0.036, fat: 0.004 },
      { name: 'Kashk', cal: 1.20, prot: 0.08, carb: 0.12, fat: 0.01 },  // Persian dried yogurt
      { name: 'Cottage Cheese Low-Fat', cal: 0.72, prot: 0.124, carb: 0.043, fat: 0.01 }
    ];

    for (const helper of proteinHelpers) {
      const testIngredients = [...baseIngredients, helper];
      const testSolution = solveUltraHighPrecisionProblem(testIngredients, targets, mealAnalysis);

      if (testSolution) {
        const proteinImprovement = Math.abs(testSolution.achieved.protein - targets.protein) < Math.abs(baseSolution.achieved.protein - targets.protein);
        const overallAccuracy = calculatePrecisionScore(testSolution.achieved, targets);
        
        console.log(`📊 Persian helper ${helper.name}: protein improvement: ${proteinImprovement}, accuracy: ${overallAccuracy.toFixed(4)}`);
        
        if (proteinImprovement && overallAccuracy > 0.6) {
          console.log(`🎉 Adding Persian helper: ${helper.name} for protein deficit`);
          return testSolution;
        }
      }
    }
  }

  // Test each helper individually
  for (const helperData of scoredHelpers) {
    const testIngredients = [...baseIngredients, helperData.ingredient];
    const testSolution = solveUltraHighPrecisionProblem(testIngredients, targets, mealAnalysis);

    if (testSolution) {
      const improvement = calculatePrecisionImprovement(baseSolution, testSolution, targets);
      const baseAccuracy = calculatePrecisionScore(baseSolution.achieved, targets);
      const newAccuracy = calculatePrecisionScore(testSolution.achieved, targets);
      
      console.log(`📊 Helper ${helperData.ingredient.name}: improvement: ${improvement.toFixed(6)}, accuracy: ${baseAccuracy.toFixed(4)} → ${newAccuracy.toFixed(4)}`);

      // Accept helper if it improves accuracy or addresses critical deficits
      const shouldAccept = improvement > 0.05 || 
                          (shouldForceHelpers && newAccuracy > 0.5 && helperData.addresses.some(d => criticalDeficits.includes(d)));

      if (shouldAccept) {
        console.log(`✅ Accepting helper: ${helperData.ingredient.name} - ${helperData.reason}`);
        return testSolution;
      }
    }
  }

  // If we have critical deficits and no helper worked well, try combinations
  if (shouldForceHelpers && scoredHelpers.length >= 2) {
    console.log("🔄 Trying helper combinations for critical deficits...");
    
    const combo = [scoredHelpers[0].ingredient, scoredHelpers[1].ingredient];
    const testIngredients = [...baseIngredients, ...combo];
    const testSolution = solveUltraHighPrecisionProblem(testIngredients, targets, mealAnalysis);
    
    if (testSolution) {
      const newAccuracy = calculatePrecisionScore(testSolution.achieved, targets);
      const baseAccuracy = calculatePrecisionScore(baseSolution.achieved, targets);
      
      console.log(`📊 Helper combination accuracy: ${baseAccuracy.toFixed(4)} → ${newAccuracy.toFixed(4)}`);
      
      if (newAccuracy > baseAccuracy + 0.05) {
        console.log(`✅ Accepting helper combination: ${combo.map(h => h.name).join(' + ')}`);
        return testSolution;
      }
    }
  }

  return null;
}

function getDeficitsAddressed(helper: Ingredient, deficits: any): string[] {
  const addressed = [];
  
  if (helper.prot > 0.05 && deficits.protein.relative > 0.1) addressed.push('protein');
  if (helper.carb > 0.1 && deficits.carbs.relative > 0.1) addressed.push('carbs');
  if (helper.fat > 0.05 && deficits.fat.relative > 0.1) addressed.push('fat');
  if (helper.cal > 0.5 && deficits.calories.relative > 0.1) addressed.push('calories');
  
  return addressed;
}

// Intelligent bounds based on meal analysis and ingredient type
function getIntelligentBounds(
  ingredient: Ingredient, 
  mealAnalysis: MealAnalysis,
  targets: Targets
): { min: number; max: number } {
  const name = ingredient.name.toLowerCase();
  
  // Base multiplier based on meal structure
  let baseMultiplier = 1.0;
  if (mealAnalysis.mealStructure === 'rice-based') baseMultiplier = 1.2;
  else if (mealAnalysis.mealStructure === 'salad-based') baseMultiplier = 0.8;

  // Target-aware scaling
  const targetScale = Math.max(0.5, Math.min(2.0, targets.calories / 500));

  // Ingredient-specific intelligent bounds
  if (/oil|tahini/.test(name)) {
    return { min: 2 * baseMultiplier, max: 12 * baseMultiplier * targetScale };
  } else if (/cheese|parmesan|feta/.test(name)) {
    return { min: 8 * baseMultiplier, max: 25 * baseMultiplier * targetScale };
  } else if (/nuts|seeds|almond|walnut|pistachio/.test(name)) {
    return { min: 5 * baseMultiplier, max: 35 * baseMultiplier * targetScale };
  } else if (/yogurt|cottage/.test(name)) {
    return { min: 30 * baseMultiplier, max: 120 * baseMultiplier * targetScale };
  } else if (/rice|quinoa|bulgur/.test(name)) {
    // Be more generous with primary carbs
    return { min: 40 * baseMultiplier, max: 200 * baseMultiplier * targetScale };
  } else if (/meat|beef|chicken|protein/.test(name)) {
    return { min: 40 * baseMultiplier, max: 150 * baseMultiplier * targetScale };
  } else if (/herbs|spices|garlic|lemon/.test(name)) {
    return { min: 1 * baseMultiplier, max: 8 * baseMultiplier };
  } else if (/vegetable|tomato|pepper|cucumber/.test(name)) {
    return { min: 20 * baseMultiplier, max: 200 * baseMultiplier * targetScale };
  } else {
    return { min: 10 * baseMultiplier, max: 100 * baseMultiplier * targetScale };
  }
}

// Optimal contribution estimation using advanced heuristics
function estimateOptimalContribution(
  ingredient: Ingredient, 
  targets: Targets, 
  allIngredients: Ingredient[],
  index: number
): number {
  // Multi-factor estimation considering ingredient's macro profile
  const macroContributions = [
    ingredient.cal > 0 ? targets.calories / (ingredient.cal * allIngredients.length) : 50,
    ingredient.prot > 0 ? targets.protein / (ingredient.prot * allIngredients.length) : 50,
    ingredient.carb > 0 ? targets.carbs / (ingredient.carb * allIngredients.length) : 50,
    ingredient.fat > 0 ? targets.fat / (ingredient.fat * allIngredients.length) : 50
  ];

  // Weight contributions based on ingredient's dominant macro
  const dominantMacroValue = Math.max(ingredient.cal, ingredient.prot * 4, ingredient.carb * 4, ingredient.fat * 9);
  let weights = [1, 1, 1, 1];

  if (ingredient.prot * 4 === dominantMacroValue) weights = [1, 3, 1, 1]; // Protein-dominant
  else if (ingredient.carb * 4 === dominantMacroValue) weights = [1, 1, 3, 1]; // Carb-dominant  
  else if (ingredient.fat * 9 === dominantMacroValue) weights = [1, 1, 1, 3]; // Fat-dominant

  const weightedAverage = macroContributions.reduce((sum, contrib, i) => sum + contrib * weights[i], 0) / weights.reduce((sum, w) => sum + w, 0);
  
  return Math.max(5, Math.min(150, weightedAverage));
}

// Advanced helper scoring with culinary intelligence
function calculateIntelligentHelperScore(
  helper: Ingredient,
  deficits: any,
  mealAnalysis: MealAnalysis,
  baseIngredients: Ingredient[]
): number {
  const name = helper.name.toLowerCase();
  let score = 0;

  // Primary scoring: Address nutritional deficits effectively with higher weights for critical needs
  if (deficits.protein.relative > 0.1) {
    const proteinScore = helper.prot * 300 * Math.abs(deficits.protein.relative);
    score += proteinScore;
    
    // Bonus for high-protein helpers when protein deficit is severe
    if (deficits.protein.relative > 0.3 && helper.prot > 0.08) {
      score += 50; // Major bonus for protein powerhouses
    }
  }
  
  if (deficits.carbs.relative > 0.1) {
    score += helper.carb * 120 * Math.abs(deficits.carbs.relative);
  }
  
  if (deficits.fat.relative > 0.1) {
    score += helper.fat * 180 * Math.abs(deficits.fat.relative);
  }
  
  if (deficits.calories.relative > 0.1) {
    score += helper.cal * 60 * Math.abs(deficits.calories.relative);
  }

  // Persian meal protein emergency bonus
  if (mealAnalysis.flavorProfile === 'persian' && deficits.protein.relative > 0.2) {
    if (/yogurt|cottage|cheese|almond|pistachio/.test(name)) {
      score += 75; // Emergency protein bonus for Persian-compatible sources
    }
  }

  // Culinary compatibility scoring
  const cuisineBonus = getCuisineCompatibilityBonus(helper, mealAnalysis);
  score += cuisineBonus;

  // Penalize inappropriate combinations (but less harsh)
  const incompatibilityPenalty = getIncompatibilityPenalty(helper, baseIngredients, mealAnalysis);
  score -= incompatibilityPenalty * 0.5; // Reduce penalty impact

  // Bonus for versatile ingredients that enhance the dish
  const versatilityBonus = getVersatilityBonus(helper, mealAnalysis);
  score += versatilityBonus;

  // Special bonus for ingredients that can significantly help
  if (helper.prot > 0.1) score += 20; // High-protein bonus
  if (helper.cal > 2.0) score += 15;  // Calorie-dense bonus
  
  return Math.max(0, score);
}

function getCuisineCompatibilityBonus(helper: Ingredient, mealAnalysis: MealAnalysis): number {
  const name = helper.name.toLowerCase();
  
  if (mealAnalysis.flavorProfile === 'persian') {
    if (/pomegranate|sumac|barberries|saffron|mint|tahini/.test(name)) return 15;
    if (/almonds|pistachios|herbs|lemon/.test(name)) return 10;
    if (/olive oil|yogurt|cucumber/.test(name)) return 8;
  } else if (mealAnalysis.flavorProfile === 'mediterranean') {
    if (/feta|olive oil|arugula|balsamic/.test(name)) return 12;
    if (/herbs|lemon|parmesan/.test(name)) return 8;
  }

  return 0;
}

function getIncompatibilityPenalty(
  helper: Ingredient, 
  baseIngredients: Ingredient[], 
  mealAnalysis: MealAnalysis
): number {
  const helperName = helper.name.toLowerCase();
  const baseNames = baseIngredients.map(i => i.name.toLowerCase()).join(' ');

  // Heavy penalty for protein conflicts
  if (/chicken|beef|lamb|fish/.test(helperName)) {
    if (/chicken|beef|lamb|fish/.test(baseNames)) {
      return 1000; // Massive penalty for mixing main proteins
    }
  }

  // Penalty for carb conflicts in rice-based dishes
  if (mealAnalysis.mealStructure === 'rice-based' && /quinoa|bulgur|pasta|bread/.test(helperName)) {
    return 500;
  }

  // Penalty for excessive fat additions
  if (/oil|butter|cheese/.test(baseNames) && /oil|butter|nuts|seeds|avocado/.test(helperName)) {
    return 200;
  }

  return 0;
}

function getVersatilityBonus(helper: Ingredient, mealAnalysis: MealAnalysis): number {
  const name = helper.name.toLowerCase();

  // Universal enhancers
  if (/herbs|garlic|lemon|olive oil/.test(name)) return 5;
  
  // Texture enhancers
  if (/nuts|seeds/.test(name) && mealAnalysis.mealStructure !== 'soup-based') return 4;
  
  // Nutritional powerhouses
  if (/yogurt|cottage cheese/.test(name)) return 6;

  return 0;
}

function getHelperReason(
  helper: Ingredient, 
  deficits: any, 
  mealAnalysis: MealAnalysis
): string {
  const name = helper.name.toLowerCase();

  if (deficits.protein.relative > 0.1 && helper.prot > 0.15) {
    return "high protein to address deficit";
  }
  if (deficits.fat.relative > 0.1 && helper.fat > 0.3) {
    return "healthy fats for deficit";
  }
  if (mealAnalysis.flavorProfile === 'persian' && /pomegranate|sumac|barberries/.test(name)) {
    return "Persian flavor enhancement";
  }
  if (/herbs|lemon|garlic/.test(name)) {
    return "flavor enhancement";
  }
  
  return "nutritional balance";
}

// Ultra-precision utility functions
function calculatePrecisionScore(achieved: number[] | any, targets: number[] | Targets): number {
  const achievedArray = Array.isArray(achieved) ? achieved : [achieved.calories, achieved.protein, achieved.carbs, achieved.fat];
  const targetsArray = Array.isArray(targets) ? targets : [targets.calories, targets.protein, targets.carbs, targets.fat];
  
  const accuracies = achievedArray.map((val, i) => {
    const target = targetsArray[i];
    if (target === 0) return val === 0 ? 1 : 0;
    return Math.max(0, 1 - Math.abs(val - target) / target);
  });

  // Weighted precision score
  const weights = [1, 3, 2, 4]; // Prioritize protein and fat precision
  return accuracies.reduce((sum, acc, i) => sum + acc * weights[i], 0) / weights.reduce((a, b) => a + b, 0);
}

function calculatePrecisionImprovement(baseSolution: OptimizationResult, testSolution: OptimizationResult, targets: Targets): number {
  const basePrecision = calculatePrecisionScore(baseSolution.achieved, targets);
  const testPrecision = calculatePrecisionScore(testSolution.achieved, targets);
  return testPrecision - basePrecision;
}

function isWithinUltraPrecisionThreshold(achieved: any, targets: Targets, threshold: number): boolean {
  const accuracies = [
    Math.abs(achieved.calories - targets.calories) / Math.max(1, targets.calories),
    Math.abs(achieved.protein - targets.protein) / Math.max(1, targets.protein),
    Math.abs(achieved.carbs - targets.carbs) / Math.max(1, targets.carbs),
    Math.abs(achieved.fat - targets.fat) / Math.max(1, targets.fat)
  ];

  return accuracies.every(acc => acc <= threshold);
}

// Utility functions (keeping essential ones)
function formatIngredientName(key: string): string {
  return key.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

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

function calculateAchievement(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((sum, coeff, j) => sum + coeff * x[j], 0));
}

function calculateGradient(A: number[][], b: number[], x: number[], weights: number[]): number[] {
  const current = calculateAchievement(A, x);
  const residuals = current.map((val, i) => weights[i] * (val - b[i]) / Math.max(1, Math.abs(b[i])));

  return x.map((_, j) => {
    return A.reduce((sum, row, i) => sum + 2 * row[j] * residuals[i], 0);
  });
}

function calculateGradientNorm(A: number[][], b: number[], x: number[], weights: number[]): number {
  const grad = calculateGradient(A, b, x, weights);
  return Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
}

function analyzeNutritionalDeficits(achieved: any, targets: Targets) {
  return {
    calories: { 
      absolute: targets.calories - achieved.calories, 
      relative: (targets.calories - achieved.calories) / Math.max(1, targets.calories) 
    },
    protein: { 
      absolute: targets.protein - achieved.protein, 
      relative: (targets.protein - achieved.protein) / Math.max(1, targets.protein) 
    },
    carbs: { 
      absolute: targets.carbs - achieved.carbs, 
      relative: (targets.carbs - achieved.carbs) / Math.max(1, targets.carbs) 
    },
    fat: { 
      absolute: targets.fat - achieved.fat, 
      relative: (targets.fat - achieved.fat) / Math.max(1, targets.fat) 
    }
  };
}

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => {
    let calories = Number(ing.calories ?? ing.kcal ?? ing.cal ?? 0) || 0;
    let protein = Number(ing.protein ?? ing.prot ?? ing.proteins ?? 0) || 0;
    let carbs = Number(ing.carbs ?? ing.carb ?? ing.carbohydrates ?? 0) || 0;
    let fat = Number(ing.fat ?? ing.fats ?? 0) || 0;

    // Fallback to nutrition database if needed
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      const fallback = NUTRITION_DATABASE[ing.name.toLowerCase()] || { cal: 100, prot: 5, carb: 15, fat: 3 };
      calories = fallback.cal;
      protein = fallback.prot;
      carbs = fallback.carb;
      fat = fallback.fat;
    }

    const amount = Number(ing.amount ?? ing.quantity ?? 100);

    return {
      name: ing.name,
      cal: amount > 0 ? calories / amount : 0,
      prot: amount > 0 ? protein / amount : 0,
      carb: amount > 0 ? carbs / amount : 0,
      fat: amount > 0 ? fat / amount : 0,
    };
  });
}

// Create targets from macro data
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

// Convert optimization result to meal format
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  console.log("🔄 Converting optimization result to meal format");

  const optimizedIngredients: MealSuggestionIngredient[] = [];

  Object.entries(optimizationResult.ingredients).forEach(([ingredientName, amount]) => {
    if (amount > 0) {
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
      }
    }
  });

  return {
    mealTitle: originalMeal.mealTitle,
    description: `Precision-optimized ${originalMeal.mealTitle} using advanced mathematical programming with intelligent, contextually-appropriate ingredient selection.`,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions || "Combine ingredients according to preference and traditional preparation methods.",
  };
}

// Main optimization function
export const optimizeMeal = optimizeMealAdvanced;
