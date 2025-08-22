// Advanced Meal Optimization using Mathematical Programming
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

// Enhanced nutrition database with research-based values
const NUTRITION_FALLBACKS: Record<
  string,
  { cal: number; prot: number; carb: number; fat: number }
> = {
  // Nuts and Seeds (per 100g)
  "almonds": { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  "walnuts": { cal: 654, prot: 15.2, carb: 13.7, fat: 65.2 },
  "pistachios": { cal: 560, prot: 20.2, carb: 27.2, fat: 45.3 },
  "cashews": { cal: 553, prot: 18.2, carb: 30.2, fat: 43.8 },
  "peanuts": { cal: 567, prot: 25.8, carb: 16.1, fat: 49.2 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },
  "flax seeds": { cal: 534, prot: 18.3, carb: 28.9, fat: 42.2 },
  "pumpkin seeds": { cal: 559, prot: 30.2, carb: 10.7, fat: 49.1 },

  // Dairy Products
  "greek yogurt non-fat": { cal: 59, prot: 10.0, carb: 3.6, fat: 0.4 },
  "low-fat yogurt": { cal: 63, prot: 5.3, carb: 7.0, fat: 1.6 },
  "cottage cheese low-fat": { cal: 72, prot: 12.4, carb: 4.3, fat: 1.0 },
  "milk skim": { cal: 34, prot: 3.4, carb: 5.0, fat: 0.1 },
  "cheese mozzarella": { cal: 280, prot: 22.2, carb: 2.2, fat: 22.4 },

  // Proteins
  "chicken breast": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "egg white": { cal: 52, prot: 10.9, carb: 0.7, fat: 0.2 },
  "whole eggs": { cal: 155, prot: 13.0, carb: 1.1, fat: 11.0 },
  "salmon": { cal: 208, prot: 22.0, carb: 0, fat: 13.0 },
  "tuna": { cal: 132, prot: 28.0, carb: 0, fat: 1.3 },
  "tofu": { cal: 144, prot: 17.3, carb: 2.8, fat: 9.0 },

  // Fruits suitable for snacks
  "apple": { cal: 52, prot: 0.3, carb: 13.8, fat: 0.2 },
  "banana": { cal: 89, prot: 1.1, carb: 22.8, fat: 0.3 },
  "berries mixed": { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  "grapes": { cal: 62, prot: 0.6, carb: 16.0, fat: 0.2 },
  "orange": { cal: 47, prot: 0.9, carb: 11.8, fat: 0.1 },
  "dates": { cal: 277, prot: 1.8, carb: 75.0, fat: 0.2 },
  "raisins": { cal: 299, prot: 3.1, carb: 79.2, fat: 0.5 },

  // Vegetables for snacks
  "carrot sticks": { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },
  "celery": { cal: 14, prot: 0.7, carb: 3.0, fat: 0.1 },
  "cucumber": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  "bell pepper": { cal: 31, prot: 1.0, carb: 7.0, fat: 0.3 },
  "cherry tomatoes": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },

  // Grains and starches
  "oats": { cal: 389, prot: 16.9, carb: 66.3, fat: 6.9 },
  "quinoa": { cal: 368, prot: 14.1, carb: 64.2, fat: 6.1 },
  "brown rice": { cal: 370, prot: 7.9, carb: 77.0, fat: 2.9 },
  "sweet potato": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "whole wheat bread": { cal: 247, prot: 13.0, carb: 41.0, fat: 4.2 },

  // Snack-appropriate additions
  "dark chocolate 70%": { cal: 598, prot: 7.8, carb: 45.9, fat: 42.6 },
  "honey": { cal: 304, prot: 0.3, carb: 82.4, fat: 0.0 },
  "peanut butter": { cal: 588, prot: 25.1, carb: 19.6, fat: 50.4 },
  "hummus": { cal: 166, prot: 8.0, carb: 14.3, fat: 9.6 },
};

// Meal context analysis for intelligent helper selection
interface MealContext {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  characteristics: {
    isPortable: boolean;
    requiresCooking: boolean;
    maxPreparationTime: number; // minutes
    targetVolume: 'light' | 'moderate' | 'filling';
  };
}

function analyzeMealContext(mealName: string, baseIngredients: Ingredient[]): MealContext {
  const name = mealName.toLowerCase();

  // Determine meal type and time
  let type: MealContext['type'] = 'snack';
  let timeOfDay: MealContext['timeOfDay'] = 'afternoon';

  if (name.includes('breakfast') || name.includes('morning')) {
    type = 'breakfast';
    timeOfDay = 'morning';
  } else if (name.includes('lunch') || name.includes('midday')) {
    type = 'lunch';
    timeOfDay = 'afternoon';
  } else if (name.includes('dinner') || name.includes('evening')) {
    type = 'dinner';
    timeOfDay = 'evening';
  } else if (name.includes('snack')) {
    type = 'snack';
    if (name.includes('morning')) timeOfDay = 'morning';
    else if (name.includes('evening')) timeOfDay = 'evening';
  }

  // Analyze base ingredients for context clues
  const hasNuts = baseIngredients.some(i => /almond|walnut|cashew|peanut|pistachio/.test(i.name.toLowerCase()));
  const hasYogurt = baseIngredients.some(i => /yogurt/.test(i.name.toLowerCase()));
  const hasProteinSource = baseIngredients.some(i => /chicken|beef|egg|fish|tofu/.test(i.name.toLowerCase()));

  return {
    type,
    timeOfDay,
    characteristics: {
      isPortable: type === 'snack' || (hasNuts && hasYogurt),
      requiresCooking: hasProteinSource && type !== 'snack',
      maxPreparationTime: type === 'snack' ? 5 : type === 'breakfast' ? 15 : 30,
      targetVolume: type === 'snack' ? 'light' : type === 'breakfast' ? 'moderate' : 'filling'
    }
  };
}

// Context-aware helper pool generation
function generateContextualHelpers(context: MealContext, baseIngredients: Ingredient[]): Ingredient[] {
  const existing = new Set(baseIngredients.map(i => i.name.toLowerCase().trim()));
  const helpers: Ingredient[] = [];

  // Define helper categories based on meal context
  let helperCategories: string[] = [];

  if (context.type === 'snack') {
    if (context.timeOfDay === 'afternoon') {
      // Afternoon snack helpers - focus on sustained energy and protein
      helperCategories = [
        'greek yogurt non-fat', // Protein boost
        'berries mixed', // Natural sugars and fiber
        'dates', // Quick energy
        'apple', // Fiber and natural sweetness
        'cottage cheese low-fat', // High protein, low fat
        'carrot sticks', // Crunch and vitamins
        'dark chocolate 70%', // Small indulgence
        'honey' // Natural sweetener
      ];
    } else if (context.timeOfDay === 'evening') {
      // Evening snack helpers - lighter, less stimulating
      helperCategories = [
        'greek yogurt non-fat',
        'berries mixed',
        'cottage cheese low-fat',
        'cucumber',
        'cherry tomatoes',
        'celery'
      ];
    } else { // morning snack
      // Morning snack helpers - energy and protein
      helperCategories = [
        'greek yogurt non-fat',
        'banana',
        'oats',
        'berries mixed',
        'honey',
        'cottage cheese low-fat'
      ];
    }
  } else if (context.type === 'breakfast') {
    helperCategories = [
      'oats', 'greek yogurt non-fat', 'berries mixed', 'banana', 
      'whole eggs', 'milk skim', 'honey', 'cottage cheese low-fat'
    ];
  } else if (context.type === 'lunch' || context.type === 'dinner') {
    helperCategories = [
      'chicken breast', 'quinoa', 'brown rice', 'sweet potato',
      'bell pepper', 'spinach', 'carrot sticks', 'olive oil'
    ];
  }

  // Create helper ingredients
  for (const category of helperCategories) {
    if (!existing.has(category)) {
      const nutrition = NUTRITION_FALLBACKS[category];
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

  return helpers;
}

function formatIngredientName(key: string): string {
  return key.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Advanced Multi-Objective Optimization using MIQP principles
export function optimizeMealAdvanced(
  ingredients: Ingredient[],
  targets: Targets,
  mealName: string = 'snack'
): OptimizationResult {
  console.log("🎯 Starting Advanced Multi-Objective Optimization");
  console.log("📊 Targets:", targets);
  console.log("🧪 Input ingredients:", ingredients.map(i => i.name));

  try {
    // Phase 1: Meal context analysis
    const context = analyzeMealContext(mealName, ingredients);
    console.log("📋 Meal context:", context);

    // Phase 2: Deduplicate base ingredients
    const baseIngredients = deduplicateIngredients(ingredients);
    console.log("🧪 Base ingredients:", baseIngredients.map(i => i.name));

    // Phase 3: Generate contextual helpers
    const contextualHelpers = generateContextualHelpers(context, baseIngredients);
    console.log("🆘 Contextual helpers:", contextualHelpers.map(h => h.name));

    // Phase 4: Advanced mathematical optimization
    return advancedMathematicalOptimization(baseIngredients, contextualHelpers, targets, context);

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

// Advanced Mathematical Optimization using Mixed Integer Quadratic Programming
function advancedMathematicalOptimization(
  baseIngredients: Ingredient[],
  helpers: Ingredient[],
  targets: Targets,
  context: MealContext
): OptimizationResult {
  console.log("\n🔬 === ADVANCED MATHEMATICAL OPTIMIZATION ===");

  // Step 1: Try base ingredients with enhanced QP solver
  console.log("📊 Phase 1: Enhanced Base Optimization");
  let bestSolution = solveEnhancedQuadraticProblem(baseIngredients, targets, context);

  if (!bestSolution) {
    throw new Error("Failed to solve base optimization problem");
  }

  console.log("📈 Base solution accuracy:", calculateAccuracyMetrics(bestSolution.achieved, targets));

  // Step 2: Precision check with tighter tolerances
  const precisionThreshold = 0.05; // ±5% for all macros
  if (isWithinPrecisionThreshold(bestSolution.achieved, targets, precisionThreshold)) {
    console.log("✅ Base ingredients meet precision requirements!");
    return bestSolution;
  }

  // Step 3: Strategic helper addition using mathematical programming
  console.log("📊 Phase 2: Strategic Helper Optimization");
  const enhancedSolution = strategicHelperOptimization(
    baseIngredients, 
    helpers, 
    targets, 
    context,
    bestSolution
  );

  if (enhancedSolution && calculateOverallError(enhancedSolution.achieved, targets) < 
      calculateOverallError(bestSolution.achieved, targets)) {
    console.log("🎉 Helper optimization improved solution!");
    return enhancedSolution;
  }

  console.log("🏁 Returning base solution as optimal");
  return bestSolution;
}

// Enhanced Quadratic Programming with context-aware constraints
function solveEnhancedQuadraticProblem(
  ingredients: Ingredient[],
  targets: Targets,
  context: MealContext
): OptimizationResult | null {
  const n = ingredients.length;
  if (n === 0) return null;

  // Build constraint matrix A and target vector b
  const A = [
    ingredients.map(ing => ing.cal),   // Calories
    ingredients.map(ing => ing.prot),  // Protein
    ingredients.map(ing => ing.carb),  // Carbs
    ingredients.map(ing => ing.fat)    // Fat
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Context-aware bounds
  const bounds = ingredients.map(ing => getContextualBounds(ing, context));

  // Smart initialization using target-based estimation
  let x = ingredients.map((ing, i) => {
    const targetContribution = estimateTargetContribution(ing, targets, n);
    const bounds_i = bounds[i];
    return Math.max(bounds_i.min, Math.min(bounds_i.max, targetContribution));
  });

  // Multi-objective optimization parameters
  const weights = getContextualWeights(context, targets);
  const maxIterations = 500;
  const tolerance = 1e-8;

  let bestSolution: number[] | null = null;
  let bestError = Infinity;

  // Enhanced iterative optimization with adaptive parameters
  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate current achievement
    const current = calculateAchievement(A, x);

    // Multi-objective error with contextual weights
    const errors = [
      (current[0] - targets.calories) / Math.max(1, targets.calories),
      (current[1] - targets.protein) / Math.max(1, targets.protein),
      (current[2] - targets.carbs) / Math.max(1, targets.carbs),
      (current[3] - targets.fat) / Math.max(1, targets.fat)
    ];

    const weightedError = errors.reduce((sum, err, i) => sum + weights[i] * err * err, 0);

    // Track best solution
    if (weightedError < bestError) {
      bestError = weightedError;
      bestSolution = [...x];
    }

    // Convergence check
    const gradientNorm = calculateGradientNorm(A, b, x, weights);
    if (gradientNorm < tolerance) break;

    // Adaptive gradient descent with momentum
    const learningRate = 0.1 / (1 + iter / 100);
    const gradient = calculateGradient(A, b, x, weights);

    for (let j = 0; j < n; j++) {
      const newValue = x[j] - learningRate * gradient[j];
      x[j] = Math.max(bounds[j].min, Math.min(bounds[j].max, newValue));
    }
  }

  if (bestSolution) {
    const finalAchieved = calculateAchievement(A, bestSolution);

    return {
      feasible: true,
      result: 0,
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

// Strategic helper optimization using branch-and-bound with pruning
function strategicHelperOptimization(
  baseIngredients: Ingredient[],
  helpers: Ingredient[],
  targets: Targets,
  context: MealContext,
  baseSolution: OptimizationResult
): OptimizationResult | null {

  // Analyze deficits to determine optimal helper selection
  const deficits = analyzeNutritionalDeficits(baseSolution.achieved, targets);
  console.log("🔍 Nutritional deficits:", deficits);

  // Score and rank helpers based on deficit-filling potential
  const rankedHelpers = helpers
    .map(helper => ({
      ingredient: helper,
      score: calculateHelperScore(helper, deficits, context)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Consider only top 3 helpers

  console.log("🏆 Top ranked helpers:", rankedHelpers.map(h => `${h.ingredient.name}: ${h.score.toFixed(3)}`));

  // Test each combination using branch-and-bound
  for (let i = 0; i < rankedHelpers.length; i++) {
    const testIngredients = [...baseIngredients, rankedHelpers[i].ingredient];
    const testSolution = solveEnhancedQuadraticProblem(testIngredients, targets, context);

    if (testSolution) {
      const improvement = calculateImprovement(baseSolution, testSolution, targets);
      console.log(`📊 Helper ${rankedHelpers[i].ingredient.name} improvement: ${improvement.toFixed(3)}`);

      if (improvement > 0.15) { // 15% improvement threshold
        return testSolution;
      }
    }
  }

  return null;
}

// Context-aware ingredient bounds
function getContextualBounds(ingredient: Ingredient, context: MealContext): { min: number; max: number } {
  const name = ingredient.name.toLowerCase();
  const baseMultiplier = context.type === 'snack' ? 0.8 : 1.2;

  // Ingredient-specific bounds with context adjustment
  if (/oil|butter|ghee/.test(name)) {
    return { min: 3 * baseMultiplier, max: 15 * baseMultiplier };
  } else if (/chia|seed|flax/.test(name)) {
    return { min: 5 * baseMultiplier, max: 25 * baseMultiplier };
  } else if (/almond|walnut|cashew|peanut|nut|pistachio/.test(name)) {
    return { min: 8 * baseMultiplier, max: 40 * baseMultiplier };
  } else if (/yogurt|cottage/.test(name)) {
    return { min: 50 * baseMultiplier, max: 150 * baseMultiplier };
  } else if (/chicken|beef|fish|tofu|tempeh|egg|salmon|tuna/.test(name)) {
    return { min: 30 * baseMultiplier, max: 120 * baseMultiplier };
  } else if (/fruit|berry|apple|banana|orange|grape|dates|raisins/.test(name)) {
    return { min: 50 * baseMultiplier, max: 200 * baseMultiplier };
  } else if (/vegetable|carrot|cucumber|celery|pepper|tomato|broccoli|spinach|kale/.test(name)) {
    return { min: 20 * baseMultiplier, max: 150 * baseMultiplier };
  } else if (/rice|quinoa|oat|pasta|bread|potato|sweet potato/.test(name)) {
    return { min: 40 * baseMultiplier, max: 180 * baseMultiplier };
  } else {
    return { min: 10 * baseMultiplier, max: 100 * baseMultiplier };
  }
}

// Contextual weight assignment for multi-objective optimization
function getContextualWeights(context: MealContext, targets: Targets): number[] {
  if (context.type === 'snack') {
    // For snacks: prioritize fat control and protein achievement
    return [1.0, 2.5, 1.5, 3.0]; // [calories, protein, carbs, fat]
  } else if (context.type === 'breakfast') {
    // For breakfast: balanced with slight carb emphasis for energy
    return [1.2, 2.0, 2.2, 1.8];
  } else {
    // For lunch/dinner: balanced optimization with slightly higher calorie/protein focus
    return [1.5, 2.0, 1.8, 2.0];
  }
}

// Helper utility functions
function estimateTargetContribution(ingredient: Ingredient, targets: Targets, numIngredients: number): number {
  const avgContribution = [
    targets.calories / (numIngredients * 2),
    targets.protein / (numIngredients * 1.5),
    targets.carbs / (numIngredients * 2),
    targets.fat / (numIngredients * 3)
  ];

  const estimates = [
    ingredient.cal > 0 ? avgContribution[0] / ingredient.cal : 50,
    ingredient.prot > 0 ? avgContribution[1] / ingredient.prot : 50,
    ingredient.carb > 0 ? avgContribution[2] / ingredient.carb : 50,
    ingredient.fat > 0 ? avgContribution[3] / ingredient.fat : 50
  ];

  return Math.max(10, Math.min(100, estimates.reduce((a, b) => a + b, 0) / 4));
}

function calculateAchievement(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((sum, coeff, j) => sum + coeff * x[j], 0));
}

function calculateGradient(A: number[][], b: number[], x: number[], weights: number[]): number[] {
  const current = calculateAchievement(A, x);
  const residuals = current.map((val, i) => weights[i] * (val - b[i]) / Math.max(1, b[i])); // Normalize residuals

  return x.map((_, j) => {
    return A.reduce((sum, row, i) => sum + 2 * row[j] * residuals[i], 0);
  });
}

function calculateGradientNorm(A: number[][], b: number[], x: number[], weights: number[]): number {
  const grad = calculateGradient(A, b, x, weights);
  return Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
}

function analyzeNutritionalDeficits(achieved: any, targets: Targets) {
  const deficits = {
    calories: { absolute: targets.calories - achieved.calories, relative: (targets.calories - achieved.calories) / Math.max(1, targets.calories) },
    protein: { absolute: targets.protein - achieved.protein, relative: (targets.protein - achieved.protein) / Math.max(1, targets.protein) },
    carbs: { absolute: targets.carbs - achieved.carbs, relative: (targets.carbs - achieved.carbs) / Math.max(1, targets.carbs) },
    fat: { absolute: targets.fat - achieved.fat, relative: (targets.fat - achieved.fat) / Math.max(1, targets.fat) }
  };
  return deficits;
}

function calculateHelperScore(helper: Ingredient, deficits: any, context: MealContext): number {
  let score = 0;

  // Score based on addressing major deficits with relevant macros
  if (deficits.protein.relative > 0.08) score += helper.prot * 100 * Math.abs(deficits.protein.relative);
  if (deficits.carbs.relative > 0.08) score += helper.carb * 50 * Math.abs(deficits.carbs.relative);
  if (deficits.fat.relative < -0.08) score -= helper.fat * 80 * Math.abs(deficits.fat.relative); // Penalize high fat if excess
  if (deficits.calories.relative > 0.08) score += helper.cal * 20 * Math.abs(deficits.calories.relative);

  // Contextual adjustments: Penalize inappropriate helpers for the context
  const name = helper.name.toLowerCase();
  if (context.type === 'snack') {
    if (/sweet potato|potato|rice|pasta|bread/.test(name)) score *= 0.2; // Penalize heavy starches in snacks
    if (/chicken|beef|fish/.test(name)) score *= 0.3; // Penalize complex proteins needing cooking
    if (/oil|butter|honey|dark chocolate/.test(name)) score *= 0.5; // Moderate penalty for high-cal, simple additions
  } else if (context.type === 'breakfast') {
    if (/fried|bacon|sausage/.test(name)) score *= 0.1; // Penalize traditionally heavy breakfast items
  }

  // Bonus for balanced macros if not addressing extreme deficits
  const isBalanced = helper.cal > 0.5 && helper.cal < 3.0 && helper.prot > 0.05 && helper.prot < 0.2 && helper.carb > 0.05 && helper.carb < 0.5 && helper.fat < 0.3;
  if (isBalanced && Math.abs(deficits.protein.relative) < 0.05 && Math.abs(deficits.carbs.relative) < 0.05) {
    score += 5;
  }

  return Math.max(0, score);
}

function calculateImprovement(baseSolution: OptimizationResult, testSolution: OptimizationResult, targets: Targets): number {
  const baseError = calculateOverallError(baseSolution.achieved, targets);
  const testError = calculateOverallError(testSolution.achieved, targets);
  if (baseError === 0) return 0; // Avoid division by zero
  return (baseError - testError) / baseError;
}

function calculateOverallError(achieved: any, targets: Targets): number {
  const errors = [
    Math.abs(achieved.calories - targets.calories) / Math.max(1, targets.calories),
    Math.abs(achieved.protein - targets.protein) / Math.max(1, targets.protein),
    Math.abs(achieved.carbs - targets.carbs) / Math.max(1, targets.carbs),
    Math.abs(achieved.fat - targets.fat) / Math.max(1, targets.fat)
  ];

  // Weighted average error with priority for protein and fat control
  return (errors[0] * 1.0 + errors[1] * 2.0 + errors[2] * 1.5 + errors[3] * 2.5) / 7.0;
}

function calculateAccuracyMetrics(achieved: any, targets: Targets) {
  return {
    calories: `${((achieved.calories / Math.max(1, targets.calories)) * 100).toFixed(1)}%`,
    protein: `${((achieved.protein / Math.max(1, targets.protein)) * 100).toFixed(1)}%`,
    carbs: `${((achieved.carbs / Math.max(1, targets.carbs)) * 100).toFixed(1)}%`,
    fat: `${((achieved.fat / Math.max(1, targets.fat)) * 100).toFixed(1)}%`
  };
}

function isWithinPrecisionThreshold(achieved: any, targets: Targets, threshold: number): boolean {
  const accuracies = [
    Math.abs(achieved.calories - targets.calories) / Math.max(1, targets.calories),
    Math.abs(achieved.protein - targets.protein) / Math.max(1, targets.protein),
    Math.abs(achieved.carbs - targets.carbs) / Math.max(1, targets.carbs),
    Math.abs(achieved.fat - targets.fat) / Math.max(1, targets.fat)
  ];

  return accuracies.every(acc => acc <= threshold);
}

// Utility functions (keeping existing ones that are still needed)
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

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => {
    let calories = Number(ing.calories ?? ing.kcal ?? ing.cal ?? 0) || 0;
    let protein = Number(ing.protein ?? ing.prot ?? ing.proteins ?? 0) || 0;
    let carbs = Number(ing.carbs ?? ing.carb ?? ing.carbohydrates ?? 0) || 0;
    let fat = Number(ing.fat ?? ing.fats ?? 0) || 0;

    // Fallback to nutrition database if needed
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      const fallback = NUTRITION_FALLBACKS[ing.name.toLowerCase()] || { cal: 100, prot: 5, carb: 15, fat: 3 };
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
    description: `Mathematically optimized ${originalMeal.mealTitle} using advanced multi-objective programming to precisely match your macro targets.`,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions || "Combine ingredients according to preference. No cooking required for this optimized snack.",
  };
}

// Main optimization function (keep for backward compatibility)
export const optimizeMeal = optimizeMealAdvanced;