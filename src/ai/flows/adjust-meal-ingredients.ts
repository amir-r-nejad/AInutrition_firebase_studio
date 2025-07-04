'use server';

import { ai } from '@/ai/genkit';
import { FullProfileType } from '@/lib/schemas';
import { z } from 'zod';

// --- Start: Define Zod Schemas for validation ---
const AIServiceIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

const AIServiceMealSchema = z.object({
  name: z.string(),
  customName: z.string().optional().or(z.literal('')),
  ingredients: z.array(AIServiceIngredientSchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
});

const AdjustMealIngredientsInputSchema = z.object({
  originalMeal: AIServiceMealSchema,
  targetMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  userProfile: z.custom<FullProfileType>(),
});

const AdjustMealIngredientsOutputSchema = z.object({
  adjustedMeal: AIServiceMealSchema,
  explanation: z.string(),
});
// --- End: Define Zod Schemas ---

// Types
export type AIServiceIngredient = z.infer<typeof AIServiceIngredientSchema>;
export type AIServiceMeal = z.infer<typeof AIServiceMealSchema>;
export type AdjustMealIngredientsInput = z.infer<
  typeof AdjustMealIngredientsInputSchema
>;
export type AdjustMealIngredientsOutput = z.infer<
  typeof AdjustMealIngredientsOutputSchema
>;

// Genkit Flow
export async function adjustMealIngredients(
  input: AdjustMealIngredientsInput
): Promise<AdjustMealIngredientsOutput> {
  return adjustMealIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustMealIngredientsPrompt',
  input: { schema: AdjustMealIngredientsInputSchema },
  output: { schema: AdjustMealIngredientsOutputSchema },
  prompt: `You are an expert nutritionist and chef. Your task is to adjust a given meal to precisely match target macronutrients, while strictly respecting the user's allergies and preferences.

User Profile:
{{#if userProfile.age}}Age: {{userProfile.age}}{{/if}}
{{#if userProfile.gender}}Gender: {{userProfile.gender}}{{/if}}
{{#if userProfile.activityLevel}}Activity Level: {{userProfile.activityLevel}}{{/if}}
{{#if userProfile.dietGoal}}Diet Goal: {{userProfile.dietGoal}}{{/if}}
{{#if userProfile.preferredDiet}}Preferred Diet: {{userProfile.preferredDiet}}{{/if}}
{{#if userProfile.allergies.length}}Allergies: {{userProfile.allergies}}{{/if}}
{{#if userProfile.dispreferredIngredients.length}}Dislikes: {{userProfile.dispreferredIngredients}}{{/if}}
{{#if userProfile.preferredIngredients.length}}Preferred Ingredients: {{userProfile.preferredIngredients}}{{/if}}

Original Meal:
{{originalMeal}}

Target Macros:
{{targetMacros}}

Strict Instructions for Output:
- Your response MUST be a JSON object with ONLY these exact two top-level properties: "adjustedMeal" and "explanation".
    - "adjustedMeal": This object MUST represent the modified meal and contain ONLY these exact properties:
        - "name": string — The original name of the meal.
        - "customName"?: string — (Optional) A custom name for the meal if provided by the user or if a significant change warrants a new descriptive name. If not applicable, omit this field.
        - "ingredients": An array of objects, where each object represents an ingredient. Each ingredient object MUST contain ONLY these exact properties:
            - "name": string — The name of the ingredient (e.g., "Chicken Breast").
            - "quantity": number — The numerical amount of the ingredient.
            - "unit": string — The unit of measurement for the quantity (e.g., "g", "ml", "cup", "unit").
            - "calories": number — Calories for this specific quantity of the ingredient.
            - "protein": number — Protein in grams for this specific quantity of the ingredient.
            - "carbs": number — Carbohydrates in grams for this specific quantity of the ingredient.
            - "fat": number — Fat in grams for this specific quantity of the ingredient.
        - "totalCalories": number — The sum of calories from all ingredients in the adjusted meal.
        - "totalProtein": number — The sum of protein (grams) from all ingredients in the adjusted meal.
        - "totalCarbs": number — The sum of carbohydrates (grams) from all ingredients in the adjusted meal.
        - "totalFat": number — The sum of fat (grams) from all ingredients in the adjusted meal.
    - "explanation": string — A clear and concise explanation of the adjustments made, how they meet the target macros, and how user preferences/allergies were respected.

⚠️ Important Rules:
- Modify ingredients (quantities, swaps, additions, removals) to match the target macros as closely as possible.
- Ensure all "total" macro fields ("totalCalories", "totalProtein", "totalCarbs", "totalFat") are accurately calculated and summed based on the "ingredients" list.
- Avoid all specified allergens and try to respect all dislikes and preferred ingredients.
- Use the exact field names and spelling provided.
- DO NOT add any extra fields, properties, or keys at any level of the JSON structure beyond what is explicitly defined above.
- DO NOT include any introductory text, concluding remarks, markdown formatting (like json), or any other commentary outside of the pure JSON object.
- All numerical values must be realistic and positive.

Respond ONLY with the pure JSON object that strictly matches the following TypeScript type:
{ adjustedMeal: { name: string; customName?: string; ingredients: { name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; }[]; totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; }; explanation: string; }
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
