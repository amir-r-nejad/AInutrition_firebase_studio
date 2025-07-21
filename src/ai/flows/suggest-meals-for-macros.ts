'use server';

import { geminiModel } from '@/ai/genkit';
import {
  SuggestMealsForMacrosInputSchema,
  SuggestMealsForMacrosOutputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from '@/lib/schemas';
import { getAIApiErrorMessage } from '@/lib/utils';

// Main entry function
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput
): Promise<SuggestMealsForMacrosOutput> {
  return suggestMealsForMacrosFlow(input);
}

// AI Prompt
const prompt = geminiModel.definePrompt({
  name: 'suggestMealsForMacrosPrompt',
  input: { schema: SuggestMealsForMacrosInputSchema },
  output: { schema: SuggestMealsForMacrosOutputSchema },

  system: `You are NutriMind, an expert AI nutritionist. Your task is to generate meal suggestions based on user data and macro targets. Adhere strictly to all user preferences and dietary restrictions. Your entire response MUST be a single, valid JSON object and nothing else.`,

  prompt: `
  Analyze the user's profile and the meal target below to generate 1-3 highly personalized and appropriate meal suggestions.

  **User Profile:**
  - Age: {{age}}
  - Gender: {{gender}}
  - Activity Level: {{activity_level}}
  - Primary Diet Goal: {{diet_goal}}
  - Dietary Preference: {{preferred_diet}}
  - Allergies: {{#if allergies.length}}{{allergies}}{{else}}None{{/if}}
  - Medical Conditions: {{#if medical_conditions.length}}{{medical_conditions}}{{else}}None{{/if}}
  - Preferred Cuisines: {{#if preferred_cuisines.length}}{{preferred_cuisines}}{{else}}None{{/if}}
  - Cuisines to Avoid: {{#if dispreferrred_cuisines.length}}{{dispreferrred_cuisines}}{{else}}None{{/if}}
  - Liked Ingredients: {{#if preferred_ingredients.length}}{{preferred_ingredients}}{{else}}None{{/if}}
  - Disliked Ingredients: {{#if dispreferrred_ingredients.length}}{{dispreferrred_ingredients}}{{else}}None{{/if}}

  **🎯 Target for "{{meal_name}}"**
  - Calories: {{target_calories}} kcal
  - Protein: {{target_protein_grams}}g
  - Carbohydrates: {{target_carbs_grams}}g
  - Fat: {{target_fat_grams}}g

  **CRITICAL RULES:**
  1.  **Meal Appropriateness:** Suggestions MUST be appropriate for the meal type (e.g., suggest oatmeal or eggs for "Breakfast," not steak).
  2.  **Strict Personalization:** Adhere to ALL allergies, medical conditions, and food preferences. No exceptions.
  3.  **Macro Accuracy:** Calculated total macros for each meal suggestion MUST be within a 5% margin of the target. Calculate totals by precisely summing the ingredient macros.
  4.  **Expert Description:** The 'description' field is vital. Explain *why* the meal is a good choice by referencing the user's specific data (e.g., "This supports your muscle growth goal and aligns with your preference for Mediterranean cuisine..."). Do not use generic descriptions.

  **JSON OUTPUT INSTRUCTIONS:**
  - Respond with ONLY a raw JSON object.
  - The JSON MUST have a single root key: "suggestions".
  - "suggestions" must be an array of 1 to 3 meal objects matching the required schema.
  - Do NOT include any introductory text, explanations, or markdown wrappers like \`\`\`json.
  `,
});

// Genkit Flow (Unchanged)
const suggestMealsForMacrosFlow = geminiModel.defineFlow(
  {
    name: 'suggestMealsForMacrosFlow',
    inputSchema: SuggestMealsForMacrosInputSchema,
    outputSchema: SuggestMealsForMacrosOutputSchema,
  },
  async (
    input: SuggestMealsForMacrosInput
  ): Promise<SuggestMealsForMacrosOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI did not return output.');
      }

      const validationResult =
        SuggestMealsForMacrosOutputSchema.safeParse(output);
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
      console.error('Error in suggestMealsForMacrosFlow:', error);
      throw new Error(getAIApiErrorMessage(error));
    }
  }
);
