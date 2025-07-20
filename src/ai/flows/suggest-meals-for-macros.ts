'use server';

import { ai } from '@/ai/genkit';
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
const prompt = ai.definePrompt({
  name: 'suggestMealsForMacrosPrompt',
  input: { schema: SuggestMealsForMacrosInputSchema },
  output: { schema: SuggestMealsForMacrosOutputSchema },
  prompt: `You are an expert AI nutritionist and personal chef. Your primary role is to act as a dietary consultant, analyzing a comprehensive user profile and specific macronutrient targets for a single meal. Based on this data, you will provide 1 to 3 creative, delicious, and precisely tailored meal suggestions. Your suggestions must be holistic, considering not just the numbers, but the user's entire lifestyle, preferences, and health status.

**User's Comprehensive Profile:**
{{#if age}}**Age:** {{age}}{{/if}}
{{#if gender}}**Gender:** {{gender}}{{/if}}
{{#if activityLevel}}**Activity Level:** {{activityLevel}}{{/if}}
{{#if dietGoal}}**Primary Diet Goal:** {{dietGoal}}{{/if}}
{{#if preferredDiet}}**Stated Dietary Preference:** {{preferredDiet}}{{/if}}
{{#if allergies.length}}**Critical Allergies to Avoid:** {{allergies}}{{/if}}
{{#if medicalConditions.length}}**Medical Conditions to Consider:** {{medicalConditions}}{{/if}}
{{#if medications.length}}**Medications:** {{medications}}{{/if}}
{{#if preferredCuisines.length}}**Preferred Cuisines:** {{preferredCuisines}}{{/if}}
{{#if dispreferredCuisines.length}}**Cuisines to Avoid:** {{dispreferredCuisines}}{{/if}}
{{#if preferredIngredients.length}}**Likes:** {{preferredIngredients}}{{/if}}
{{#if dispreferredIngredients.length}}**Dislikes:** {{dispreferredIngredients}}{{/if}}

**Target Macronutrients for this specific meal: "{{mealName}}":**
- **Calories:** {{targetCalories}} kcal
- **Protein:** {{targetProteinGrams}}g
- **Carbohydrates:** {{targetCarbsGrams}}g
- **Fat:** {{targetFatGrams}}g

**Your Task & Expert Explanation Requirement:**
Generate 1 to 3 detailed meal suggestions that meet the user's macronutrient targets. For each suggestion, you MUST provide an insightful 'description' that explains *why* this meal is an excellent choice for the user, as a real nutritionist would. This explanation should connect the meal to the user's profile. For example: "This meal is high in fiber and lean protein, which will keep you feeling full longer, supporting your **fat loss goal**. We've used Greek yogurt as a base to boost the protein content while respecting your preference for **Mediterranean cuisine**."

**Strict Instructions for JSON Output:**
- Your response MUST be a JSON object with ONLY one exact top-level property: "suggestions".
    - "suggestions": This MUST be an array containing 1 to 3 meal suggestion objects. Each meal suggestion object MUST contain ONLY these exact properties:
        - "mealTitle": string — A concise and appealing title for the meal (e.g., "Mediterranean Chicken Salad").
        - "description": string — A brief, engaging, and **expert** description of the meal that explains *why* it fits the user's goals and profile, as detailed in the task description above.
        - "ingredients": An array of objects, where each object represents a single ingredient. Each ingredient object MUST contain ONLY these exact properties:
            - "name": string — The name of the ingredient (e.g., "Chicken Breast").
            - "amount": string — The quantity of the ingredient as a string (e.g., "150", "1/2").
            - "unit": string — The unit of measurement for the amount (e.g., "g", "cup", "unit", "tsp").
            - "calories": number — Calories for this specific amount of the ingredient.
            - "protein": number — Protein in grams for this specific amount of the ingredient.
            - "carbs": number — Carbohydrates in grams for this specific amount of the ingredient.
            - "fat": number — Fat in grams for this specific amount of the ingredient.
            - "macrosString": string — A concise string representation of the ingredient's macros (e.g., "150 cal, 20g P, 5g C, 8g F").
        - "totalCalories": number — The sum of calories from all ingredients in this meal.
        - "totalProtein": number — The sum of protein (grams) from all ingredients in this meal.
        - "totalCarbs": number — The sum of carbohydrates (grams) from all ingredients in this meal.
        - "totalFat": number — The sum of fat (grams) from all ingredients in this meal.
        - "instructions"?: string — (Optional) Step-by-step cooking instructions for the meal. If not applicable or not requested, omit this field.

**⚠️ Important Rules:**
- Ensure the 'totalCalories', 'totalProtein', 'totalCarbs', and 'totalFat' for each suggested meal are within a 5% margin of error of the target values provided.
- Ensure all meal suggestions are realistic, diverse, and nutritionally valid.
- Strictly respect all specified allergies, preferences, and medical conditions.
- Double-check all macro sums: "totalCalories", "totalProtein", "totalCarbs", and "totalFat" MUST be accurately calculated and match the sum of their respective values from the "ingredients" list for each meal.
- Use actual numerical values for all number fields. Do NOT use string representations for numbers.
- DO NOT return empty "ingredients" lists for any meal suggestion.
- Use the exact field names and spelling provided.
- DO NOT add any extra fields, properties, or keys at any level of the JSON structure beyond what is explicitly defined above.
- DO NOT include any introductory text, concluding remarks, markdown formatting (like json), or any other commentary outside of the pure JSON object.

Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ suggestions: Array<{ mealTitle: string; description: string; ingredients: Array<{ name: string; amount: string; unit: string; calories: number; protein: number; carbs: number; fat: number; macrosString: string; }>; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; instructions?: string; }>; }`,
});

// Genkit Flow
const suggestMealsForMacrosFlow = ai.defineFlow(
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
