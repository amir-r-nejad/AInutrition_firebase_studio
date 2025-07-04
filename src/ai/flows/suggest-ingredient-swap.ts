'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Zod Schemas
export const SuggestIngredientSwapInputSchema = z.object({
  mealName: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(), // grams
      caloriesPer100g: z.number(),
      proteinPer100g: z.number(),
      fatPer100g: z.number(),
    })
  ),
  dietaryPreferences: z.string(),
  dislikedIngredients: z.array(z.string()),
  allergies: z.array(z.string()),
  nutrientTargets: z.object({
    calories: z.number(),
    protein: z.number(),
    carbohydrates: z.number(),
    fat: z.number(),
  }),
});
export type SuggestIngredientSwapInput = z.infer<
  typeof SuggestIngredientSwapInputSchema
>;

export const SuggestIngredientSwapOutputSchema = z.array(
  z.object({
    ingredientName: z.string(),
    reason: z.string(),
  })
);
export type SuggestIngredientSwapOutput = z.infer<
  typeof SuggestIngredientSwapOutputSchema
>;

// Main entry function
export async function suggestIngredientSwap(
  input: SuggestIngredientSwapInput
): Promise<SuggestIngredientSwapOutput> {
  return suggestIngredientSwapFlow(input);
}

// AI Prompt
const prompt = ai.definePrompt({
  name: 'suggestIngredientSwapPrompt',
  input: { schema: SuggestIngredientSwapInputSchema },
  output: { schema: SuggestIngredientSwapOutputSchema },
  prompt: `You are a nutritional expert. Your task is to suggest ingredient swaps for a given meal, while strictly preserving its nutritional balance and respecting user preferences.

{{{input}}}

Strict Instructions:
- Analyze the provided meal and the user's preferences (allergies, dislikes, dietary needs).
- Suggest ingredient swaps that maintain approximate calorie, protein, carbohydrate, and fat targets of the original meal.
- Your response MUST be a JSON array. Each item in this array MUST be an object with ONLY these exact two properties:
    - "ingredientName": string — The name of the suggested swapped ingredient (e.g., "Quinoa", "Almond Milk").
    - "reason": string — A concise explanation of why this swap is suggested, specifically mentioning how it addresses preferences or maintains nutritional balance (e.g., "Gluten-free alternative with similar protein content", "Lactose-free option for dairy allergy").

⚠️ Important Rules:
- Use the exact field names and spelling provided: "ingredientName" and "reason".
- DO NOT add any extra fields, properties, or keys to the objects within the array.
- DO NOT include any introductory text, concluding remarks, markdown formatting (like json), or any other commentary outside of the pure JSON array.
- Ensure all suggestions are realistic and nutritionally sound.

Respond ONLY with the pure JSON array that strictly matches the following TypeScript type:
Array<{ ingredientName: string; reason: string; }>
`,
});

// Genkit Flow
const suggestIngredientSwapFlow = ai.defineFlow(
  {
    name: 'suggestIngredientSwapFlow',
    inputSchema: SuggestIngredientSwapInputSchema,
    outputSchema: SuggestIngredientSwapOutputSchema,
  },
  async (
    input: SuggestIngredientSwapInput
  ): Promise<SuggestIngredientSwapOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return output.');
    }

    const validationResult = SuggestIngredientSwapOutputSchema.safeParse(output);
    if (!validationResult.success) {
        console.error('AI output validation error:', validationResult.error.flatten());
        throw new Error(`AI returned data in an unexpected format. Details: ${validationResult.error.message}`);
    }

    return validationResult.data;
  }
);
