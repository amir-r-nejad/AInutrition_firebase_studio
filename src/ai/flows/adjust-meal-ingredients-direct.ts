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

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate with schema
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
You are a nutrition expert. Your task is to adjust the meal ingredients to meet the target macronutrients while strictly following these rules:

1. Always maintain the original meal structure and ingredient types
2. Only adjust quantities, do not add or remove ingredients unless necessary due to allergies
3. Preserve all original ingredient properties (name, unit, etc.)
4. Ensure the final meal meets the target macros as closely as possible

User Profile:
- Age: ${input.userProfile.age}
- Diet Goal: ${input.userProfile.primary_diet_goal}
- Preferred Diet: ${input.userProfile.preferred_diet || "None specified"}
- Allergies: ${input.userProfile.allergies?.join(", ") || "None"}
- Disliked Ingredients: ${input.userProfile.dispreferrred_ingredients?.join(", ") || "None"}
- Preferred Ingredients: ${input.userProfile.preferred_ingredients?.join(", ") || "None"}

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
    "custom_name": "${input.originalMeal.custom_name || ""}",
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
  input: AdjustMealIngredientsInput,
): Promise<AdjustMealIngredientsOutput> {
  try {
    // Sanitize input: only allow fields defined in schema
    const cleanedInput = AdjustMealIngredientsInputSchema.parse(
      cleanInput(input),
    );
    console.log(
      "[AdjustMealIngredients] Input:",
      JSON.stringify(cleanedInput, null, 2),
    );

    const prompt = buildPrompt(cleanedInput);

    // Try Gemini first
    try {
      console.log("[Gemini Direct] Attempting to generate meal adjustment...");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up the response to extract JSON
      let cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        const parsed = JSON.parse(cleanedText);

        // Validate the response structure
        if (!parsed.adjustedMeal || !parsed.explanation) {
          throw new Error("AI response missing required fields");
        }

        // Validate that macros are not zero or negative
        const meal = parsed.adjustedMeal;
        if (
          meal.total_calories <= 0 ||
          meal.total_protein <= 0 ||
          meal.total_carbs <= 0 ||
          meal.total_fat <= 0
        ) {
          console.warn("AI generated invalid macro values, regenerating...");

          // Try to regenerate with more specific instructions
          const retryPrompt = `${prompt}

IMPORTANT: The previous attempt resulted in zero or negative macro values. Please ensure:
- total_calories is at least 50
- total_protein is at least 5g
- total_carbs is at least 5g
- total_fat is at least 2g

All macro values must be positive numbers greater than zero.`;

          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();

          let retryCleanedText = retryText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          const retryParsed = JSON.parse(retryCleanedText);

          // Final validation
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

      // If Gemini fails with 403 or other API errors, try OpenAI
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
        // For other Gemini errors, throw the error
        throw new Error(`Gemini API error: ${geminiError.message}`);
      }
    }
  } catch (error: any) {
    console.error("Error in adjustMealIngredientsDirect:", error);
    throw error;
  }
}
