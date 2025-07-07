
'use server';

import { ai } from '@/ai/genkit';
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  AIUnvalidatedWeeklyMealPlanSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from '@/lib/schemas';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import { defaultMacroPercentages, mealNames } from '@/lib/constants';
import { z } from 'zod';
import { getAIApiErrorMessage } from '@/lib/utils';

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

// REWRITTEN AI Prompt for clarity and reliability
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: AIUnvalidatedWeeklyMealPlanSchema },
  prompt: `You are a data conversion service. Your sole purpose is to convert user nutritional requirements into a valid JSON object representing a 7-day meal plan. You must adhere strictly to the provided JSON schema.

**USER DATA FOR CONTEXT:**
- **Dietary Goal:** {{dietGoalOnboarding}}
{{#if preferredDiet}}- **Dietary Preference:** {{preferredDiet}}{{/if}}
{{#if allergies.length}}- **Allergies to Avoid:** {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- **Disliked Ingredients:** {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- **Preferred Cuisines:** {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

- **Daily Meal Targets (Generate {{mealTargets.length}} meals per day):**
{{#each mealTargets}}
  - **{{this.mealName}}**: Target ~{{this.calories}} kcal, ~{{this.protein}}g Protein, ~{{this.carbs}}g Carbs, ~{{this.fat}}g Fat
{{/each}}

**CRITICAL INSTRUCTIONS FOR JSON OUTPUT:**
1.  **JSON-ONLY RESPONSE:** Your entire response MUST be a single, valid JSON object. Do not include any text, explanations, greetings, or markdown (like \`\`\`json) before or after the JSON.
2.  **ROOT OBJECT:** The root JSON object MUST have one key: "weeklyMealPlan".
3.  **WEEKLY PLAN:** "weeklyMealPlan" MUST be an array of 7 objects, one for each day from "Monday" to "Sunday".
4.  **DAY OBJECT:** Each day object MUST have a "day" (string) and a "meals" (array).
5.  **MEAL OBJECT:** Each object in the "meals" array MUST have TWO keys:
    - "meal_title": A short, appetizing name for the meal (e.g., "Protein Oatmeal", "Grilled Salmon Salad"). This should NOT contain conversational text or disclaimers.
    - "ingredients": An array of ingredient objects. This array MUST NOT be empty.
6.  **INGREDIENT OBJECT:** Each ingredient object MUST have these five keys: "name" (string, e.g., "Chicken Breast"), "calories" (number), "protein" (number), "carbs" (number), and "fat" (number). Do not add any other keys.
7.  **ACCURACY:** Ensure all macronutrient values are realistic positive numbers.
`,
});

// Genkit Flow - REWRITTEN for robustness and data integrity
const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    // 1. Calculate total daily targets
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
      throw new Error('Could not calculate daily nutritional targets from the provided profile data.');
    }

    // 2. Determine meal distributions
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
      calories: Math.round(dailyTargets.finalTargetCalories! * (dist.calories_pct / 100)),
      protein: Math.round(dailyTargets.proteinGrams! * (dist.protein_pct / 100)),
      carbs: Math.round(dailyTargets.carbGrams! * (dist.carbs_pct / 100)),
      fat: Math.round(dailyTargets.fatGrams! * (dist.fat_pct / 100)),
    }));

    // 4. Create prompt input
    const promptInput: PromptInput = { ...input, mealTargets };

    // 5. Call the prompt
    const { output } = await prompt(promptInput);

    if (!output) {
      throw new Error(getAIApiErrorMessage({ message: 'AI did not return a meal plan.' }));
    }

    // 6. Validate the raw AI output against a lenient schema
    const validationResult = AIUnvalidatedWeeklyMealPlanSchema.safeParse(output);
    if (!validationResult.success) {
      console.error('AI output validation error:', validationResult.error.flatten());
      throw new Error(`AI returned data in an unexpected format. Details: ${validationResult.error.message}`);
    }

    const { weeklyMealPlan: rawWeeklyPlan } = validationResult.data;

    // 7. Sanitize, process, and calculate totals in a robust way
    const weeklySummary = { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 };
    
    const processedWeeklyPlan = rawWeeklyPlan?.map(day => {
        // **KEY FIX**: Filter out any malformed "meal" entries that lack ingredients.
        const validMeals = day.meals?.filter(meal => meal && meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) ?? [];
        
        const processedMeals = validMeals.map((meal, index) => {
            // Sanitize each ingredient to ensure all fields exist and are numbers
            const sanitizedIngredients = meal.ingredients!.map(ing => ({
                name: ing.name ?? 'Unknown Ingredient',
                calories: ing.calories ?? 0,
                protein: ing.protein ?? 0,
                carbs: ing.carbs ?? 0,
                fat: ing.fat ?? 0,
            }));

            // Calculate totals reliably from sanitized data
            const mealTotals = sanitizedIngredients.reduce((totals, ing) => {
                totals.calories += ing.calories;
                totals.protein += ing.protein;
                totals.carbs += ing.carbs;
                totals.fat += ing.fat;
                return totals;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

            // Add to weekly summary
            weeklySummary.totalCalories += mealTotals.calories;
            weeklySummary.totalProtein += mealTotals.protein;
            weeklySummary.totalCarbs += mealTotals.carbs;
            weeklySummary.totalFat += mealTotals.fat;

            // Construct the final, clean meal object
            return {
                meal_name: mealTargets[index]?.mealName || `Meal ${index + 1}`, // Assign name based on filtered order
                meal_title: meal.meal_title || `AI Generated ${mealTargets[index]?.mealName || 'Meal'}`,
                ingredients: sanitizedIngredients,
                total_calories: mealTotals.calories,
                total_protein_g: mealTotals.protein,
                total_carbs_g: mealTotals.carbs,
                total_fat_g: mealTotals.fat,
            };
        });

        return { ...day, meals: processedMeals };
    }) ?? [];


    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: processedWeeklyPlan as any, // Cast is safe because we just built it
      weeklySummary,
    };

    return finalOutput;
  }
);
