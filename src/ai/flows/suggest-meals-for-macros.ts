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

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'suggestMealsForMacrosPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are an **expert, precise, and strict nutritional meal planner and recipe generator**. Your primary goal is to create 1-3 detailed meal ideas that **EXACTLY meet the user's macronutrient targets** and **STRICTLY adhere to ALL their dietary restrictions and preferences**.

The user's detailed profile and meal request are provided below in JSON format:

{{{input}}}

---

**CRITICAL GUIDELINES FOR MEAL SUGGESTIONS:**

1.  **ABSOLUTE ADHERENCE TO DIETARY RESTRICTIONS:**
    * **Diet Type:** If 'preferredDiet' is specified (e.g., "vegan", "vegetarian"), **NO ingredients outside of that diet are permitted**. For example, if 'vegan', absolutely no meat, poultry, fish, dairy, or eggs.
    * **Allergies:** **STRICTLY EXCLUDE ALL** ingredients listed in 'allergies'.
    * **Dispreferred Ingredients:** **DO NOT use ANY** ingredients listed in 'dispreferredIngredients'.
    * **Preferred Ingredients:** Prioritize the use of ingredients listed in 'preferredIngredients' where appropriate and within the other constraints.
    * **Cuisines:** Prioritize 'preferredCuisines' and **AVOID** 'dispreferredCuisines' when developing meal ideas.

2.  **MACRONUTRIENT ACCURACY:**
    * The 'totalCalories', 'totalProtein', 'totalCarbs', and 'totalFat' for each meal MUST be meticulously calculated and match the sum of their respective values from the 'ingredients' list. Aim to be as close as possible to the 'targetCalories', 'targetProteinGrams', 'targetCarbsGrams', and 'targetFatGrams' provided in the input for the specified 'mealName'.

3.  **OUTPUT FORMAT - STRICT JSON ONLY:**
    * Your response MUST be a JSON object with ONLY one top-level property: "suggestions".
    * "suggestions": This MUST be an array containing 1 to 3 meal suggestion objects. Each meal suggestion object MUST contain ONLY these exact properties:
        * "mealTitle": string — A concise and appealing title for the meal.
        * "description": string — A brief, engaging description of the meal.
        * "ingredients": An array of objects, where each object represents a single ingredient. Each ingredient object MUST contain ONLY these exact properties:
            * "name": string — The name of the ingredient.
            * "amount": string — The quantity of the ingredient as a string.
            * "unit": string — The unit of measurement for the amount.
            * "calories": number — Calories for this specific amount of the ingredient.
            * "protein": number — Protein in grams for this specific amount of the ingredient.
            * "carbs": number — Carbohydrates in grams for this specific amount of the ingredient.
            * "fat": number — Fat in grams for this specific amount of the ingredient.
            * "macrosString": string — A concise string representation of the ingredient's macros (e.g., "150 cal, 20g P, 5g C, 8g F").
        * "totalCalories": number — The sum of calories from all ingredients in this meal.
        * "totalProtein": number — The sum of protein (grams) from all ingredients in this meal.
        * "totalCarbs": number — The sum of carbohydrates (grams) from all ingredients in this meal.
        * "totalFat": number — The sum of fat (grams) from all ingredients in this meal.
        * "instructions"?: string — (Optional) Step-by-step cooking instructions for the meal. If not applicable or not requested, omit this field.

**⚠️ Non-Negotiable Rules:**

* **NO EXCEPTIONS** to any of the dietary constraints (diet type, allergies, dispreferred ingredients).
* Ensure all macro sums are perfectly accurate.
* Use actual numerical values for all number fields. DO NOT use string representations for numbers.
* DO NOT return empty "ingredients" lists.
* Use the exact field names and spelling provided.
* DO NOT add any extra fields, properties, or keys at any level of the JSON structure.
* DO NOT include any introductory text, concluding remarks, markdown formatting (like json), or any other commentary outside of the pure JSON object.

Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ suggestions: Array<{ mealTitle: string; description: string; ingredients: Array<{ name: string; amount: string; unit: string; calories: number; protein: number; carbs: number; fat: number; macrosString: string; }>; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; instructions?: string; }>; }
`,
});

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
