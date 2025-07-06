
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

// AI Prompt - Simplified to be a pure data conversion task with a clear example.
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: PromptInputSchema },
  // REMOVED output schema to handle parsing manually for robustness.
  prompt: `You are a JSON generation service. Your only job is to create a valid JSON object representing a 7-day meal plan based on user data.

**USER DATA & TARGETS:**
- **Dietary Goal:** {{dietGoalOnboarding}}
{{#if preferredDiet}}- **Dietary Preference:** {{preferredDiet}}{{/if}}
{{#if allergies.length}}- **Allergies to Avoid:** {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- **Disliked Ingredients:** {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- **Preferred Cuisines:** {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
- **Daily Meal Targets:**
{{#each mealTargets}}
  - **{{this.mealName}}**: Target ~{{this.calories}} kcal, ~{{this.protein}}g Protein, ~{{this.carbs}}g Carbs, ~{{this.fat}}g Fat
{{/each}}

**OUTPUT FORMAT INSTRUCTIONS:**
Your response MUST be ONLY a single, valid JSON object. Do not add any extra text, explanations, or markdown. The JSON structure MUST follow this example:

\`\`\`json
{
  "weeklyMealPlan": [
    {
      "day": "Monday",
      "meals": [
        {
          "meal_title": "Example Breakfast: Scrambled Eggs",
          "ingredients": [
            {
              "name": "Large Eggs",
              "calories": 140,
              "protein": 12,
              "carbs": 1,
              "fat": 10
            },
            {
              "name": "Whole Wheat Toast",
              "calories": 80,
              "protein": 4,
              "carbs": 15,
              "fat": 1
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

Now, generate the full 7-day meal plan based on the user data provided above, strictly following this JSON format.
`,
});

/**
 * Extracts a JSON object from a string that might contain markdown backticks or other text.
 * @param text The string to parse.
 * @returns The parsed JSON object or null if not found.
 */
function extractJson(text: string) {
  // First, try to find JSON within ```json ... ```
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse JSON from markdown block', e);
      // Fall through to try parsing the whole string
    }
  }

  // If no markdown block, find the first '{' and last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON from substring', e);
    }
  }
  
  // As a last resort, try parsing the whole string
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Genkit Flow - Now with manual JSON parsing for robustness
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

    // 5. Call the prompt and get the raw text output
    const response = await prompt(promptInput);
    const rawText = response.text;
    
    if (!rawText) {
       throw new Error(
        getAIApiErrorMessage({ message: 'AI did not return any text response.' })
      );
    }

    // 6. Extract JSON from the raw text
    const parsedOutput = extractJson(rawText);

    if (!parsedOutput) {
      throw new Error(
        getAIApiErrorMessage({ message: 'AI returned a non-JSON response. Please try again.' })
      );
    }

    // 7. Validate the parsed output with our lenient schema
    const validationResult =
      AIUnvalidatedWeeklyMealPlanSchema.safeParse(parsedOutput);
    if (!validationResult.success) {
      console.error(
        'AI output validation error after manual parsing:',
        validationResult.error.flatten()
      );
      throw new Error(
        `AI returned data in an unexpected format. Details: ${validationResult.error.message}`
      );
    }

    const { weeklyMealPlan } = validationResult.data || { weeklyMealPlan: [] };

    // 8. SANITIZATION & CALCULATION STEP
    const sanitizedWeeklyMealPlan = weeklyMealPlan?.map(day => ({
        ...day,
        meals: day.meals?.map(meal => ({
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

    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    sanitizedWeeklyMealPlan.forEach((day) => {
      day.meals.forEach((meal, index) => {
        if (mealTargets[index]) {
          (meal as any).meal_name = mealTargets[index].mealName;
        } else {
          (meal as any).meal_name = 'Unknown Meal';
        }

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
            mealCalories += ing.calories;
            mealProtein += ing.protein;
            mealCarbs += ing.carbs;
            mealFat += ing.fat;
        });

        (meal as any).total_calories = mealCalories;
        (meal as any).total_protein_g = mealProtein;
        (meal as any).total_carbs_g = mealCarbs;
        (meal as any).total_fat_g = mealFat;

        weeklySummary.totalCalories += (meal as any).total_calories;
        weeklySummary.totalProtein += (meal as any).total_protein_g;
        weeklySummary.totalCarbs += (meal as any).total_carbs_g;
        weeklySummary.totalFat += (meal as any).total_fat_g;
      });
    });

    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan: sanitizedWeeklyMealPlan as any,
      weeklySummary,
    };

    return finalOutput;
  }
);
