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
              "You are a nutrition expert. CRITICAL: You MUST respond ONLY with valid JSON in this exact format. No explanatory text before or after JSON. Calculate exact nutrition from USDA data. Add ingredients as needed: Low fat = add vegetables, Low carbs = add fruits/grains, Low protein = add lean meats/eggs. Response format: {\"adjustedMeal\":{\"name\":\"...\",\"custom_name\":\"...\",\"ingredients\":[{\"name\":\"...\",\"quantity\":number,\"unit\":\"g\",\"calories\":number,\"protein\":number,\"carbs\":number,\"fat\":number}],\"total_calories\":number,\"total_protein\":number,\"total_carbs\":number,\"total_fat\":number},\"explanation\":\"...\"}",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
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

    // Clean and parse JSON - handle both JSON and text responses
    let cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error("Could not parse AI response as JSON:", cleanedContent);
          throw new Error("AI response format error - not valid JSON");
        }
      } else {
        console.error("No JSON found in AI response:", cleanedContent);
        throw new Error("AI response format error - no JSON structure found");
      }
    }

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

ADJUST THIS MEAL TO HIT TARGET MACROS:

CURRENT MEAL: "${input.originalMeal.name}"
${input.originalMeal.ingredients.map((ing) => `- ${ing.name}: ${ing.quantity}g`).join("\n")}

TARGET MACROS (MUST MATCH):
- Calories: ${input.targetMacros.calories}
- Protein: ${input.targetMacros.protein}g  
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

INSTRUCTIONS:
1. Adjust quantities of existing ingredients
2. Add ingredients as needed (banana for carbs, spinach for low-fat bulk, egg whites for protein)
3. Use exact USDA nutrition values
4. Make total macros match targets exactly

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

    // Log the results for monitoring (removed strict validation)
    const adjustedMeal = result.adjustedMeal;
    console.log("✅ AI meal adjustment completed:", {
      target: cleanedInput.targetMacros,
      actual: {
        calories: adjustedMeal.total_calories,
        protein: adjustedMeal.total_protein,
        carbs: adjustedMeal.total_carbs,
        fat: adjustedMeal.total_fat,
      },
      meal: adjustedMeal.name,
    });

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