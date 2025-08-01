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

  prompt: `You are an expert nutritionist. Your task is to adjust ONLY the quantities of existing ingredients in a meal to better meet the target macros. 

**CRITICAL RULES - MUST FOLLOW EXACTLY:**
1. ✅ KEEP the meal name EXACTLY as provided: "{{currentMeal.name}}"
2. ✅ KEEP all ingredient names EXACTLY as provided
3. ✅ ONLY change the quantity numbers
4. ❌ DO NOT add new ingredients
5. ❌ DO NOT remove ingredients
6. ❌ DO NOT change ingredient names
7. ❌ DO NOT change the meal name

**INPUT DATA:**
Current Meal Name: {{currentMeal.name}}
Current Ingredients: {{#each currentMeal.ingredients}}
- {{name}}: {{quantity}}{{unit}} ({{calories}} cal, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat)
{{/each}}

Current Totals: {{currentMeal.total_calories}} cal, {{currentMeal.total_protein}}g protein, {{currentMeal.total_carbs}}g carbs, {{currentMeal.total_fat}}g fat

**TARGET MACROS:**
Target Calories: {{targetMacros.calories}}
Target Protein: {{targetMacros.protein}}g  
Target Carbs: {{targetMacros.carbs}}g
Target Fat: {{targetMacros.fat}}g

**EXAMPLE:**
Input meal "Lunch" with chicken breast 100g and brown rice 80g targeting 400 calories
Output meal "Lunch" with chicken breast 120g and brown rice 100g reaching 409 calories

**YOUR OUTPUT MUST:**
1. Have "name" field with EXACT same value: "{{currentMeal.name}}"
2. Have "custom_name" field (can be empty string "")
3. Have same ingredients with ONLY quantity changes
4. Have accurate total nutritional calculations
5. Include explanation of what quantities were changed

**STRICT REQUIREMENT:** The meal name in your response MUST be exactly "{{currentMeal.name}}" - no changes allowed.

**DIETARY RESTRICTIONS TO RESPECT:**
{{#if userProfile.allergies}}
Allergies: {{#each userProfile.allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if userProfile.preferred_diet}}
Diet Preference: {{userProfile.preferred_diet}}
{{/if}}

Return only valid JSON matching the required schema. The meal name MUST be "{{currentMeal.name}}" in your response.`,
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

      // Extra validation to ensure meal name is preserved
      if (output.adjustedMeal.name !== input.currentMeal.name) {
        console.error(`Meal name changed from "${input.currentMeal.name}" to "${output.adjustedMeal.name}"`);
        // Force the correct meal name
        output.adjustedMeal.name = input.currentMeal.name;
      }

      return validationResult.data;
    } catch (error: any) {
      console.error("Error in adjustMealIngredientsFlow:", error);
      throw new Error(error);
    }
  },
);