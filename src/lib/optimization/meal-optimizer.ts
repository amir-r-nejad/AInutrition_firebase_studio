
// Advanced Meal Optimization using Genetic Algorithm
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
  helpers_added?: string[];
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
  // Protein Sources
  "chicken breast": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "chicken breast grilled": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "lean ground turkey": { cal: 189, prot: 27.0, carb: 0, fat: 8.3 },
  "egg whites": { cal: 52, prot: 10.9, carb: 0.7, fat: 0.2 },
  "greek yogurt non-fat": { cal: 59, prot: 10.0, carb: 3.6, fat: 0.4 },
  "cottage cheese low-fat": { cal: 72, prot: 12.4, carb: 4.3, fat: 1.0 },
  "whey protein powder": { cal: 412, prot: 85.0, carb: 4.0, fat: 5.0 },
  "fish cod": { cal: 82, prot: 18.0, carb: 0, fat: 0.7 },
  "tofu firm": { cal: 144, prot: 15.8, carb: 4.3, fat: 8.7 },

  // Carbohydrate Sources  
  "brown rice raw": { cal: 370, prot: 7.9, carb: 77.0, fat: 2.9 },
  "white rice raw": { cal: 365, prot: 7.1, carb: 80.0, fat: 0.7 },
  "quinoa raw": { cal: 368, prot: 14.1, carb: 64.2, fat: 6.1 },
  "oats raw": { cal: 389, prot: 16.9, carb: 66.3, fat: 6.9 },
  "sweet potato raw": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "pasta whole wheat raw": { cal: 348, prot: 14.6, carb: 71.0, fat: 2.5 },
  "bread whole wheat": { cal: 247, prot: 13.0, carb: 41.0, fat: 4.2 },

  // Vegetables (low calorie, high volume)
  "spinach": { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
  "broccoli": { cal: 34, prot: 2.8, carb: 7.0, fat: 0.4 },
  "bell peppers": { cal: 31, prot: 1.0, carb: 7.0, fat: 0.3 },
  "cucumber": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  "lettuce": { cal: 15, prot: 1.4, carb: 2.9, fat: 0.2 },
  "tomatoes": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "carrots": { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },

  // Healthy Fats
  "olive oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
  "avocado": { cal: 160, prot: 2.0, carb: 8.5, fat: 14.7 },
  "almonds": { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  "walnuts": { cal: 654, prot: 15.2, carb: 13.7, fat: 65.2 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },

  // Fruits
  "banana": { cal: 89, prot: 1.1, carb: 22.8, fat: 0.3 },
  "berries mixed": { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  "apple": { cal: 52, prot: 0.3, carb: 13.8, fat: 0.2 },
};

// Genetic Algorithm Parameters
const GA_CONFIG = {
  populationSize: 150,
  generations: 800,
  mutationRate: 0.12,
  crossoverRate: 0.8,
  eliteSize: 10,
  maxAmount: 500, // Max grams per ingredient
  tournamentSize: 5
};

// Individual in genetic algorithm
interface Individual {
  genes: number[]; // Amount of each ingredient in grams
  fitness: number;
}

// Calculate fitness (lower is better - sum of weighted absolute deviations)
function calculateFitness(genes: number[], ingredients: Ingredient[], targets: Targets): number {
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0;
  
  for (let i = 0; i < ingredients.length; i++) {
    const amount = genes[i];
    totalCal += amount * ingredients[i].cal;
    totalProt += amount * ingredients[i].prot;
    totalCarb += amount * ingredients[i].carb;
    totalFat += amount * ingredients[i].fat;
  }

  // Weighted deviations (prioritize protein and fat accuracy)
  const calDeviation = Math.abs(totalCal - targets.calories);
  const protDeviation = Math.abs(totalProt - targets.protein) * 3; // Higher weight
  const carbDeviation = Math.abs(totalCarb - targets.carbs) * 2;
  const fatDeviation = Math.abs(totalFat - targets.fat) * 4; // Highest weight

  return calDeviation + protDeviation + carbDeviation + fatDeviation;
}

// Calculate achieved macros from genes
function calculateMacros(genes: number[], ingredients: Ingredient[]) {
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  
  for (let i = 0; i < ingredients.length; i++) {
    const amount = genes[i];
    calories += amount * ingredients[i].cal;
    protein += amount * ingredients[i].prot;
    carbs += amount * ingredients[i].carb;
    fat += amount * ingredients[i].fat;
  }

  return {
    calories: Math.round(calories * 100) / 100,
    protein: Math.round(protein * 100) / 100,
    carbs: Math.round(carbs * 100) / 100,
    fat: Math.round(fat * 100) / 100
  };
}

// Create random individual
function createIndividual(ingredientsCount: number): Individual {
  const genes = Array.from({ length: ingredientsCount }, () => 
    Math.random() * GA_CONFIG.maxAmount
  );
  
  return { genes, fitness: Infinity };
}

// Tournament selection
function selectParent(population: Individual[]): Individual {
  const tournament: Individual[] = [];
  
  for (let i = 0; i < GA_CONFIG.tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push(population[randomIndex]);
  }
  
  return tournament.reduce((best, current) => 
    current.fitness < best.fitness ? current : best
  );
}

// Single-point crossover
function crossover(parent1: Individual, parent2: Individual): Individual[] {
  if (Math.random() > GA_CONFIG.crossoverRate) {
    return [{ ...parent1 }, { ...parent2 }];
  }

  const crossoverPoint = Math.floor(Math.random() * parent1.genes.length);
  
  const child1Genes = [
    ...parent1.genes.slice(0, crossoverPoint),
    ...parent2.genes.slice(crossoverPoint)
  ];
  
  const child2Genes = [
    ...parent2.genes.slice(0, crossoverPoint),
    ...parent1.genes.slice(crossoverPoint)
  ];

  return [
    { genes: child1Genes, fitness: Infinity },
    { genes: child2Genes, fitness: Infinity }
  ];
}

// Gaussian mutation
function mutate(individual: Individual): void {
  for (let i = 0; i < individual.genes.length; i++) {
    if (Math.random() < GA_CONFIG.mutationRate) {
      // Gaussian mutation with adaptive step size
      const stepSize = GA_CONFIG.maxAmount * 0.1;
      const mutation = (Math.random() - 0.5) * 2 * stepSize;
      
      individual.genes[i] += mutation;
      individual.genes[i] = Math.max(0, Math.min(GA_CONFIG.maxAmount, individual.genes[i]));
    }
  }
}

// Main genetic algorithm optimization
function optimizeWithGeneticAlgorithm(
  ingredients: Ingredient[],
  targets: Targets
): OptimizationResult {
  console.log("🧬 Starting Genetic Algorithm Optimization");
  console.log("📊 Population:", GA_CONFIG.populationSize, "Generations:", GA_CONFIG.generations);

  // Initialize population
  let population: Individual[] = Array.from({ length: GA_CONFIG.populationSize }, 
    () => createIndividual(ingredients.length)
  );

  // Evaluate initial population
  population.forEach(individual => {
    individual.fitness = calculateFitness(individual.genes, ingredients, targets);
  });

  let bestFitness = Infinity;
  let bestIndividual: Individual | null = null;
  let generationsWithoutImprovement = 0;

  // Evolution loop
  for (let generation = 0; generation < GA_CONFIG.generations; generation++) {
    // Sort population by fitness
    population.sort((a, b) => a.fitness - b.fitness);

    // Track best solution
    if (population[0].fitness < bestFitness) {
      bestFitness = population[0].fitness;
      bestIndividual = { ...population[0] };
      generationsWithoutImprovement = 0;
    } else {
      generationsWithoutImprovement++;
    }

    // Early stopping if no improvement for many generations
    if (generationsWithoutImprovement > 100) {
      console.log(`🔄 Early stopping at generation ${generation} (no improvement for 100 generations)`);
      break;
    }

    // Log progress every 100 generations
    if (generation % 100 === 0) {
      const currentBest = calculateMacros(population[0].genes, ingredients);
      console.log(`🧬 Gen ${generation}: Fitness=${population[0].fitness.toFixed(2)}, ` +
                  `Macros: ${currentBest.calories}cal/${currentBest.protein}p/${currentBest.carbs}c/${currentBest.fat}f`);
    }

    // Create new generation
    const newPopulation: Individual[] = [];

    // Keep elite individuals
    for (let i = 0; i < GA_CONFIG.eliteSize; i++) {
      newPopulation.push({ ...population[i] });
    }

    // Generate offspring
    while (newPopulation.length < GA_CONFIG.populationSize) {
      const parent1 = selectParent(population);
      const parent2 = selectParent(population);
      
      const [child1, child2] = crossover(parent1, parent2);
      
      mutate(child1);
      mutate(child2);
      
      // Evaluate children
      child1.fitness = calculateFitness(child1.genes, ingredients, targets);
      child2.fitness = calculateFitness(child2.genes, ingredients, targets);
      
      newPopulation.push(child1);
      if (newPopulation.length < GA_CONFIG.populationSize) {
        newPopulation.push(child2);
      }
    }

    population = newPopulation;
  }

  // Return best solution
  if (bestIndividual) {
    const achieved = calculateMacros(bestIndividual.genes, ingredients);
    
    // Convert to result format
    const ingredientAmounts: { [key: string]: number } = {};
    ingredients.forEach((ingredient, index) => {
      if (bestIndividual!.genes[index] > 0.5) { // Only include meaningful amounts
        ingredientAmounts[ingredient.name] = Math.round(bestIndividual!.genes[index] * 100) / 100;
      }
    });

    console.log("🎯 GA Optimization Complete!");
    console.log("📊 Best fitness:", bestFitness.toFixed(2));
    console.log("🥗 Final macros:", achieved);

    // Check if solution is acceptable (within 10% tolerance)
    const toleranceCheck = {
      calories: Math.abs(achieved.calories - targets.calories) / targets.calories <= 0.1,
      protein: Math.abs(achieved.protein - targets.protein) / targets.protein <= 0.1,
      carbs: Math.abs(achieved.carbs - targets.carbs) / targets.carbs <= 0.1,
      fat: Math.abs(achieved.fat - targets.fat) / targets.fat <= 0.1
    };

    const isAcceptable = Object.values(toleranceCheck).every(check => check);

    return {
      feasible: isAcceptable,
      result: bestFitness,
      ingredients: ingredientAmounts,
      achieved,
      error: isAcceptable ? undefined : "Could not achieve targets within 10% tolerance"
    };
  }

  return {
    feasible: false,
    result: 0,
    ingredients: {},
    achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    error: "Genetic algorithm failed to find solution"
  };
}

// Generate contextual helper ingredients
function generateContextualHelpers(
  baseIngredients: Ingredient[],
  targets: Targets,
  mealType: string = 'meal'
): Ingredient[] {
  const existing = new Set(baseIngredients.map(ing => ing.name.toLowerCase()));
  const helpers: Ingredient[] = [];

  // Check for existing protein types to avoid conflicts
  const existingMeats = new Set<string>();
  const meatProteins = ['beef', 'chicken', 'turkey', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'cod'];
  
  baseIngredients.forEach(ing => {
    const ingName = ing.name.toLowerCase();
    meatProteins.forEach(meat => {
      if (ingName.includes(meat)) {
        existingMeats.add(meat);
      }
    });
  });

  console.log("🥩 Existing meat proteins detected:", Array.from(existingMeats));

  // Analyze deficits
  const estimatedBase = {
    calories: baseIngredients.reduce((sum, ing) => sum + ing.cal * 100, 0),
    protein: baseIngredients.reduce((sum, ing) => sum + ing.prot * 100, 0),
    carbs: baseIngredients.reduce((sum, ing) => sum + ing.carb * 100, 0),
    fat: baseIngredients.reduce((sum, ing) => sum + ing.fat * 100, 0)
  };

  const deficits = {
    calories: targets.calories - estimatedBase.calories,
    protein: targets.protein - estimatedBase.protein,
    carbs: targets.carbs - estimatedBase.carbs,
    fat: targets.fat - estimatedBase.fat
  };

  // Helper categories based on deficits
  const helperCategories: string[] = [];

  // Protein helpers (highest priority if deficit > 10g)
  // Only add non-conflicting protein sources
  if (deficits.protein > 10) {
    // If meat already exists, prefer dairy/egg proteins
    if (existingMeats.size > 0) {
      console.log("🚫 Meat detected, avoiding additional meat proteins");
      helperCategories.push('greek yogurt non-fat', 'egg whites', 'cottage cheese low-fat');
    } else {
      // No meat exists, can add chicken as primary protein
      helperCategories.push('chicken breast grilled', 'greek yogurt non-fat', 'egg whites');
    }
  } else if (deficits.protein > 5) {
    // For smaller protein needs, always prefer dairy/egg
    helperCategories.push('greek yogurt non-fat', 'cottage cheese low-fat');
  }

  // Carb helpers
  if (deficits.carbs > 30) {
    helperCategories.push('brown rice raw', 'quinoa raw', 'sweet potato raw');
  } else if (deficits.carbs > 15) {
    helperCategories.push('sweet potato raw', 'oats raw');
  }

  // Fat helpers (for low-fat requirements)
  if (deficits.fat < -5) {
    // Need to reduce fat - add low-fat high-volume foods
    helperCategories.push('spinach', 'cucumber', 'bell peppers');
  } else if (deficits.fat > 5) {
    helperCategories.push('olive oil', 'avocado');
  }

  // Volume helpers (vegetables)
  helperCategories.push('spinach', 'broccoli', 'tomatoes');

  // Convert to ingredients
  for (const category of helperCategories.slice(0, 6)) { // Limit to 6 helpers
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

  console.log("🆘 Final helpers selected:", helpers.map(h => h.name));
  return helpers;
}

// Main optimization function with helper addition
export function optimizeMealAdvanced(
  ingredients: Ingredient[],
  targets: Targets,
  mealName: string = 'meal'
): OptimizationResult {
  console.log("🧬 Starting Advanced Genetic Algorithm Optimization");
  console.log("📊 Targets:", targets);
  console.log("🧪 Base ingredients:", ingredients.map(i => i.name));

  try {
    // Phase 1: Try with original ingredients
    console.log("📊 Phase 1: Optimizing with original ingredients");
    let result = optimizeWithGeneticAlgorithm(ingredients, targets);

    // Check if result is within acceptable tolerance (5%)
    const isWithinTolerance = result.feasible && result.achieved && 
      Math.abs(result.achieved.calories - targets.calories) / targets.calories <= 0.05 &&
      Math.abs(result.achieved.protein - targets.protein) / targets.protein <= 0.05 &&
      Math.abs(result.achieved.carbs - targets.carbs) / targets.carbs <= 0.05 &&
      Math.abs(result.achieved.fat - targets.fat) / targets.fat <= 0.05;

    if (isWithinTolerance) {
      console.log("✅ Original ingredients achieved targets within 5% tolerance");
      return result;
    }

    // Phase 2: Add contextual helpers and re-optimize
    console.log("📊 Phase 2: Adding contextual helpers");
    const helpers = generateContextualHelpers(ingredients, targets, mealName);
    console.log("🆘 Generated helpers:", helpers.map(h => h.name));

    const enhancedIngredients = [...ingredients, ...helpers];

    // Try optimization with helpers
    const enhancedResult = optimizeWithGeneticAlgorithm(enhancedIngredients, targets);

    if (enhancedResult.feasible) {
      // Check which helpers were actually used (amount > 1g)
      const helpersUsed = helpers
        .filter(helper => enhancedResult.ingredients[helper.name] > 1)
        .map(helper => helper.name);

      console.log("✅ Genetic Algorithm optimization with helpers completed");
      console.log("🆘 Helpers used:", helpersUsed);

      return {
        ...enhancedResult,
        helpers_added: helpersUsed
      };
    }

    console.log("❌ Could not achieve targets even with helpers");
    return result; // Return original attempt

  } catch (error: any) {
    console.error("❌ Genetic Algorithm optimization failed:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error?.message || String(error)
    };
  }
}

// Utility functions
function formatIngredientName(key: string): string {
  return key.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
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
    if (amount > 0.5) { // Only include ingredients with meaningful amounts
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

  // Create description mentioning genetic algorithm
  let description = `Optimized ${originalMeal.mealTitle} using advanced genetic algorithm to achieve precise macro targets with intelligent ingredient selection.`;

  if (optimizationResult.helpers_added && optimizationResult.helpers_added.length > 0) {
    description += ` Additional ingredients (${optimizationResult.helpers_added.join(', ')}) were added to make the targets achievable.`;
  }

  return {
    mealTitle: originalMeal.mealTitle,
    description,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions || "Cook ingredients according to preference. Season to taste and serve.",
  };
}

// Main optimization function
export const optimizeMeal = optimizeMealAdvanced;
