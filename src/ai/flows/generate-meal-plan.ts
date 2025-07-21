'use server';

import { openaiModel } from '@/ai/genkit';
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  type GeneratePersonalizedMealPlanOutput,
  type GeneratePersonalizedMealPlanInput,
} from '@/lib/schemas';
import { getAIApiErrorMessage } from '@/lib/utils';

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

const prompt = openaiModel.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are NutriMind, an elite AI nutritionist responsible for generating a complete and highly personalized 7-day meal plan. Your output must be a single, perfect JSON object, as it will be directly consumed by an application.

**[Step 1] Analyze User Context**
Meticulously analyze the following user data. This is the foundation for the meal plan.

**User Data & Nutritional Goals (JSON Input):**
\`\`\`json
{
  // User Profile & Preferences
  "age": {{age}},
  "biological_sex": "{{biological_sex}}",
  "height_cm": {{height_cm}},
  "current_weight_kg": {{current_weight_kg}},
  "primary_diet_goal": "{{primary_diet_goal}}",
  "physical_activity_level": "{{physical_activity_level}}",
  "preferred_diet": "{{preferred_diet}}",
  "allergies": [{{#if allergies.length}}"{{#each allergies}}{{this}}", "{{/each}}"{{/if}}],
  "preferred_cuisines": [{{#if preferred_cuisines.length}}"{{#each preferred_cuisines}}{{this}}", "{{/each}}"{{/if}}],
  "dispreferrred_cuisines": [{{#if dispreferrred_cuisines.length}}"{{#each dispreferrred_cuisines}}{{this}}", "{{/each}}"{{/if}}],
  "preferred_ingredients": [{{#if preferred_ingredients.length}}"{{#each preferred_ingredients}}{{this}}", "{{/each}}"{{/if}}],
  "dispreferrred_ingredients": [{{#if dispreferrred_ingredients.length}}"{{#each dispreferrred_ingredients}}{{this}}", "{{/each}}"{{/if}}],
  "medical_conditions": [{{#if medical_conditions.length}}"{{#each medical_conditions}}{{this}}", "{{/each}}"{{/if}}],
  "preferred_micronutrients": [{{#if preferred_micronutrients.length}}"{{#each preferred_micronutrients}}{{this}}", "{{/each}}"{{/if}}],

  // Daily Nutritional Targets (Use these exact values for each day)
  "target_daily_calories": {{meal_data.target_daily_calories}},
  "target_protein_g": {{meal_data.target_protein_g}},
  "target_carbs_g": {{meal_data.target_carbs_g}},
  "target_fat_g": {{meal_data.target_fat_g}}
}
\`\`\`

**[Step 2] Generate the 7-Day Meal Plan**
Create a comprehensive 7-day meal plan from Monday to Sunday. Adhere strictly to the following rules:

🧠 **CRITICAL GENERATION RULES:**
1.  **Full 7-Day Plan:** You MUST generate a complete plan for all seven days of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Do not stop after one day.
2.  **Six Meals Per Day:** Each day MUST consist of exactly six meals: "Breakfast", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", and "Evening Snack".
3.  **Adhere to Daily Targets:** The sum of calories, protein, carbs, and fat for the six meals of any given day must closely match the \`target_daily_calories\`, \`target_protein_g\`, \`target_carbs_g\`, and \`target_fat_g\` provided in the context above.
4.  **Variety and Creativity:** Ensure variety across the week. Avoid repeating meals. All meals must be complete recipes, not single ingredients (e.g., use "Grilled Chicken Salad with Lemon Vinaigrette" instead of just "Chicken Breast").
5.  **Meal Appropriateness:** Ensure meals are logical for their time slot. Breakfast should be a breakfast-style meal, and snacks should be lighter than main meals.
6.  **Respect All Preferences:** The plan must strictly avoid all allergies and disliked ingredients/cuisines, while prioritizing preferred ones.

**[Step 3] Construct the Final JSON**
Assemble the final output as a single, valid JSON object. The structure MUST be exactly as follows.

**Strict JSON Output Format:**
\`\`\`json
{
  "days": [
    {
      "day_of_week": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "custom_name": "Scrambled Eggs with Spinach and Whole-Wheat Toast",
          "ingredients": [
            { "name": "Eggs", "quantity": 150, "unit": "g", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11 },
            { "name": "Spinach", "quantity": 50, "unit": "g", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4 },
            { "name": "Whole-Wheat Bread", "quantity": 60, "unit": "g", "calories": 247, "protein": 13, "carbs": 41, "fat": 3.2 }
          ],
          "total_calories": 450,
          "total_protein": 30,
          "total_carbs": 40,
          "total_fat": 20
        },
        // ... (Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack for Monday)
      ]
    },
    {
      "day_of_week": "Tuesday",
      "meals": [
        // ... (6 meal objects for Tuesday)
      ]
    },
    // ... (Continue for Wednesday, Thursday, Friday, Saturday, Sunday)
  ],
  "weekly_summary": {
    "total_calories": 17500,
    "total_protein": 1400,
    "total_carbs": 1575,
    "total_fat": 622
  }
}
\`\`\`

⚠️ **FINAL VALIDATION CHECK:**
Before responding, double-check your entire output.
- Does the \`days\` array contain exactly 7 objects?
- Does each day object contain exactly 6 meal objects?
- Are all daily and weekly totals calculated correctly based on the ingredients?
- Is the entire response a single JSON object with no extra text, comments, or markdown?

Respond ONLY with the pure, complete JSON object.
`,
});

const generatePersonalizedMealPlanFlow = openaiModel.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error('AI did not return output.');

      const validationResult =
        GeneratePersonalizedMealPlanOutputSchema.safeParse(output);
      if (!validationResult.success) {
        console.error(
          'AI output validation error:',
          validationResult.error.flatten()
        );
        throw new Error(
          `AI returned data in an unexpected format. Details: ${validationResult.error.message}`
        );
      }

      return validationResult.data;
    } catch (error: any) {
      console.error('Error in generatePersonalizedMealPlanFlow:', error);
      throw new Error(getAIApiErrorMessage(error));
    }
  }
);
