
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

**EXAMPLE INPUT:**
```json
{
  "currentMeal": {
    "name": "Lunch",
    "ingredients": [
      {"name": "Chicken Breast", "quantity": 100, "unit": "g", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
      {"name": "Brown Rice", "quantity": 80, "unit": "g", "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9}
    ],
    "total_calories": 276,
    "total_protein": 33.6,
    "total_carbs": 23,
    "total_fat": 4.5
  },
  "targetMacros": {
    "calories": 400,
    "protein": 40,
    "carbs": 35,
    "fat": 8
  }
}
```

**EXAMPLE OUTPUT:**
```json
{
  "adjustedMeal": {
    "name": "Lunch",
    "custom_name": "",
    "ingredients": [
      {
        "name": "Chicken Breast",
        "quantity": 120,
        "unit": "g",
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fat": 3.6
      },
      {
        "name": "Brown Rice",
        "quantity": 100,
        "unit": "g",
        "calories": 111,
        "protein": 2.6,
        "carbs": 23,
        "fat": 0.9
      }
    ],
    "total_calories": 409,
    "total_protein": 39.8,
    "total_carbs": 23,
    "total_fat": 5.22
  },
  "explanation": "Increased chicken breast from 100g to 120g and rice from 80g to 100g to meet calorie and protein targets."
}
```

**YOUR OUTPUT MUST:**
1. Have "name" field with EXACT same value: "{{currentMeal.name}}"
2. Have "custom_name" field (can be empty string "")
3. Have same ingredients with ONLY quantity changes
4. Have accurate total nutritional calculations
5. Include explanation of what quantities were changed

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
      if (output.adjustedMeal.name !== input.originalMeal.name) {
        console.error(`Meal name changed from "${input.originalMeal.name}" to "${output.adjustedMeal.name}"`);
        // Force the correct meal name
        output.adjustedMeal.name = input.originalMeal.name;
      }

      return validationResult.data;
    } catch (error: any) {
      console.error("Error in adjustMealIngredientsFlow:", error);
      throw new Error(error);
    }
  },
);
