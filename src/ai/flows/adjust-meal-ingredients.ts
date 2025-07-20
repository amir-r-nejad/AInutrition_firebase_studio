'use server';

import { ai } from '@/ai/genkit';

import {
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutputSchema,
  type AdjustMealIngredientsInput,
  type AdjustMealIngredientsOutput,
} from '@/lib/schemas';

export async function adjustMealIngredients(
  input: AdjustMealIngredientsInput
): Promise<AdjustMealIngredientsOutput> {
  return adjustMealIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustMealIngredientsPrompt',
  input: { schema: AdjustMealIngredientsInputSchema },
  output: { schema: AdjustMealIngredientsOutputSchema },
  prompt: `You are an expert nutritionist. Your task is to adjust the quantities of the **existing ingredients** for a given meal to precisely match target macronutrients.

**-- ABSOLUTELY CRITICAL RULES --**
1.  **YOU MUST NOT ADD NEW INGREDIENTS.** The output ingredient list must be identical to the input ingredient list.
2.  **YOU MUST NOT REMOVE EXISTING INGREDIENTS.** The output ingredient list must be identical to the input ingredient list.
3.  **YOU MUST NOT CHANGE OR SWAP ANY INGREDIENTS.**
4.  Your **ONLY** allowed action is to modify the \`quantity\` value for each ingredient provided.
5.  After adjusting quantities, you MUST accurately recalculate the \`calories\`, \`protein\`, \`carbs\`, and \`fat\` for each ingredient, as well as the \`total_calories\`, \`total_protein\`, \`total_carbs\`, and \`total_fat\` for the entire meal.
6.  The \`name\` of the meal in the output JSON **MUST** exactly match the "Original Meal Type" provided in the input.
7.  The \`customName\` of the meal in the output JSON **MUST** exactly match the "Original Custom Meal Name" provided in the input. If no custom name was provided, this field should be omitted or be an empty string.


User Profile:
{{#if userProfile.age}}Age: {{userProfile.age}}{{/if}}
{{#if userProfile.biological_sex}}Gender: {{userProfile.biological_sex}}{{/if}}
{{#if userProfile.physical_activity_level}}Activity Level: {{userProfile.physical_activity_level}}{{/if}}
{{#if userProfile.primary_diet_goal}}Diet Goal: {{userProfile.primary_diet_goal}}{{/if}}
{{#if userProfile.preferred_diet}}Preferred Diet: {{userProfile.preferred_diet}}{{/if}}
{{#if userProfile.allergies.length}}Allergies: {{#each userProfile.allergies}}{{{this}}}{{/each}}{{/if}}
{{#if userProfile.dispreferrred_ingredients.length}}Dislikes: {{#each userProfile.dispreferrred_ingredients}}{{{this}}}{{/each}}{{/if}}
{{#if userProfile.preferred_ingredients.length}}Preferred Ingredients: {{#each userProfile.preferred_ingredients}}{{{this}}}{{/each}}{{/if}}

Original Meal Type: {{originalMeal.name}}
{{#if originalMeal.customName}}Original Custom Meal Name: {{originalMeal.customName}}{{/if}}
Ingredients:
{{#each originalMeal.ingredients}}
- {{this.name}}: {{this.quantity}} {{this.unit}} (Calories: {{this.calories}}, Protein: {{this.protein}}g, Carbs: {{this.carbs}}g, Fat: {{this.fat}}g)
{{/each}}
Current Totals:
- Calories: {{originalMeal.total_calories}}
- Protein: {{originalMeal.total_protein}}g
- Carbs: {{originalMeal.total_carbs}}g
- Fat: {{originalMeal.total_fat}}g

Target Macros for "{{originalMeal.name}}":
- Calories: {{targetMacros.calories}}
- Protein: {{targetMacros.protein}}g
- Carbs: {{targetMacros.carbs}}g
- Fat: {{targetMacros.fat}}g

Strict Instructions for Output:
- Your response MUST be a JSON object with ONLY these exact two top-level properties: "adjustedMeal" and "explanation".
- The \`adjustedMeal\` object MUST represent the modified meal and contain ONLY these properties: "name", "customName", "ingredients", "total_calories", "total_protein", "total_carbs", "total_fat".
- The \`ingredients\` array objects MUST contain ONLY these properties: "name", "quantity", "unit", "calories", "protein", "carbs", "fat".
- DO NOT add any extra fields, properties, keys, or markdown formatting (like \`\`\`json) to the response.
- Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ adjustedMeal: { name: string; customName?: string; ingredients: { name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; }[]; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; }; explanation: string; }
`,
});

const adjustMealIngredientsFlow = ai.defineFlow(
  {
    name: 'adjustMealIngredientsFlow',
    inputSchema: AdjustMealIngredientsInputSchema,
    outputSchema: AdjustMealIngredientsOutputSchema,
  },
  async (
    input: AdjustMealIngredientsInput
  ): Promise<AdjustMealIngredientsOutput> => {
    try {
      const { output } = await prompt(input);

      if (!output)
        throw new Error('AI did not return an output for meal adjustment.');

      const validationResult =
        AdjustMealIngredientsOutputSchema.safeParse(output);
      if (!validationResult.success) {
        throw new Error(
          `AI returned data in an unexpected format. Details: ${validationResult.error.message}`
        );
      }

      return validationResult.data;
    } catch (error: any) {
      console.error('Error in adjustMealIngredientsFlow:', error);
      throw new Error(error);
    }
  }
);
