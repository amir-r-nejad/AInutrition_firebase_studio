'use server';

import { geminiModel } from '@/ai/genkit';
import {
  SuggestIngredientSwapInputSchema,
  SuggestIngredientSwapOutputSchema,
  type SuggestIngredientSwapInput,
  type SuggestIngredientSwapOutput,
} from '@/lib/schemas';
import { getAIApiErrorMessage } from '@/lib/utils';

// Main entry function
export async function suggestIngredientSwap(
  input: SuggestIngredientSwapInput
): Promise<SuggestIngredientSwapOutput> {
  return suggestIngredientSwapFlow(input);
}

// AI Prompt
const prompt = geminiModel.definePrompt({
  name: 'suggestIngredientSwapPrompt',
  input: { schema: SuggestIngredientSwapInputSchema },
  output: { schema: SuggestIngredientSwapOutputSchema },
  prompt: `You are an expert nutritionist and personal chef for "NutriPlan," a platform for personalized meal planning. Your task is to optimize a user’s meal by suggesting a complete, edible, and appetizing meal that aligns with the provided macronutrient targets, meal context, and user preferences. If the user provides meal ingredients, optimize them into a cohesive meal. If no ingredients are provided, generate a new meal from scratch that is appropriate for the meal type (e.g., breakfast, lunch, dinner, or snack) and respects user preferences, allergies, and dietary needs.

**Input Data**: {{{input}}}

**Chain-of-Thought Reasoning (Mandatory)**:
Follow these steps to ensure accurate, relevant, and practical meal suggestions:
1. **Analyze Meal Context**: Identify the meal type ({{mealName}}) and ensure the suggested meal is appropriate (e.g., oatmeal or smoothies for breakfast, not steak). If no meal type is specified, assume a general meal but prioritize user preferences.
2. **Evaluate Input Ingredients**: If ingredients are provided, analyze their nutritional profile (calories, protein, carbs, fat) and optimize them into a complete meal by adjusting quantities or adding complementary ingredients. If no ingredients are provided, generate a new meal from scratch.
3. **Review User Preferences**: Consider dietaryPreferences, dislikedIngredients, and allergies to select ingredients that align with the user’s needs and avoid harmful or disliked items.
4. **Match Macronutrient Targets**: Ensure the meal’s total calories, protein, carbohydrates, and fat are within a 5% margin of error of the provided nutrientTargets ({{nutrientTargets.calories}} kcal, {{nutrientTargets.protein}}g protein, {{nutrientTargets.carbohydrates}}g carbs, {{nutrientTargets.fat}}g fat). Use precise nutritional data (e.g., USDA database) for calculations.
5. **Ensure Practicality**: Suggest a cohesive, edible meal that is feasible to prepare with basic kitchen equipment (e.g., stove, blender) unless otherwise specified. Avoid overly complex recipes.
6. **Craft Ingredient List**: Select 3–5 ingredients to form a complete meal. For each ingredient, provide a reason explaining why it fits the meal, user preferences, or nutritional goals (e.g., “Greek yogurt adds protein to support muscle gain and respects lactose-free preference”).
7. **Validate Nutritional Balance**: Double-check that the sum of calories, protein, carbs, and fat from all ingredients matches the nutrientTargets within 5%. If no suitable meal can be generated, return an empty array.

**Example Input and Output (Reference Only)**:
**Input Example**:
{
  "mealName": "Breakfast",
  "ingredients": [],
  "dietaryPreferences": "High-Protein",
  "dislikedIngredients": ["Tofu"],
  "allergies": ["Peanuts"],
  "nutrientTargets": {
    "calories": 400,
    "protein": 30,
    "carbohydrates": 40,
    "fat": 10
  }
}
**Output Example**:
[
  {
    "ingredientName": "Greek Yogurt (Non-Fat)",
    "reason": "High in protein to support your muscle gain goal, lactose-free to avoid allergies, and perfect for a creamy breakfast base."
  },
  {
    "ingredientName": "Mixed Berries",
    "reason": "Provides carbs and antioxidants, enhancing flavor and nutrition for a balanced breakfast without peanuts or tofu."
  },
  {
    "ingredientName": "Chia Seeds",
    "reason": "Adds healthy fats and fiber, keeping you full longer while meeting your high-protein dietary preference."
  },
  {
    "ingredientName": "Almond Milk (Unsweetened)",
    "reason": "Low-calorie liquid to blend the smoothie, peanut-free to respect allergies, and aligns with high-protein needs."
  }
]

**Strict Instructions for JSON Output**:
- Your response MUST be a JSON array containing 3–5 objects, each representing an ingredient in a complete, edible meal.
- Each object MUST contain ONLY these exact two properties:
    - "ingredientName": string — The name of the ingredient (e.g., "Greek Yogurt", "Grilled Chicken").
    - "reason": string — A concise explanation (max 50 words) of why this ingredient fits the meal, user preferences, or nutritional goals.
- **⚠️ Critical Rules**:
  - Use exact field names: "ingredientName" and "reason".
  - Ensure the suggested ingredients form a cohesive, edible meal appropriate for the meal type (e.g., a smoothie or omelet for breakfast, not just adjusted quantities of input ingredients).
  - If ingredients are provided, optimize them into a complete meal by adjusting quantities or adding complementary ingredients.
  - If no ingredients are provided, generate a new meal from scratch based on mealName, dietaryPreferences, and nutrientTargets.
  - Respect dietaryPreferences, dislikedIngredients, and allergies strictly. Avoid any ingredient that conflicts with these constraints.
  - Ensure the meal’s total calories, protein, carbs, and fat are within 5% of nutrientTargets. Use precise nutritional data for calculations.
  - If no suitable meal can be generated within constraints, return an empty array.
  - Do NOT add extra fields, properties, or keys to the objects in the array.
  - Do NOT include introductory text, concluding remarks, markdown, or commentary outside the JSON array.
  - Keep reasons concise, user-friendly, and tied to user preferences or nutritional goals.

Respond ONLY with the pure JSON array matching the following TypeScript type:
Array<{ ingredientName: string; reason: string; }>
`,
});

// Genkit Flow (Unchanged)
const suggestIngredientSwapFlow = geminiModel.defineFlow(
  {
    name: 'suggestIngredientSwapFlow',
    inputSchema: SuggestIngredientSwapInputSchema,
    outputSchema: SuggestIngredientSwapOutputSchema,
  },
  async (
    input: SuggestIngredientSwapInput
  ): Promise<SuggestIngredientSwapOutput> => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI did not return output.');
      }

      const validationResult =
        SuggestIngredientSwapOutputSchema.safeParse(output);
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
    } catch (error: any) {
      console.error('Error in suggestIngredientSwapFlow:', error);
      throw new Error(getAIApiErrorMessage(error));
    }
  }
);
