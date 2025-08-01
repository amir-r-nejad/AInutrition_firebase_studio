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

const geminiPrompt = geminiModel.definePrompt({
  name: "adjustMealIngredientsPrompt",
  input: { schema: AdjustMealIngredientsInputSchema },
  output: { schema: AdjustMealIngredientsOutputSchema },

  prompt: `You are an expert nutritionist. Your task is to adjust ONLY the quantities of existing ingredients in a meal to better meet the target macros. DO NOT add new ingredients, remove ingredients, or substitute ingredients.

**INPUT DATA:**
Current Meal: {{currentMeal.name}}
Current Ingredients: {{#each currentMeal.ingredients}}
- {{name}}: {{quantity}}{{unit}} ({{calories}} cal, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat)
{{/each}}

Current Totals: {{currentMeal.total_calories}} cal, {{currentMeal.total_protein}}g protein, {{currentMeal.total_carbs}}g carbs, {{currentMeal.total_fat}}g fat

**TARGET MACROS:**
Target Calories: {{targetMacros.calories}}
Target Protein: {{targetMacros.protein}}g  
Target Carbs: {{targetMacros.carbs}}g
Target Fat: {{targetMacros.fat}}g

**DIETARY RESTRICTIONS TO RESPECT:**
{{#if userProfile.allergies}}
Allergies: {{#each userProfile.allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if userProfile.preferred_diet}}
Diet Preference: {{userProfile.preferred_diet}}
{{/if}}

**CRITICAL RULES:**
1. ONLY adjust the quantities of the existing ingredients
2. DO NOT add any new ingredients
3. DO NOT remove any existing ingredients  
4. DO NOT substitute or replace ingredients
5. Keep the same meal name: {{currentMeal.name}}
6. Maintain the same ingredient names exactly as provided
7. Only change the quantity values to get closer to target macros

**INSTRUCTIONS:**
1. Calculate the optimal quantities for each existing ingredient to meet target macros
2. Use proportional scaling to adjust quantities while maintaining ingredient ratios when possible
3. Ensure all nutritional calculations are accurate per 100g of each ingredient
4. Provide a clear explanation of quantity changes made

**OUTPUT REQUIREMENTS:**
- Return the same meal with same name and same ingredients
- Only the quantities should be different
- Each ingredient must have accurate nutritional data per 100g
- Calculate precise total nutritional values based on new quantities
- Explain which quantities were changed and why

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
      const { output } = await geminiPrompt(input);

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