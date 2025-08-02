
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

// Extended input schema for internal use
const ExtendedGeneratePersonalizedMealPlanInputSchema = z.object({
  age: z.number().int().min(1).max(120).default(30),
  biological_sex: z.enum(["male", "female", "other"]).default("other"),
  height_cm: z.number().min(50).max(300).default(170),
  current_weight_kg: z.number().min(20).max(500).default(70),
  target_weight_kg: z.number().min(20).max(500).default(70),
  physical_activity_level: z.enum(["sedentary", "light", "moderate", "active", "extra_active"]).default("moderate"),
  primary_diet_goal: z.enum(["fat_loss", "muscle_gain", "recomp"]).default("fat_loss"),
  preferred_diet: z.enum(["Standard", "Vegetarian", "Vegan", "Keto"]).default("Standard"),
  allergies: z.array(z.string()).default([]),
  dispreferrred_ingredients: z.array(z.string()).default([]),
  preferred_ingredients: z.array(z.string()).default([]),
  medical_conditions: z.array(z.string()).default([]),
  meal_data: z.object({
    target_daily_calories: z.number().min(100).default(1200),
    target_protein_g: z.number().min(0).default(90),
    target_carbs_g: z.number().min(0).default(150),
    target_fat_g: z.number().min(0).default(40),
  }).default({
    target_daily_calories: 1200,
    target_protein_g: 90,
    target_carbs_g: 150,
    target_fat_g: 40,
  }),
  meal_distributions: z.array(
    z.object({
      mealName: z.enum(["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Evening Snack"]),
      calories_pct: z.number().min(0).max(100),
      protein_pct: z.number().min(0).max(100).optional(),
      carbs_pct: z.number().min(0).max(100).optional(),
      fat_pct: z.number().min(0).max(100).optional(),
    })
  ).length(6).default([
    { mealName: "Breakfast", calories_pct: 25 },
    { mealName: "Morning Snack", calories_pct: 10 },
    { mealName: "Lunch", calories_pct: 30 },
    { mealName: "Afternoon Snack", calories_pct: 10 },
    { mealName: "Dinner", calories_pct: 20 },
    { mealName: "Evening Snack", calories_pct: 5 },
  ]),
  calculatedMealTargets: z.array(
    z.object({
      mealName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  ),
  dailyTotals: z.object({
    target_daily_calories: z.number(),
    target_protein_g: z.number(),
    target_carbs_g: z.number(),
    target_fat_g: z.number(),
  }),
});

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
    console.log("🔄 Starting meal plan generation...");
    console.log("📊 Input meal_data:", mealData);
    console.log("📋 Meal distributions:", input.meal_distributions);

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

    // Calculate meal targets from macro splitter data
    const mealTargets = calculateMealTargets(
      mealData,
      input.meal_distributions,
    );
    console.log("🎯 Calculated meal targets:", mealTargets);

    while (retryCount <= maxRetries) {
      try {
        const { output } = await prompt({
          ...input,
          calculatedMealTargets: mealTargets,
          dailyTotals: mealData,
        });

        if (!output) {
          console.error("❌ AI did not return output");
          throw new Error("AI did not return output");
        }

        console.log("✅ Raw AI output received");
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

          try {
            const { output } = await fallbackPrompt({
              ...input,
              calculatedMealTargets: mealTargets,
              dailyTotals: mealData,
            });

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

// Calculate exact meal targets from macro splitter
function calculateMealTargets(mealData: any, mealDistributions: any[]) {
  const defaultDistributions = [
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

  const distributions = mealDistributions || defaultDistributions;

  return distributions.map((dist) => {
    const calories = Math.round(
      (mealData.target_daily_calories * dist.calories_pct) / 100,
    );
    const protein = Math.round(
      (mealData.target_protein_g * (dist.protein_pct || dist.calories_pct)) /
        100,
    );
    const carbs = Math.round(
      (mealData.target_carbs_g * (dist.carbs_pct || dist.calories_pct)) / 100,
    );
    const fat = Math.round(
      (mealData.target_fat_g * (dist.fat_pct || dist.calories_pct)) / 100,
    );

    return {
      mealName: dist.mealName,
      calories,
      protein,
      carbs,
      fat,
    };
  });
}

// Main prompt (simplified without helper functions)
const prompt = geminiModel.definePrompt({
  name: "generatePersonalizedMealPlanPrompt",
  input: {
    schema: ExtendedGeneratePersonalizedMealPlanInputSchema,
  },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are NutriMind, an AI nutritionist. Create a 7-day meal plan with exactly 6 meals per day that matches the provided macro targets within 5% tolerance.

**CRITICAL REQUIREMENTS:**
1. **Macro Accuracy**: Each meal must match its target macros within ±5%. Daily totals must match within ±3%.
2. **No Repeated Meals**: All 42 meals must be unique in name and ingredient combination.
3. **Exact Calculations**: Use precise portions to meet targets.

**Daily Targets:**
- Calories: {{dailyTotals.target_daily_calories}}
- Protein: {{dailyTotals.target_protein_g}}g
- Carbs: {{dailyTotals.target_carbs_g}}g
- Fat: {{dailyTotals.target_fat_g}}g

**Meal Targets (from Macro Splitter):**
{{#each calculatedMealTargets}}
- {{mealName}}: {{calories}} calories, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat
{{/each}}

**User Preferences:**
- Diet: {{preferred_diet}}
- Allergies: {{#if allergies.length}}{{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Avoid: {{#if dispreferrred_ingredients.length}}{{#each dispreferrred_ingredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Prefer: {{#if preferred_ingredients.length}}{{#each preferred_ingredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**Standard Nutritional Values (per 100g):**
- Chicken breast: 165 cal, 31g protein, 0g carbs, 3.6g fat
- Rice (cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Olive oil: 884 cal, 0g protein, 0g carbs, 100g fat
- Eggs: 155 cal, 13g protein, 1.1g carbs, 11g fat
- Greek yogurt: 59 cal, 10g protein, 3.6g carbs, 0.4g fat
- Oats: 389 cal, 16.9g protein, 66.3g carbs, 6.9g fat
- Banana: 89 cal, 1.1g protein, 22.8g carbs, 0.3g fat
- Almonds: 579 cal, 21.2g protein, 21.6g carbs, 49.9g fat

**Required JSON Output Format:**
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

Generate the complete 7-day meal plan now with exact macro calculations.`,
});

// Fallback prompt (even simpler)
const fallbackPrompt = geminiModel.definePrompt({
  name: "generatePersonalizedMealPlanFallbackPrompt",
  input: {
    schema: ExtendedGeneratePersonalizedMealPlanInputSchema,
  },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `Generate a 7-day meal plan with 6 unique meals per day for a {{preferred_diet}} diet. 

Daily targets: {{dailyTotals.target_daily_calories}} calories, {{dailyTotals.target_protein_g}}g protein, {{dailyTotals.target_carbs_g}}g carbs, {{dailyTotals.target_fat_g}}g fat.

Each meal targets:
{{#each calculatedMealTargets}}
{{mealName}}: {{calories}} cal, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat
{{/each}}

Avoid: {{#if allergies.length}}{{#each allergies}}{{this}} {{/each}}{{/if}}{{#if dispreferrred_ingredients.length}}{{#each dispreferrred_ingredients}}{{this}} {{/each}}{{/if}}

Return valid JSON with 7 days, 6 meals per day, exact macro calculations, daily totals, and weekly summary.`,
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

  let days = output.days || output.week || [];
  if (!Array.isArray(days)) {
    console.error("Invalid AI output: No valid days array");
    throw new Error("Invalid AI output: No valid days array");
  }

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
      if (!meal.meal_name || meal.meal_name !== mealNames[mealIndex]) {
        console.error(
          `Invalid or missing meal_name for meal ${mealIndex + 1} on ${dayObj.day_of_week}. Expected: ${mealNames[mealIndex]}.`,
        );
        throw new Error(
          `Invalid meal_name: Expected ${mealNames[mealIndex]}, got ${meal.meal_name || "undefined"}`,
        );
      }

      const safeIngredients = Array.isArray(meal.ingredients)
        ? meal.ingredients.filter((ing: any) => {
            return (
              ing &&
              typeof ing === "object" &&
              ing.name &&
              Number.isFinite(ing.quantity) &&
              ing.unit &&
              Number.isFinite(ing.calories) &&
              Number.isFinite(ing.protein) &&
              Number.isFinite(ing.carbs) &&
              Number.isFinite(ing.fat)
            );
          })
        : [];

      if (safeIngredients.length < 2 || safeIngredients.length > 8) {
        console.error(
          `Invalid ingredients for meal ${meal.meal_name} on ${dayObj.day_of_week}: Expected 2-8 ingredients, got ${safeIngredients.length}.`,
        );
        throw new Error(
          `Invalid ingredient count for meal ${meal.meal_name}: Got ${safeIngredients.length}`,
        );
      }

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
        total_calories: Number(mealTotals.total_calories.toFixed(1)),
        total_protein: Number(mealTotals.total_protein.toFixed(1)),
        total_carbs: Number(mealTotals.total_carbs.toFixed(1)),
        total_fat: Number(mealTotals.total_fat.toFixed(1)),
      };
    });

    const dailyTotals = calculateDailyTotals(safeMeals);

    return {
      day_of_week: dayObj.day_of_week,
      meals: safeMeals,
      daily_totals: {
        calories: Number(dailyTotals.calories.toFixed(1)),
        protein: Number(dailyTotals.protein.toFixed(1)),
        carbs: Number(dailyTotals.carbs.toFixed(1)),
        fat: Number(dailyTotals.fat.toFixed(1)),
      },
    };
  });

  const weeklySummary = calculateWeeklySummary(week);

  return {
    days: week,
    weekly_summary: {
      total_calories: Number(weeklySummary.total_calories.toFixed(1)),
      total_protein: Number(weeklySummary.total_protein.toFixed(1)),
      total_carbs: Number(weeklySummary.total_carbs.toFixed(1)),
      total_fat: Number(weeklySummary.total_fat.toFixed(1)),
    },
  };
}
