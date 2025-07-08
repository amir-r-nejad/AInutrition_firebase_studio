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
  prompt: `You are a **creative nutritional meal planner** who combines precision macro tracking with culinary creativity. Your mission is to create delicious, varied meals that hit exact nutritional targets while maximizing user satisfaction.

**USER PROFILE DATA:**
{{{input}}}

**PRECISION MACRO REQUIREMENTS:**
🎯 **EXACT TARGETS (TOP PRIORITY):**
- Calories: {{targetCalories}} (±8 calories maximum)
- Protein: {{targetProteinGrams}}g (±2g maximum)
- Carbs: {{targetCarbsGrams}}g (±3g maximum)  
- Fat: {{targetFatGrams}}g (±2g maximum)

**ENHANCED PERSONALIZATION PRIORITIES:**
1. **STRICT EXCLUSIONS** (Never include):
   - Allergies: {{allergies}} - ABSOLUTELY FORBIDDEN
   - Disliked ingredients: {{dispreferredIngredients}} - AVOID COMPLETELY
   - Disliked cuisines: {{dispreferredCuisines}} - DO NOT USE

2. **STRONG PREFERENCES** (Prioritize heavily):
   - Preferred ingredients: {{preferredIngredients}} - INCORPORATE CREATIVELY
   - Preferred cuisines: {{preferredCuisines}} - PRIMARY CUISINE STYLES
   - Diet type: {{preferredDiet}} - FOLLOW STRICTLY

3. **LIFESTYLE OPTIMIZATION**:
   - Age {{age}}, {{gender}}, {{activityLevel}} activity - tailor portion sizes and energy density
   - Diet goal: {{dietGoal}} - adjust meal composition and timing suggestions

**CREATIVE MEAL DEVELOPMENT APPROACH:**
- **INGREDIENT FREEDOM**: Explore diverse ingredients within user preferences
- **COOKING VARIETY**: Use different cooking methods (grilled, roasted, steamed, raw, etc.)
- **TEXTURE COMBINATIONS**: Mix crunchy, creamy, chewy elements
- **FLAVOR PROFILES**: Balance sweet, savory, spicy, tangy elements
- **MEAL FORMATS**: Consider bowls, wraps, salads, traditional plates, smoothies, etc.
- **SEASONAL AWARENESS**: Suggest fresh, seasonal ingredients when possible
- **GLOBAL INSPIRATION**: Draw from user's preferred cuisines authentically

**MACRO CALCULATION PRECISION:**
1. **BASE FRAMEWORK**: Start with 1-2 primary ingredients from user preferences
2. **MACRO BALANCING**: Add complementary ingredients to reach exact targets
3. **MICRONUTRIENT ACCURACY**: Account for vitamins, minerals, and their caloric contributions
4. **PORTION PRECISION**: Calculate exact grams/ml for each ingredient
5. **VERIFICATION**: Double-check that all ingredients sum to exact macro targets

**NUTRITIONAL NOTES:**
- Remember that vitamins and minerals themselves contain calories (e.g., vitamin C in fruits, B-vitamins in grains)
- Account for cooking methods that may alter nutritional content
- Consider bioavailability and nutrient absorption factors

**RESPONSE FORMAT:**
Return ONLY a JSON object with this exact structure:

{
  "suggestions": [
    {
      "mealTitle": "Creative, appetizing meal name",
      "description": "Engaging description highlighting flavors, textures, and user preference alignment",
      "cuisineStyle": "Primary cuisine from user preferences",
      "mealType": "Bowl/Plate/Wrap/Salad/etc.",
      "ingredients": [
        {
          "name": "Precise ingredient name",
          "amount": "Exact quantity with decimal precision",
          "unit": "g or ml",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "macrosString": "Cal cal, Pg P, Cg C, Fg F",
          "preparationNote": "How this ingredient is prepared (optional)"
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
      "instructions": "Step-by-step cooking instructions with timing",
      "flavorProfile": "Brief description of taste and texture experience",
      "userPreferenceAlignment": "How this meal specifically caters to user preferences"
    }
  ],
  "alternativeSuggestions": [
    {
      "quickSwaps": "Simple ingredient substitutions for variety",
      "cookingVariations": "Different preparation methods for the same ingredients",
      "flavorBoosts": "Herbs, spices, or condiments to enhance taste (with minimal caloric impact)"
    }
  ]
}

**ENHANCED CALCULATION EXAMPLE:**
For {{targetCalories}} calories with {{preferredIngredients}} preference:
1. **Start with preference**: If user loves "Pizza", create a macro-accurate pizza or pizza-inspired bowl
2. **Build foundation**: Choose base that aligns with diet goal (cauliflower crust for low-carb, whole grain for energy)
3. **Layer strategically**: Add proteins, vegetables, healthy fats to hit exact macros
4. **Precision tuning**: Adjust quantities down to the gram for exact targets
5. **Flavor enhancement**: Add zero/low-calorie seasonings for maximum taste impact

**CRITICAL SUCCESS CRITERIA:**
✅ Total calories within {{targetCalories}} ±5
✅ Each macro within specified tolerance
✅ Zero inclusion of allergies or strongly disliked items
✅ Creative use of preferred ingredients and cuisines
✅ Practical, appealing meal that user will actually want to eat
✅ Accurate calculation including micronutrient caloric contributions

**MEAL VARIETY MANDATE:**
- Never suggest the same meal twice
- Vary cooking methods, textures, and flavor profiles
- Explore different meal formats (traditional plates, bowls, wraps, etc.)
- Consider different temperature combinations (hot/cold elements)

Generate 1-2 creative meal options that perfectly hit macro targets while maximizing user satisfaction and culinary enjoyment.`,
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
