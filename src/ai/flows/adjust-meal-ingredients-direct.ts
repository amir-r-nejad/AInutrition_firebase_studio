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
              "You are a PRECISION NUTRITION CALCULATOR. CRITICAL: You MUST ADD new ingredients when existing ones cannot meet macro ratios. For example: if current meal is 60% fat calories but target is 20% fat calories, you CANNOT just reduce quantities - you MUST add high-carb/high-protein ingredients like fruits, vegetables, lean proteins. Use real USDA nutrition data. Calculate precisely to meet ALL targets within 10% tolerance. Respond ONLY with valid JSON.",
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

CURRENT INGREDIENTS:
${input.originalMeal.ingredients.map((ing) => `- ${ing.name}: ${ing.quantity}g`).join("\n")}

CRITICAL ANALYSIS REQUIRED:
1. Calculate current macro percentages: (protein_cal/total_cal, carb_cal/total_cal, fat_cal/total_cal)
2. Calculate target macro percentages from target macros
3. If percentages differ significantly (>5%), you MUST add ingredients to fix ratios

MANDATORY INGREDIENT ADDITIONS:
- If target protein % > current protein %: ADD chicken breast, egg whites, protein powder, greek yogurt, tofu
- If target carb % > current carb %: ADD oats, rice, banana, apple, sweet potato, pasta
- If target fat % < current fat %: ADD low-fat high-carb/protein ingredients

CURRENT MEAL ANALYSIS EXAMPLE:
Cheese (33.1g fat) + Bread (3.2g fat) = 36.3g total fat from 36.3g*9 = 327 fat calories
Target: 14.2g fat = 128 fat calories
SOLUTION: ADD high-carb ingredients like banana (0.3g fat/100g) to dilute fat percentage

INSTRUCTIONS:
1. NEVER just reduce quantities if macro ratios are wrong
2. ALWAYS add balancing ingredients when needed
3. Use USDA nutrition data
4. Meet ALL targets within 10%

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
    const tolerance = 0.1; // 10% - more reasonable tolerance

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
        `AI failed to meet macro targets within 10% tolerance. Please try again. Target: ${cleanedInput.targetMacros.calories}kcal/${cleanedInput.targetMacros.protein}p/${cleanedInput.targetMacros.carbs}c/${cleanedInput.targetMacros.fat}f`,
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
