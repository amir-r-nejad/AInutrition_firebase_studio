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
  prompt: `You are a **personalized nutritional meal planner** who creates unique, varied meal suggestions based on individual user profiles. Your goal is to provide 1-3 DIFFERENT meal ideas that precisely meet macronutrient targets while reflecting the user's personal preferences and lifestyle.

**USER PROFILE DATA:**
{{{input}}}

**PERSONALIZATION REQUIREMENTS:**

1. **DEMOGRAPHIC & LIFESTYLE ADAPTATION:**
   - Age {{age}}, {{gender}}, {{activityLevel}} activity level
   - Diet goal: {{dietGoal}} - tailor meal complexity and ingredients accordingly
   - For muscle gain: emphasize protein-rich combinations
   - For weight loss: focus on satiating, lower-calorie density foods
   - For maintenance: balanced, sustainable everyday meals

2. **CUISINE & FLAVOR DIVERSITY:**
   - MUST incorporate flavors from preferred cuisines: {{preferredCuisines}}
   - AVOID cuisines: {{dispreferredCuisines}}
   - Create DISTINCTLY DIFFERENT meals - vary cooking methods, spice profiles, and meal structures
   - Examples: One bowl-style, one traditional plated meal, one soup/stew if appropriate

3. **INGREDIENT PERSONALIZATION:**
   - PRIORITIZE these ingredients: {{preferredIngredients}}
   - COMPLETELY EXCLUDE: {{dispreferredIngredients}} and {{allergies}}
   - STRICT {{preferredDiet}} compliance - no exceptions
   - Use seasonal, accessible ingredients when possible

4. **MEAL VARIATION STRATEGIES:**
   - Vary cooking methods: grilled, roasted, steamed, sautéed, raw
   - Different meal structures: bowls, wraps, soups, salads, traditional plates
   - Alternate protein sources and preparation styles
   - Mix textures: crunchy, creamy, chewy elements

**MACRO PRECISION TARGETS:**
- Target: {{targetCalories}} cal, {{targetProteinGrams}}g protein, {{targetCarbsGrams}}g carbs, {{targetFatGrams}}g fat
- Acceptable range: ±5% for calories, ±3g for macros
- Calculate each ingredient precisely and verify totals

**RESPONSE FORMAT:**
Return ONLY a JSON object with this exact structure:

{
  "suggestions": [
    {
      "mealTitle": "Unique, appealing meal name reflecting cuisine/style",
      "description": "Brief description highlighting key flavors and why it fits this user",
      "cuisineStyle": "Primary cuisine inspiration from user preferences",
      "ingredients": [
        {
          "name": "Ingredient name",
          "amount": "Quantity as string",
          "unit": "Measurement unit",
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
      "instructions": "Step-by-step cooking instructions"
    }
  ]
}

**CRITICAL REMINDERS:**
- Each meal suggestion MUST be genuinely different in style, ingredients, and preparation
- Use the user's preferred ingredients creatively across different cuisines
- Reflect their activity level and diet goals in portion sizes and ingredient choices
- Double-check that all allergies and dietary restrictions are respected
- Ensure macro calculations are accurate and match the target ranges

Generate meals that this specific user would actually want to eat based on their profile, not generic suggestions.`,
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
