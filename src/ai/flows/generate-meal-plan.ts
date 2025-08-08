
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

export type { GeneratePersonalizedMealPlanOutput };

function isValidNumber(val: any): boolean {
  return typeof val === "number" && !isNaN(val) && isFinite(val);
}

function preprocessMealTargets(mealTargets: any[]): any[] {
  console.log(
    "preprocessMealTargets input:",
    JSON.stringify(mealTargets, null, 2),
  );
  const defaultMacroSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 };

  const processed = mealTargets
    .map((meal, index) => {
      const mealName = meal.mealName || `Meal ${index + 1}`;
      const rawCalories = Number(meal.calories);
      const calories =
        isValidNumber(rawCalories) && rawCalories > 0 ? rawCalories : 0;

      const protein = isValidNumber(meal.protein)
        ? Number(meal.protein)
        : (calories * defaultMacroSplit.protein) / 4;

      const carbs = isValidNumber(meal.carbs)
        ? Number(meal.carbs)
        : (calories * defaultMacroSplit.carbs) / 4;

      const fat = isValidNumber(meal.fat)
        ? Number(meal.fat)
        : (calories * defaultMacroSplit.fat) / 9;

      const allValid = [calories, protein, carbs, fat].every(isValidNumber);
      if (!allValid) {
        console.warn(`Invalid macros in meal index ${index}:`, {
          mealName,
          calories,
          protein,
          carbs,
          fat,
        });
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

  console.log(
    "preprocessMealTargets output:",
    JSON.stringify(processed, null, 2),
  );
  return processed;
}

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

const dailyPrompt = geminiModel.definePrompt({
  name: "generateDailyMealPlanPrompt",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `You are an expert nutritionist and meal planner. Generate EXACTLY 6 diverse and nutritionally balanced meals for {{dayOfWeek}} that strictly match the provided macro targets. Each meal must be unique, practical, and delicious.

**USER PREFERENCES:**
{{#if preferredDiet}}- Diet: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- Allergies: {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- Avoid: {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- Prefer: {{#each preferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- Cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredCuisines.length}}- Avoid Cuisines: {{#each dispreferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medicalConditions.length}}- Health: {{#each medicalConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medications.length}}- Meds: {{#each medications}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**MEAL TARGETS FOR {{dayOfWeek}}:**
{{#each mealTargets}}
**{{this.mealName}}** - {{this.calories}} cal, {{this.protein}}g protein, {{this.carbs}}g carbs, {{this.fat}}g fat
{{/each}}

**CRITICAL REQUIREMENTS:**
1. Generate EXACTLY {{mealTargets.length}} meals - NO MORE, NO LESS
2. Each meal's total macros must be within 3% of targets
3. Use varied, realistic ingredients with accurate nutrition data
4. No repetitive meals - each should be unique and appealing
5. Consider meal timing (light snacks vs substantial meals)
6. Include practical cooking methods and common ingredients
7. Ensure cultural diversity and flavor variety across meals

**OUTPUT FORMAT:**
Return ONLY valid JSON with exactly {{mealTargets.length}} meal objects. Each meal must have:
- meal_title: Creative, appetizing meal name
- ingredients: Array with name, calories, protein, carbs, fat for each ingredient
- Macro totals that match targets within 3% tolerance

Generate diverse, practical meals that people actually want to eat!`,
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generatePersonalizedMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log("🚀 Starting meal plan generation flow");
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Generate all 7 days with better error handling
    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];
      console.log(`📅 Processing ${dayOfWeek} (${dayIndex + 1}/7)`);

      const dailyPromptInput: DailyPromptInput = {
        dayOfWeek,
        mealTargets: input.mealTargets,
        preferredDiet: input.preferred_diet || input.preferredDiet || null,
        allergies: input.allergies || [],
        dispreferredIngredients:
          input.dispreferrred_ingredients ||
          input.dispreferredIngredients ||
          [],
        preferredIngredients:
          input.preferred_ingredients || input.preferredIngredients || [],
        preferredCuisines: input.preferredCuisines || [],
        dispreferredCuisines: input.dispreferredCuisines || [],
        medicalConditions:
          input.medical_conditions || input.medicalConditions || [],
        medications: input.medications || [],
      };

      let dailyOutput = null;
      let retryCount = 0;
      const maxRetries = 2;

      // Retry logic with improved fallback
      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          console.log(`🤖 AI attempt ${retryCount + 1} for ${dayOfWeek}`);
          const promptResult = await dailyPrompt(dailyPromptInput);
          dailyOutput = promptResult.output;

          // Validate output has exactly 6 meals
          if (
            !dailyOutput?.meals ||
            dailyOutput.meals.length !== input.mealTargets.length
          ) {
            console.warn(
              `❌ Invalid meal count for ${dayOfWeek}: got ${dailyOutput?.meals?.length || 0}, expected ${input.mealTargets.length}`,
            );
            dailyOutput = null;
            throw new Error(`Invalid meal count for ${dayOfWeek}`);
          }

          console.log(`✅ Generated ${dailyOutput.meals.length} meals for ${dayOfWeek}`);
          break;
        } catch (error) {
          console.error(`❌ Error on attempt ${retryCount + 1} for ${dayOfWeek}:`, error);
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // If AI fails, create fallback meals
      if (!dailyOutput?.meals || dailyOutput.meals.length !== input.mealTargets.length) {
        console.warn(`🔧 Creating fallback meals for ${dayOfWeek}`);
        dailyOutput = createFallbackMeals(input.mealTargets, dayOfWeek);
      }

      // Process and validate meals
      const processedMeals: AIGeneratedMeal[] = [];
      
      for (let mealIndex = 0; mealIndex < input.mealTargets.length; mealIndex++) {
        const mealFromAI = dailyOutput.meals[mealIndex];
        const targetMeal = input.mealTargets[mealIndex];
        
        if (mealFromAI && mealFromAI.ingredients && mealFromAI.ingredients.length > 0) {
          // Use AI generated meal
          const sanitizedIngredients = mealFromAI.ingredients.map((ing) => ({
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

          processedMeals.push({
            meal_name: targetMeal.mealName,
            meal_title: mealFromAI.meal_title || `${targetMeal.mealName} for ${dayOfWeek}`,
            ingredients: sanitizedIngredients,
            total_calories: mealTotals.calories,
            total_protein: mealTotals.protein,
            total_carbs: mealTotals.carbs,
            total_fat: mealTotals.fat,
          });
        } else {
          // Create placeholder meal
          processedMeals.push(createPlaceholderMeal(targetMeal, dayOfWeek));
        }
      }

      // Calculate daily totals
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

      console.log(`✅ Completed ${dayOfWeek} with ${processedMeals.length} meals`);
    }

    console.log(`🎉 Generated complete weekly plan: ${processedWeeklyPlan.length} days`);

    return {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary,
    };
  },
);

// Helper function to create fallback meals when AI fails
function createFallbackMeals(mealTargets: any[], dayOfWeek: string): any {
  console.log(`🔧 Creating fallback meals for ${dayOfWeek}`);
  
  const fallbackMeals = mealTargets.map((target) => ({
    meal_title: `Balanced ${target.mealName}`,
    ingredients: [
      {
        name: `Protein source for ${target.mealName.toLowerCase()}`,
        calories: Math.round(target.calories * 0.3),
        protein: Math.round(target.protein * 0.6),
        carbs: Math.round(target.carbs * 0.1),
        fat: Math.round(target.fat * 0.3),
      },
      {
        name: `Carb source for ${target.mealName.toLowerCase()}`,
        calories: Math.round(target.calories * 0.5),
        protein: Math.round(target.protein * 0.2),
        carbs: Math.round(target.carbs * 0.8),
        fat: Math.round(target.fat * 0.1),
      },
      {
        name: `Healthy fat for ${target.mealName.toLowerCase()}`,
        calories: Math.round(target.calories * 0.2),
        protein: Math.round(target.protein * 0.2),
        carbs: Math.round(target.carbs * 0.1),
        fat: Math.round(target.fat * 0.6),
      },
    ],
  }));

  return { meals: fallbackMeals };
}

// Helper function to create placeholder meal
function createPlaceholderMeal(targetMeal: any, dayOfWeek: string): AIGeneratedMeal {
  return {
    meal_name: targetMeal.mealName,
    meal_title: `Simple ${targetMeal.mealName}`,
    ingredients: [
      {
        name: `Balanced meal for ${targetMeal.mealName.toLowerCase()}`,
        calories: targetMeal.calories,
        protein: targetMeal.protein,
        carbs: targetMeal.carbs,
        fat: targetMeal.fat,
      }
    ],
    total_calories: targetMeal.calories,
    total_protein: targetMeal.protein,
    total_carbs: targetMeal.carbs,
    total_fat: targetMeal.fat,
  };
}

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput,
  userId: string,
): Promise<GeneratePersonalizedMealPlanOutput> {
  try {
    console.log("🎯 Starting meal plan generation for user:", userId);
    
    const processedInput = {
      ...input,
      mealTargets: preprocessMealTargets(input.mealTargets),
    };

    if (!processedInput.mealTargets || processedInput.mealTargets.length === 0) {
      throw new Error("No valid meal targets could be derived from input.");
    }

    const parsedInput = GeneratePersonalizedMealPlanInputSchema.parse(processedInput);
    const result = await generatePersonalizedMealPlanFlow(parsedInput);
    
    console.log("✅ Meal plan generated successfully");

    // Save the AI plan to database
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving AI meal plan:", saveError);
      // Don't throw error here, just log it
    }

    return result;
  } catch (e) {
    console.error("❌ Meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message: "Failed to generate meal plan. Please check your inputs and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
