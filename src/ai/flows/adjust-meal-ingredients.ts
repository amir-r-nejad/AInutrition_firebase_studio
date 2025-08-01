"use server";

import { geminiModel } from "@/ai/genkit";

import {
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutputSchema,
  type AdjustMealIngredientsInput,
  type AdjustMealIngredientsOutput,
} from "@/lib/schemas";

export async function adjustMealIngredients(
  input: AdjustMealIngredientsInput,
): Promise<AdjustMealIngredientsOutput> {
  return adjustMealIngredientsFlow(input);
}

const prompt = geminiModel.definePrompt({
  name: "adjustMealIngredientsPrompt",
  input: { schema: AdjustMealIngredientsInputSchema },
  output: { schema: AdjustMealIngredientsOutputSchema },

  prompt: `You are an expert nutritionist and meal planning assistant. Your task is to adjust a meal's ingredients based on user preferences while maintaining nutritional accuracy and meal integrity.

**INPUT DATA:**
Current Meal: {{currentMeal.name}}
Current Ingredients: {{#each currentMeal.ingredients}}
- {{name}}: {{quantity}}{{unit}} ({{calories}} cal, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat)
{{/each}}

Current Totals: {{currentMeal.total_calories}} cal, {{currentMeal.total_protein}}g protein, {{currentMeal.total_carbs}}g carbs, {{currentMeal.total_fat}}g fat

**ADJUSTMENT REQUEST:**
{{adjustmentRequest}}

**DIETARY RESTRICTIONS TO RESPECT:**
{{#if dietaryRestrictions}}
{{#each dietaryRestrictions}}
- {{this}}
{{/each}}
{{else}}
- None specified
{{/if}}

**INSTRUCTIONS:**
1. Analyze the current meal and the requested adjustment
2. Make intelligent ingredient substitutions, quantity adjustments, or additions
3. Maintain the meal's character and appeal
4. Respect all dietary restrictions
5. Provide accurate nutritional calculations
6. Explain your reasoning clearly

**OUTPUT REQUIREMENTS:**
- Return a complete adjusted meal with all ingredients
- Each ingredient must have accurate nutritional data per 100g
- Calculate precise quantities and total nutritional values
- Provide a clear explanation of changes made
- Ensure the meal remains balanced and appealing

Return only valid JSON matching the required schema.`,
});

const adjustMealIngredientsFlow = geminiModel.defineFlow(
  {
    name: "adjustMealIngredientsFlow",
    inputSchema: AdjustMealIngredientsInputSchema,
    outputSchema: AdjustMealIngredientsOutputSchema,
  },
  async (
    input: AdjustMealIngredientsInput,
  ): Promise<AdjustMealIngredientsOutput> => {
    try {
      const { output } = await prompt(input);

      if (!output)
        throw new Error("AI did not return an output for meal adjustment.");

      const validationResult =
        AdjustMealIngredientsOutputSchema.safeParse(output);
      if (!validationResult.success) {
        throw new Error(
          `AI returned data in an unexpected format. Details: ${validationResult.error.message}`,
        );
      }

      return validationResult.data;
    } catch (error: any) {
      console.error("Error in adjustMealIngredientsFlow:", error);
      throw new Error(error);
    }
  },
);
