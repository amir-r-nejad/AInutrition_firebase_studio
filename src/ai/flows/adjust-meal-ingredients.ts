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
  prompt: `
You are an expert nutritionist tasked with adjusting ONLY the quantities of existing ingredients in a meal to meet the specified target macronutrients (calories, protein, carbs, fat). You MUST follow these rules EXACTLY:

**CRITICAL RULES - NON-NEGOTIABLE:**
1. **Meal Name**: The meal name MUST remain EXACTLY as provided: "{{originalMeal.name}}". Do NOT modify it, including adding or removing spaces, capitalization, or any characters.
2. **Ingredients**: 
   - KEEP ALL ingredients EXACTLY as provided in the input, including any spaces, capitalization, or special characters in ingredient names.
   - ONLY adjust the "quantity" field of each ingredient.
   - DO NOT add new ingredients.
   - DO NOT remove any ingredients.
   - DO NOT change ingredient names, including trimming spaces or altering capitalization.
   - DO NOT change ingredient units.
3. **Nutritional Calculations**: 
   - For each ingredient, calculate the nutritional values (calories, protein, carbs, fat) based on the adjusted quantity using the input's per-unit nutritional data.
   - Example: If input provides 165 cal per 100g of Chicken Breast, and quantity is adjusted to 120g, calculate calories as (165/100) * 120 = 198 cal.
   - Ensure all nutritional values are numbers (NOT "n/a", null, or undefined).
   - Recalculate total_calories, total_protein, total_carbs, and total_fat for the meal based on the adjusted ingredient quantities.
4. **Custom Name**: Preserve the input's custom_name (default to "" if not provided).
5. **Explanation**: Provide a clear explanation of which ingredient quantities were changed, why, and how the new nutritional values were calculated.

**INPUT DATA:**
- **Meal Name**: {{originalMeal.name}}
- **Custom Name**: {{originalMeal.custom_name}}
- **Ingredients**: 
  {{#each originalMeal.ingredients}}
  - {{name}}: {{quantity}}{{unit}} ({{calories}} cal, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat per {{unit}})
  {{/each}}
- **Current Totals**: 
  - Calories: {{originalMeal.total_calories}} cal
  - Protein: {{originalMeal.total_protein}}g
  - Carbs: {{originalMeal.total_carbs}}g
  - Fat: {{originalMeal.total_fat}}g

**TARGET MACROS:**
- Calories: {{targetMacros.calories}} cal
- Protein: {{targetMacros.protein}}g
- Carbs: {{targetMacros.carbs}}g
- Fat: {{targetMacros.fat}}g

**USER PROFILE (FOR DIETARY RESTRICTIONS):**
{{#if userProfile.allergies}}
- Allergies: {{#each userProfile.allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{#if userProfile.preferred_diet}}
- Diet Preference: {{userProfile.preferred_diet}}
{{/if}}
{{#if userProfile.medical_conditions}}
- Medical Conditions: {{#each userProfile.medical_conditions}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

**EXAMPLE:**
**Input:**
- Meal Name: Breakfast Omelette
- Custom Name: ""
- Ingredients:
  - egg : 2piece (160 cal, 12g protein, 1g carbs, 11g fat per piece)
  - spinach: 50g (12 cal, 1.5g protein, 2g carbs, 0.2g fat per 50g)
- Current Totals: 172 cal, 13.5g protein, 3g carbs, 11.2g fat
- Target Macros: 200 cal, 15g protein, 5g carbs, 12g fat

**Output:**
{
  "adjustedMeal": {
    "name": "Breakfast Omelette",
    "custom_name": "",
    "ingredients": [
      {
        "name": "egg ",
        "quantity": 2.2,
        "unit": "piece",
        "calories": 352,
        "protein": 26.4,
        "carbs": 2.2,
        "fat": 24.2
      },
      {
        "name": "spinach",
        "quantity": 60,
        "unit": "g",
        "calories": 14.4,
        "protein": 1.8,
        "carbs": 2.4,
        "fat": 0.24
      }
    ],
    "total_calories": 366.4,
    "total_protein": 28.2,
    "total_carbs": 4.6,
    "total_fat": 24.44
  },
  "explanation": "Increased 'egg ' from 2 to 2.2 pieces (calories: 160*2.2=352, protein: 12*2.2=26.4, carbs: 1*2.2=2.2, fat: 11*2.2=24.2). Increased 'spinach' from 50g to 60g (calories: (12/50)*60=14.4, protein: (1.5/50)*60=1.8, carbs: (2/50)*60=2.4, fat: (0.2/50)*60=0.24). Totals are close to target macros (200 cal, 15g protein, 5g carbs, 12g fat)."
}

**STRICT REQUIREMENTS FOR OUTPUT:**
- The output MUST be valid JSON matching the AdjustMealIngredientsOutputSchema.
- The meal name in adjustedMeal.name MUST be EXACTLY "{{originalMeal.name}}", including any spaces or special characters.
- The ingredients list MUST contain EXACTLY the same ingredients as the input, with EXACT names (including spaces, capitalization, or special characters) and only the "quantity" field changed.
- All nutritional values (calories, protein, carbs, fat) for each ingredient and totals MUST be numbers, calculated accurately based on the input's per-unit data and adjusted quantities. Do NOT return "n/a", null, or undefined.
- The explanation MUST detail which quantities were changed, why, and how the nutritional values were calculated.

Return the adjusted meal in valid JSON format.
`,
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
      // Log input for debugging
      console.log("Input to adjustMealIngredientsFlow:", JSON.stringify(input, null, 2));

      const { output } = await geminiPrompt(input);

      if (!output) {
        throw new Error("AI did not return an output for meal adjustment.");
      }

      // Log raw AI output for debugging
      console.log("Raw AI output:", JSON.stringify(output, null, 2));

      const validationResult =
        AdjustMealIngredientsOutputSchema.safeParse(output);
      if (!validationResult.success) {
        throw new Error(
          `AI returned data in an unexpected format. Details: ${validationResult.error.message}`,
        );
      }

      const { adjustedMeal } = validationResult.data;

      // Validate meal name preservation
      if (adjustedMeal.name !== input.originalMeal.name) {
        console.warn(
          `Meal name changed from "${input.originalMeal.name}" to "${adjustedMeal.name}". Forcing correct name.`,
        );
        adjustedMeal.name = input.originalMeal.name;
      }

      // Validate ingredient names and count
      const inputIngredients = input.originalMeal.ingredients;
      const outputIngredients = adjustedMeal.ingredients;

      if (inputIngredients.length !== outputIngredients.length) {
        throw new Error(
          `Ingredient count mismatch: input has ${inputIngredients.length}, output has ${outputIngredients.length}.`,
        );
      }

      // Force exact ingredient names and recalculate nutritional values
      outputIngredients.forEach((ingredient, i) => {
        if (ingredient.name !== inputIngredients[i].name) {
          console.warn(
            `Ingredient name mismatch at index ${i}: expected "${inputIngredients[i].name}", got "${ingredient.name}". Forcing input name.`,
          );
          ingredient.name = inputIngredients[i].name; // Preserve exact input name
        }
        if (ingredient.unit !== inputIngredients[i].unit) {
          throw new Error(
            `Ingredient unit mismatch for "${inputIngredients[i].name}": expected "${inputIngredients[i].unit}", got "${ingredient.unit}".`,
          );
        }

        // Recalculate nutritional values based on input's per-unit data
        const inputNutrients = inputIngredients[i];
        const quantityRatio = ingredient.quantity / inputNutrients.quantity;
        if (
          ingredient.calories === null ||
          ingredient.protein === null ||
          ingredient.carbs === null ||
          ingredient.fat === null ||
          isNaN(ingredient.calories) ||
          isNaN(ingredient.protein) ||
          isNaN(ingredient.carbs) ||
          isNaN(ingredient.fat)
        ) {
          console.warn(
            `Invalid nutritional values for "${ingredient.name}". Recalculating based on input.`,
          );
          ingredient.calories = inputNutrients.calories * quantityRatio;
          ingredient.protein = inputNutrients.protein * quantityRatio;
          ingredient.carbs = inputNutrients.carbs * quantityRatio;
          ingredient.fat = inputNutrients.fat * quantityRatio;
        }
      });

      // Recalculate totals to ensure accuracy
      const recalculatedTotals = outputIngredients.reduce(
        (totals, ingredient) => {
          return {
            total_calories: totals.total_calories + (ingredient.calories || 0),
            total_protein: totals.total_protein + (ingredient.protein || 0),
            total_carbs: totals.total_carbs + (ingredient.carbs || 0),
            total_fat: totals.total_fat + (ingredient.fat || 0),
          };
        },
        {
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
        },
      );

      adjustedMeal.total_calories = recalculatedTotals.total_calories;
      adjustedMeal.total_protein = recalculatedTotals.total_protein;
      adjustedMeal.total_carbs = recalculatedTotals.total_carbs;
      adjustedMeal.total_fat = recalculatedTotals.total_fat;

      // Validate that no nutritional values are null or n/a
      const hasInvalidNutrients = outputIngredients.some(
        (ingredient) =>
          ingredient.calories === null ||
          ingredient.protein === null ||
          ingredient.carbs === null ||
          ingredient.fat === null ||
          isNaN(ingredient.calories) ||
          isNaN(ingredient.protein) ||
          isNaN(ingredient.carbs) ||
          isNaN(ingredient.fat)
      );
      if (hasInvalidNutrients) {
        throw new Error(
          "AI returned invalid nutritional values (null, undefined, or n/a) for one or more ingredients.",
        );
      }

      // Log final output for debugging
      console.log("Final adjusted meal:", JSON.stringify(adjustedMeal, null, 2));

      return {
        adjustedMeal,
        explanation: validationResult.data.explanation,
      };
    } catch (error: any) {
      console.error("Error in adjustMealIngredientsFlow:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred in meal ingredients adjustment",
      );
    }
  },
);