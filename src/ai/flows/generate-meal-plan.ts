"use server";

import { geminiModel } from "@/ai/genkit";
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  MacroSplitterFormSchema,
  SuggestMealsForMacrosInputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from "@/lib/schemas";

export const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generatePersonalizedMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    const maxRetries = 3;
    let retryCount = 0;

    // Validate and fix zero values in meal_data
    const defaultMealData = {
      target_daily_calories: 1200,
      target_protein_g: 90,
      target_carbs_g: 150,
      target_fat_g: 40,
    };
    const mealData =
      input.meal_data && !("days" in input.meal_data)
        ? {
            target_daily_calories:
              input.meal_data.target_daily_calories ||
              defaultMealData.target_daily_calories,
            target_protein_g:
              input.meal_data.target_protein_g ||
              defaultMealData.target_protein_g,
            target_carbs_g:
              input.meal_data.target_carbs_g || defaultMealData.target_carbs_g,
            target_fat_g:
              input.meal_data.target_fat_g || defaultMealData.target_fat_g,
          }
        : defaultMealData;

    // Log input meal_data for debugging
    console.log("Input meal_data:", mealData);

    // Validate macro splitter input
    const macroValidation = MacroSplitterFormSchema.safeParse({
      meal_distributions: input.meal_distributions,
    });
    if (!macroValidation.success) {
      console.error(
        "Macro splitter validation error:",
        macroValidation.error.flatten(),
      );
      throw new Error("Invalid macro splitter data");
    }

    // Validate meal suggestion preferences
    const suggestionValidation = SuggestMealsForMacrosInputSchema.safeParse({
      target_calories: mealData.target_daily_calories,
      target_protein_grams: mealData.target_protein_g,
      target_carbs_grams: mealData.target_carbs_g,
      target_fat_grams: mealData.target_fat_g,
      preferred_diet: input.preferred_diet || "Standard",
      allergies: input.allergies || [],
      dispreferrred_ingredients: input.dispreferrred_ingredients || [],
      preferred_ingredients: input.preferred_ingredients || [],
      medical_conditions: input.medical_conditions || [],
    });
    if (!suggestionValidation.success) {
      console.error(
        "Meal suggestion validation error:",
        suggestionValidation.error.flatten(),
      );
      throw new Error("Invalid meal suggestion preferences");
    }

    console.log("🔄 Attempting to generate meal plan with Gemini...");
    console.log("📊 Input validation:", {
      hasMealDistributions: !!input.meal_distributions,
      mealDistributionsCount: input.meal_distributions?.length || 0,
      targetCalories: mealData.target_daily_calories,
      targetProtein: mealData.target_protein_g,
      targetCarbs: mealData.target_carbs_g,
      targetFat: mealData.target_fat_g,
      preferredDiet: input.preferred_diet || "Standard",
      allergies: input.allergies || [],
      mealDistributionsDetails: input.meal_distributions,
    });
    
    // Log detailed meal distribution targets
    if (input.meal_distributions) {
      console.log("📋 Meal Distribution Targets:");
      input.meal_distributions.forEach((dist, index) => {
        const targetCal = (mealData.target_daily_calories * dist.calories_pct / 100).toFixed(1);
        const targetProt = (mealData.target_protein_g * (dist.protein_pct || dist.calories_pct) / 100).toFixed(1);
        const targetCarbs = (mealData.target_carbs_g * (dist.carbs_pct || dist.calories_pct) / 100).toFixed(1);
        const targetFat = (mealData.target_fat_g * (dist.fat_pct || dist.calories_pct) / 100).toFixed(1);
        
        console.log(`   ${dist.mealName}: ${targetCal} cal, ${targetProt}g protein, ${targetCarbs}g carbs, ${targetFat}g fat`);
      });
    }

    while (retryCount <= maxRetries) {
      try {
        const { output } = await prompt(input);
        if (!output) {
          console.error("❌ AI did not return output");
          throw new Error("AI did not return output");
        }

        console.log("Raw AI output:", JSON.stringify(output, null, 2));

        const transformedOutput = transformAIOutputToWeekSchema(
          output,
          input,
          mealData,
        );
        const validationResult =
          GeneratePersonalizedMealPlanOutputSchema.safeParse(transformedOutput);

        if (!validationResult.success) {
          console.error(
            "AI output validation error:",
            JSON.stringify(validationResult.error.flatten(), null, 2),
          );
          throw new Error(
            `AI returned data in an unexpected format. Details: ${validationResult.error.message}`,
          );
        }

        console.log("✅ Successfully generated meal plan with Gemini");
        return validationResult.data;
      } catch (error: any) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);

        if (error.message?.includes("400 Bad Request")) {
          console.error("🔍 Gemini API 400 Bad Request Error Analysis:");
          console.error("   - Likely caused by complex schema or long prompt.");
          console.error("   - Simplifying prompt and retrying...");
          // Try fallback prompt
          try {
            const { output } = await fallbackPrompt(input);
            if (!output) {
              console.error("❌ Fallback prompt did not return output");
              throw new Error("Fallback prompt did not return output");
            }

            const transformedOutput = transformAIOutputToWeekSchema(
              output,
              input,
              mealData,
            );
            const validationResult =
              GeneratePersonalizedMealPlanOutputSchema.safeParse(
                transformedOutput,
              );

            if (!validationResult.success) {
              console.error(
                "Fallback AI output validation error:",
                JSON.stringify(validationResult.error.flatten(), null, 2),
              );
              throw new Error(
                `Fallback AI returned data in an unexpected format. Details: ${validationResult.error.message}`,
              );
            }

            console.log(
              "✅ Successfully generated meal plan with fallback prompt",
            );
            return validationResult.data;
          } catch (fallbackError: any) {
            console.error("Fallback prompt failed:", fallbackError);
          }
        }

        if (error.message?.includes("403 Forbidden")) {
          console.error("🔍 Gemini API 403 Forbidden Error Analysis:");
          console.error("   - This usually means:");
          console.error("     1. API key is incorrect or expired");
          console.error("     2. Generative Language API is not enabled");
          console.error("     3. API key has IP restrictions");
          console.error("     4. Billing is not set up");
          console.error("   - Please check your GEMINI_API_KEY in .env.local");
          console.error(
            "   - Ensure Generative Language API is enabled in Google Cloud",
          );
          console.error("   - Verify billing is set up for the project");
        }

        if (error.message?.includes("401")) {
          console.error("🔍 Gemini API 401 Unauthorized Error:");
          console.error("   - API key is invalid or expired");
          console.error("   - Please regenerate your API key");
        }

        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1} of ${maxRetries}...`);
          retryCount++;
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount)),
          );
          continue;
        }

        console.error("❌ All retries failed to generate meal plan");
        throw new Error(
          `Failed to generate meal plan after ${maxRetries + 1} attempts. Error: ${error.message}`,
        );
      }
    }

    throw new Error("Unexpected error: Retry loop exited without resolution");
  },
);

// Main prompt (optimized for accuracy)
const prompt = geminiModel.definePrompt({
  name: "generatePersonalizedMealPlanPrompt",
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are NutriMind, an AI nutritionist. Create a 7-day meal plan with 6 unique meals per day that EXACTLY matches macro targets within 5% tolerance.

**CRITICAL REQUIREMENTS:**
1. **Macro Accuracy (HIGHEST PRIORITY)**: Each meal must match its target macros within ±5%. Daily totals must match within ±3%.
2. **No Repeated Meals**: All 42 meals must be unique in name and ingredient combination.
3. **Systematic Calculation**: For each meal, calculate exact portions to meet targets.

**Daily Targets**: {{meal_data.target_daily_calories}} cal, {{meal_data.target_protein_g}}g protein, {{meal_data.target_carbs_g}}g carbs, {{meal_data.target_fat_g}}g fat

**Meal Distribution from Macro Splitter**:
{{#if meal_distributions}}
{{#each meal_distributions}}
- {{mealName}}: {{calories_pct}}% calories ({{#multiply ../meal_data.target_daily_calories calories_pct}}{{/multiply}} cal), {{protein_pct}}% protein ({{#multiply ../meal_data.target_protein_g protein_pct}}{{/multiply}}g), {{carbs_pct}}% carbs ({{#multiply ../meal_data.target_carbs_g carbs_pct}}{{/multiply}}g), {{fat_pct}}% fat ({{#multiply ../meal_data.target_fat_g fat_pct}}{{/multiply}}g)
{{/each}}
{{else}}
**Default Distribution (if no custom distribution provided):**
- Breakfast: 25% = {{#multiply meal_data.target_daily_calories 0.25}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.25}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.25}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.25}}{{/multiply}}g fat
- Morning Snack: 10% = {{#multiply meal_data.target_daily_calories 0.10}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.10}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.10}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.10}}{{/multiply}}g fat
- Lunch: 30% = {{#multiply meal_data.target_daily_calories 0.30}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.30}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.30}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.30}}{{/multiply}}g fat
- Afternoon Snack: 10% = {{#multiply meal_data.target_daily_calories 0.10}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.10}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.10}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.10}}{{/multiply}}g fat
- Dinner: 20% = {{#multiply meal_data.target_daily_calories 0.20}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.20}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.20}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.20}}{{/multiply}}g fat
- Evening Snack: 5% = {{#multiply meal_data.target_daily_calories 0.05}}{{/multiply}} cal, {{#multiply meal_data.target_protein_g 0.05}}{{/multiply}}g protein, {{#multiply meal_data.target_carbs_g 0.05}}{{/multiply}}g carbs, {{#multiply meal_data.target_fat_g 0.05}}{{/multiply}}g fat
{{/if}}

**User Preferences**:
- Diet: {{preferred_diet}}
- Allergies: {{#if allergies.length}}{{allergies}}{{else}}None{{/if}}
- Avoid: {{#if dispreferrred_ingredients.length}}{{dispreferrred_ingredients}}{{else}}None{{/if}}
- Preferred: {{#if preferred_ingredients.length}}{{preferred_ingredients}}{{else}}None{{/if}}
- Medical: {{#if medical_conditions.length}}{{medical_conditions}}{{else}}None{{/if}}

**Calculation Method for Each Meal**:
1. Identify target calories/protein/carbs/fat for the meal type
2. Select appropriate base ingredients (protein source, carb source, fat source, vegetables)
3. Calculate exact quantities to meet targets within 5% tolerance
4. Verify totals before finalizing meal

**Standard Nutritional Values (use these for consistency)**:
- Chicken breast: 165 cal, 31g protein, 0g carbs, 3.6g fat per 100g
- Rice (cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat per 100g
- Olive oil: 884 cal, 0g protein, 0g carbs, 100g fat per 100g
- Eggs: 155 cal, 13g protein, 1.1g carbs, 11g fat per 100g
- Greek yogurt: 59 cal, 10g protein, 3.6g carbs, 0.4g fat per 100g
- Oats: 389 cal, 16.9g protein, 66.3g carbs, 6.9g fat per 100g
- Banana: 89 cal, 1.1g protein, 22.8g carbs, 0.3g fat per 100g
- Almonds: 579 cal, 21.2g protein, 21.6g carbs, 49.9g fat per 100g

**Output Format (EXACT JSON)**:
{
  "days": [
    {
      "day_of_week": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "custom_name": "Power Protein Bowl",
          "ingredients": [
            {
              "name": "Greek yogurt",
              "quantity": 150,
              "unit": "g",
              "calories": 88.5,
              "protein": 15,
              "carbs": 5.4,
              "fat": 0.6
            }
          ],
          "total_calories": 88.5,
          "total_protein": 15,
          "total_carbs": 5.4,
          "total_fat": 0.6
        }
      ],
      "daily_totals": {
        "calories": 1500,
        "protein": 120,
        "carbs": 180,
        "fat": 50
      }
    }
  ],
  "weekly_summary": {
    "total_calories": 10500,
    "total_protein": 840,
    "total_carbs": 1260,
    "total_fat": 350
  }
}

**VALIDATION RULES**:
- Each meal total must be within 5% of target
- Daily totals must be within 3% of targets  
- All numbers must be precise (use decimals)
- No repeated meal names across the week
- Include variety in ingredients and cooking methods

Generate the precise meal plan now with exact calculations.`,
});

// Fallback prompt (even simpler)
const fallbackPrompt = geminiModel.definePrompt({
  name: "generatePersonalizedMealPlanFallbackPrompt",
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `Generate a 7-day meal plan with 6 unique meals per day for a {{preferred_diet}} diet. Each meal must have 3-8 ingredients and match the following daily targets: {{meal_data.target_daily_calories}} calories, {{meal_data.target_protein_g}}g protein, {{meal_data.target_carbs_g}}g carbs, {{meal_data.target_fat_g}}g fat. Avoid allergens ({{#if allergies.length}}{{allergies}}{{else}}None{{/if}}) and dispreferred ingredients ({{#if dispreferrred_ingredients.length}}{{dispreferrred_ingredients}}{{else}}None{{/if}}). Each meal must match macro distributions: {{#if meal_distributions}}{{#each meal_distributions}}- {{mealName}}: {{calories_pct}}% calories, {{protein_pct}}% protein, {{carbs_pct}}% carbs, {{fat_pct}}% fat{{/each}}{{else}}- Breakfast: 25% - Morning Snack: 10% - Lunch: 30% - Afternoon Snack: 10% - Dinner: 20% - Evening Snack: 5%{{/if}}. Return valid JSON with 7 days, 6 meals per day, daily totals, and a weekly summary.`,
});

// Calculate daily totals from meals
function calculateDailyTotals(meals: any[]): any {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + (Number(meal.total_calories) || 0),
      protein: totals.protein + (Number(meal.total_protein) || 0),
      carbs: totals.carbs + (Number(meal.total_carbs) || 0),
      fat: totals.fat + (Number(meal.total_fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// Calculate weekly summary from days
function calculateWeeklySummary(week: any[]): any {
  return week.reduce(
    (totals, day) => ({
      total_calories:
        totals.total_calories + (Number(day.daily_totals?.calories) || 0),
      total_protein:
        totals.total_protein + (Number(day.daily_totals?.protein) || 0),
      total_carbs: totals.total_carbs + (Number(day.daily_totals?.carbs) || 0),
      total_fat: totals.total_fat + (Number(day.daily_totals?.fat) || 0),
    }),
    { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 },
  );
}

// Helper function to safely access meal_data properties
function getMealDataValue(
  mealData: {
    target_daily_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  },
  key: keyof {
    target_daily_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  },
): number {
  const value = mealData[key];
  return value !== null && value !== undefined ? Number(value) : 0;
}

// Check for duplicate meals
function checkForDuplicateMeals(meals: any[]): boolean {
  const mealSignatures = new Set<string>();
  for (const meal of meals) {
    const signature = JSON.stringify({
      custom_name: meal.custom_name,
      ingredients: meal.ingredients.map((ing: any) => ing.name).sort(),
    });
    if (mealSignatures.has(signature)) {
      console.warn(`Duplicate meal detected: ${meal.custom_name}`);
      return true;
    }
    mealSignatures.add(signature);
  }
  return false;
}

// Transform AI output to required schema
function transformAIOutputToWeekSchema(
  output: any,
  input: GeneratePersonalizedMealPlanInput,
  mealData: {
    target_daily_calories: number;
    target_protein_g: number;
    target_carbs_g: number;
    target_fat_g: number;
  },
): GeneratePersonalizedMealPlanOutput {
  if (!output || typeof output !== "object") {
    console.error("Invalid AI output: Output is not an object");
    throw new Error("Invalid AI output: Output is not an object");
  }

  // Handle both "days" and "week" cases
  let days = output.days || output.week || [];
  if (!Array.isArray(days)) {
    console.error("Invalid AI output: No valid days array");
    throw new Error("Invalid AI output: No valid days array");
  }

  // Ensure exactly 7 days
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  if (days.length !== 7) {
    console.error(
      `Invalid AI output: Expected exactly 7 days, got ${days.length}.`,
    );
    throw new Error("Invalid AI output: Incorrect number of days");
  }

  // Collect all meals to check for duplicates
  const allMeals: any[] = [];
  days.forEach((day: any) => {
    if (Array.isArray(day.meals)) {
      allMeals.push(...day.meals);
    }
  });

  // Check for duplicate meals
  if (checkForDuplicateMeals(allMeals)) {
    console.error("Duplicate meals detected in AI output.");
    throw new Error("Duplicate meals detected in AI output");
  }

  const week = days.map((dayObj: any, dayIndex: number) => {
    if (!dayObj.day_of_week || dayObj.day_of_week !== dayNames[dayIndex]) {
      console.error(
        `Invalid or missing day_of_week at index ${dayIndex}. Expected: ${dayNames[dayIndex]}.`,
      );
      throw new Error(
        `Invalid day_of_week: Expected ${dayNames[dayIndex]}, got ${dayObj.day_of_week || "undefined"}`,
      );
    }

    let meals = Array.isArray(dayObj.meals) ? dayObj.meals : [];
    // Ensure exactly 6 meals
    const mealNames = [
      "Breakfast",
      "Morning Snack",
      "Lunch",
      "Afternoon Snack",
      "Dinner",
      "Evening Snack",
    ];
    if (meals.length !== 6) {
      console.error(
        `Invalid number of meals for ${dayObj.day_of_week}: Expected 6, got ${meals.length}.`,
      );
      throw new Error("Invalid number of meals");
    }

    const safeMeals = meals.map((meal: any, mealIndex: number) => {
      // Ensure meal_name
      if (!meal.meal_name || meal.meal_name !== mealNames[mealIndex]) {
        console.error(
          `Invalid or missing meal_name for meal ${mealIndex + 1} on ${dayObj.day_of_week}. Expected: ${mealNames[mealIndex]}.`,
        );
        throw new Error(
          `Invalid meal_name: Expected ${mealNames[mealIndex]}, got ${meal.meal_name || "undefined"}`,
        );
      }

      // Validate ingredients
      const safeIngredients = Array.isArray(meal.ingredients)
        ? meal.ingredients.filter((ing: any, ingIndex: number) => {
            const isValid =
              ing &&
              typeof ing === "object" &&
              ing.name &&
              Number.isFinite(ing.quantity) &&
              ing.unit &&
              Number.isFinite(ing.calories) &&
              Number.isFinite(ing.protein) &&
              Number.isFinite(ing.carbs) &&
              Number.isFinite(ing.fat);

            if (!isValid) {
              console.error(
                `Invalid ingredient at index ${ingIndex} in meal ${meal.meal_name} on ${dayObj.day_of_week}.`,
              );
              throw new Error(
                `Invalid ingredient in meal ${meal.meal_name} on ${dayObj.day_of_week}`,
              );
            }

            // Filter out allergens and dispreferred ingredients
            const allergies = input.allergies || [];
            const dispreferredIngredients =
              input.dispreferrred_ingredients || [];
            if (
              allergies.includes(ing.name) ||
              dispreferredIngredients.includes(ing.name)
            ) {
              console.error(
                `Ingredient ${ing.name} in meal ${meal.meal_name} on ${dayObj.day_of_week} is an allergen or dispreferred.`,
              );
              throw new Error(
                `Invalid ingredient ${ing.name} in meal ${meal.meal_name}`,
              );
            }

            // Check preferred diet compliance
            const preferredDiet = input.preferred_diet || "Standard";
            const nonVegetarianIngredients = [
              "Chicken",
              "Turkey",
              "Beef",
              "Pork",
              "Salmon",
              "Tuna",
              "Shrimp",
            ];
            const nonVeganIngredients = [
              ...nonVegetarianIngredients,
              "Egg",
              "Greek Yogurt",
              "Cottage Cheese",
              "Cheddar Cheese",
            ];
            if (
              preferredDiet === "Vegetarian" &&
              nonVegetarianIngredients.includes(ing.name)
            ) {
              console.error(
                `Ingredient ${ing.name} in meal ${meal.meal_name} on ${dayObj.day_of_week} is not vegetarian.`,
              );
              throw new Error(
                `Non-vegetarian ingredient ${ing.name} in meal ${meal.meal_name}`,
              );
            }
            if (
              preferredDiet === "Vegan" &&
              nonVeganIngredients.includes(ing.name)
            ) {
              console.error(
                `Ingredient ${ing.name} in meal ${meal.meal_name} on ${dayObj.day_of_week} is not vegan.`,
              );
              throw new Error(
                `Non-vegan ingredient ${ing.name} in meal ${meal.meal_name}`,
              );
            }

            return true;
          })
        : [];

      // Ensure 3-8 ingredients
      if (safeIngredients.length < 3 || safeIngredients.length > 8) {
        console.error(
          `Invalid ingredients for meal ${meal.meal_name} on ${dayObj.day_of_week}: Expected 3-8 ingredients, got ${safeIngredients.length}.`,
        );
        throw new Error(
          `Invalid ingredient count for meal ${meal.meal_name}: Got ${safeIngredients.length}`,
        );
      }

      // Calculate meal totals
      const mealTotals = {
        total_calories: safeIngredients.reduce(
          (sum: number, ing: any) => sum + Number(ing.calories),
          0,
        ),
        total_protein: safeIngredients.reduce(
          (sum: number, ing: any) => sum + Number(ing.protein),
          0,
        ),
        total_carbs: safeIngredients.reduce(
          (sum: number, ing: any) => sum + Number(ing.carbs),
          0,
        ),
        total_fat: safeIngredients.reduce(
          (sum: number, ing: any) => sum + Number(ing.fat),
          0,
        ),
      };

      // Validate macro distribution with improved accuracy
      const targetCalories = mealData.target_daily_calories;
      const targetProtein = mealData.target_protein_g;
      const targetCarbs = mealData.target_carbs_g;
      const targetFat = mealData.target_fat_g;
      
      // Use actual meal distributions from macro splitter or defaults
      const mealDistributions = input.meal_distributions || [
        {
          mealName: "Breakfast",
          calories_pct: 25,
          protein_pct: 25,
          carbs_pct: 25,
          fat_pct: 25,
        },
        {
          mealName: "Morning Snack", 
          calories_pct: 10,
          protein_pct: 10,
          carbs_pct: 10,
          fat_pct: 10,
        },
        {
          mealName: "Lunch",
          calories_pct: 30,
          protein_pct: 30,
          carbs_pct: 30,
          fat_pct: 30,
        },
        {
          mealName: "Afternoon Snack",
          calories_pct: 10,
          protein_pct: 10,
          carbs_pct: 10,
          fat_pct: 10,
        },
        {
          mealName: "Dinner",
          calories_pct: 20,
          protein_pct: 20,
          carbs_pct: 20,
          fat_pct: 20,
        },
        {
          mealName: "Evening Snack",
          calories_pct: 5,
          protein_pct: 5,
          carbs_pct: 5,
          fat_pct: 5,
        },
      ];
      
      const distribution = mealDistributions[mealIndex];
      if (!distribution) {
        console.error(`No distribution found for meal index ${mealIndex}`);
        throw new Error(`No distribution found for meal ${meal.meal_name}`);
      }
      
      // Calculate precise target macros for this meal
      const targetMealCalories = Number((targetCalories * distribution.calories_pct / 100).toFixed(1));
      const targetMealProtein = Number((targetProtein * (distribution.protein_pct || distribution.calories_pct) / 100).toFixed(1));
      const targetMealCarbs = Number((targetCarbs * (distribution.carbs_pct || distribution.calories_pct) / 100).toFixed(1));
      const targetMealFat = Number((targetFat * (distribution.fat_pct || distribution.calories_pct) / 100).toFixed(1));
      
      const tolerance = 0.05; // ±5% tolerance for meal-level accuracy

      if (
        mealTotals.total_calories < targetMealCalories * (1 - tolerance) ||
        mealTotals.total_calories > targetMealCalories * (1 + tolerance) ||
        mealTotals.total_protein < targetMealProtein * (1 - tolerance) ||
        mealTotals.total_protein > targetMealProtein * (1 + tolerance) ||
        mealTotals.total_carbs < targetMealCarbs * (1 - tolerance) ||
        mealTotals.total_carbs > targetMealCarbs * (1 + tolerance) ||
        mealTotals.total_fat < targetMealFat * (1 - tolerance) ||
        mealTotals.total_fat > targetMealFat * (1 + tolerance)
      ) {
        console.error(
          `Meal ${meal.meal_name} on ${dayObj.day_of_week} does not match macro distribution:
          Calories: ${mealTotals.total_calories} (expected: ${targetMealCalories} ±${targetMealCalories * tolerance}),
          Protein: ${mealTotals.total_protein} (expected: ${targetMealProtein} ±${targetMealProtein * tolerance}),
          Carbs: ${mealTotals.total_carbs} (expected: ${targetMealCarbs} ±${targetMealCarbs * tolerance}),
          Fat: ${mealTotals.total_fat} (expected: ${targetMealFat} ±${targetMealFat * tolerance}).`,
        );
        throw new Error(
          `Macro distribution mismatch for meal ${meal.meal_name} on ${dayObj.day_of_week}`,
        );
      }

      return {
        meal_name: meal.meal_name,
        custom_name: meal.custom_name || `${meal.meal_name} Meal`,
        ingredients: safeIngredients.map((ing: any) => ({
          name: ing.name || "Unknown",
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || "g",
          calories: Number(ing.calories) || 0,
          protein: Number(ing.protein) || 0,
          carbs: Number(ing.carbs) || 0,
          fat: Number(ing.fat) || 0,
        })),
        total_calories: mealTotals.total_calories,
        total_protein: mealTotals.total_protein,
        total_carbs: mealTotals.total_carbs,
        total_fat: mealTotals.total_fat,
      };
    });

    const dailyTotals = calculateDailyTotals(safeMeals);

    // Validate daily totals with precise calculations
    const targetCalories = mealData.target_daily_calories;
    const targetProtein = mealData.target_protein_g;
    const targetCarbs = mealData.target_carbs_g;
    const targetFat = mealData.target_fat_g;
    const dailyTolerance = 0.03; // ±3% for daily accuracy

    // Round daily totals to 1 decimal place for consistency
    const roundedDailyTotals = {
      calories: Number(dailyTotals.calories.toFixed(1)),
      protein: Number(dailyTotals.protein.toFixed(1)),
      carbs: Number(dailyTotals.carbs.toFixed(1)),
      fat: Number(dailyTotals.fat.toFixed(1)),
    };

    // Calculate acceptable ranges
    const ranges = {
      calories: {
        min: Number((targetCalories * (1 - dailyTolerance)).toFixed(1)),
        max: Number((targetCalories * (1 + dailyTolerance)).toFixed(1)),
      },
      protein: {
        min: Number((targetProtein * (1 - dailyTolerance)).toFixed(1)),
        max: Number((targetProtein * (1 + dailyTolerance)).toFixed(1)),
      },
      carbs: {
        min: Number((targetCarbs * (1 - dailyTolerance)).toFixed(1)),
        max: Number((targetCarbs * (1 + dailyTolerance)).toFixed(1)),
      },
      fat: {
        min: Number((targetFat * (1 - dailyTolerance)).toFixed(1)),
        max: Number((targetFat * (1 + dailyTolerance)).toFixed(1)),
      },
    };

    // Check if daily totals are within acceptable ranges
    const violations = [];
    
    if (roundedDailyTotals.calories < ranges.calories.min || roundedDailyTotals.calories > ranges.calories.max) {
      violations.push(`Calories: ${roundedDailyTotals.calories} (expected: ${targetCalories}, range: ${ranges.calories.min}-${ranges.calories.max})`);
    }
    if (roundedDailyTotals.protein < ranges.protein.min || roundedDailyTotals.protein > ranges.protein.max) {
      violations.push(`Protein: ${roundedDailyTotals.protein}g (expected: ${targetProtein}g, range: ${ranges.protein.min}-${ranges.protein.max})`);
    }
    if (roundedDailyTotals.carbs < ranges.carbs.min || roundedDailyTotals.carbs > ranges.carbs.max) {
      violations.push(`Carbs: ${roundedDailyTotals.carbs}g (expected: ${targetCarbs}g, range: ${ranges.carbs.min}-${ranges.carbs.max})`);
    }
    if (roundedDailyTotals.fat < ranges.fat.min || roundedDailyTotals.fat > ranges.fat.max) {
      violations.push(`Fat: ${roundedDailyTotals.fat}g (expected: ${targetFat}g, range: ${ranges.fat.min}-${ranges.fat.max})`);
    }

    if (violations.length > 0) {
      console.error(`Daily totals for ${dayObj.day_of_week} out of acceptable 3% range:`, violations.join(', '));
      throw new Error(`Daily totals accuracy violation for ${dayObj.day_of_week}: ${violations.join('; ')}`);
    }

    // Log successful validation
    console.log(`✅ Daily totals for ${dayObj.day_of_week} validated successfully:`, roundedDailyTotals);

    return {
      day_of_week: dayObj.day_of_week,
      meals: safeMeals,
      daily_totals: {
        calories: Number(dailyTotals.calories) || 0,
        protein: Number(dailyTotals.protein) || 0,
        carbs: Number(dailyTotals.carbs) || 0,
        fat: Number(dailyTotals.fat) || 0,
      },
    };
  });

  const weeklySummary = calculateWeeklySummary(week);

  return {
    days: week,
    weekly_summary: {
      total_calories: Number(weeklySummary.total_calories) || 0,
      total_protein: Number(weeklySummary.total_protein) || 0,
      total_carbs: Number(weeklySummary.total_carbs) || 0,
      total_fat: Number(weeklySummary.total_fat) || 0,
    },
  };
}
