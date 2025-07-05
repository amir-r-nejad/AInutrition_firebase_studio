
'use server';

import { ai } from '@/ai/genkit';
import {
  AIGeneratedWeeklyMealPlanSchema,
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  type AIGeneratedMeal,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
} from '@/lib/schemas';

// Main entry function
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt - Now only responsible for generating the plan structure, not the totals.
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: AIGeneratedWeeklyMealPlanSchema }, // AI outputs a schema without required totals
  prompt: `You are a professional AI nutritionist. Your task is to create a personalized weekly meal plan based on the user's profile and goals.

Your response MUST be a JSON object that strictly adheres to the structure and rules outlined below.

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

**--- MEAL STRUCTURE INSTRUCTIONS ---**
{{#if mealDistributions}}
You MUST generate meals according to this custom macro distribution. The "meal_name" for each meal object you generate MUST exactly match one of these names:
{{#each mealDistributions}}
- **{{this.mealName}}**: Calories: {{this.calories_pct}}%, Protein: {{this.protein_pct}}%, Carbs: {{this.carbs_pct}}%, Fat: {{this.fat_pct}}%
{{/each}}
{{else}}
You MUST generate a plan for **ALL** of the following meals every day. The "meal_name" property for each meal object you generate MUST exactly match one of these names:
- Breakfast
- Morning Snack
- Lunch
- Afternoon Snack
- Dinner
- Evening Snack
{{/if}}

**--- VERY STRICT JSON OUTPUT SCHEMA ---**
Your entire response must be a single JSON object with ONLY ONE top-level key: "weeklyMealPlan".
This "weeklyMealPlan" array MUST contain exactly 7 day objects, one for each day from "Monday" to "Sunday". Do not calculate totals like "total_calories" yourself.

"weeklyMealPlan": [
  // This is an array of 7 day objects (Monday to Sunday).
  {
    "day": "Monday", // The full name of the day.
    "meals": [
      // This is an array of meal objects.
      {
        "meal_name": "Breakfast", // The name of the meal type. MUST match a name from the MEAL STRUCTURE INSTRUCTIONS.
        "meal_title": "Oatmeal with Berries and Nuts", // A specific, appealing title for the meal. This MUST be generated.
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
2.  Use the exact field names and spelling as shown in the schema above.
3.  DO NOT add any extra fields, properties, or keys at any level.
4.  All numerical values must be realistic, positive, and correctly calculated.
5.  Before you finalize your response, perform this critical check on every single meal object inside the "meals" array: It MUST contain all of the following properties: "meal_name", "meal_title", and "ingredients". This is not optional.
6.  Your entire response MUST be only the pure JSON object. Do not include any markdown formatting (like \`\`\`json), code blocks, or any other text before or after the JSON.
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

    // Calculate meal-level and weekly summary here in the code, which is more reliable.
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    weeklyMealPlan.forEach((day) => {
      day.meals.forEach((meal: AIGeneratedMeal) => {
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;

        meal.ingredients.forEach((ing) => {
          const quantityFactor = ing.quantity_g / 100.0;
          mealCalories += (ing.macros_per_100g.calories || 0) * quantityFactor;
          mealProtein += (ing.macros_per_100g.protein_g || 0) * quantityFactor;
          mealCarbs += (ing.macros_per_100g.carbs_g || 0) * quantityFactor;
          mealFat += (ing.macros_per_100g.fat_g || 0) * quantityFactor;
        });

        // Mutate the meal object to add calculated totals
        meal.total_calories = mealCalories;
        meal.total_protein_g = mealProtein;
        meal.total_carbs_g = mealCarbs;
        meal.total_fat_g = mealFat;

        // Add meal totals to the weekly summary
        weeklySummary.totalCalories += meal.total_calories;
        weeklySummary.totalProtein += meal.total_protein_g;
        weeklySummary.totalCarbs += meal.total_carbs_g;
        weeklySummary.totalFat += meal.total_fat_g;
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
