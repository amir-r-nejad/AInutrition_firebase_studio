'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Zod Schemas
export const GeneratePersonalizedMealPlanInputSchema = z.object({
  age: z.number(),
  gender: z.string(),
  height_cm: z.number(),
  current_weight: z.number(),
  goal_weight_1m: z.number(),
  activityLevel: z.string(),
  dietGoalOnboarding: z.string(),
  ideal_goal_weight: z.number().optional(),
  bf_current: z.number().optional(),
  bf_target: z.number().optional(),
  bf_ideal: z.number().optional(),
  mm_current: z.number().optional(),
  mm_target: z.number().optional(),
  mm_ideal: z.number().optional(),
  bw_current: z.number().optional(),
  bw_target: z.number().optional(),
  bw_ideal: z.number().optional(),
  waist_current: z.number().optional(),
  waist_goal_1m: z.number().optional(),
  waist_ideal: z.number().optional(),
  hips_current: z.number().optional(),
  hips_goal_1m: z.number().optional(),
  hips_ideal: z.number().optional(),
  right_leg_current: z.number().optional(),
  right_leg_goal_1m: z.number().optional(),
  right_leg_ideal: z.number().optional(),
  left_leg_current: z.number().optional(),
  left_leg_goal_1m: z.number().optional(),
  left_leg_ideal: z.number().optional(),
  right_arm_current: z.number().optional(),
  right_arm_goal_1m: z.number().optional(),
  right_arm_ideal: z.number().optional(),
  left_arm_current: z.number().optional(),
  left_arm_goal_1m: z.number().optional(),
  left_arm_ideal: z.number().optional(),
  preferredDiet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  dispreferredCuisines: z.array(z.string()).optional(),
  preferredIngredients: z.array(z.string()).optional(),
  dispreferredIngredients: z.array(z.string()).optional(),
  preferredMicronutrients: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  typicalMealsDescription: z.string().optional(),
});
export type GeneratePersonalizedMealPlanInput = z.infer<
  typeof GeneratePersonalizedMealPlanInputSchema
>;

const MealSchema = z.object({
  meal_name: z.string(),
  ingredients: z.array(
    z.object({
      ingredient_name: z.string(),
      quantity_g: z.number(),
      macros_per_100g: z.object({
        calories: z.number(),
        protein_g: z.number(),
        fat_g: z.number(),
      }),
    })
  ),
  total_calories: z.number(),
  total_protein_g: z.number(),
  total_fat_g: z.number(),
});
export type Meal = z.infer<typeof MealSchema>;

const DayPlanSchema = z.object({
  day: z.string(),
  meals: z.array(MealSchema),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

export const GeneratePersonalizedMealPlanOutputSchema = z.object({
  weeklyMealPlan: z.array(DayPlanSchema),
  weeklySummary: z.object({
    totalCalories: z.number(),
    totalProtein: z.number(),
    totalCarbs: z.number(),
    totalFat: z.number(),
  }),
});
export type GeneratePersonalizedMealPlanOutput = z.infer<
  typeof GeneratePersonalizedMealPlanOutputSchema
>;

// Main entry function
export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt
const prompt = ai.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are a professional AI nutritionist. Your task is to create a personalized weekly meal plan based on the user's profile.

{{{input}}}

Strict Instructions:
- You must return a JSON object with exactly two top-level properties:
  1. "weeklyMealPlan" — an array with 7 objects, each representing a day of the week.
  2. "weeklySummary" — an object containing nutritional totals for the entire week.

Detailed structure:

"weeklyMealPlan":
- This is an array with 7 items.
- Each item represents one day (Monday to Sunday) and has these exact properties:
    - "day": string — the full name of the day (e.g., "Monday", "Tuesday").
    - "meals": an array of exactly 5 items, representing 3 main meals and 2 snacks.
    - Each meal or snack object must contain these exact properties:
        - "meal_name": string — the name of the meal or snack (e.g., "Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner").
        - "ingredients": an array where each item is an object representing an ingredient. Each ingredient object must include these exact properties:
            - "ingredient_name": string — the name of the ingredient (e.g., "Chicken Breast", "Broccoli").
            - "quantity_g": number — the amount of that ingredient in grams.
            - "macros_per_100g": an object with these exact properties:
                - "calories": number — calories per 100 grams of this ingredient.
                - "protein_g": number — protein in grams per 100 grams of this ingredient.
                - "fat_g": number — fat in grams per 100 grams of this ingredient.
        - "total_calories": number — the total calories for the entire meal, calculated based on the quantities of all ingredients.
        - "total_protein_g": number — the total protein in grams for the entire meal, calculated based on the quantities of all ingredients.
        - "total_fat_g": number — the total fat in grams for the entire meal, calculated based on the quantities of all ingredients.

"weeklySummary":
- This is an object that **MUST contain ONLY these exact four fields, and no others**:
    - "totalCalories": number — the total calories consumed during the entire week.
    - "totalProtein": number — the total protein in grams consumed during the entire week.
    - "totalCarbs": number — the total carbohydrates in grams consumed during the entire week.
    - "totalFat": number — the total fat in grams consumed during the entire week.
- Ensure "totalCarbs" is calculated and included.

⚠️ Important Rules:
- Use the exact field names and spelling provided in this prompt.
- **DO NOT add any extra fields, properties, or keys at any level of the JSON structure. This includes, but is not limited to, fields like 'calories', 'carbohydrates', 'estimatedTotalCalories', 'estimatedTotalCarbs', 'estimatedTotalFat', 'estimatedTotalProtein', 'fat', or 'protein' within the 'weeklySummary' object.**
- DO NOT rename any fields.
- All numerical values must be realistic, positive, and correctly calculated based on ingredient quantities and nutritional information.
- Only output valid JSON. Do not include any markdown formatting (like json), code blocks, or any extra commentary before, during, or after the JSON.

Respond only with pure JSON that matches this structure.`,
});

// Genkit Flow
const generatePersonalizedMealPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return output.');
    }

    const validationResult = GeneratePersonalizedMealPlanOutputSchema.safeParse(output);
    if (!validationResult.success) {
        console.error('AI output validation error:', validationResult.error.flatten());
        throw new Error(`AI returned data in an unexpected format. Details: ${validationResult.error.message}`);
    }

    return validationResult.data;
  }
);
