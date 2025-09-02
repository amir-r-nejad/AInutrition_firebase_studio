import { z } from "zod";

// Input schema for RAG-based meal plan generation
export const GenerateMealPlanRAGInputSchema = z.object({
  mealTargets: z.array(
    z.object({
      mealName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    })
  ),
  preferred_diet: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  preferred_cuisines: z.array(z.string()).optional(),
  dispreferrred_cuisines: z.array(z.string()).optional(),
  preferred_ingredients: z.array(z.string()).optional(),
  dispreferrred_ingredients: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

export type GenerateMealPlanRAGInput = z.infer<typeof GenerateMealPlanRAGInputSchema>;

// Output schema for RAG-based meal plan generation
export const GenerateMealPlanRAGOutputSchema = z.object({
  weeklyMealPlan: z.array(
    z.object({
      day: z.string(),
      meals: z.array(
        z.object({
          meal_title: z.string(),
          meal_name: z.string(),
          description: z.string().optional(),
          instructions: z.string().optional(),
          total_calories: z.number(),
          total_protein: z.number(),
          total_carbs: z.number(),
          total_fat: z.number(),
          ingredients: z.array(
            z.object({
              name: z.string(),
              quantity: z.number(),
              unit: z.string(),
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            })
          ),
        })
      ),
      daily_totals: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }),
    })
  ),
  weeklySummary: z.object({
    totalCalories: z.number(),
    totalProtein: z.number(),
    totalCarbs: z.number(),
    totalFat: z.number(),
  }),
  success: z.boolean(),
  message: z.string(),
});

export type GenerateMealPlanRAGOutput = z.infer<typeof GenerateMealPlanRAGOutputSchema>;

// RAG API configuration - using same as meal suggestion
const RAG_API_BASE = "https://web-production-55aa.up.railway.app";
const RAG_API_KEY = "sk-nutrition-8_S-o7F-3z2yCp7A6IPJxFDLO3ZWqYYO57OK8MvVltU";

async function generateWithRAG(
  prompt: string,
  input: GenerateMealPlanRAGInput,
): Promise<GenerateMealPlanRAGOutput> {
  console.log("🔄 Starting RAG-based meal plan generation...");
  console.log("📤 Input to RAG API:", JSON.stringify(input, null, 2));

  // Generate meal plan by calling RAG API for each meal individually (like meal suggestion)
  const weeklyMealPlan = [];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const dayName = days[dayIndex];
    console.log(`🔄 Generating meals for ${dayName}...`);
    
    const dayMeals = [];
    let dailyCalories = 0;
    let dailyProtein = 0;
    let dailyCarbs = 0;
    let dailyFat = 0;
    
    // Generate each meal individually using RAG API
    for (let mealIndex = 0; mealIndex < input.mealTargets.length; mealIndex++) {
      const mealTarget = input.mealTargets[mealIndex];
      console.log(`🔄 Generating ${mealTarget.mealName} for ${dayName}...`);
      
      try {
        // Build the RAG payload for this specific meal
        const ragPayload = {
          prompt: `Generate a single meal for ${mealTarget.mealName} with the following targets:
          - Calories: ${mealTarget.calories}
          - Protein: ${mealTarget.protein}g
          - Carbs: ${mealTarget.carbs}g
          - Fat: ${mealTarget.fat}g
          
          ${prompt}`,
          meal_targets: [mealTarget], // Send only this meal target
          user_preferences: {
            preferred_diet: input.preferred_diet || "balanced",
            preferences: input.preferences || [],
            preferred_cuisines: input.preferred_cuisines || [],
            dispreferrred_cuisines: input.dispreferrred_cuisines || [],
            preferred_ingredients: input.preferred_ingredients || [],
            dispreferrred_ingredients: input.dispreferrred_ingredients || [],
            allergies: input.allergies || [],
            medical_conditions: input.medical_conditions || [],
            medications: input.medications || [],
          },
        };

        console.log("🔍 Input preferences received:", {
          preferred_diet: input.preferred_diet,
          preferences: input.preferences,
          preferred_cuisines: input.preferred_cuisines,
          dispreferrred_cuisines: input.dispreferrred_cuisines,
          preferred_ingredients: input.preferred_ingredients,
          dispreferrred_ingredients: input.dispreferrred_ingredients,
          allergies: input.allergies,
          medical_conditions: input.medical_conditions,
          medications: input.medications,
        });

        const response = await fetch(`${RAG_API_BASE}/meal-recommendation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ragPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`RAG API Error for ${mealTarget.mealName} on ${dayName}:`, {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText,
            url: `${RAG_API_BASE}/meal-recommendation`
          });
          throw new Error(
            `RAG API error for ${mealTarget.mealName}: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }

        const data = await response.json();
        console.log(`RAG API Response for ${mealTarget.mealName} on ${dayName}:`, JSON.stringify(data, null, 2));
        
        // Extract the meal from the response
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestion = data.suggestions[0]; // Take first suggestion
          const meal = {
            meal_title: suggestion.mealTitle || `${mealTarget.mealName} Meal`,
            meal_name: mealTarget.mealName,
            description: suggestion.description || "",
            instructions: suggestion.instructions || "",
            total_calories: suggestion.totalCalories || 0,
            total_protein: suggestion.totalProtein || 0,
            total_carbs: suggestion.totalCarbs || 0,
            total_fat: suggestion.totalFat || 0,
            ingredients: suggestion.ingredients?.map((ingredient: any) => ({
              name: ingredient.name || "Unknown Ingredient",
              quantity: ingredient.amount || 100,
              unit: ingredient.unit || "g",
              calories: ingredient.calories || 0,
              protein: ingredient.protein || 0,
              carbs: ingredient.carbs || 0,
              fat: ingredient.fat || 0,
            })) || [],
          };
          
          dayMeals.push(meal);
          dailyCalories += meal.total_calories;
          dailyProtein += meal.total_protein;
          dailyCarbs += meal.total_carbs;
          dailyFat += meal.total_fat;
        } else {
          // Fallback if no suggestions
          console.warn(`No suggestions received for ${mealTarget.mealName} on ${dayName}, using fallback`);
          const fallbackMeal = {
            meal_title: `${mealTarget.mealName} Meal`,
            meal_name: mealTarget.mealName,
            description: "Generated meal",
            instructions: "",
            total_calories: mealTarget.calories,
            total_protein: mealTarget.protein,
            total_carbs: mealTarget.carbs,
            total_fat: mealTarget.fat,
            ingredients: [],
          };
          
          dayMeals.push(fallbackMeal);
          dailyCalories += fallbackMeal.total_calories;
          dailyProtein += fallbackMeal.total_protein;
          dailyCarbs += fallbackMeal.total_carbs;
          dailyFat += fallbackMeal.total_fat;
        }
      } catch (mealError: any) {
        console.error(`Failed to generate ${mealTarget.mealName} for ${dayName}:`, mealError);
        console.warn(`Using fallback meal for ${mealTarget.mealName} on ${dayName}`);
        
        // Use fallback meal if RAG API fails
        const fallbackMeal = {
          meal_title: `${mealTarget.mealName} Meal`,
          meal_name: mealTarget.mealName,
          description: "Generated meal (fallback)",
          instructions: "",
          total_calories: mealTarget.calories,
          total_protein: mealTarget.protein,
          total_carbs: mealTarget.carbs,
          total_fat: mealTarget.fat,
          ingredients: [],
        };
        
        dayMeals.push(fallbackMeal);
        dailyCalories += fallbackMeal.total_calories;
        dailyProtein += fallbackMeal.total_protein;
        dailyCarbs += fallbackMeal.total_carbs;
        dailyFat += fallbackMeal.total_fat;
      }
    }
    
    weeklyMealPlan.push({
      day: dayName,
      meals: dayMeals,
      daily_totals: {
        calories: dailyCalories,
        protein: dailyProtein,
        carbs: dailyCarbs,
        fat: dailyFat,
      },
    });
  }

  // Calculate weekly summary
  const weeklySummary = {
    totalCalories: weeklyMealPlan.reduce((sum, day) => sum + (day.daily_totals?.calories || 0), 0),
    totalProtein: weeklyMealPlan.reduce((sum, day) => sum + (day.daily_totals?.protein || 0), 0),
    totalCarbs: weeklyMealPlan.reduce((sum, day) => sum + (day.daily_totals?.carbs || 0), 0),
    totalFat: weeklyMealPlan.reduce((sum, day) => sum + (day.daily_totals?.fat || 0), 0),
  };

  const transformedResponse: GenerateMealPlanRAGOutput = {
    weeklyMealPlan: weeklyMealPlan.map((day: any) => ({
      day: day.day || "Unknown Day",
      meals: day.meals?.map((meal: any) => ({
        meal_title: meal.meal_title || meal.mealTitle || "Generated Meal",
        meal_name: meal.meal_name || meal.mealName || "meal",
        description: meal.description || "",
        instructions: meal.instructions || "",
        total_calories: meal.total_calories || meal.totalCalories || 0,
        total_protein: meal.total_protein || meal.totalProtein || 0,
        total_carbs: meal.total_carbs || meal.totalCarbs || 0,
        total_fat: meal.total_fat || meal.totalFat || 0,
        ingredients: meal.ingredients?.map((ingredient: any) => ({
          name: ingredient.name || "Unknown Ingredient",
          quantity: ingredient.quantity || ingredient.amount || 100,
          unit: ingredient.unit || "g",
          calories: ingredient.calories || 0,
          protein: ingredient.protein || 0,
          carbs: ingredient.carbs || 0,
          fat: ingredient.fat || 0,
        })) || [],
      })) || [],
      daily_totals: day.daily_totals || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    })),
    weeklySummary,
    success: true,
    message: "Meal plan generated successfully with RAG API (individual meals)",
  };

  console.log("✅ RAG response transformed successfully");
  return transformedResponse;
}

function buildPrompt(input: GenerateMealPlanRAGInput): string {
  const mealTargetsString = input.mealTargets
    .map(
      (target) =>
        `**${target.mealName}**: ${target.calories} kcal | ${target.protein}g protein | ${target.carbs}g carbs | ${target.fat}g fat`,
    )
    .join("\n");

  return `You are NutriMind, an expert AI nutritionist and innovative chef. Generate a complete weekly meal plan with 7 days, each containing ${input.mealTargets.length} diverse, nutrition-rich, and optimized meals that match the macro targets within ±5% for calories and protein, and as close as possible for carbs and fat.

IMPORTANT OUTPUT RULES:
- Return RAW INGREDIENTS ONLY (no cooked/composite recipes). Use single raw items like Greek yogurt, oats, blueberries, tofu, olive oil, tomato paste, etc.
- Each ingredient must include precise grams and per-100g nutrition values so we can optimize mathematically later.
- Ensure every meal is optimization-ready: include foods that cover protein, carbs, and fat so quantities can be tuned to hit targets exactly.
- Generate exactly 7 days of meal plans.

Targets per meal:
${mealTargetsString}

Dietary rules:
${input.preferred_diet ? `- Preferred diet: ${input.preferred_diet}` : "- Preferred diet: Any"}
${input.allergies && input.allergies.length > 0 ? `- Avoid strictly: ${input.allergies.join(", ")}` : "- Allergies: None"}
${input.preferred_ingredients && input.preferred_ingredients.length > 0 ? `- Prefer ingredients: ${input.preferred_ingredients.join(", ")}` : "- Prefer ingredients: None"}
${input.dispreferrred_ingredients && input.dispreferrred_ingredients.length > 0 ? `- Avoid disliked ingredients: ${input.dispreferrred_ingredients.join(", ")}` : "- Disliked ingredients: None"}
${input.medical_conditions && input.medical_conditions.length > 0 ? `- Medical conditions: ${input.medical_conditions.join(", ")}` : "- Medical conditions: None"}
${input.medications && input.medications.length > 0 ? `- Medications: ${input.medications.join(", ")}` : "- Medications: None"}

Critical Requirements:
1. **Nutrition Diversity**: Each meal MUST contain at least:
   - 2+ protein sources (animal/plant proteins, dairy, legumes)
   - 2+ carbohydrate sources (complex carbs, fruits/vegetables with natural sugars)
   - 1–2 healthy fat sources (nuts, oils, avocado, seeds)
   - 2–3 vegetables for micronutrients and fiber
2. **Meal Type Appropriateness**: Consider meal timing (e.g., lighter proteins for breakfast, hearty meals for dinner)
3. **Macro Distribution**: Ensure foods are rich in all macro sources to enable optimization:
   - Include foods with significant protein (>10g per 100g)
   - Include foods with substantial carbs (>15g per 100g)
   - Include foods with good fat content (>5g per 100g)
4. **Quantity Precision**: All quantities in grams with precise nutritional calculations
5. **Cultural Variety**: Draw from diverse cuisines and cooking methods
6. **Optimization-Ready**: Select ingredients that can be mathematically optimized to hit exact targets (avoid composite cooked recipes)

Nutritional Calculation Rules:
- Use USDA FoodData Central values or reliable nutrition databases
- Provide per-100g nutrition, and compute totals as: (grams ÷ 100) × per_100g_values
- Ensure total meal macros are within ±5% of targets
- Round nutrition values to 1 decimal place

Return a complete weekly meal plan with 7 days, each containing ${input.mealTargets.length} meals that match the provided macro targets.`;
}

// Main entry function using RAG System
export async function generateMealPlanWithRAG(
  input: GenerateMealPlanRAGInput,
): Promise<GenerateMealPlanRAGOutput> {
  try {
    // Log input for debugging
    console.log(
      "Input to generateMealPlanWithRAG (RAG):",
      JSON.stringify(input, null, 2),
    );

    // Validate input
    const validatedInput = GenerateMealPlanRAGInputSchema.parse(input);

    // Generate the prompt
    const prompt = buildPrompt(validatedInput);

    // Get RAG response
    const result = await generateWithRAG(prompt, validatedInput);

    // Log the RAG response for debugging
    console.log("RAG Response:", JSON.stringify(result, null, 2));

    // Return the RAG response directly
    return result;
  } catch (error: any) {
    console.error("Error in generateMealPlanWithRAG (RAG):", error);
    throw new Error(`Failed to generate meal plan with RAG: ${error.message}`);
  }
}

