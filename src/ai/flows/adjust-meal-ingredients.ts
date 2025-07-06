'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { FullProfileType } from '@/lib/schemas';

// Types
export interface AdjustMealIngredientsInput {
  originalMeal: AIServiceMeal;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  userProfile: FullProfileType;
}

export interface AIServiceIngredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AIServiceMeal {
  name: string;
  customName?: string;
  ingredients: AIServiceIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface AdjustMealIngredientsOutput {
  adjustedMeal: AIServiceMeal;
  explanation: string;
}

// Genkit Flow

export async function adjustMealIngredients(
  input: AdjustMealIngredientsInput
): Promise<AdjustMealIngredientsOutput> {
  return adjustMealIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'strictMealAdjustmentPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `MEAL ADJUSTMENT TASK

You must modify the provided meal to meet nutritional targets. Follow these rules exactly:

STEP 1: IDENTIFY THE MEAL
- Meal Name: {{{originalMeal.name}}}
- Meal Type: {{{originalMeal.customName}}}
- Original Ingredients: {{{originalMeal.ingredients}}}

STEP 2: APPLY DIETARY RESTRICTIONS
- User Diet: {{{userProfile.preferredDiet}}}
- Allergies to avoid: {{{userProfile.allergies}}}
- Ingredients to avoid: {{{userProfile.dispreferredIngredients}}}
- Preferred ingredients: {{{userProfile.preferredIngredients}}}

STEP 3: ADJUST TO TARGETS
- Target Calories: {{{targetMacros.calories}}}
- Target Protein: {{{targetMacros.protein}}}g
- Target Carbs: {{{targetMacros.carbs}}}g
- Target Fat: {{{targetMacros.fat}}}g

STEP 4: RETURN ADJUSTED MEAL
The adjusted meal must:
1. Keep the same name: "{{{originalMeal.name}}}"
2. Keep the same meal concept: "{{{originalMeal.customName}}}"
3. Only modify ingredients and quantities to meet targets
4. Respect all dietary restrictions

OUTPUT FORMAT (JSON only):
{
  "adjustedMeal": {
    "name": "{{{originalMeal.name}}}",
    "customName": "adjusted version of {{{originalMeal.customName}}}",
    "ingredients": [
      {
        "name": "string",
        "quantity": number,
        "unit": "string", 
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    ],
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number
  },
  "explanation": "What changes were made and why"
}`,
});

const adjustMealIngredientsFlow = ai.defineFlow(
  {
    name: 'adjustMealIngredientsFlow',
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (
    input: AdjustMealIngredientsInput
  ): Promise<AdjustMealIngredientsOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return an output for meal adjustment.');
    }
    return output as AdjustMealIngredientsOutput;
  }
);
