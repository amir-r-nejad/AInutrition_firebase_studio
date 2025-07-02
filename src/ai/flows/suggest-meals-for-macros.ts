'use server';

import { ai, geminiModel } from '@/ai/genkit';

// Types
export interface SuggestMealsForMacrosInput {
  mealName: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  dietGoal?: string;
  preferredDiet?: string;
  preferredCuisines?: string[];
  dispreferredCuisines?: string[];
  preferredIngredients?: string[];
  dispreferredIngredients?: string[];
  allergies?: string[];
}

export interface IngredientDetail {
  name: string;
  amount: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
}

export interface MealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: IngredientDetail[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

export interface SuggestMealsForMacrosOutput {
  suggestions: MealSuggestion[];
}

// Main entry function
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput
): Promise<SuggestMealsForMacrosOutput> {
  return suggestMealsForMacrosFlow(input);
}

// AI Prompt

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'suggestMealsForMacrosPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are a creative nutritionist and recipe developer. Your task is to suggest 1-3 detailed meal ideas for a specific mealtime that precisely meet the user's macronutrient targets and strictly adhere to their preferences.

{{{input}}}

Strict Instructions for Output:
- Your response MUST be a JSON object with ONLY one exact top-level property: "suggestions".
    - "suggestions": This MUST be an array containing 1 to 3 meal suggestion objects. Each meal suggestion object MUST contain ONLY these exact properties:
        - "mealTitle": string — A concise and appealing title for the meal (e.g., "Mediterranean Chicken Salad").
        - "description": string — A brief, engaging description of the meal.
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

⚠️ Important Rules:
- Ensure all meal suggestions are realistic, diverse, and nutritionally valid.
- Strictly respect all specified allergies, preferences, and dislikes.
- Double-check all macro sums: "totalCalories", "totalProtein", "totalCarbs", and "totalFat" MUST be accurately calculated and match the sum of their respective values from the "ingredients" list for each meal.
- Use actual numerical values for all number fields. Do NOT use string representations for numbers.
- DO NOT return empty "ingredients" lists for any meal suggestion.
- Use the exact field names and spelling provided.
- DO NOT add any extra fields, properties, or keys at any level of the JSON structure beyond what is explicitly defined above.
- DO NOT include any introductory text, concluding remarks, markdown formatting (like json), or any other commentary outside of the pure JSON object.

Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ suggestions: Array<{ mealTitle: string; description: string; ingredients: Array<{ name: string; amount: string; unit: string; calories: number; protein: number; carbs: number; fat: number; macrosString: string; }>; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; instructions?: string; }>; }
`,
});

// Genkit Flow

const suggestMealsForMacrosFlow = ai.defineFlow(
  {
    name: 'suggestMealsForMacrosFlow',
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (
    input: SuggestMealsForMacrosInput
  ): Promise<SuggestMealsForMacrosOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return output.');
    }
    return output as SuggestMealsForMacrosOutput;
  }
);
