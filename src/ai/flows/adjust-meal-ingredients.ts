
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutputSchema,
  type AdjustMealIngredientsInput,
  type AdjustMealIngredientsOutput,
} from '@/lib/schemas';

// Genkit Flow
export async function adjustMealIngredients(
  input: AdjustMealIngredientsInput
): Promise<AdjustMealIngredientsOutput> {
  return adjustMealIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustMealIngredientsPrompt',
  input: { schema: AdjustMealIngredientsInputSchema }, // Use the main input schema directly
  output: { schema: AdjustMealIngredientsOutputSchema },
  prompt: `You are an expert nutritionist. Your task is to adjust the quantities of the **existing ingredients** for a given meal to precisely match target macronutrients.

**-- ABSOLUTELY CRITICAL RULES --**
1.  **YOU MUST NOT ADD NEW INGREDIENTS.** The output ingredient list must be identical to the input ingredient list.
2.  **YOU MUST NOT REMOVE EXISTING INGREDIENTS.** The output ingredient list must be identical to the input ingredient list.
3.  **YOU MUST NOT CHANGE OR SWAP ANY INGREDIENTS.**
4.  Your **ONLY** allowed action is to modify the \`quantity\` value for each ingredient provided.
5.  After adjusting quantities, you MUST accurately recalculate the \`calories\`, \`protein\`, \`carbs\`, and \`fat\` for each ingredient, as well as the \`totalCalories\`, \`totalProtein\`, \`totalCarbs\`, and \`totalFat\` for the entire meal.
6.  The \`name\` of the meal in the output JSON **MUST** exactly match the meal name provided in the input.

User Profile:
{{#if userProfile.age}}Age: {{userProfile.age}}{{/if}}
{{#if userProfile.gender}}Gender: {{userProfile.gender}}{{/if}}
{{#if userProfile.activityLevel}}Activity Level: {{userProfile.activityLevel}}{{/if}}
{{#if userProfile.dietGoal}}Diet Goal: {{userProfile.dietGoal}}{{/if}}
{{#if userProfile.preferredDiet}}Preferred Diet: {{userProfile.preferredDiet}}{{/if}}
{{#if userProfile.allergies.length}}Allergies: {{#each userProfile.allergies}}{{{this}}}{{/each}}{{/if}}
{{#if userProfile.dispreferredIngredients.length}}Dislikes: {{#each userProfile.dispreferredIngredients}}{{{this}}}{{/each}}{{/if}}
{{#if userProfile.preferredIngredients.length}}Preferred Ingredients: {{#each userProfile.preferredIngredients}}{{{this}}}{{/each}}{{/if}}

Original Meal: {{originalMeal.name}}
Ingredients:
{{#each originalMeal.ingredients}}
- {{this.name}}: {{this.quantity}} {{this.unit}} (Calories: {{this.calories}}, Protein: {{this.protein}}g, Carbs: {{this.carbs}}g, Fat: {{this.fat}}g)
{{/each}}
Current Totals:
- Calories: {{originalMeal.totalCalories}}
- Protein: {{originalMeal.totalProtein}}g
- Carbs: {{originalMeal.totalCarbs}}g
- Fat: {{originalMeal.totalFat}}g

Target Macros for "{{originalMeal.name}}":
- Calories: {{targetMacros.calories}}
- Protein: {{targetMacros.protein}}g
- Carbs: {{targetMacros.carbs}}g
- Fat: {{targetMacros.fat}}g

Strict Instructions for Output:
- Your response MUST be a JSON object with ONLY these exact two top-level properties: "adjustedMeal" and "explanation".
- The \`adjustedMeal\` object MUST represent the modified meal and contain ONLY these properties: "name", "ingredients", "totalCalories", "totalProtein", "totalCarbs", "totalFat".
- The \`ingredients\` array objects MUST contain ONLY these properties: "name", "quantity", "unit", "calories", "protein", "carbs", "fat".
- DO NOT add any extra fields, properties, keys, or markdown formatting (like \`\`\`json) to the response.
- Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ adjustedMeal: { name: string; ingredients: { name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; }[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; }; explanation: string; }
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
    // Pass the input directly to the prompt.
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error('AI did not return an output for meal adjustment.');
    }

    // Validate the output with Zod for robustness
    const validationResult =
      AdjustMealIngredientsOutputSchema.safeParse(output);
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
  }
);
