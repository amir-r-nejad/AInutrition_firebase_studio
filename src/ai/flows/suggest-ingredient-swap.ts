'use server';

import { ai, geminiModel } from '@/ai/genkit';

// Types
export interface SuggestIngredientSwapInput {
  mealName: string;
  ingredients: Array<{
    name: string;
    quantity: number; // grams
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
  }>;
  dietaryPreferences: string;
  dislikedIngredients: string[];
  allergies: string[];
  nutrientTargets: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}

export type SuggestIngredientSwapOutput = Array<{
  ingredientName: string;
  reason: string;
}>;

// Main entry function

export async function suggestIngredientSwap(
  input: SuggestIngredientSwapInput
): Promise<SuggestIngredientSwapOutput> {
  return suggestIngredientSwapFlow(input);
}

// AI Prompt

const prompt = ai.definePrompt({
  model: geminiModel,
  name: 'suggestIngredientSwapPrompt',
  input: { type: 'json' },
  output: { type: 'json' },
  prompt: `You are a nutritional expert specializing in ingredient optimization. Your task is to suggest practical ingredient swaps that maintain nutritional balance while improving meal variety and appeal. You MUST always provide suggestions regardless of how much preference data is available.

**INPUT DATA:**
{{{input}}}

**CORE REQUIREMENTS:**
1. **NUTRITIONAL PRESERVATION** - Maintain similar macro profiles (calories, protein, carbs, fat)
2. **SAFETY FIRST** - Never suggest ingredients that conflict with allergies
3. **PRACTICAL SWAPS** - Focus on commonly available, realistic alternatives
4. **VARIETY ENHANCEMENT** - Improve meal diversity and appeal

**ADAPTIVE APPROACH BASED ON AVAILABLE DATA:**

**TIER 1 - SAFETY RESTRICTIONS (Always enforce if provided):**
- Allergies: {{allergies}} - NEVER suggest these ingredients
- Disliked ingredients: {{dislikedIngredients}} - AVOID if specified

**TIER 2 - PREFERENCE OPTIMIZATION (Use when available):**
- Dietary preferences: {{dietaryPreferences}} - Consider if specified
- Nutrient targets: {{nutrientTargets}} - Optimize towards these goals

**TIER 3 - UNIVERSAL IMPROVEMENTS (When preferences are limited):**
- Suggest nutritionally superior alternatives
- Offer variety-enhancing swaps
- Recommend seasonal or fresher options
- Focus on taste and texture improvements

**SWAP STRATEGY EXAMPLES:**
- **Rich preference data**: Focus on dietary needs and dislikes
- **Moderate preference data**: Balance preferences with nutritional improvements
- **Minimal preference data**: Suggest universally beneficial swaps
- **No preference data**: Focus on nutritional upgrades and variety

**COMMON BENEFICIAL SWAPS (use when preferences are minimal):**
- White rice → Brown rice/quinoa (more fiber, protein)
- Regular pasta → Whole grain pasta (more nutrients)
- Butter → Olive oil (healthier fats)
- White bread → Whole grain bread (more fiber)
- Regular milk → Greek yogurt (more protein)
- Vegetable oil → Avocado oil (better fat profile)
- Sugar → Natural sweeteners (better glycemic response)

**NUTRITIONAL MATCHING PRINCIPLES:**
- **Protein swaps**: Match protein content within ±3g per 100g
- **Carb swaps**: Match carb content within ±5g per 100g
- **Fat swaps**: Match fat content within ±3g per 100g
- **Calorie swaps**: Match calories within ±20 per 100g

**RESPONSE REQUIREMENTS:**
- ALWAYS provide at least 3-5 realistic swaps
- Focus on ingredients that actually improve the meal
- Ensure suggestions are practical and available
- Provide clear, helpful reasons for each swap

**STRICT OUTPUT FORMAT:**
Respond ONLY with a pure JSON array. Each object must have exactly these two properties:

[
  {
    "ingredientName": "Specific ingredient name",
    "reason": "Clear explanation of why this swap is beneficial - mention nutritional benefits, dietary compatibility, or preference alignment"
  }
]

**EXAMPLE REASONING PATTERNS:**
- "Higher protein content and gluten-free alternative"
- "Provides more fiber and sustained energy release"
- "Lactose-free option with similar calcium content"
- "Lower glycemic index for better blood sugar control"
- "Richer in omega-3 fatty acids and antioxidants"
- "More bioavailable nutrients and better digestibility"

**CRITICAL SUCCESS CRITERIA:**
✅ ALWAYS provide swap suggestions (never fail due to lack of preferences)
✅ Maintain nutritional balance in all suggestions
✅ Respect allergies and hard restrictions when provided
✅ Focus on practical, beneficial improvements
✅ Provide clear, educational reasons for each swap
✅ Output only valid JSON array with exact field names

**FALLBACK APPROACH:**
When user data is minimal or empty, focus on:
- Nutritional upgrades (whole grains, lean proteins, healthy fats)
- Variety enhancement (different protein sources, colorful vegetables)
- Seasonal alternatives (fresh vs. frozen, seasonal produce)
- Texture improvements (crunchy additions, creamy alternatives)
- Flavor enhancements (herbs, spices, natural flavor boosters)

Generate practical ingredient swaps that improve the meal while maintaining nutritional integrity. ALWAYS succeed in providing useful suggestions.`,
});

// Genkit Flow

const suggestIngredientSwapFlow = ai.defineFlow(
  {
    name: 'suggestIngredientSwapFlow',
    inputSchema: undefined,
    outputSchema: undefined,
  },
  async (
    input: SuggestIngredientSwapInput
  ): Promise<SuggestIngredientSwapOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI did not return output.');
    }
    return output as SuggestIngredientSwapOutput;
  }
);
