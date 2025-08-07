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
You are a certified nutrition expert and AI assistant. Your task is to adjust the meal ingredients to match the target macronutrients within a 5% error margin using the following strict rules:

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
3. Only adjust quantities in grams (or convert to grams if other units are provided).
4. Search for each ingredient's nutritional data (calories, protein, carbs, fat per gram) using trusted online sources (e.g., USDA FoodData Central, FatSecret, MyFitnessPal).
5. Calculate precise per-gram nutritional values for each ingredient:
   - Calories (kcal per gram)
   - Protein (grams per gram)
   - Carbs (grams per gram)
   - Fat (grams per gram)
6. Adjust ingredient quantities to match the target macronutrients within a 5% error margin:
   - Total calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05}
   - Total protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
   - Total carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
   - Total fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g
7. Use linear optimization or iterative adjustments to ensure the total macronutrients of the adjusted meal match the target values.
8. Respect user's dietary preferences and restrictions (e.g., allergies, preferred diet).
9. If exact nutritional data for an ingredient is unavailable, use the closest equivalent (e.g., use "chicken breast" for "chicken" if specific data is missing) and note the substitution in the explanation.
10. Ensure all adjusted quantities are positive and realistic (e.g., no negative or zero quantities).

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
  "explanation": "Ingredient nutrition facts were sourced from reputable online databases (e.g., USDA, FatSecret). Quantities were adjusted using per-gram nutritional data to match target macronutrients within a 5% error margin while preserving original ingredient structure and respecting user dietary constraints. Substitutions (if any) are noted."
}

Ensure the adjusted meal's total macronutrients are within the 5% error margin of the target values. Verify calculations to avoid errors.
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
        if (
          meal.total_calories <= 0 ||
          meal.total_protein <= 0 ||
          meal.total_carbs <= 0 ||
          meal.total_fat <= 0
        ) {
          console.warn("AI generated invalid macro values, regenerating...");

          const retryPrompt = `${prompt}

IMPORTANT: The previous attempt resulted in zero or negative macro values. Please ensure:
- total_calories is at least 50
- total_protein is at least 5g
- total_carbs is at least 5g
- total_fat is at least 2g
- All macro values must be within 5% of the target values:
  - Calories: ${input.targetMacros.calories} ± ${input.targetMacros.calories * 0.05}
  - Protein: ${input.targetMacros.protein} ± ${input.targetMacros.protein * 0.05}g
  - Carbs: ${input.targetMacros.carbs} ± ${input.targetMacros.carbs * 0.05}g
  - Fat: ${input.targetMacros.fat} ± ${input.targetMacros.fat * 0.05}g

All macro values must be positive numbers greater than zero.`;

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
            retryMeal.total_fat <= 0
          ) {
            throw new Error(
              "AI continues to generate invalid macro values. Please try again.",
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