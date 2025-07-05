
'use server';

import { ai } from '@/ai/genkit';
import {
  AIGeneratedWeeklyMealPlanSchema,
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from '@/lib/schemas';

// Main entry function
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt - Now only responsible for generating the plan, not the summary.
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: AIGeneratedWeeklyMealPlanSchema }, // AI now outputs a simpler schema
  prompt: `You are a professional AI nutritionist. Your task is to create a personalized weekly meal plan based on the user's profile, goals, and specific meal macro distribution preferences if provided.

**User Profile & Goals:**
- Age: {{age}}
- Gender: {{gender}}
- Height: {{height_cm}} cm
- Current Weight: {{current_weight}} kg
- 1-Month Goal Weight: {{goal_weight_1m}} kg
- Activity Level: {{activityLevel}}
- Primary Diet Goal: {{dietGoalOnboarding}}
{{#if preferredDiet}}
- Dietary Preference: {{preferredDiet}}
{{/if}}
{{#if allergies.length}}
- Allergies to Avoid: {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if dispreferredIngredients.length}}
- Disliked Ingredients: {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if preferredCuisines.length}}
- Preferred Cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if mealDistributions}}
**--- CRITICAL INSTRUCTION: CUSTOM MEAL MACRO DISTRIBUTION ---**
You MUST follow this specific percentage breakdown for daily macros across meals. The total macros for each meal you generate MUST reflect these percentages applied to the user's total daily needs.
{{#each mealDistributions}}
- **{{this.mealName}}**: Calories: {{this.calories_pct}}%, Protein: {{this.protein_pct}}%, Carbs: {{this.carbs_pct}}%, Fat: {{this.fat_pct}}%
{{/each}}
{{else}}
**Standard Meal Macro Distribution:**
If no custom distribution is provided, use a standard, balanced approach suitable for the user's goal (e.g., for fat loss, slightly higher protein and lower carbs; for muscle gain, higher carbs).
{{/if}}


**--- VERY STRICT JSON OUTPUT INSTRUCTIONS ---**
- You must return a JSON object with **ONLY ONE** top-level property: "weeklyMealPlan".

**Detailed structure:**

"weeklyMealPlan":
- This is an array with 7 items.
- Each item represents one day (Monday to Sunday) and has these exact properties:
    - "day": string — the full name of the day (e.g., "Monday", "Tuesday").
    - "meals": an array of exactly 5 items, representing 3 main meals and 2 snacks.
    - Each meal or snack object must contain these exact properties:
        - "meal_name": string — the name of the meal or snack (e.g., "Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner").
        - "ingredients": an array where each item is an object representing an ingredient. Each ingredient object must include these exact properties:
            - "ingredient_name": string — the name of the ingredient (e.g., "Chicken Breast", "Broccoli").
            - "quantity_g": number — the amount of that ingredient in grams.
            - "macros_per_100g": an object with these exact properties:
                - "calories": number — calories per 100 grams of this ingredient.
                - "protein_g": number — protein in grams per 100 grams of this ingredient.
                - "carbs_g": number — carbohydrates in grams per 100 grams of this ingredient.
                - "fat_g": number — fat in grams per 100 grams of this ingredient.
        - "total_calories": number — the total calories for the entire meal, calculated from all ingredients.
        - "total_protein_g": number — the total protein in grams for the entire meal, calculated from all ingredients.
        - "total_carbs_g": number — the total carbohydrates in grams for the entire meal, calculated from all ingredients.
        - "total_fat_g": number — the total fat in grams for the entire meal, calculated from all ingredients.

⚠️ Important Rules:
- Use the exact field names and spelling provided in this prompt.
- **DO NOT add any extra fields, properties, or keys at any level of the JSON structure.**
- DO NOT rename any fields.
- All numerical values must be realistic, positive, and correctly calculated.
- Only output valid JSON. Do not include any markdown formatting (like json), code blocks, or any other commentary before, during, or after the JSON.

Respond only with pure JSON that strictly matches the required structure. The final JSON object must ONLY have the "weeklyMealPlan" key.
`,
});

// Genkit Flow
const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return a meal plan.');
    }

    // Validate the AI's direct output (just the weekly plan)
    const validationResult =
      AIGeneratedWeeklyMealPlanSchema.safeParse(output);
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

    // Calculate weekly summary here in the code, which is more reliable than asking the AI.
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    weeklyMealPlan.forEach((day) => {
      day.meals.forEach((meal) => {
        weeklySummary.totalCalories += meal.total_calories || 0;
        weeklySummary.totalProtein += meal.total_protein_g || 0;
        weeklySummary.totalCarbs += meal.total_carbs_g || 0;
        weeklySummary.totalFat += meal.total_fat_g || 0;
      });
    });

    // Construct the final output object that the application expects
    const finalOutput: GeneratePersonalizedMealPlanOutput = {
      weeklyMealPlan,
      weeklySummary,
    };

    return finalOutput;
  }
);
