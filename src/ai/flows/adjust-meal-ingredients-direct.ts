
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
🚨 EMERGENCY NUTRITION CALCULATOR MODE 🚨
YOU ARE NOW A PRECISION NUTRITION DATABASE WITH ACCESS TO REAL INTERNET DATA.

NON-NEGOTIABLE TARGETS (MACRO SPLITTER DEMANDS EXACTNESS):
Calories: ${input.targetMacros.calories} kcal (RANGE: ${calorieMin}-${calorieMax})
Protein: ${input.targetMacros.protein}g (RANGE: ${proteinMin}-${proteinMax})
Carbs: ${input.targetMacros.carbs}g (RANGE: ${carbsMin}-${carbsMax})
Fat: ${input.targetMacros.fat}g (RANGE: ${fatMin}-${fatMax})

CURRENT INGREDIENTS TO ADJUST:
${input.originalMeal.ingredients.map(ing => `- ${ing.name}: ${ing.quantity}g`).join('\n')}

⚠️ MANDATORY INTERNET NUTRITION LOOKUP PROCESS:
Step 1: For EACH ingredient, use REAL nutrition data per 100g:
• White bread: 265 kcal, 9g protein, 49g carbs, 3.2g fat per 100g (USDA)
• Whole eggs: 155 kcal, 13g protein, 1.1g carbs, 11g fat per 100g (USDA)
• Cheddar cheese: 403 kcal, 25g protein, 1.3g carbs, 33g fat per 100g (USDA)
• Chicken breast: 165 kcal, 31g protein, 0g carbs, 3.6g fat per 100g (USDA)
• Rice, white: 130 kcal, 2.7g protein, 28g carbs, 0.3g fat per 100g (USDA)

Step 2: Calculate EXACT grams needed using MATHEMATICS:
Formula: needed_grams = (target_macro_contribution × 100) ÷ nutrition_per_100g

Step 3: VERIFY calculation by summing all contributions
Step 4: If ANY macro is outside range, RECALCULATE completely

🔴 ABSOLUTE REQUIREMENTS - NO EXCEPTIONS:
✓ Use ONLY verified nutrition data from internet databases
✓ Calculate to decimal precision (e.g., 127.3g, not 127g)
✓ Sum must equal targets within 5% tolerance
✓ NO guessing, NO rounding errors, NO fake data
✓ If you can't meet targets exactly, FAIL and say so

REQUIRED JSON OUTPUT:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "ingredient_name_from_database",
        "quantity": calculated_precise_grams,
        "unit": "g",
        "calories": precise_calculated_calories,
        "protein": precise_calculated_protein,
        "carbs": precise_calculated_carbs,
        "fat": precise_calculated_fat
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Used verified internet nutrition database values and precise mathematical calculations to match macro targets exactly."
}

🚨 FINAL CHECK: Before responding, verify totals match targets. If ANY macro is off by more than 5%, you MUST recalculate or declare failure.
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
