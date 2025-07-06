
'use server';

import { ai } from '@/ai/genkit';
import {
  AIGeneratedWeeklyMealPlanSchema,
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  AIUnvalidatedWeeklyMealPlanSchema,
  type AIGeneratedMeal,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from '@/lib/schemas';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import { defaultMacroPercentages, mealNames } from '@/lib/constants';
import { z } from 'zod';

// Define a new schema for the prompt's specific input needs
const MealTargetSchema = z.object({
  mealName: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const PromptInputSchema = GeneratePersonalizedMealPlanInputSchema.extend({
  mealTargets: z.array(MealTargetSchema),
});
type PromptInput = z.infer<typeof PromptInputSchema>;


// Main entry function
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt - Now receives explicit macro targets for each meal.
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: PromptInputSchema }, // Use the new, more detailed schema
  output: { schema: AIUnvalidatedWeeklyMealPlanSchema }, // AI still outputs the basic plan
  prompt: `You are a professional AI nutritionist. Your task is to create a personalized weekly meal plan based on the user's profile and EXACT meal-by-meal macro targets provided below.

**--- USER PROFILE ---**
- Age: {{age}}
- Gender: {{gender}}
- Height: {{height_cm}} cm
- Current Weight: {{current_weight}} kg
- 1-Month Goal Weight: {{goal_weight_1m}} kg
- Activity Level: {{activityLevel}}
- Primary Diet Goal: {{dietGoalOnboarding}}
{{#if preferredDiet}}- Dietary Preference: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- Allergies to Avoid: {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- Disliked Ingredients: {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- Preferred Cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**--- MEAL STRUCTURE & EXACT TARGETS ---**
You MUST generate a complete 7-day plan. For each day, you must generate a meal for EACH of the following targets. The meal you create should be as close as possible to the specified macros.

{{#each mealTargets}}
- **{{this.mealName}}**: Target ~{{this.calories}} kcal, ~{{this.protein}}g Protein, ~{{this.carbs}}g Carbs, ~{{this.fat}}g Fat
{{/each}}


**--- VERY STRICT JSON OUTPUT SCHEMA ---**
Your entire response must be a single JSON object with ONLY ONE top-level key: "weeklyMealPlan".
This "weeklyMealPlan" array MUST contain exactly 7 day objects, one for each day from "Monday" to "Sunday". Do not calculate totals like "total_calories" yourself.

"weeklyMealPlan": [
  // This is an array of 7 day objects (Monday to Sunday).
  {
    "day": "Monday", // The full name of the day.
    "meals": [
      // This is an array of meal objects. The number of meals per day MUST match the number of targets in the "MEAL STRUCTURE & EXACT TARGETS" section.
      {
        "meal_title": "Oatmeal with Berries and Nuts", // A specific, appealing title for the meal. This field is MANDATORY.
        "ingredients": [
          {
            "ingredient_name": "Oats",
            "quantity_g": 50,
            "macros_per_100g": { "calories": 389, "protein_g": 16.9, "carbs_g": 66.3, "fat_g": 6.9 }
          }
        ]
      }
    ]
  }
]

**--- FINAL RULES & CRITICAL CHECK ---**
1.  **You MUST generate a complete 7-day plan from Monday to Sunday.**
2.  Use the exact field names and spelling as shown in the schema above. Do NOT include a "meal_name" field in your output.
3.  DO NOT add any extra fields, properties, or keys at any level.
4.  All numerical values must be realistic, positive, and correctly calculated.
5.  **CRITICAL CHECK**: Before you finalize your response, you MUST perform these checks on every single part of the generated JSON:
    *   **Meal Check:** Every object in the "meals" array MUST have the "meal_title" property with a descriptive name like "Grilled Chicken Salad".
    *   **Ingredient Check:** Every object in the "ingredients" array MUST contain these three properties: "ingredient_name", "quantity_g", and "macros_per_100g".
    *   **Macros Check:** Every "macros_per_100g" object MUST contain these four properties: "calories", "protein_g", "carbs_g", and "fat_g".
6.  Your entire response MUST be only the pure JSON object. Do not include any markdown formatting (like \`\`\`json), code blocks, or any other text before or after the JSON.
`,
});

// Genkit Flow - Now acts as an orchestrator
const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    // 1. Calculate total daily targets from user profile
    const dailyTargets = calculateEstimatedDailyTargets({
      age: input.age,
      gender: input.gender,
      currentWeight: input.current_weight,
      height: input.height_cm,
      activityLevel: input.activityLevel,
      dietGoal: input.dietGoalOnboarding,
    });

    if (
      !dailyTargets.finalTargetCalories ||
      !dailyTargets.proteinGrams ||
      !dailyTargets.carbGrams ||
      !dailyTargets.fatGrams
    ) {
      throw new Error(
        'Could not calculate daily nutritional targets from the provided profile data.'
      );
    }
    
    // 2. Determine meal distributions (user's custom or default)
    const distributions =
      input.mealDistributions && input.mealDistributions.length > 0
        ? input.mealDistributions
        : mealNames.map((name) => ({
            mealName: name,
            calories_pct: defaultMacroPercentages[name].calories_pct,
            protein_pct: defaultMacroPercentages[name].protein_pct,
            carbs_pct: defaultMacroPercentages[name].carbs_pct,
            fat_pct: defaultMacroPercentages[name].fat_pct,
          }));

    // 3. Calculate absolute macro targets for each meal
    const mealTargets = distributions.map((dist) => ({
      mealName: dist.mealName,
      calories: Math.round(
        dailyTargets.finalTargetCalories! * (dist.calories_pct / 100)
      ),
      protein: Math.round(
        dailyTargets.proteinGrams! * (dist.protein_pct / 100)
      ),
      carbs: Math.round(dailyTargets.carbGrams! * (dist.carbs_pct / 100)),
      fat: Math.round(dailyTargets.fatGrams! * (dist.fat_pct / 100)),
    }));

    // 4. Create the detailed input object for the prompt
    const promptInput: PromptInput = {
      ...input,
      mealTargets: mealTargets,
    };

    // 5. Call the prompt with explicit targets
    const { output } = await prompt(promptInput);
    
    if (!output) {
      throw new Error('AI did not return a meal plan.');
    }

    const validationResult =
      AIUnvalidatedWeeklyMealPlanSchema.safeParse(output);
    if (!validationResult.success) {
      console.error(
        'AI output validation error:',
        validationResult.error.flatten()
      );
      throw new Error(
        `AI returned data in an unexpected format. Details: ${validationResult.error.message}`
      );
    }

    const { weeklyMealPlan } = validationResult.data;

    // 6. Calculate meal-level and weekly summary in reliable application code
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    weeklyMealPlan.forEach((day) => {
      day.meals.forEach((meal, index) => {
        // Forcefully correct or add the meal_name based on its order.
        // This makes the app resilient to the AI forgetting this field.
        if (mealTargets[index]) {
          (meal as any).meal_name = mealTargets[index].mealName;
        } else {
          // Fallback in case of an unexpected mismatch
          (meal as any).meal_name = 'Unknown Meal';
        }

        // Add a fallback for meal_title if the AI forgets it
        if (!meal.meal_title) {
          (meal as any).meal_title = `AI Generated ${
            mealTargets[index]?.mealName || 'Meal'
          }`;
        }

        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;

        meal.ingredients.forEach((ing) => {
          const quantityFactor = ing.quantity_g / 100.0;
          mealCalories += ing.macros_per_100g.calories * quantityFactor;
          mealProtein += ing.macros_per_100g.protein_g * quantityFactor;
          mealCarbs += ing.macros_per_100g.carbs_g * quantityFactor;
          mealFat += ing.macros_per_100g.fat_g * quantityFactor;
        });

        // Mutate the meal object to add calculated totals
        (meal as any).total_calories = mealCalories;
        (meal as any).total_protein_g = mealProtein;
        (meal as any).total_carbs_g = mealCarbs;
        (meal as any).total_fat_g = mealFat;

        // Add meal totals to the weekly summary
        weeklySummary.totalCalories += (meal as any).total_calories;
        weeklySummary.totalProtein += (meal as any).total_protein_g;
        weeklySummary.totalCarbs += (meal as any).total_carbs_g;
        weeklySummary.totalFat += (meal as any).total_fat_g;
      });
    });

    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: weeklyMealPlan as any, // Cast is safe as we've corrected it
      weeklySummary,
    };

    return finalOutput;
  }
);
