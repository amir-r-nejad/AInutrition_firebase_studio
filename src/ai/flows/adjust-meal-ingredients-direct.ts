'use server';

import { generateStructuredContent } from '@/ai/gemini-direct';
import {
  AdjustMealIngredientsInput,
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutput,
  AdjustMealIngredientsOutputSchema,
} from '@/lib/schemas';

// OpenAI fallback function
async function generateWithOpenAI(prompt: string): Promise<AdjustMealIngredientsOutput> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found in environment variables');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition expert. Always respond with valid JSON only, no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
    // Validate with schema
    const validationResult = AdjustMealIngredientsOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error('OpenAI response validation failed:', validationResult.error);
      throw new Error('OpenAI response validation failed');
    }

    return validationResult.data;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Fallback function برای محاسبات محلی
function createFallbackAdjustment(input: AdjustMealIngredientsInput): AdjustMealIngredientsOutput {
  const { originalMeal, targetMacros } = input;
  
  // کپی از meal اصلی
  const adjustedMeal = {
    name: originalMeal.name,
    custom_name: originalMeal.custom_name,
    ingredients: originalMeal.ingredients.map((ingredient: any) => ({ ...ingredient }))
  };

  // محاسبه نسبت‌های مورد نیاز برای رسیدن به target macros
  const currentCalories = originalMeal.ingredients.reduce((sum: number, ing: any) => 
    sum + (ing.calories || 0), 0);

  // محاسبه نسبت تغییر برای calories
  const calorieRatio = currentCalories > 0 ? targetMacros.calories / currentCalories : 1;

  // اعمال تغییرات به ingredients
  adjustedMeal.ingredients = adjustedMeal.ingredients.map((ing: any) => ({
    ...ing,
    quantity: ing.quantity ? Math.round(ing.quantity * calorieRatio * 10) / 10 : ing.quantity,
    calories: ing.calories ? Math.round(ing.calories * calorieRatio) : ing.calories,
    protein: ing.protein ? Math.round(ing.protein * calorieRatio * 10) / 10 : ing.protein,
    carbs: ing.carbs ? Math.round(ing.carbs * calorieRatio * 10) / 10 : ing.carbs,
    fat: ing.fat ? Math.round(ing.fat * calorieRatio * 10) / 10 : ing.fat,
  }));

  // محاسبه مجدد totals
  const totals = adjustedMeal.ingredients.reduce(
    (acc: any, ing: any) => ({
      total_calories: acc.total_calories + (ing.calories || 0),
      total_protein: acc.total_protein + (ing.protein || 0),
      total_carbs: acc.total_carbs + (ing.carbs || 0),
      total_fat: acc.total_fat + (ing.fat || 0),
    }),
    { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
  );

  return {
    adjustedMeal: {
      ...adjustedMeal,
      ...totals,
    },
    explanation: `Meal adjusted using local calculations due to API unavailability. Ingredients have been scaled to target ${targetMacros.calories} calories, ${targetMacros.protein}g protein, ${targetMacros.carbs}g carbs, and ${targetMacros.fat}g fat.`
  };
}

function cleanInput(input: any): any {
  const allowedKeys = ['userProfile', 'originalMeal', 'targetMacros'];
  const cleaned: any = {};
  
  for (const key of allowedKeys) {
    if (input[key] !== undefined) {
      cleaned[key] = input[key];
    }
  }
  
  return cleaned;
}

function buildPrompt(input: AdjustMealIngredientsInput): string {
  return `
You are a nutrition expert. Your task is to adjust the meal ingredients to meet the target macronutrients while strictly following these rules:

1. Always maintain the original meal structure and ingredient types
2. Only adjust quantities, do not add or remove ingredients unless necessary due to allergies
3. Preserve all original ingredient properties (name, unit, etc.)
4. Ensure the final meal meets the target macros as closely as possible

User Profile:
- Age: ${input.userProfile.age}
- Diet Goal: ${input.userProfile.primary_diet_goal}
- Preferred Diet: ${input.userProfile.preferred_diet || 'None specified'}
- Allergies: ${input.userProfile.allergies?.join(', ') || 'None'}
- Disliked Ingredients: ${input.userProfile.dispreferrred_ingredients?.join(', ') || 'None'}
- Preferred Ingredients: ${input.userProfile.preferred_ingredients?.join(', ') || 'None'}

Current Meal (DO NOT MODIFY STRUCTURE, ONLY ADJUST QUANTITIES):
${JSON.stringify(input.originalMeal, null, 2)}

Target Macronutrients (MUST MATCH THESE VALUES):
- Calories: ${input.targetMacros.calories}
- Protein: ${input.targetMacros.protein}g
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

Response MUST be valid JSON with EXACTLY this structure:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ''}",
    "ingredients": [
      {
        "name": "[ORIGINAL_NAME]",
        "quantity": [ADJUSTED_VALUE],
        "unit": "[ORIGINAL_UNIT]",
        "calories": [ADJUSTED_VALUE],
        "protein": [ADJUSTED_VALUE],
        "carbs": [ADJUSTED_VALUE],
        "fat": [ADJUSTED_VALUE]
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Adjusted quantities proportionally to meet target macros while respecting user preferences."
}
`;
}

export async function adjustMealIngredientsDirect(
  input: AdjustMealIngredientsInput
): Promise<AdjustMealIngredientsOutput> {
  try {
    // Sanitize input: only allow fields defined in schema
    const cleanedInput = AdjustMealIngredientsInputSchema.parse(cleanInput(input));
    console.log('[AdjustMealIngredients] Input:', JSON.stringify(cleanedInput, null, 2));
    
    const prompt = buildPrompt(cleanedInput);
    
    // Try Gemini first
    try {
      console.log('[Gemini Direct] Attempting to generate meal adjustment...');
      const result = await generateStructuredContent<AdjustMealIngredientsOutput>(
        prompt,
        AdjustMealIngredientsOutputSchema
      );
      
      console.log('[Gemini Direct] Success! AI Response:', JSON.stringify(result, null, 2));
      return result;
      
    } catch (geminiError: any) {
      console.error('[Gemini Direct] Failed:', geminiError.message);
      
      // If Gemini fails with 403 or other API errors, try OpenAI
      if (geminiError.message?.includes('403') || 
          geminiError.message?.includes('Forbidden') ||
          geminiError.message?.includes('API access forbidden')) {
        
        console.log('[OpenAI Fallback] Gemini API access forbidden, trying OpenAI...');
        
        try {
          const openaiResult = await generateWithOpenAI(prompt);
          console.log('[OpenAI Fallback] Success! AI Response:', JSON.stringify(openaiResult, null, 2));
          return openaiResult;
          
        } catch (openaiError: any) {
          console.error('[OpenAI Fallback] Failed:', openaiError.message);
          
          // If both APIs fail, use local fallback
          console.log('[Local Fallback] Both APIs failed, using local calculation...');
          return createFallbackAdjustment(cleanedInput);
        }
      } else {
        // For other Gemini errors, go straight to local fallback
        console.log('[Local Fallback] Gemini error (non-403), using local calculation...');
        return createFallbackAdjustment(cleanedInput);
      }
    }
    
  } catch (error: any) {
    console.error('Error in adjustMealIngredientsDirect:', error);
    
    // Parse input again for fallback
    try {
      const cleanedInput = AdjustMealIngredientsInputSchema.parse(cleanInput(input));
      return createFallbackAdjustment(cleanedInput);
    } catch (parseError) {
      console.error('Error parsing input for fallback:', parseError);
      throw new Error('Invalid input format for meal adjustment');
    }
  }
}