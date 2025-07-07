
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

// AI Prompt - Now WITH an output schema to enforce JSON and a much simpler prompt
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: AIUnvalidatedWeeklyMealPlanSchema },
  prompt: `You are a highly precise nutritional data generation service. Your ONLY task is to create a list of meals for a single day, {{dayOfWeek}}, that strictly matches the provided macronutrient targets for each meal.

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

For each meal listed below, you MUST generate a corresponding meal object. The total macros for the ingredients you list for each meal MUST fall within a 5% tolerance of the targets.

**EXAMPLE CALCULATION:**
- If Target Calories = 500, a 5% tolerance means the sum of your ingredient calories must be between 475 and 525.
- If Target Protein = 30g, a 5% tolerance means the sum of your ingredient protein must be between 28.5g and 31.5g.
- **YOU MUST PERFORM THIS CHECK FOR EVERY MEAL AND EVERY MACRONUTRIENT (CALORIES, PROTEIN, CARBS, FAT).**

**MEAL TARGETS FOR {{dayOfWeek}} (FROM USER'S MACRO SPLITTER):**
You are being provided with specific macronutrient targets for each meal. These targets were set by the user in the "Macro Splitter" tool. It is absolutely critical that you respect these targets.

{{#each mealTargets}}
- **Meal: {{this.mealName}}**
  - **TARGET Calories:** {{this.calories}} kcal
  - **TARGET Protein:** {{this.protein}}g
  - **TARGET Carbohydrates:** {{this.carbs}}g
  - **TARGET Fat:** {{this.fat}}g
{{/each}}

**CRITICAL OUTPUT INSTRUCTIONS:**
1.  Respond with ONLY a valid JSON object matching the provided schema. Do NOT include any text, notes, greetings, or markdown like \`\`\`json outside the JSON object.
2.  For each meal in the targets, create a corresponding meal object in the "meals" array.
3.  Each meal object MUST have a "meal_title" (a short, appetizing name) and a non-empty "ingredients" array.
4.  For each ingredient object MUST have a "name", and the precise "calories", "protein", "carbs", and "fat" values for the portion used in the meal. All values must be numbers.
5.  **Before finalizing your output, you MUST double-check your math.** Sum the macros for each ingredient list to ensure the totals for each meal are within the 5% tolerance of the targets provided above. If they are not, you must adjust the ingredients and recalculate until they are. ONLY output the final, correct version.
`,
});

// Genkit Flow - Orchestrator and validator
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

    // 5. Call the prompt and get the structured output
    const { output } = await prompt(promptInput as any);

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

    const { weeklyMealPlan } = validationResult.data || { weeklyMealPlan: [] };

    // SANITIZATION STEP: Ensure every ingredient has the required fields, providing defaults if missing.
    // This makes the data robust for the rest of the application.
    const sanitizedWeeklyMealPlan = weeklyMealPlan?.map(day => ({
        ...day,
        meals: day.meals?.filter(meal => meal && meal.ingredients && meal.ingredients.length > 0).map(meal => ({
            ...meal,
            ingredients: meal.ingredients?.map(ing => ({
                name: ing.name ?? 'Unknown Ingredient',
                calories: ing.calories ?? 0,
                protein: ing.protein ?? 0,
                carbs: ing.carbs ?? 0,
                fat: ing.fat ?? 0,
            })) ?? [],
        })) ?? [],
    })) ?? [];

    // 6. Calculate meal-level and weekly summary in reliable application code
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Use the SANITIZED plan for all subsequent operations
    sanitizedWeeklyMealPlan.forEach((day) => {
      day.meals.forEach((meal, index) => {
        // Forcefully correct or add the meal_name based on its order.
        if (mealTargets[index]) {
          (meal as any).meal_name = mealTargets[index].mealName;
        } else {
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

        // Iterate over all ingredients to calculate totals.
        // This is safe now because of the sanitization step above.
        meal.ingredients.forEach((ing) => {
            mealCalories += ing.calories;
            mealProtein += ing.protein;
            mealCarbs += ing.carbs;
            mealFat += ing.fat;
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
      weeklyMealPlan: sanitizedWeeklyMealPlan as any, // Cast is safe because we sanitized it
      weeklySummary,
    };

    return finalOutput;
  }
);

    