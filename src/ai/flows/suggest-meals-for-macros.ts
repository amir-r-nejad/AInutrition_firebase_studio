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
  prompt: `You are a **versatile nutritional meal planner** who creates delicious, varied meals that hit exact nutritional targets. You MUST always provide meal suggestions regardless of how much or little preference data is available.

**USER PROFILE DATA:**
{{{input}}}

**CORE REQUIREMENTS (MANDATORY):**
🎯 **EXACT MACRO TARGETS:**
- Calories: {{targetCalories}} (±8 calories maximum)
- Protein: {{targetProteinGrams}}g (±2g maximum)
- Carbs: {{targetCarbsGrams}}g (±3g maximum)  
- Fat: {{targetFatGrams}}g (±2g maximum)

**PERSONALIZATION STRATEGY (ADAPTIVE):**

**TIER 1 - ABSOLUTE RESTRICTIONS (Always enforce if provided):**
- Allergies: {{allergies}} - NEVER include these ingredients
- Disliked ingredients: {{dispreferredIngredients}} - AVOID if specified
- Disliked cuisines: {{dispreferredCuisines}} - AVOID if specified

**TIER 2 - PREFERENCES (Incorporate when available):**
- Preferred ingredients: {{preferredIngredients}} - USE when possible, but not required
- Preferred cuisines: {{preferredCuisines}} - PREFER when available, but explore others
- Diet type: {{preferredDiet}} - FOLLOW if specified, otherwise use balanced approach

**TIER 3 - FALLBACK APPROACH (When preferences are limited/empty):**
- Use diverse, widely-accepted ingredients (chicken, rice, vegetables, eggs, etc.)
- Focus on balanced, nutritious whole foods
- Explore popular cuisines (Mediterranean, American, Asian fusion)
- Prioritize commonly available ingredients

**MEAL DEVELOPMENT PRIORITIES:**

1. **MACRO PRECISION FIRST** - Always hit exact targets regardless of preferences
2. **Safety** - Respect allergies and hard restrictions
3. **Preference Integration** - Use available preferences when possible
4. **Variety & Appeal** - Create interesting meals even with minimal data
5. **Practical Implementation** - Ensure meals are realistic and achievable

**FLEXIBLE INGREDIENT STRATEGY:**
- **Rich preference data**: Focus heavily on user preferences
- **Moderate preference data**: Balance preferences with variety
- **Minimal preference data**: Use proven, appealing ingredient combinations
- **No preference data**: Default to balanced, popular meal options

**COOKING APPROACH:**
- Vary cooking methods (grilled, roasted, steamed, sautéed, raw)
- Mix textures (crunchy, creamy, tender)
- Balance flavors (sweet, savory, spicy, fresh)
- Consider meal formats (bowls, plates, wraps, salads)

**MACRO CALCULATION PRECISION:**
1. Start with a protein source appropriate for the macro targets
2. Add carbohydrate sources to meet carb targets
3. Include healthy fats to reach fat targets
4. Adjust portions to hit exact calorie targets
5. Include vegetables for micronutrients and fiber
6. Verify all calculations sum correctly

**RESPONSE FORMAT:**
Return ONLY a JSON object with this exact structure:

{
  "suggestions": [
    {
      "mealTitle": "Appetizing meal name",
      "description": "Engaging description highlighting flavors and appeal",
      "cuisineStyle": "Cuisine type (from preferences if available, otherwise balanced choice)",
      "mealType": "Bowl/Plate/Wrap/Salad/etc.",
      "ingredients": [
        {
          "name": "Ingredient name",
          "amount": "Exact quantity with decimal precision",
          "unit": "g or ml",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "macrosString": "Cal cal, Pg P, Cg C, Fg F",
          "preparationNote": "How prepared (optional)"
        }
      ],
      "totalCalories": number,
      "totalProtein": number,
      "totalCarbs": number,
      "totalFat": number,
      "targetAccuracy": {
        "calories": "{{targetCalories}} target vs actual difference",
        "protein": "{{targetProteinGrams}}g target vs actual difference",
        "carbs": "{{targetCarbsGrams}}g target vs actual difference",
        "fat": "{{targetFatGrams}}g target vs actual difference"
      },
      "instructions": "Clear step-by-step cooking instructions",
      "flavorProfile": "Description of taste and texture experience",
      "preferenceAlignment": "How this meal uses available preferences or why it's appealing despite limited data"
    }
  ],
  "alternativeSuggestions": [
    {
      "quickSwaps": "Simple ingredient substitutions for variety",
      "cookingVariations": "Different preparation methods",
      "flavorBoosts": "Herbs, spices, or condiments to enhance taste"
    }
  ]
}

**CRITICAL SUCCESS CRITERIA:**
✅ ALWAYS provide meal suggestions (never fail due to lack of preferences)
✅ Hit macro targets within specified tolerances
✅ Respect allergies and hard restrictions
✅ Create appealing meals regardless of preference data availability
✅ Maintain variety and creativity
✅ Ensure practical, achievable recipes

**UNIVERSAL FALLBACK INGREDIENTS** (use when preferences are minimal):
- Proteins: Chicken breast, eggs, Greek yogurt, lean beef, fish, legumes
- Carbs: Rice, quinoa, sweet potato, oats, whole grain bread, fruits
- Fats: Olive oil, avocado, nuts, seeds
- Vegetables: Spinach, broccoli, bell peppers, tomatoes, onions
- Flavor enhancers: Garlic, herbs, spices, lemon, vinegar

**EXAMPLE SCENARIOS:**
- **Rich data**: Use specific preferences heavily
- **Moderate data**: Balance preferences with variety  
- **Minimal data**: Focus on universally appealing, balanced meals
- **No preferences**: Create nutritious, tasty meals using proven combinations

Generate 1-2 creative meal options that perfectly hit macro targets while being as appealing as possible given the available user data. ALWAYS succeed in providing suggestions.`,
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
    console.log('DATA ✅✅', input);

    const { output } = await prompt(input);
    if (!output) throw new Error('AI did not return output.');

    return output as SuggestMealsForMacrosOutput;
  }
);
