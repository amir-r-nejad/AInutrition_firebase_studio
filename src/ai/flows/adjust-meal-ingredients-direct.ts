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
              "MANDATORY RULES: 1) Calculate EXACT nutrition values from USDA database 2) MUST add ingredients to balance macros 3) Fat too high = ADD spinach/cucumber (0 fat) 4) Carbs too low = ADD banana/apple 5) Protein low = ADD egg whites 6) MUST hit targets within 3% tolerance. NO NEGOTIATION.",
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
  return `
Adjust these ingredients to meet the target macros:

TARGET MACROS:
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g  
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

FIX THIS MEAL TO EXACT TARGETS:

CURRENT:
${input.originalMeal.ingredients.map((ing) => `${ing.name} ${ing.quantity}g (${ing.calories}cal, ${ing.protein}p, ${ing.carbs}c, ${ing.fat}f)`).join("\n")}

MUST REACH EXACTLY:
Calories: ${input.targetMacros.calories}
Protein: ${input.targetMacros.protein}g
Carbs: ${input.targetMacros.carbs}g  
Fat: ${input.targetMacros.fat}g

REQUIRED ACTIONS:
1. Keep existing ingredients but adjust quantities
2. ADD banana (89cal/100g, 1.1p, 23c, 0.3f) to increase carbs
3. ADD spinach (23cal/100g, 2.9p, 3.6c, 0.4f) to reduce fat ratio
4. ADD egg whites (52cal/100g, 11p, 0.7c, 0.2f) for protein

CALCULATE EXACT QUANTITIES TO HIT TARGETS.

JSON FORMAT:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "ingredient_name",
        "quantity": precise_grams,
        "unit": "g", 
        "calories": calculated_calories,
        "protein": calculated_protein,
        "carbs": calculated_carbs,
        "fat": calculated_fat
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Adjusted ingredient quantities to meet macro targets."
}
`;
}

export async function adjustMealIngredientsDirect(
  input: AdjustMealIngredientsInput,
): Promise<AdjustMealIngredientsOutput> {
  try {
    // Add debugging and better error handling
    console.log(
      "[AdjustMealIngredients] Raw input received:",
      JSON.stringify(input, null, 2),
    );
    console.log("🎯 TARGET MACROS ANALYSIS:", {
      mealName: input.originalMeal?.name,
      targetMacros: input.targetMacros,
      expectedFromMacroSplitter:
        "Should match your macro splitter calculations",
    });

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

    console.log(
      "[OpenAI] Generating enhanced meal adjustment with nutrition lookup...",
    );
    const result = await generateWithOpenAI(prompt);

    // Validate that the result matches the target macros
    const adjustedMeal = result.adjustedMeal;
    const tolerance = 0.03; // 3% - very strict tolerance

    const caloriesValid =
      Math.abs(
        adjustedMeal.total_calories - cleanedInput.targetMacros.calories,
      ) <=
      cleanedInput.targetMacros.calories * tolerance;
    const proteinValid =
      Math.abs(
        adjustedMeal.total_protein - cleanedInput.targetMacros.protein,
      ) <=
      cleanedInput.targetMacros.protein * tolerance;
    const carbsValid =
      Math.abs(adjustedMeal.total_carbs - cleanedInput.targetMacros.carbs) <=
      cleanedInput.targetMacros.carbs * tolerance;
    const fatValid =
      Math.abs(adjustedMeal.total_fat - cleanedInput.targetMacros.fat) <=
      cleanedInput.targetMacros.fat * tolerance;

    if (!caloriesValid || !proteinValid || !carbsValid || !fatValid) {
      console.error("❌ AI failed to meet macro targets:", {
        target: cleanedInput.targetMacros,
        actual: {
          calories: adjustedMeal.total_calories,
          protein: adjustedMeal.total_protein,
          carbs: adjustedMeal.total_carbs,
          fat: adjustedMeal.total_fat,
        },
        validation: { caloriesValid, proteinValid, carbsValid, fatValid },
      });
      throw new Error(
        `AI failed to meet macro targets within 3% tolerance. Please try again. Target: ${cleanedInput.targetMacros.calories}kcal/${cleanedInput.targetMacros.protein}p/${cleanedInput.targetMacros.carbs}c/${cleanedInput.targetMacros.fat}f`,
      );
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
      const missingFields = error.issues
        .map((issue: any) => issue.path.join("."))
        .join(", ");
      throw new Error(
        `Missing required fields: ${missingFields}. Please ensure all meal data is properly provided.`,
      );
    }

    throw error;
  }
}
