'use server';

import { openaiModel } from '@/ai/genkit';

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

const prompt = openaiModel.definePrompt({
  name: 'adjustMealIngredientsPrompt',
  input: { schema: AdjustMealIngredientsInputSchema },
  output: { schema: AdjustMealIngredientsOutputSchema },
  prompt: `You are an expert nutritionist and a creative personal chef. Your primary goal is to help a user create a delicious, complete, and nutritionally perfect meal that matches their targets. You will either **complete and optimize** an existing meal idea or **generate a new one from scratch**.

**User Profile for Context:**
- Age: {{userProfile.age}}
- Diet Goal: {{userProfile.primary_diet_goal}}
- Dietary Preference: {{#if userProfile.preferred_diet}}{{userProfile.preferred_diet}}{{else}}None specified{{/if}}
- Allergies (Critical to Avoid): {{#if userProfile.allergies.length}}{{#each userProfile.allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Disliked Ingredients: {{#if userProfile.dispreferrred_ingredients.length}}{{#each userProfile.dispreferrred_ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Favorite Ingredients: {{#if userProfile.preferred_ingredients.length}}{{#each userProfile.preferred_ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**Target Macros for "{{originalMeal.name}}":**
- Calories: {{targetMacros.calories}} kcal
- Protein: {{targetMacros.protein}}g
- Carbohydrates: {{targetMacros.carbs}}g
- Fat: {{targetMacros.fat}}g

**--- Your Task: Choose a Scenario ---**

**Scenario 1: User provided ingredients (Meal Optimization & Completion)**
*This scenario applies if the 'Ingredients' list below is NOT empty.*
1.  **Identify the Intended Meal:** Look at the user's ingredients (e.g., 'Pizza Dough', 'Mozzarella Cheese'). What are they trying to make?
2.  **Make it a Complete Meal:** Determine what's missing. A pizza needs sauce, maybe some vegetables or a protein source. **You MUST add the necessary ingredients** to make the meal realistic, balanced, and appetizing.
3.  **Optimize All Ingredients:** Adjust the quantities of **ALL** ingredients—both the user's original ones and the ones you added—to precisely meet the target macros within a 3-5% tolerance.
4.  **Explain Your Actions:** In the 'explanation' field, describe how you completed their meal idea.

**Original Meal Data:**
- Meal Type: {{originalMeal.name}}
- Ingredients:
{{#if originalMeal.ingredients.length}}
{{#each originalMeal.ingredients}}
- {{this.name}}: {{this.quantity}} {{this.unit}}
{{/each}}
{{else}}
- (No ingredients provided)
{{/if}}

**Scenario 2: User did not provide ingredients (Meal Generation from Scratch)**
*This scenario applies if the 'Ingredients' list above is empty.*
1.  **Analyze the Context:** Note the meal type (e.g., 'Breakfast', 'Lunch') and the user's profile (preferences, dislikes, goals).
2.  **Generate a New, Appropriate Meal:** Create a complete, suitable meal from scratch that the user would likely enjoy and that fits the meal type. (e.g., suggest a 'Chicken and Quinoa Bowl' for lunch, not for breakfast).
3.  **Set Ingredient Quantities:** Select all ingredients and set their quantities to precisely meet the target macros.
4.  **Explain Your Actions:** In the 'explanation' field, state that you've generated a new meal suggestion since none was provided.

**--- CRITICAL Output Instructions ---**
- Your entire response MUST be a single, valid JSON object. Do not include notes or markdown like \`\`\`json.
- The JSON object must have exactly two top-level properties: "adjustedMeal" and "explanation".
- The \`adjustedMeal\` object represents the final, complete meal. Its \`ingredients\` array should include ALL final ingredients with their optimized quantities and recalculated nutritional values.
- The \`name\` and \`customName\` of the meal in the output must match the original input.
- Your response must strictly match this TypeScript type:
  \`{ adjustedMeal: { name: string; custom_name?: string; ingredients: { name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; }[]; total_calories: number; total_protein: number; total_carbs: number; total_fat: number; }; explanation: string; }\`

Begin JSON response now.
`,
});

const adjustMealIngredientsFlow = openaiModel.defineFlow(
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
