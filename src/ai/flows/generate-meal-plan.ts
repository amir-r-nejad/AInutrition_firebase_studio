
'use server';

import { ai } from '@/ai/genkit';
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  AIDailyPlanOutputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
  type DayPlan,
  type AIGeneratedMeal,
} from '@/lib/schemas';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import { defaultMacroPercentages, mealNames, daysOfWeek } from '@/lib/constants';
import { z } from 'zod';
import { getAIApiErrorMessage } from '@/lib/utils';

// Define a new schema for the prompt's specific input needs
const DailyPromptInputSchema =
  GeneratePersonalizedMealPlanInputSchema.extend({
    dayOfWeek: z.string(),
    mealTargets: z.array(
      z.object({
        mealName: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      })
    ),
  });
type DailyPromptInput = z.infer<typeof DailyPromptInputSchema>;


// Main entry function remains the same
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}


// NEW: A prompt specifically for generating a SINGLE DAY's meal plan.
// This is much simpler and more reliable for the AI to handle.
const dailyPrompt = ai.definePrompt({
  name: 'generateDailyMealPlanPrompt',
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `You are a nutritional data assistant. Your task is to generate a meal plan for a single day, which is {{dayOfWeek}}, based on specific macro targets for each meal.

**USER PROFILE FOR CONTEXT:**
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


**MEAL TARGETS FOR TODAY ({{dayOfWeek}}):**
You MUST create meals that adhere to the following targets. The total calories, protein, carbs, and fat for each meal suggestion MUST be within a 5% margin of error of the target values provided.

{{#each mealTargets}}
- **{{this.mealName}}**:
  - Target Calories: {{this.calories}} kcal
  - Target Protein: {{this.protein}}g
  - Target Carbohydrates: {{this.carbs}}g
  - Target Fat: {{this.fat}}g
{{/each}}

**CRITICAL OUTPUT INSTRUCTIONS:**
1.  Respond with ONLY a valid JSON object matching the provided schema.
2.  Do NOT include any text, notes, greetings, or markdown like \`\`\`json outside the JSON object.
3.  For each meal in the targets, create a corresponding meal object in the "meals" array.
4.  Each meal object MUST have a "meal_title" (a short, appetizing name) and a non-empty "ingredients" array.
5.  Each ingredient object MUST have a "name", "calories", "protein", "carbs", and "fat". All values must be numbers.
6.  You MUST calculate the total macros for each meal based on its ingredients and ensure they are within a 5% margin of the targets specified above.
`,
});


// REWRITTEN FLOW: Now iterates through each day, making smaller, more reliable AI calls.
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
      throw new Error(
        'Could not calculate daily nutritional targets from the provided profile data.'
      );
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
      calories: Math.round(
        dailyTargets.finalTargetCalories! * (dist.calories_pct / 100)
      ),
      protein: Math.round(
        dailyTargets.proteinGrams! * (dist.protein_pct / 100)
      ),
      carbs: Math.round(dailyTargets.carbGrams! * (dist.carbs_pct / 100)),
      fat: Math.round(dailyTargets.fatGrams! * (dist.fat_pct / 100)),
    }));

    // 4. Loop through each day of the week and generate a plan
    const processedWeeklyPlan: DayPlan[] = [];
    let weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    for (const dayOfWeek of daysOfWeek) {
      try {
        const dailyPromptInput: DailyPromptInput = {
          ...input,
          dayOfWeek,
          mealTargets,
        };

        // 5. Call the new, simpler daily prompt
        const { output: dailyOutput } = await dailyPrompt(dailyPromptInput);
        
        if (!dailyOutput || !dailyOutput.meals || dailyOutput.meals.length === 0) {
            console.warn(`AI returned no meals for ${dayOfWeek}. Skipping.`);
            continue; // Skip this day if AI fails
        }

        // 6. Process the valid daily output
        const processedMeals: AIGeneratedMeal[] = dailyOutput.meals
          .map((meal, index) => {
            // Filter out any meals AI might have hallucinated without ingredients
            if (!meal.ingredients || meal.ingredients.length === 0) {
              return null;
            }

            // Sanitize ingredients and calculate totals
            const sanitizedIngredients = meal.ingredients!.map((ing) => ({
              name: ing.name ?? 'Unknown Ingredient',
              calories: ing.calories ?? 0,
              protein: ing.protein ?? 0,
              carbs: ing.carbs ?? 0,
              fat: ing.fat ?? 0,
            }));

            const mealTotals = sanitizedIngredients.reduce(
              (totals, ing) => {
                totals.calories += ing.calories;
                totals.protein += ing.protein;
                totals.carbs += ing.carbs;
                totals.fat += ing.fat;
                return totals;
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            // Add to weekly summary
            weeklySummary.totalCalories += mealTotals.calories;
            weeklySummary.totalProtein += mealTotals.protein;
            weeklySummary.totalCarbs += mealTotals.carbs;
            weeklySummary.totalFat += mealTotals.fat;

            return {
              meal_name: mealTargets[index]?.mealName || `Meal ${index + 1}`,
              meal_title: meal.meal_title || `AI Generated ${mealTargets[index]?.mealName || 'Meal'}`,
              ingredients: sanitizedIngredients,
              total_calories: mealTotals.calories,
              total_protein_g: mealTotals.protein,
              total_carbs_g: mealTotals.carbs,
              total_fat_g: mealTotals.fat,
            };
        }).filter((meal): meal is AIGeneratedMeal => meal !== null); // Remove nulls from the array

        // Only add the day if it has valid meals
        if(processedMeals.length > 0) {
            processedWeeklyPlan.push({ day: dayOfWeek, meals: processedMeals });
        }

      } catch (e) {
        console.error(`Failed to generate meal plan for ${dayOfWeek}:`, e);
        // Continue to the next day even if one day fails
      }
    }

    if (processedWeeklyPlan.length === 0) {
        throw new Error(getAIApiErrorMessage({ message: 'The AI failed to generate a valid meal plan for any day of the week. Please try again.' }));
    }

    // 7. Assemble final output
    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary,
    };

    return finalOutput;
  }
);
