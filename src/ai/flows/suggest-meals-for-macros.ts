'use server';

import { ai, geminiModel } from '@/ai/genkit';

// Types
export interface SuggestMealsForMacrosInput {
  mealName: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  dietGoal?: string;
  preferredDiet?: string;
  preferredCuisines?: string[];
  dispreferredCuisines?: string[];
  preferredIngredients?: string[];
  dispreferredIngredients?: string[];
  allergies?: string[];
}

export interface IngredientDetail {
  name: string;
  amount: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
}

export interface MealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: IngredientDetail[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

export interface SuggestMealsForMacrosOutput {
  suggestions: MealSuggestion[];
}

// Main entry function
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput
): Promise<SuggestMealsForMacrosOutput> {
  return suggestMealsForMacrosFlow(input);
}

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'suggestMealsForMacrosPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are a **precision nutritional meal planner** who creates meals that EXACTLY match macronutrient targets. Your #1 priority is achieving the specified calorie and macro targets with mathematical precision.

**USER PROFILE DATA:**
{{{input}}}

**CRITICAL MACRO REQUIREMENTS - ABSOLUTE PRIORITY:**
🎯 **EXACT TARGETS (NON-NEGOTIABLE):**
- Calories: {{targetCalories}} (±10 calories maximum)
- Protein: {{targetProteinGrams}}g (±2g maximum)
- Carbs: {{targetCarbsGrams}}g (±3g maximum)  
- Fat: {{targetFatGrams}}g (±2g maximum)

**MACRO CALCULATION PROCESS - FOLLOW THIS EXACTLY:**
1. **CALCULATE BACKWARDS**: Start with the calorie target and work backwards to determine ingredient quantities
2. **VERIFY EACH INGREDIENT**: Use precise nutritional values (per 100g standard)
3. **ADJUST PORTIONS**: Increase/decrease quantities until you hit the exact targets
4. **DOUBLE-CHECK MATH**: Verify that individual ingredient calories sum to the target
5. **PRIORITIZE CALORIES**: If there's a conflict, prioritize hitting the calorie target first

**PERSONALIZATION (Secondary to macro accuracy):**
- Age {{age}}, {{gender}}, {{activityLevel}} activity level
- Diet goal: {{dietGoal}} 
- Preferred cuisines: {{preferredCuisines}}
- AVOID: {{dispreferredCuisines}}
- INCLUDE: {{preferredIngredients}}
- EXCLUDE: {{dispreferredIngredients}} and {{allergies}}
- Follow {{preferredDiet}} requirements

**MEAL STRUCTURE GUIDELINES:**
- Create 1-2 DIFFERENT meal options
- Use varied cooking methods and meal structures
- Incorporate user's preferred ingredients creatively
- Ensure meals are practical and appealing

**RESPONSE FORMAT:**
Return ONLY a JSON object with this exact structure:

{
  "suggestions": [
    {
      "mealTitle": "Descriptive meal name",
      "description": "Brief description highlighting key flavors and user fit",
      "cuisineStyle": "Primary cuisine from user preferences",
      "ingredients": [
        {
          "name": "Ingredient name",
          "amount": "Precise quantity",
          "unit": "g or ml",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "macrosString": "Cal cal, Pg P, Cg C, Fg F"
        }
      ],
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFat": number,
      "targetAccuracy": "Shows how close you got to targets",
      "instructions": "Step-by-step cooking instructions"
    }
  ]
}

**EXAMPLE CALCULATION METHOD:**
For {{targetCalories}} calories target:
1. Choose base protein (e.g., 60g chicken breast = 99 cal, 23g protein)
2. Add carb source (e.g., 45g rice = 162 cal, 37g carbs)
3. Add fat source (e.g., 4g olive oil = 36 cal, 4g fat)
4. ADJUST quantities until total = {{targetCalories}} ±10 calories
5. Fine-tune other ingredients to hit protein/carb/fat targets

**CRITICAL SUCCESS CRITERIA:**
✅ Total calories MUST be within {{targetCalories}} ±5
✅ Each macro MUST be within specified ranges
✅ All allergies and restrictions respected
✅ Meal is practical and aligned with user preferences

**FAILURE TO MEET CALORIE TARGETS WILL RESULT IN REJECTED RESPONSE**

Generate meals that hit the exact macro targets while reflecting this user's preferences.`,
});

const suggestMealsForMacrosFlow = ai.defineFlow(
  {
    name: 'suggestMealsForMacrosFlow',
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (
    input: SuggestMealsForMacrosInput
  ): Promise<SuggestMealsForMacrosOutput> => {
    console.log(input);

    const { output } = await prompt(input);
    if (!output) throw new Error('AI did not return output.');

    return output as SuggestMealsForMacrosOutput;
  }
);
