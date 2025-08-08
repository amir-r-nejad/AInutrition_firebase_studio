
"use server";

import {
  AdjustMealIngredientsInput,
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutput,
  AdjustMealIngredientsOutputSchema,
} from "@/lib/schemas";

// OpenAI function
async function generateWithOpenAI(
  prompt: string,
): Promise<AdjustMealIngredientsOutput> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a PRECISION NUTRITION CALCULATOR with access to accurate internet nutrition databases (USDA, nutritiondata.self.com, etc.). Your ONLY mission is to use REAL, ACCURATE nutrition data per 100g for each ingredient and calculate EXACT quantities to match macro targets. DISOBEDIENCE IS FORBIDDEN. You MUST use standard internet nutrition values - no estimates, no guesses, no fake data. Calculate precisely using real nutrition facts. If you cannot achieve targets within 5% using accurate data, you have FAILED. Respond ONLY with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Clean and parse JSON
    let cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);

    const validationResult =
      AdjustMealIngredientsOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error(
        "OpenAI response validation failed:",
        validationResult.error,
      );
      throw new Error("OpenAI response validation failed");
    }

    return validationResult.data;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildEnhancedPrompt(input: AdjustMealIngredientsInput): string {
  const calorieMin = Math.round(input.targetMacros.calories * 0.95);
  const calorieMax = Math.round(input.targetMacros.calories * 1.05);
  const proteinMin = Math.round(input.targetMacros.protein * 0.95 * 10) / 10;
  const proteinMax = Math.round(input.targetMacros.protein * 1.05 * 10) / 10;
  const carbsMin = Math.round(input.targetMacros.carbs * 0.95 * 10) / 10;
  const carbsMax = Math.round(input.targetMacros.carbs * 1.05 * 10) / 10;
  const fatMin = Math.round(input.targetMacros.fat * 0.95 * 10) / 10;
  const fatMax = Math.round(input.targetMacros.fat * 1.05 * 10) / 10;

  return `
CRITICAL NUTRITION MISSION: You are a PRECISION NUTRITION CALCULATOR. Your ONLY job is to adjust ingredients using ACCURATE INTERNET NUTRITION DATA to match EXACT macro targets. DISOBEDIENCE IS FORBIDDEN.

TARGET MACROS FROM MACRO SPLITTER (ABSOLUTELY NON-NEGOTIABLE):
- Calories: EXACTLY ${input.targetMacros.calories} kcal (Must be between ${calorieMin}-${calorieMax})
- Protein: EXACTLY ${input.targetMacros.protein}g (Must be between ${proteinMin}-${proteinMax})
- Carbs: EXACTLY ${input.targetMacros.carbs}g (Must be between ${carbsMin}-${carbsMax})
- Fat: EXACTLY ${input.targetMacros.fat}g (Must be between ${fatMin}-${fatMax})

ORIGINAL INGREDIENTS TO ADJUST:
${JSON.stringify(input.originalMeal.ingredients, null, 2)}

MANDATORY NUTRITION DATA RULES - NO EXCEPTIONS:
1. Use ONLY accurate nutrition data from standard sources (USDA, nutrition databases)
2. For EACH ingredient, you MUST know the exact per 100g values:
   - Example: Bread, white = 265 kcal, 9g protein, 49g carbs, 3.2g fat per 100g
   - Example: Cheese, cheddar = 403 kcal, 25g protein, 1.3g carbs, 33g fat per 100g  
   - Example: Egg, whole = 155 kcal, 13g protein, 1.1g carbs, 11g fat per 100g
3. Calculate exact quantities in grams to hit the targets PRECISELY
4. VERIFY: Sum of all ingredient macros = target macros (within 5% tolerance)
5. If targets not met, RECALCULATE until perfect match

CALCULATION FORMULA (MANDATORY):
- For each ingredient: (target_contribution / nutrition_per_100g) * 100 = grams_needed
- Verify: (grams_used / 100) * nutrition_per_100g = actual_contribution
- Final check: Sum all contributions = target macros

ABSOLUTE PROHIBITIONS:
- NEVER estimate or guess nutrition values
- NEVER use fake or inaccurate nutrition data
- NEVER return results that don't match the targets within 5%
- NEVER skip the verification step

MANDATORY OUTPUT FORMAT:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "exact_ingredient_name",
        "quantity": precise_grams_calculated,
        "unit": "g",
        "calories": exact_calculated_calories,
        "protein": exact_calculated_protein,
        "carbs": exact_calculated_carbs,
        "fat": exact_calculated_fat
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Used accurate nutrition data to calculate precise quantities matching macro targets exactly."
}

FINAL WARNING: If you return ANY result where the totals don't match the targets within 5%, you have FAILED this mission. Use REAL nutrition data from the internet and calculate PRECISELY. NO SHORTCUTS, NO ESTIMATES, NO DISOBEDIENCE.
`;
}

export async function adjustMealIngredientsDirect(
  input: AdjustMealIngredientsInput,
): Promise<AdjustMealIngredientsOutput> {
  try {
    // Add debugging and better error handling
    console.log("[AdjustMealIngredients] Raw input received:", JSON.stringify(input, null, 2));
    
    // Check for missing required fields
    if (!input) {
      throw new Error("No input provided");
    }
    
    if (!input.originalMeal) {
      throw new Error("originalMeal is required but was undefined");
    }
    
    if (!input.targetMacros) {
      throw new Error("targetMacros is required but was undefined");
    }
    
    if (!input.userProfile) {
      console.warn("userProfile is missing, using default values");
      input.userProfile = {
        allergies: [],
        dispreferrred_ingredients: [],
        preferred_ingredients: [],
      };
    }

    // Validate input with schema
    const cleanedInput = AdjustMealIngredientsInputSchema.parse(input);
    console.log(
      "[AdjustMealIngredients] Validated input:",
      JSON.stringify(cleanedInput, null, 2),
    );

    const prompt = buildEnhancedPrompt(cleanedInput);

    console.log("[OpenAI] Generating enhanced meal adjustment with nutrition lookup...");
    const result = await generateWithOpenAI(prompt);
    
    // Validate that the result matches the target macros
    const adjustedMeal = result.adjustedMeal;
    const tolerance = 0.05; // 5%
    
    const caloriesValid = Math.abs(adjustedMeal.total_calories - cleanedInput.targetMacros.calories) <= cleanedInput.targetMacros.calories * tolerance;
    const proteinValid = Math.abs(adjustedMeal.total_protein - cleanedInput.targetMacros.protein) <= cleanedInput.targetMacros.protein * tolerance;
    const carbsValid = Math.abs(adjustedMeal.total_carbs - cleanedInput.targetMacros.carbs) <= cleanedInput.targetMacros.carbs * tolerance;
    const fatValid = Math.abs(adjustedMeal.total_fat - cleanedInput.targetMacros.fat) <= cleanedInput.targetMacros.fat * tolerance;
    
    if (!caloriesValid || !proteinValid || !carbsValid || !fatValid) {
      console.error("❌ AI failed to meet macro targets:", {
        target: cleanedInput.targetMacros,
        actual: {
          calories: adjustedMeal.total_calories,
          protein: adjustedMeal.total_protein,
          carbs: adjustedMeal.total_carbs,
          fat: adjustedMeal.total_fat
        },
        validation: { caloriesValid, proteinValid, carbsValid, fatValid }
      });
      throw new Error(`AI failed to meet macro targets. Please try again. Target: ${cleanedInput.targetMacros.calories}kcal/${cleanedInput.targetMacros.protein}p/${cleanedInput.targetMacros.carbs}c/${cleanedInput.targetMacros.fat}f`);
    }
    
    console.log(
      "[OpenAI] ✅ Success! Macros validated. Result:",
      JSON.stringify(result, null, 2),
    );
    
    return result;
  } catch (error: any) {
    console.error("Error in adjustMealIngredientsDirect:", error);
    
    // Provide more specific error messages
    if (error.name === "ZodError") {
      const missingFields = error.issues.map((issue: any) => issue.path.join(".")).join(", ");
      throw new Error(`Missing required fields: ${missingFields}. Please ensure all meal data is properly provided.`);
    }
    
    throw error;
  }
}
