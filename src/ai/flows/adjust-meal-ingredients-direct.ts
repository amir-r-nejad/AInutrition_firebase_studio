"use server";

import { generateStructuredContent } from "@/ai/gemini-direct";
import {
  AdjustMealIngredientsInput,
  AdjustMealIngredientsInputSchema,
  AdjustMealIngredientsOutput,
  AdjustMealIngredientsOutputSchema,
} from "@/lib/schemas";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY!);

// OpenAI fallback function
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
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert. Always respond with valid JSON only, no additional text or formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    const parsed = JSON.parse(content);

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

function cleanInput(input: any): any {
  const allowedKeys = ["userProfile", "originalMeal", "targetMacros"];
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
You are a certified nutrition expert and AI assistant. Your task is to adjust the meal ingredients to match the target macronutrients within a 5% error margin. Follow these steps carefully:

USER PROFILE:
- Age: ${input.userProfile.age}
- Diet Goal: ${input.userProfile.primary_diet_goal}
- Preferred Diet: ${input.userProfile.preferred_diet || "None specified"}
- Allergies: ${input.userProfile.allergies?.join(", ") || "None"}
- Disliked Ingredients: ${input.userProfile.dispreferrred_ingredients?.join(", ") || "None"}
- Preferred Ingredients: ${input.userProfile.preferred_ingredients?.join(", ") || "None"}

RULES FOR ADJUSTMENT:
1. **Preserve Meal Structure**: Keep the original meal's ingredients and structure. Only adjust quantities.
2. **No Ingredient Changes**: Do not add or remove ingredients unless required by allergies.
3. **Use Grams**: Convert all quantities to grams for calculations.
4. **Nutritional Data**:
   - For each ingredient, use accurate nutritional data (calories, protein, carbs, fat per gram) based on reliable sources (e.g., USDA FoodData Central, FatSecret, MyFitnessPal).
   - If exact data is unavailable, use the closest equivalent (e.g., "brown rice" for "rice") and note it in the explanation.
5. **Calculate Per-Gram Values**:
   - For each ingredient, compute:
     - Calories (kcal per gram)
     - Protein (grams per gram)
     - Carbs (grams per gram)
     - Fat (grams per gram)
6. **Adjust Quantities**:
   - Adjust ingredient quantities to match the target macronutrients within a 5% error margin:
     - Calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05} kcal
     - Protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
     - Carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
     - Fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g
   - Use iterative adjustments to ensure totals match the targets.
7. **Validate Totals**:
   - Ensure total macronutrients satisfy:
     - ${input.targetMacros.calories * 0.95} ≤ total_calories ≤ ${input.targetMacros.calories * 1.05}
     - ${input.targetMacros.protein * 0.95} ≤ total_protein ≤ ${input.targetMacros.protein * 1.05}
     - ${input.targetMacros.carbs * 0.95} ≤ total_carbs ≤ ${input.targetMacros.carbs * 1.05}
     - ${input.targetMacros.fat * 0.95} ≤ total_fat ≤ ${input.targetMacros.fat * 1.05}
8. **Respect Constraints**: Adhere to user’s dietary preferences, allergies, and restrictions.
9. **Ensure Positive Values**: All quantities and macronutrients must be positive (e.g., no zero or negative values).
10. **Round Values**: Round quantities and macronutrients to two decimal places for clarity.

CURRENT MEAL (adjust quantities in grams only):
${JSON.stringify(input.originalMeal, null, 2)}

TARGET MACRONUTRIENTS (must match within 5%):
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

RESPONSE FORMAT:
Return valid JSON with this exact structure:

{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "[ORIGINAL_NAME]",
        "quantity": [ADJUSTED_VALUE_IN_GRAMS],
        "unit": "grams",
        "calories": [ADJUSTED_CALORIES],
        "protein": [ADJUSTED_PROTEIN],
        "carbs": [ADJUSTED_CARBS],
        "fat": [ADJUSTED_FAT]
      }
    ],
    "total_calories": [ADJUSTED_TOTAL_CALORIES],
    "total_protein": [ADJUSTED_TOTAL_PROTEIN],
    "total_carbs": [ADJUSTED_TOTAL_CARBS],
    "total_fat": [ADJUSTED_TOTAL_FAT]
  },
  "explanation": "Nutritional data was sourced from reliable databases. Quantities were adjusted to match target macronutrients within a 5% error margin, preserving meal structure and respecting dietary constraints. Substitutions (if any): [LIST SUBSTITUTIONS]."
}

Ensure the response is valid JSON, all calculations are accurate, and totals are within the 5% error margin. If data is unavailable, use the closest equivalent and note it in the explanation.
`;
}

export async function adjustMealIngredientsDirect(
  input: AdjustMealIngredientsInput,
): Promise<AdjustMealIngredientsOutput> {
  try {
    const cleanedInput = AdjustMealIngredientsInputSchema.parse(
      cleanInput(input),
    );
    console.log(
      "[AdjustMealIngredients] Input:",
      JSON.stringify(cleanedInput, null, 2),
    );

    const prompt = buildPrompt(cleanedInput);

    try {
      console.log("[Gemini Direct] Attempting to generate meal adjustment...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleanedText);

        if (!parsed.adjustedMeal || !parsed.explanation) {
          throw new Error("AI response missing required fields");
        }

        const meal = parsed.adjustedMeal;
        const isWithinMargin = (
          value: number,
          target: number,
          margin: number = 0.05
        ) => value >= target * (1 - margin) && value <= target * (1 + margin);

        // Validate macro totals and ensure positive values
        if (
          meal.total_calories <= 0 ||
          meal.total_protein <= 0 ||
          meal.total_carbs <= 0 ||
          meal.total_fat <= 0 ||
          !isWithinMargin(meal.total_calories, input.targetMacros.calories) ||
          !isWithinMargin(meal.total_protein, input.targetMacros.protein) ||
          !isWithinMargin(meal.total_carbs, input.targetMacros.carbs) ||
          !isWithinMargin(meal.total_fat, input.targetMacros.fat)
        ) {
          console.warn(
            "AI generated invalid macro values or values outside 5% margin:",
            {
              total_calories: meal.total_calories,
              total_protein: meal.total_protein,
              total_carbs: meal.total_carbs,
              total_fat: meal.total_fat,
            }
          );

          const retryPrompt = `${prompt}

IMPORTANT: The previous attempt failed due to invalid macro values or values outside the 5% error margin. Please:
- Ensure totals are within:
  - Calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05} kcal
  - Protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
  - Carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
  - Fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g
- Minimum values: total_calories ≥ 50, total_protein ≥ 5g, total_carbs ≥ 5g, total_fat ≥ 2g
- Use reliable nutritional data for each ingredient.
- Verify that individual ingredient macronutrients sum to the total values.

Recalculate and ensure all values are positive and within the 5% margin.`;

          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();

          let retryCleanedText = retryText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          const retryParsed = JSON.parse(retryCleanedText);

          const retryMeal = retryParsed.adjustedMeal;
          if (
            retryMeal.total_calories <= 0 ||
            retryMeal.total_protein <= 0 ||
            retryMeal.total_carbs <= 0 ||
            retryMeal.total_fat <= 0 ||
            !isWithinMargin(retryMeal.total_calories, input.targetMacros.calories) ||
            !isWithinMargin(retryMeal.total_protein, input.targetMacros.protein) ||
            !isWithinMargin(retryMeal.total_carbs, input.targetMacros.carbs) ||
            !isWithinMargin(retryMeal.total_fat, input.targetMacros.fat)
          ) {
            console.error(
              "Retry failed with invalid macro values or values outside 5% margin:",
              {
                total_calories: retryMeal.total_calories,
                total_protein: retryMeal.total_protein,
                total_carbs: retryMeal.total_carbs,
                total_fat: retryMeal.total_fat,
              }
            );
            throw new Error(
              "AI continues to generate invalid macro values or values outside 5% margin. Please check input data or try again.",
            );
          }

          return retryParsed as AdjustMealIngredientsOutput;
        }

        // Additional validation to ensure ingredient macros sum to totals
        const ingredientSums = meal.ingredients.reduce(
          (sums: { calories: number; protein: number; carbs: number; fat: number }, ingredient: any) => ({
            calories: sums.calories + (ingredient.calories || 0),
            protein: sums.protein + (ingredient.protein || 0),
            carbs: sums.carbs + (ingredient.carbs || 0),
            fat: sums.fat + (ingredient.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        if (
          Math.abs(ingredientSums.calories - meal.total_calories) > 0.01 ||
          Math.abs(ingredientSums.protein - meal.total_protein) > 0.01 ||
          Math.abs(ingredientSums.carbs - meal.total_carbs) > 0.01 ||
          Math.abs(ingredientSums.fat - meal.total_fat) > 0.01
        ) {
          console.error(
            "Ingredient macronutrient sums do not match totals:",
            { ingredientSums, totals: meal }
          );
          throw new Error("Ingredient macronutrient sums do not match reported totals.");
        }

        return parsed as AdjustMealIngredientsOutput;
      } catch (jsonError: any) {
        console.error(
          "[Gemini Direct] JSON parsing or validation failed:",
          jsonError.message,
          { receivedText: cleanedText }
        );
        throw new Error(
          `Failed to parse or validate AI response: ${jsonError.message}`,
        );
      }
    } catch (geminiError: any) {
      console.error("[Gemini Direct] Failed:", geminiError.message);

      if (
        geminiError.message?.includes("403") ||
        geminiError.message?.includes("Forbidden") ||
        geminiError.message?.includes("API access forbidden")
      ) {
        console.log(
          "[OpenAI Fallback] Gemini API access forbidden, trying OpenAI...",
        );

        try {
          const openaiResult = await generateWithOpenAI(prompt);
          console.log(
            "[OpenAI Fallback] Success! AI Response:",
            JSON.stringify(openaiResult, null, 2),
          );
          return openaiResult;
        } catch (openaiError: any) {
          console.error("[OpenAI Fallback] Failed:", openaiError.message);
          throw new Error(
            `Both Gemini and OpenAI APIs failed: ${openaiError.message}`,
          );
        }
      } else {
        throw new Error(`Gemini API error: ${geminiError.message}`);
      }
    }
  } catch (error: any) {
    console.error("Error in adjustMealIngredientsDirect:", error);
    throw error;
  }
}