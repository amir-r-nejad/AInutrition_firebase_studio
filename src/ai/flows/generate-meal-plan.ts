'use server';

import { ai, geminiModel } from '@/ai/genkit';

// Types
export interface GeneratePersonalizedMealPlanInput {
  age: number;
  gender: string;
  height_cm: number;
  current_weight: number;
  goal_weight_1m: number;
  activityLevel: string;
  dietGoalOnboarding: string;
  ideal_goal_weight?: number;
  bf_current?: number;
  bf_target?: number;
  bf_ideal?: number;
  mm_current?: number;
  mm_target?: number;
  mm_ideal?: number;
  bw_current?: number;
  bw_target?: number;
  bw_ideal?: number;
  waist_current?: number;
  waist_goal_1m?: number;
  waist_ideal?: number;
  hips_current?: number;
  hips_goal_1m?: number;
  hips_ideal?: number;
  right_leg_current?: number;
  right_leg_goal_1m?: number;
  right_leg_ideal?: number;
  left_leg_current?: number;
  left_leg_goal_1m?: number;
  left_leg_ideal?: number;
  right_arm_current?: number;
  right_arm_goal_1m?: number;
  right_arm_ideal?: number;
  left_arm_current?: number;
  left_arm_goal_1m?: number;
  left_arm_ideal?: number;
  preferredDiet?: string;
  allergies?: string[];
  preferredCuisines?: string[];
  dispreferredCuisines?: string[];
  preferredIngredients?: string[];
  dispreferredIngredients?: string[];
  preferredMicronutrients?: string[];
  medicalConditions?: string[];
  medications?: string[];
  typicalMealsDescription?: string;
}

export interface Meal {
  meal_name: string;
  ingredients: {
    ingredient_name: string;
    quantity_g: number;
    macros_per_100g: {
      calories: number;
      protein_g: number;
      fat_g: number;
    };
  }[];
  total_calories: number;
  total_protein_g: number;
  total_fat_g: number;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface GeneratePersonalizedMealPlanOutput {
  weeklyMealPlan: DayPlan[];
  weeklySummary: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}

// Main entry function

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

// AI Prompt

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'generatePersonalizedMealPlanPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
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
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return output.');
    }
    return output as GeneratePersonalizedMealPlanOutput;
  }
);
