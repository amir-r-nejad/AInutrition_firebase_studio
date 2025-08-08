"use server";

import { geminiModel } from "@/ai/genkit";
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  AIDailyPlanOutputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
  type AIGeneratedMeal,
  DayPlan,
} from "@/lib/schemas";
import { daysOfWeek } from "@/lib/constants";
import { getAIApiErrorMessage } from "@/lib/utils";
import { z } from "zod";
import { editAiPlan } from "@/features/meal-plan/lib/data-service";

// Function to validate numbers
function isValidNumber(val: any): boolean {
  return typeof val === "number" && !isNaN(val) && isFinite(val);
}

// Process meal targets into a structured format
function preprocessMealTargets(mealTargets: any[]): any[] {
  const defaultMacroSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 };
  return mealTargets
    .map((meal, index) => {
      const mealName = meal.mealName || `Meal ${index + 1}`;
      const calories =
        isValidNumber(meal.calories) && meal.calories > 0 ? meal.calories : 0;
      const protein = isValidNumber(meal.protein)
        ? meal.protein
        : (calories * defaultMacroSplit.protein) / 4;
      const carbs = isValidNumber(meal.carbs)
        ? meal.carbs
        : (calories * defaultMacroSplit.carbs) / 4;
      const fat = isValidNumber(meal.fat)
        ? meal.fat
        : (calories * defaultMacroSplit.fat) / 9;

      if ([calories, protein, carbs, fat].some((val) => !isValidNumber(val))) {
        console.warn(`Invalid macros in meal ${mealName}`);
        return null;
      }

      return {
        mealName,
        calories: Number(calories.toFixed(2)),
        protein: Number(protein.toFixed(2)),
        carbs: Number(carbs.toFixed(2)),
        fat: Number(fat.toFixed(2)),
      };
    })
    .filter(Boolean);
}

// Schema for daily meal plan input
const DailyPromptInputSchema = z.object({
  dayOfWeek: z.string(),
  mealTargets: z.array(
    z.object({
      mealName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  ),
  preferredDiet: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  dispreferredIngredients: z.array(z.string()).nullable().optional(),
  preferredIngredients: z.array(z.string()).nullable().optional(),
  preferredCuisines: z.array(z.string()).nullable().optional(),
  dispreferredCuisines: z.array(z.string()).nullable().optional(),
  medicalConditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
});

type DailyPromptInput = z.infer<typeof DailyPromptInputSchema>;

// Simplified prompt with optimization for token use
const dailyPrompt = geminiModel.definePrompt({
  name: "generateDailyMealPlanPrompt",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `
You are a nutritional service that finds recipes from various online sources that meet strict macronutrient targets. For each meal, find a recipe that matches the following targets as closely as possible (within 5% tolerance) and fits the user's preferences.

**Meal Targets:**
{{#each mealTargets}}
- **Meal: {{this.mealName}}**
  - **Calories:** {{this.calories}} kcal
  - **Protein:** {{this.protein}}g
  - **Carbs:** {{this.carbs}}g
  - **Fat:** {{this.fat}}g
{{/each}}

**Preferences:**
{{#if preferredDiet}}Diet: {{preferredDiet}}{{/if}}
{{#if allergies.length}}Allergies: {{allergies}}{{/if}}
{{#if dispreferredIngredients.length}}Avoid: {{dispreferredIngredients}}{{/if}}
{{#if preferredIngredients.length}}Preferred: {{preferredIngredients}}{{/if}}

Please search for a recipe on the web and return a meal with ingredients that match the macros as closely as possible.

- Ingredients must include name, calories, protein, carbs, and fat.
- Do not include any additional text or markdown.
`,
});

// Flow for generating the personalized meal plan
const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generatePersonalizedMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];

      let retryCount = 0;
      const maxRetries = 3;
      let dailyOutput = null;

      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          const dailyPromptInput: DailyPromptInput = {
            dayOfWeek,
            mealTargets: input.mealTargets,
            preferredDiet: input.preferredDiet || null,
            allergies: input.allergies || [],
            dispreferredIngredients: input.dispreferredIngredients || [],
            preferredIngredients: input.preferredIngredients || [],
            preferredCuisines: input.preferredCuisines || [],
            dispreferredCuisines: input.dispreferredCuisines || [],
            medicalConditions: input.medicalConditions || [],
            medications: input.medications || [],
          };

          const promptResult = await dailyPrompt(dailyPromptInput);
          dailyOutput = promptResult.output;

          if (
            !dailyOutput ||
            !dailyOutput.meals ||
            dailyOutput.meals.length === 0
          ) {
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            } else {
              break;
            }
          }
          break;
        } catch (error) {
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!dailyOutput || !dailyOutput.meals || dailyOutput.meals.length === 0)
        continue;

      const processedMeals: AIGeneratedMeal[] = dailyOutput.meals
        .map((meal, index) => {
          const sanitizedIngredients = meal.ingredients.map((ing) => ({
            name: ing.name ?? "Unknown Ingredient",
            calories: Number(ing.calories) || 0,
            protein: Number(ing.protein) || 0,
            carbs: Number(ing.carbs) || 0,
            fat: Number(ing.fat) || 0,
          }));

          const mealTotals = sanitizedIngredients.reduce(
            (totals, ing) => {
              totals.calories += ing.calories;
              totals.protein += ing.protein;
              totals.carbs += ing.carbs;
              totals.fat += ing.fat;
              return totals;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );

          return {
            meal_name:
              input.mealTargets[index]?.mealName || `Meal ${index + 1}`,
            meal_title: meal.meal_title || `Generated ${index + 1}`,
            ingredients: sanitizedIngredients,
            total_calories: mealTotals.calories,
            total_protein: mealTotals.protein,
            total_carbs: mealTotals.carbs,
            total_fat: mealTotals.fat,
          };
        })
        .filter(Boolean);

      if (processedMeals.length > 0) {
        const dailyTotals = processedMeals.reduce(
          (totals, meal) => ({
            calories: totals.calories + (meal.total_calories || 0),
            protein: totals.protein + (meal.total_protein || 0),
            carbs: totals.carbs + (meal.total_carbs || 0),
            fat: totals.fat + (meal.total_fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        processedWeeklyPlan.push({
          day: dayOfWeek,
          meals: processedMeals,
          daily_totals: dailyTotals,
        });

        weeklySummary.totalCalories += dailyTotals.calories;
        weeklySummary.totalProtein += dailyTotals.protein;
        weeklySummary.totalCarbs += dailyTotals.carbs;
        weeklySummary.totalFat += dailyTotals.fat;
      }
    }
    // Return the plan in JSON format
    return {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary,
    };
  },
);

export { generatePersonalizedMealPlanFlow };
