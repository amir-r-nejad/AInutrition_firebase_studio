
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
              "You are a precision nutrition calculator. Your ONLY job is to adjust meal ingredients to match EXACT macro targets from a macro splitter system. You MUST achieve the exact calories, protein, carbs, and fat specified. Use accurate nutrition data per 100g and calculate precise quantities. Failure to match targets within 5% is unacceptable. Respond ONLY with valid JSON, no additional text.",
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
CRITICAL MISSION: Adjust meal ingredients to EXACTLY match these macro targets from the macro splitter. NO EXCEPTIONS.

TARGET MACROS FROM MACRO SPLITTER (NON-NEGOTIABLE):
- Calories: EXACTLY ${input.targetMacros.calories} kcal (Range: ${calorieMin}-${calorieMax})
- Protein: EXACTLY ${input.targetMacros.protein}g (Range: ${proteinMin}-${proteinMax})
- Carbs: EXACTLY ${input.targetMacros.carbs}g (Range: ${carbsMin}-${carbsMax})
- Fat: EXACTLY ${input.targetMacros.fat}g (Range: ${fatMin}-${fatMax})

ORIGINAL MEAL TO ADJUST:
${JSON.stringify(input.originalMeal.ingredients, null, 2)}

MANDATORY PROCESS:
1. For each ingredient, get EXACT nutrition per 100g from nutrition database
2. Calculate precise quantities (in grams) to hit the EXACT macro targets
3. Verify calculations: sum all ingredient macros must equal target macros
4. If ANY macro is outside the range, RECALCULATE until ALL are within range

ABSOLUTE REQUIREMENTS:
- The final total_calories MUST be ${input.targetMacros.calories}
- The final total_protein MUST be ${input.targetMacros.protein}
- The final total_carbs MUST be ${input.targetMacros.carbs}
- The final total_fat MUST be ${input.targetMacros.fat}
- Sum of all ingredient calories MUST equal total_calories
- Sum of all ingredient protein MUST equal total_protein
- Sum of all ingredient carbs MUST equal total_carbs
- Sum of all ingredient fat MUST equal total_fat

RETURN EXACTLY THIS JSON FORMAT:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "ingredient_name",
        "quantity": precise_number_in_grams,
        "unit": "g",
        "calories": exact_calories_for_this_portion,
        "protein": exact_protein_for_this_portion,
        "carbs": exact_carbs_for_this_portion,
        "fat": exact_fat_for_this_portion
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Adjusted quantities to match macro splitter targets exactly."
}

FAILURE IS NOT ACCEPTABLE. The macro splitter has calculated these exact values and you MUST achieve them.
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
