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
You are a certified nutrition expert and AI assistant with access to real-time nutritional data. Your task is to adjust the meal ingredients to match the target macronutrients within a 5% error margin using the following strict rules:

USER PROFILE:
- Age: ${input.userProfile.age}
- Diet Goal: ${input.userProfile.primary_diet_goal}
- Preferred Diet: ${input.userProfile.preferred_diet || "None specified"}
- Allergies: ${input.userProfile.allergies?.join(", ") || "None"}
- Disliked Ingredients: ${input.userProfile.dispreferrred_ingredients?.join(", ") || "None"}
- Preferred Ingredients: ${input.userProfile.preferred_ingredients?.join(", ") || "None"}

RULES FOR ADJUSTMENT:
1. Preserve the original meal structure and ingredient types.
2. Do not add or remove ingredients unless required due to allergies.
3. Adjust quantities in grams (convert other units to grams if provided).
4. For each ingredient, retrieve precise nutritional data (calories, protein, carbs, fat per gram) from trusted online databases such as:
   - USDA FoodData Central (fdc.nal.usda.gov)
   - FatSecret (fatsecret.com)
   - MyFitnessPal (myfitnesspal.com)
   Use the most specific match for each ingredient (e.g., "grilled chicken breast" instead of generic "chicken").
5. Calculate per-gram nutritional values for each ingredient:
   - Calories (kcal per gram)
   - Protein (grams per gram)
   - Carbs (grams per gram)
   - Fat (grams per gram)
6. Adjust ingredient quantities using linear optimization or iterative calculations to ensure the total macronutrients match the target values within a 5% error margin:
   - Total calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05} kcal
   - Total protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
   - Total carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
   - Total fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g
7. Validate that the adjusted meal's total macronutrients satisfy:
   - ${input.targetMacros.calories * 0.95} ≤ total_calories ≤ ${input.targetMacros.calories * 1.05}
   - ${input.targetMacros.protein * 0.95} ≤ total_protein ≤ ${input.targetMacros.protein * 1.05}
   - ${input.targetMacros.carbs * 0.95} ≤ total_carbs ≤ ${input.targetMacros.carbs * 1.05}
   - ${input.targetMacros.fat * 0.95} ≤ total_fat ≤ ${input.targetMacros.fat * 1.05}
8. Respect user's dietary preferences and restrictions (e.g., allergies, preferred diet).
9. If exact nutritional data is unavailable, select the closest equivalent (e.g., "brown rice" for "rice") and document the substitution in the explanation.
10. Ensure all adjusted quantities are positive, realistic, and rounded to two decimal places (e.g., 100.25 grams).
11. Double-check calculations to ensure macronutrient totals align with the sum of individual ingredient contributions.

CURRENT MEAL (do NOT change structure, only adjust quantities in grams using real nutritional data):
${JSON.stringify(input.originalMeal, null, 2)}

TARGET MACRONUTRIENTS (final meal MUST match these values within 5%):
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

RESPONSE FORMAT:
Your response MUST be valid JSON with exactly this structure:

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
  "explanation": "Nutritional data for each ingredient was retrieved from trusted online databases (USDA FoodData Central, FatSecret, or MyFitnessPal). Quantities were adjusted using per-gram nutritional values to match target macronutrients within a 5% error margin. The meal structure was preserved, and user dietary constraints (allergies, preferences) were respected. Substitutions (if any) are noted below: [LIST SUBSTITUTIONS]."
}

Ensure the response is valid JSON, all calculations are accurate, and macronutrient totals are within the 5% error margin. If data retrieval fails, use the most recent and reliable nutritional data available and note any assumptions in the explanation.
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
        // Enhanced validation for 5% error margin
        const isWithinMargin = (
          value: number,
          target: number,
          margin: number = 0.05
        ) => value >= target * (1 - margin) && value <= target * (1 + margin);

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
          console.warn("AI generated invalid macro values or values outside 5% margin, regenerating...");

          const retryPrompt = `${prompt}

IMPORTANT: The previous attempt resulted in invalid macro values or values outside the 5% error margin. Please ensure:
- total_calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05} kcal
- total_protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
- total_carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
- total_fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g
- Minimum values: total_calories ≥ 50, total_protein ≥ 5g, total_carbs ≥ 5g, total_fat ≥ 2g
- Retrieve fresh nutritional data from USDA FoodData Central, FatSecret, or MyFitnessPal for accuracy.
- Verify that the sum of individual ingredient macronutrients matches the total values.

All macro values must be positive and within the 5% error margin of the target values.`;

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
            throw new Error(
              "AI continues to generate invalid macro values or values outside 5% margin. Please try again.",
            );
          }

          return retryParsed as AdjustMealIngredientsOutput;
        }

        return parsed as AdjustMealIngredientsOutput;
      } catch (jsonError: any) {
        console.error(
          "[Gemini Direct] JSON parsing or validation failed:",
          jsonError.message,
        );
        console.error("[Gemini Direct] Received text:", cleanedText);
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