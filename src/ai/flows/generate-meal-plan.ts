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
    });

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

// Main prompt (simplified)
const prompt = geminiModel.definePrompt({
  name: "generatePersonalizedMealPlanPrompt",
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are NutriMind, an AI nutritionist. Create a 7-day meal plan with 6 unique meals per day, tailored to the user's dietary preferences and nutritional goals.

**Requirements:**
1. **No Repeated Meals**: All 42 meals (6 meals × 7 days) must have unique names and ingredients.
2. **Diet Compliance**: Follow the user's preferred diet ({{preferred_diet}}) and avoid allergens ({{#if allergies.length}}{{allergies}}{{else}}None{{/if}}) and dispreferred ingredients ({{#if dispreferrred_ingredients.length}}{{dispreferrred_ingredients}}{{else}}None{{/if}}).
3. **Meal Distribution**:
   {{#if meal_distributions}}
   {{#each meal_distributions}}
   - {{mealName}}: {{calories_pct}}% calories, {{protein_pct}}% protein, {{carbs_pct}}% carbs, {{fat_pct}}% fat
   {{/each}}
   {{else}}
   - Breakfast: 25% calories, 25% protein, 25% carbs, 25% fat
   - Morning Snack: 10% calories, 10% protein, 10% carbs, 10% fat
   - Lunch: 30% calories, 30% protein, 30% carbs, 30% fat
   - Afternoon Snack: 10% calories, 10% protein, 10% carbs, 10% fat
   - Dinner: 20% calories, 20% protein, 20% carbs, 20% fat
   - Evening Snack: 5% calories, 5% protein, 5% carbs, 5% fat
   {{/if}}
4. **Nutritional Targets**:
   - Daily: {{meal_data.target_daily_calories}} calories, {{meal_data.target_protein_g}}g protein, {{meal_data.target_carbs_g}}g carbs, {{meal_data.target_fat_g}}g fat
   - Each meal must match macro percentages within ±3%.
   - Daily totals must match targets within ±5%.
5. **Meal Structure**:
   - 7 days (Monday-Sunday), each with 6 meals: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack.
   - Each meal needs 3-8 ingredients with nutritional data (calories, protein, carbs, fat per unit).
   - Include daily totals and a weekly summary.

**User Profile**:
- Age: {{age}}
- Sex: {{biological_sex}}
- Height: {{height_cm}} cm
- Weight: {{current_weight_kg}} kg
- Target Weight: {{target_weight_kg}} kg
- Activity Level: {{physical_activity_level}}
- Diet Goal: {{primary_diet_goal}}
- Preferred Ingredients: {{#if preferred_ingredients.length}}{{preferred_ingredients}}{{else}}None{{/if}}
- Medical Conditions: {{#if medical_conditions.length}}{{medical_conditions}}{{else}}None{{/if}}

**Output Format**:
{
  "days": [
    {
      "day_of_week": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "custom_name": "Unique Meal Name",
          "ingredients": [
            {
              "name": "Ingredient",
              "quantity": 100,
              "unit": "g",
              "calories": 100,
              "protein": 5,
              "carbs": 10,
              "fat": 3
            }
          ],
          "total_calories": 100,
          "total_protein": 5,
          "total_carbs": 10,
          "total_fat": 3
        }
      ],
      "daily_totals": {
        "calories": 1200,
        "protein": 90,
        "carbs": 150,
        "fat": 40
      }
    }
  ],
  "weekly_summary": {
    "total_calories": 8400,
    "total_protein": 630,
    "total_carbs": 1050,
    "total_fat": 280
  }
}

**Rules**:
- Return valid JSON only.
- Use unquoted numbers.
- Ensure 7 days, 6 meals per day, 3-8 ingredients per meal.
- No allergens or dispreferred ingredients.
- No repeated meals.
- Match macro and daily targets.

Generate the meal plan now.`,
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

      // Validate macro distribution
      const targetCalories = mealData.target_daily_calories;
      const targetProtein = mealData.target_protein_g;
      const targetCarbs = mealData.target_carbs_g;
      const targetFat = mealData.target_fat_g;
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
      const targetMealCalories =
        (targetCalories * distribution.calories_pct) / 100;
      const targetMealProtein =
        (targetProtein *
          (distribution.protein_pct || distribution.calories_pct)) /
        100;
      const targetMealCarbs =
        (targetCarbs * (distribution.carbs_pct || distribution.calories_pct)) /
        100;
      const targetMealFat =
        (targetFat * (distribution.fat_pct || distribution.calories_pct)) / 100;
      const tolerance = 0.03; // ±3%

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

    // Validate daily totals
    const targetCalories = mealData.target_daily_calories;
    const targetProtein = mealData.target_protein_g;
    const targetCarbs = mealData.target_carbs_g;
    const targetFat = mealData.target_fat_g;
    const dailyTolerance = 0.05; // ±5%

    if (
      dailyTotals.calories < targetCalories * (1 - dailyTolerance) ||
      dailyTotals.calories > targetCalories * (1 + dailyTolerance) ||
      dailyTotals.protein < targetProtein * (1 - dailyTolerance) ||
      dailyTotals.protein > targetProtein * (1 + dailyTolerance) ||
      dailyTotals.carbs < targetCarbs * (1 - dailyTolerance) ||
      dailyTotals.carbs > targetCarbs * (1 + dailyTolerance) ||
      dailyTotals.fat < targetFat * (1 - dailyTolerance) ||
      dailyTotals.fat > targetFat * (1 + dailyTolerance)
    ) {
      console.error(
        `Daily totals for ${dayObj.day_of_week} out of range:
        Calories: ${dailyTotals.calories} (expected: ${targetCalories} ±${targetCalories * dailyTolerance}),
        Protein: ${dailyTotals.protein} (expected: ${targetProtein} ±${targetProtein * dailyTolerance}),
        Carbs: ${dailyTotals.carbs} (expected: ${targetCarbs} ±${targetCarbs * dailyTolerance}),
        Fat: ${dailyTotals.fat} (expected: ${targetFat} ±${targetFat * dailyTolerance}).`,
      );
      throw new Error(`Daily totals out of range for ${dayObj.day_of_week}`);
    }

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
