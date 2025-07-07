
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
import { defaultMacroPercentages, mealNames, daysOfWeek } from '@/lib/constants';
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
  daysOfWeek: z.array(z.string()),
});
type PromptInput = z.infer<typeof PromptInputSchema>;

// Main entry function
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt - Now asks for a FULL WEEKLY plan in one go.
const prompt = ai.definePrompt({
  name: 'generateWeeklyMealPlanPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: AIUnvalidatedWeeklyMealPlanSchema },
  prompt: `You are a highly precise nutritional data generation service. Your ONLY task is to create a complete 7-day meal plan based on the user's profile and specific macronutrient targets for each meal.

**USER PROFILE (FOR CONTEXT ONLY - DO NOT REPEAT IN OUTPUT):**
- Age: {{age}}
- Gender: {{gender}}
- Dietary Goal: {{dietGoalOnboarding}}
{{#if preferredDiet}}- Dietary Preference: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- Allergies to Avoid: {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- Disliked Ingredients: {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- Favorite Ingredients: {{#each preferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- Favorite Cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredCuisines.length}}- Cuisines to Avoid: {{#each dispreferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medicalConditions.length}}- Medical Conditions: {{#each medicalConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medications.length}}- Medications: {{#each medications}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**ABSOLUTE REQUIREMENTS FOR MEAL GENERATION:**
1.  You MUST generate a plan for all 7 days of the week: {{#each daysOfWeek}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
2.  For each day, you MUST generate a meal object for each meal listed in the targets below.
3.  The total macros for the ingredients you list for each meal MUST fall within a 5% tolerance of the targets.
    - **EXAMPLE CALCULATION:** If Target Calories = 500, a 5% tolerance means the sum of your ingredient calories must be between 475 and 525.
    - **YOU MUST PERFORM THIS CHECK FOR EVERY MEAL AND EVERY MACRONUTRIENT (CALORIES, PROTEIN, CARBS, FAT).**

**DAILY MEAL TARGETS (Use these for EACH of the 7 days):**
{{#each mealTargets}}
- **Meal: {{this.mealName}}**
  - **TARGET Calories:** {{this.calories}} kcal
  - **TARGET Protein:** {{this.protein}}g
  - **TARGET Carbohydrates:** {{this.carbs}}g
  - **TARGET Fat:** {{this.fat}}g
{{/each}}

**CRITICAL OUTPUT INSTRUCTIONS:**
1.  Your response MUST be ONLY a single, valid JSON object that strictly matches the provided output schema.
2.  The JSON object must have one top-level key: "weeklyMealPlan".
3.  "weeklyMealPlan" must be an array of 7 day objects.
4.  Each day object must have a "day" (e.g., "Monday") and a "meals" array.
5.  Each meal object in the "meals" array MUST have a "meal_title" (a short, appetizing name) and a non-empty "ingredients" array.
6.  Each ingredient object MUST have a "name", "calories", "protein", "carbs", and "fat". All values must be numbers.
7.  **Before finalizing your output, you MUST double-check your math for ALL meals across ALL 7 days.** If any meal is outside the 5% tolerance, you must adjust its ingredients and recalculate until it is correct.
8.  Do NOT include any text, notes, greetings, or markdown like \`\`\`json outside the final JSON object.
`,
});

// Genkit Flow - Orchestrator and validator for a single-shot weekly plan
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
      daysOfWeek: daysOfWeek,
    };

    // 5. Call the prompt and get the structured output
    const { output } = await prompt(promptInput);

    if (!output) {
      throw new Error(
        getAIApiErrorMessage({ message: 'AI did not return a meal plan.' })
      );
    }

    // The initial parsing is now handled by Genkit. We just need to validate.
    const validationResult =
      AIUnvalidatedWeeklyMealPlanSchema.safeParse(output);
    if (!validationResult.success) {
      console.error(
        'AI output validation error after Genkit parsing:',
        validationResult.error.flatten()
      );
      throw new Error(
        `AI returned data in an unexpected format. Details: ${validationResult.error.message}`
      );
    }

    const { weeklyMealPlan: unvalidatedPlan } = validationResult.data || { weeklyMealPlan: [] };

    // SANITIZATION STEP: Filter out empty days/meals and ensure every ingredient has the required fields, providing defaults if missing.
    // This makes the data robust for the rest of the application.
    const sanitizedWeeklyMealPlan = (unvalidatedPlan || [])
        .map(day => {
            if (!day || !day.day || !day.meals || day.meals.length === 0) return null;
            
            const processedMeals = day.meals.map(meal => {
                if (!meal || !meal.ingredients || meal.ingredients.length === 0) return null;
                
                return {
                    ...meal,
                    ingredients: meal.ingredients.map(ing => ({
                        name: ing.name ?? 'Unknown Ingredient',
                        calories: ing.calories ?? 0,
                        protein: ing.protein ?? 0,
                        carbs: ing.carbs ?? 0,
                        fat: ing.fat ?? 0,
                    })),
                };
            }).filter(meal => meal !== null);
            
            if (processedMeals.length === 0) return null;

            return {
                ...day,
                meals: processedMeals,
            };
        })
        .filter(day => day !== null);


    if (sanitizedWeeklyMealPlan.length === 0) {
        throw new Error(
            getAIApiErrorMessage({ message: 'The AI returned a plan with no valid days or meals. Please try again.' })
        );
    }

    // 6. Calculate meal-level and weekly summary in reliable application code
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Use the SANITIZED plan for all subsequent operations
    sanitizedWeeklyMealPlan.forEach((day) => {
      (day!.meals).forEach((meal, index) => {
        // Forcefully correct or add the meal_name based on its order.
        (meal as any).meal_name = mealTargets[index]?.mealName || `Meal ${index + 1}`;
        
        // Add a fallback for meal_title if the AI forgets it
        meal!.meal_title = meal!.meal_title || `AI Generated ${(meal as any).meal_name}`;
        
        const mealTotals = (meal!.ingredients!).reduce((totals, ing) => {
          totals.calories += ing.calories;
          totals.protein += ing.protein;
          totals.carbs += ing.carbs;
          totals.fat += ing.fat;
          return totals;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
        
        // Mutate the meal object to add calculated totals
        (meal as any).total_calories = mealTotals.calories;
        (meal as any).total_protein_g = mealTotals.protein;
        (meal as any).total_carbs_g = mealTotals.carbs;
        (meal as any).total_fat_g = mealTotals.fat;

        // Add meal totals to the weekly summary
        weeklySummary.totalCalories += mealTotals.calories;
        weeklySummary.totalProtein += mealTotals.protein;
        weeklySummary.totalCarbs += mealTotals.carbs;
        weeklySummary.totalFat += mealTotals.fat;
      });
    });

    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: sanitizedWeeklyMealPlan as any, // Cast is safe because we sanitized it
      weeklySummary,
    };

    return finalOutput;
  }
);
