
'use server';

import { ai } from '@/ai/genkit';
import {
  GeneratePersonalizedMealPlanOutputSchema,
  AIDailyPlanOutputSchema,
  type GeneratePersonalizedMealPlanOutput,
  type DayPlan,
  type AIGeneratedMeal,
  type FullProfileType,
} from '@/lib/schemas';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  defaultMacroPercentages,
  mealNames,
  daysOfWeek,
} from '@/lib/constants';
import { z } from 'zod';
import { getAIApiErrorMessage } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

// This is the input for the public-facing function, just the user ID.
export async function generatePersonalizedMealPlan(
  userId: string
): Promise<GeneratePersonalizedMealPlanOutput> {
  if (!userId) {
    throw new Error('User ID is required to generate a meal plan.');
  }
  return generatePersonalizedMealPlanFlow(userId);
}

// This schema is for the internal daily prompt, containing only necessary info.
const DailyPromptInputSchema = z.object({
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
  age: z.number().optional(),
  gender: z.string().optional(),
  dietGoalOnboarding: z.string().optional(),
  preferredDiet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dispreferredIngredients: z.array(z.string()).optional(),
  preferredIngredients: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  dispreferredCuisines: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});
type DailyPromptInput = z.infer<typeof DailyPromptInputSchema>;

// A prompt specifically for generating a SINGLE DAY's meal plan.
const dailyPrompt = ai.definePrompt({
  name: 'generateDailyMealPlanPrompt',
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
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

// REWRITTEN FLOW: Now takes a userId, fetches data, then iterates through each day.
const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: z.string(), // Expects userId
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (userId: string): Promise<GeneratePersonalizedMealPlanOutput> => {
    // 1. Fetch the user's latest profile directly from Firestore.
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      throw new Error('Could not find a profile for the provided user.');
    }
    const input = docSnap.data() as FullProfileType;

    // 2. Calculate total daily targets
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

    // 3. Determine meal distributions (user's custom or default)
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

    // 4. Calculate absolute macro targets for each meal
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

    // 5. Loop through each day of the week and generate a plan
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
          dayOfWeek,
          mealTargets,
          age: input.age ?? undefined,
          gender: input.gender ?? undefined,
          dietGoalOnboarding: input.dietGoalOnboarding ?? undefined,
          preferredDiet: input.preferredDiet ?? undefined,
          allergies: input.allergies ?? [],
          dispreferredIngredients: input.dispreferredIngredients ?? [],
          preferredIngredients: input.preferredIngredients ?? [],
          preferredCuisines: input.preferredCuisines ?? [],
          dispreferredCuisines: input.dispreferredCuisines ?? [],
          medicalConditions: input.medicalConditions ?? [],
          medications: input.medications ?? [],
        };

        const { output: dailyOutput } = await dailyPrompt(dailyPromptInput);

        if (!dailyOutput || !dailyOutput.meals || dailyOutput.meals.length === 0) {
          console.warn(`AI returned no meals for ${dayOfWeek}. Skipping.`);
          continue;
        }
        
        const processedMeals: AIGeneratedMeal[] = dailyOutput.meals.map((meal, index) => {
            if (!meal.ingredients || meal.ingredients.length === 0) {
              return null;
            }

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
        }).filter((meal): meal is AIGeneratedMeal => meal !== null);

        if (processedMeals.length > 0) {
            processedWeeklyPlan.push({ day: dayOfWeek, meals: processedMeals });
        }

      } catch (e) {
        console.error(`Failed to generate meal plan for ${dayOfWeek}:`, e);
      }
    }

    if (processedWeeklyPlan.length === 0) {
      throw new Error(getAIApiErrorMessage({ message: 'The AI failed to generate a valid meal plan for any day of the week. Please try again.' }));
    }
    
    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary,
    };

    return finalOutput;
  }
);

    