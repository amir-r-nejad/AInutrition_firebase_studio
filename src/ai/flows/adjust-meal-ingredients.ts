'use server';

import { ai, geminiModel } from '@/ai/genkit';
import {
  AdjustMealIngredientsInput,
  AdjustMealIngredientsOutput,
} from '@/features/meal-plan/types';

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
  prompt: `You are a **precision meal optimization specialist** who transforms existing meals to meet exact nutritional targets while preserving the meal's identity and maximizing user satisfaction.

**MEAL OPTIMIZATION TASK:**

**ORIGINAL MEAL DATA:**
- Meal Name: {{{originalMeal.name}}}
- Meal Concept: {{{originalMeal.customName}}}
- Current Ingredients: {{{originalMeal.ingredients}}}
- Current Totals: {{{originalMeal.totalCalories}}} cal, {{{originalMeal.totalProtein}}}g protein, {{{originalMeal.totalCarbs}}}g carbs, {{{originalMeal.totalFat}}}g fat

**PRECISE TARGET REQUIREMENTS (ABSOLUTE PRIORITY):**
🎯 **EXACT MACRO TARGETS - NON-NEGOTIABLE:**
- Calories: {{{targetMacros.calories}}} (±5 calories maximum)
- Protein: {{{targetMacros.protein}}}g (±1g maximum)
- Carbs: {{{targetMacros.carbs}}}g (±2g maximum)
- Fat: {{{targetMacros.fat}}}g (±1g maximum)

**USER PROFILE CONSTRAINTS:**
- Age: {{{userProfile.age}}}, Gender: {{{userProfile.gender}}}, Activity: {{{userProfile.activityLevel}}}
- Diet Goal: {{{userProfile.dietGoal}}}
- Diet Type: {{{userProfile.preferredDiet}}}
- **STRICT EXCLUSIONS**: {{{userProfile.allergies}}} and {{{userProfile.dispreferredIngredients}}} - NEVER INCLUDE
- **PREFERRED ELEMENTS**: {{{userProfile.preferredIngredients}}} - MAINTAIN/ENHANCE

**OPTIMIZATION STRATEGY:**

**PHASE 1: MACRO GAP ANALYSIS**
Calculate exact differences:
- Calorie gap: {{{targetMacros.calories}}} - {{{originalMeal.totalCalories}}} = X calories
- Protein gap: {{{targetMacros.protein}}} - {{{originalMeal.totalProtein}}} = X grams
- Carbs gap: {{{targetMacros.carbs}}} - {{{originalMeal.totalCarbs}}} = X grams
- Fat gap: {{{targetMacros.fat}}} - {{{originalMeal.totalFat}}} = X grams

**PHASE 2: INTELLIGENT INGREDIENT OPTIMIZATION**
Use this prioritized approach:

1. **PRESERVE CORE IDENTITY**: Keep the meal's essential character and preferred ingredients
2. **SMART QUANTITY ADJUSTMENTS**: Modify existing ingredient portions for the biggest macro impact
3. **STRATEGIC SUBSTITUTIONS**: Replace ingredients only if necessary for targets or restrictions
4. **PRECISION ADDITIONS**: Add minimal new ingredients to close remaining macro gaps
5. **MICRO-ADJUSTMENTS**: Fine-tune quantities to hit exact targets

**OPTIMIZATION PRINCIPLES:**
- **CALORIE PRECISION**: Calories are the #1 priority - must be within ±5 of target
- **MEAL INTEGRITY**: Preserve the meal's name, concept, and core ingredients
- **USER SATISFACTION**: Maintain preferred ingredients and avoid dislikes
- **PRACTICAL PORTIONS**: Use realistic, measurable quantities
- **NUTRITIONAL ACCURACY**: Account for cooking methods and nutrient interactions

**ADVANCED OPTIMIZATION TECHNIQUES:**
- **INGREDIENT SYNERGY**: Choose ingredients that complement each other nutritionally
- **COOKING METHOD OPTIMIZATION**: Adjust preparation methods to alter macro profiles
- **PORTION SCALING**: Proportionally adjust multiple ingredients to maintain flavor balance
- **STRATEGIC ADDITIONS**: Add nutrient-dense ingredients to fill specific macro gaps
- **SMART SUBSTITUTIONS**: Replace similar ingredients with better macro profiles

**RESPONSE FORMAT:**
Return ONLY a JSON object with this exact structure:

{
  "adjustedMeal": {
    "name": "{{{originalMeal.name}}}",
    "customName": "Optimized {{{originalMeal.customName}}}",
    "ingredients": [
      {
        "name": "Precise ingredient name",
        "quantity": number,
        "unit": "string",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "changeType": "modified/added/substituted/unchanged",
        "optimizationNote": "Brief note on why this change was made"
      }
    ],
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number,
    "targetAccuracy": {
      "caloriesDifference": number,
      "proteinDifference": number,
      "carbsDifference": number,
      "fatDifference": number,
      "accuracyScore": "percentage of how close to targets"
    }
  },
  "optimizationSummary": {
    "primaryChanges": "Main adjustments made to hit targets",
    "macroStrategy": "How each macro gap was addressed",
    "userPreferenceAlignment": "How user preferences were maintained/enhanced",
    "practicalImpact": "How changes affect meal preparation and taste"
  },
  "alternativeOptions": [
    {
      "changeDescription": "Alternative modification approach",
      "impact": "Different way to achieve similar macro targets"
    }
  ]
}

**CALCULATION METHODOLOGY:**
1. **START WITH GAPS**: Calculate exact macro differences from current to target
2. **PRIORITIZE CALORIES**: Address calorie gap first through portion adjustments
3. **BALANCE REMAINING MACROS**: Fine-tune protein, carbs, fat in that order
4. **VERIFY RESTRICTIONS**: Ensure no allergies or dislikes are introduced
5. **OPTIMIZE PORTIONS**: Adjust quantities to the gram/ml for precision
6. **VALIDATE TOTALS**: Double-check that all ingredients sum to exact targets

**CRITICAL SUCCESS CRITERIA:**
✅ Total calories within {{{targetMacros.calories}}} ±3
✅ Each macro within specified tolerance ranges
✅ No allergies or disliked ingredients included
✅ Meal identity and preferred ingredients preserved
✅ Practical, realistic ingredient quantities
✅ Enhanced user satisfaction while meeting targets

**FAILURE CONDITIONS TO AVOID:**
❌ Exceeding calorie tolerance (±10 calories)
❌ Including any allergies or disliked ingredients
❌ Completely changing the meal's core identity
❌ Using unrealistic ingredient quantities
❌ Ignoring user's preferred ingredients

**EXAMPLE OPTIMIZATION APPROACH:**
If meal is 50 calories under target:
1. Increase calorie-dense ingredients (nuts, oils, grains) by small amounts
2. Add nutrient-dense ingredients that align with user preferences
3. Adjust cooking methods to increase caloric density
4. Fine-tune portions to hit exact calorie target
5. Verify all other macros still align with targets

Transform this meal into its optimized version that perfectly meets the user's nutritional targets while maintaining maximum satisfaction and meal identity.`,
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
    console.log('INPUT:', input);

    const { output } = await prompt(input);
    if (!output) {
      console.log('11');
      // throw new Error('AI did not return an output for meal adjustment.');
    }
    return output as AdjustMealIngredientsOutput;
  }
);
