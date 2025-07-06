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

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'generatePersonalizedMealPlanPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are a professional AI nutritionist creating a HIGHLY PERSONALIZED weekly meal plan. You MUST carefully analyze and incorporate ALL the user's specific requirements below.

USER PROFILE DATA:
{{{input}}}

CRITICAL PERSONALIZATION REQUIREMENTS:
1. DIETARY RESTRICTIONS: The user follows a {{preferredDiet}} diet - ONLY include ingredients that align with this diet type
2. ALLERGIES: NEVER include these ingredients: {{allergies}} - this is a safety requirement
3. PREFERRED CUISINES: Prioritize meals from: {{preferredCuisines}}
4. AVOID THESE CUISINES: Do not create meals from: {{dispreferredCuisines}}
5. PREFERRED INGREDIENTS: Frequently use: {{preferredIngredients}}
6. AVOID THESE INGREDIENTS: Never use: {{dispreferredIngredients}}
7. MEDICAL CONDITIONS: Account for {{medicalConditions}} - adjust sodium, sugar, etc. accordingly
8. GOAL: This user wants {{dietGoalOnboarding}} - adjust portions and macro ratios accordingly
9. ACTIVITY LEVEL: {{activityLevel}} - adjust total calorie needs
10. MICRONUTRIENT FOCUS: Emphasize {{preferredMicronutrients}} in ingredient selection

CALORIE CALCULATION REQUIREMENTS:
- Age: {{age}}, Gender: {{gender}}, Height: {{height_cm}}cm, Current Weight: {{current_weight}}kg
- Activity Level: {{activityLevel}}
- Goal: {{dietGoalOnboarding}}
- Calculate appropriate daily calories based on these factors
- For muscle gain: typically 300-500 calories above maintenance
- For weight loss: typically 300-500 calories below maintenance
- For maintenance: use calculated BMR × activity multiplier

MEAL PLAN STRUCTURE:
You must return a JSON object with exactly two top-level properties:

1. "weeklyMealPlan" — an array with 7 objects (Monday-Sunday)
2. "weeklySummary" — nutritional totals for the entire week

DETAILED JSON STRUCTURE:

"weeklyMealPlan":
- Array of 7 day objects
- Each day object has:
  - "day": string (e.g., "Monday")
  - "meals": array of exactly 5 meal objects
  
Each meal object must have:
- "meal_name": string ("Breakfast", "Snack 1", "Lunch", "Snack 2", "Dinner")
- "ingredients": array of ingredient objects
- "total_calories": number
- "total_protein_g": number  
- "total_fat_g": number

Each ingredient object must have:
- "ingredient_name": string
- "quantity_g": number
- "macros_per_100g": object with:
  - "calories": number
  - "protein_g": number
  - "fat_g": number

"weeklySummary":
Must contain ONLY these four fields:
- "totalCalories": number
- "totalProtein": number
- "totalCarbs": number
- "totalFat": number

VALIDATION CHECKLIST - Before responding, verify:
✓ All meals use only {{preferredDiet}}-compatible ingredients
✓ No ingredients from allergies list: {{allergies}}
✓ No ingredients from dispreferred list: {{dispreferredIngredients}}
✓ Cuisines match preferences: {{preferredCuisines}}
✓ Frequent use of preferred ingredients: {{preferredIngredients}}
✓ Appropriate calories for {{dietGoalOnboarding}} goal
✓ All calculations are mathematically correct
✓ JSON structure matches exactly as specified

IMPORTANT RULES:
- Use EXACT field names provided
- NO extra fields in weeklySummary
- NO markdown formatting or code blocks
- ALL numerical values must be realistic and properly calculated
- Ensure totalCarbs is calculated and included in weeklySummary

Respond with pure JSON only.`,
});

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
    if (!output) throw new Error('AI did not return output.');

    return output as GeneratePersonalizedMealPlanOutput;
  }
);
