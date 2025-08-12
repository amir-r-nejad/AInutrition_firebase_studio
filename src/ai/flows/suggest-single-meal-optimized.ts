
"use server";

import {
  SuggestSingleMealInputSchema,
  OptimizedMealResultSchema,
  type SuggestSingleMealInput,
  type OptimizedMealResult,
} from "@/lib/schemas";

// Linear optimization function using JavaScript solver approach
function optimizeIngredientAmounts(
  ingredients: Array<{
    name: string;
    cal: number;
    prot: number;
    carb: number;
    fat: number;
  }>,
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }
): {
  amounts: Record<string, number>;
  achieved: { calories: number; protein: number; carbs: number; fat: number };
  status: string;
  deviation: number;
} {
  // Simple optimization using iterative approach
  // This is a simplified version - in production, you'd use a proper LP solver
  
  const maxIterations = 1000;
  const tolerance = 1;
  let bestAmounts: Record<string, number> = {};
  let bestDeviation = Infinity;
  let bestAchieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Initialize with equal distribution
  const baseAmount = 100; // Start with 100g of each ingredient
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const amounts: Record<string, number> = {};
    
    // Calculate current amounts based on iteration
    ingredients.forEach((ing, index) => {
      // Use different scaling factors for each ingredient type
      let scale = 1;
      if (ing.prot > 0.2) scale = targets.protein / (ing.prot * ingredients.length); // Protein sources
      else if (ing.carb > 0.2) scale = targets.carbs / (ing.carb * ingredients.length); // Carb sources
      else if (ing.fat > 0.5) scale = targets.fat / (ing.fat * ingredients.length); // Fat sources
      else scale = targets.calories / (ing.cal * ingredients.length * 4); // Other ingredients
      
      amounts[ing.name] = Math.max(0, baseAmount * scale * (0.5 + Math.random()));
    });

    // Calculate achieved macros
    const achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach(ing => {
      const amount = amounts[ing.name] || 0;
      achieved.calories += amount * ing.cal;
      achieved.protein += amount * ing.prot;
      achieved.carbs += amount * ing.carb;
      achieved.fat += amount * ing.fat;
    });

    // Calculate deviation
    const deviation = 
      Math.abs(achieved.calories - targets.calories) +
      Math.abs(achieved.protein - targets.protein) * 4 + // Weight protein more
      Math.abs(achieved.carbs - targets.carbs) * 4 +
      Math.abs(achieved.fat - targets.fat) * 9;

    if (deviation < bestDeviation) {
      bestDeviation = deviation;
      bestAmounts = { ...amounts };
      bestAchieved = { ...achieved };
      
      if (deviation < tolerance) break;
    }
  }

  return {
    amounts: bestAmounts,
    achieved: bestAchieved,
    status: bestDeviation < tolerance * 5 ? "Optimal" : "Near Optimal",
    deviation: bestDeviation
  };
}

// OpenAI function for dish generation
async function generateDishWithOpenAI(
  prompt: string,
  input: SuggestSingleMealInput,
): Promise<{
  dishName: string;
  description: string;
  rawIngredients: Array<{
    name: string;
    cal: number;
    prot: number;
    carb: number;
    fat: number;
  }>;
}> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a culinary nutrition expert. Create a single delicious dish that includes ingredients covering protein, carbohydrates, and fats. Return ONLY valid JSON with the dish name, description, and ingredient nutrition data per gram.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    let cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildDishPrompt(input: SuggestSingleMealInput): string {
  const allergiesText = input.allergies?.length ? input.allergies.join(", ") : "None";
  const preferencesText = input.preferences || "No specific preferences";

  return `
Create ONE complete dish for "${input.meal_name}" that meets these requirements:

**User Profile:**
- Age: ${input.age}
- Gender: ${input.gender}
- Activity Level: ${input.activity_level}
- Diet Goal: ${input.diet_goal}
- Allergies: ${allergiesText}
- Preferences: ${preferencesText}
- Preferred Diet: ${input.preferred_diet || "None"}
- Preferred Cuisines: ${input.preferred_cuisines?.join(", ") || "Any"}
- Preferred Ingredients: ${input.preferred_ingredients?.join(", ") || "Any"}
- Avoided Ingredients: ${input.dispreferrred_ingredients?.join(", ") || "None"}

**Requirements:**
1. Create ONE complete dish (not multiple items)
2. Include ingredients that provide protein, carbohydrates, and healthy fats
3. Ensure ingredients work well together in a single dish
4. Consider user's dietary preferences and restrictions

**Required JSON Format:**
{
  "dishName": "Creative dish name",
  "description": "Engaging description of the dish and why it's perfect for the user's goals",
  "rawIngredients": [
    {
      "name": "Ingredient Name",
      "cal": 0.00,
      "prot": 0.00,
      "carb": 0.00,
      "fat": 0.00
    }
  ]
}

**Nutrition Data (per gram) - Use these exact values:**
- Chicken Breast: cal: 1.65, prot: 0.31, carb: 0, fat: 0.036
- Salmon: cal: 2.08, prot: 0.254, carb: 0, fat: 0.124
- Rice (cooked): cal: 1.3, prot: 0.027, carb: 0.28, fat: 0.003
- Quinoa (cooked): cal: 1.2, prot: 0.044, carb: 0.213, fat: 0.019
- Sweet Potato: cal: 0.86, prot: 0.016, carb: 0.201, fat: 0.001
- Broccoli: cal: 0.34, prot: 0.028, carb: 0.07, fat: 0.004
- Spinach: cal: 0.23, prot: 0.029, carb: 0.036, fat: 0.004
- Olive Oil: cal: 8.84, prot: 0, carb: 0, fat: 1
- Avocado: cal: 1.6, prot: 0.02, carb: 0.085, fat: 0.147
- Almonds: cal: 5.79, prot: 0.212, carb: 0.216, fat: 0.499

Create a cohesive dish using 4-6 ingredients that work together. Return only the JSON.
`;
}

export async function suggestSingleMealWithOptimization(
  input: SuggestSingleMealInput,
): Promise<OptimizedMealResult> {
  try {
    console.log("Generating single optimized meal:", JSON.stringify(input, null, 2));

    // Validate input
    const validatedInput = SuggestSingleMealInputSchema.parse(input);

    // Generate dish with AI
    const prompt = buildDishPrompt(validatedInput);
    const dishData = await generateDishWithOpenAI(prompt, validatedInput);

    // Optimize ingredient amounts using linear programming approach
    const targets = {
      calories: validatedInput.target_calories,
      protein: validatedInput.target_protein_grams,
      carbs: validatedInput.target_carbs_grams,
      fat: validatedInput.target_fat_grams,
    };

    const optimization = optimizeIngredientAmounts(dishData.rawIngredients, targets);

    // Build final result
    const optimizedIngredients = dishData.rawIngredients.map(ing => ({
      name: ing.name,
      amount: optimization.amounts[ing.name] || 0,
      calories: (optimization.amounts[ing.name] || 0) * ing.cal,
      protein: (optimization.amounts[ing.name] || 0) * ing.prot,
      carbs: (optimization.amounts[ing.name] || 0) * ing.carb,
      fat: (optimization.amounts[ing.name] || 0) * ing.fat,
    }));

    const result: OptimizedMealResult = {
      dishName: dishData.dishName,
      description: dishData.description,
      optimizedIngredients,
      achievedMacros: optimization.achieved,
      optimizationStatus: optimization.status,
      totalDeviation: optimization.deviation,
    };

    console.log("Optimization complete:", {
      dishName: result.dishName,
      targets,
      achieved: result.achievedMacros,
      status: result.optimizationStatus,
    });

    return OptimizedMealResultSchema.parse(result);
  } catch (error: any) {
    console.error("Error in suggestSingleMealWithOptimization:", error);
    throw error;
  }
}
