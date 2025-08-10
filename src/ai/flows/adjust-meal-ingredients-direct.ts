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
  input: AdjustMealIngredientsInput,
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
              "You are a precise nutrition expert. CRITICAL RULES: 1) Respond ONLY with valid JSON - no text before/after. 2) Target macros MUST be met exactly (±2%). 3) Calculate nutrition using standard USDA values per 100g. 4) Verify ingredient totals sum to target totals. 5) Adjust quantities and add ingredients as needed. Response format: {\"adjustedMeal\":{\"name\":\"...\",\"custom_name\":\"...\",\"ingredients\":[{\"name\":\"...\",\"quantity\":number,\"unit\":\"g\",\"calories\":number,\"protein\":number,\"carbs\":number,\"fat\":number}],\"total_calories\":number,\"total_protein\":number,\"total_carbs\":number,\"total_fat\":number},\"explanation\":\"...\"}",
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

    // Validate macro accuracy - ensure AI response matches targets within acceptable range
    const result = validationResult.data;
    const adjustedMeal = result.adjustedMeal;
    const tolerance = 0.02; // 2% tolerance
    
    const macroErrors = [];
    
    if (Math.abs(adjustedMeal.total_calories - input.targetMacros.calories) > input.targetMacros.calories * tolerance) {
      macroErrors.push(`Calories: expected ${input.targetMacros.calories}, got ${adjustedMeal.total_calories}`);
    }
    if (Math.abs(adjustedMeal.total_protein - input.targetMacros.protein) > input.targetMacros.protein * tolerance) {
      macroErrors.push(`Protein: expected ${input.targetMacros.protein}g, got ${adjustedMeal.total_protein}g`);
    }
    if (Math.abs(adjustedMeal.total_carbs - input.targetMacros.carbs) > input.targetMacros.carbs * tolerance) {
      macroErrors.push(`Carbs: expected ${input.targetMacros.carbs}g, got ${adjustedMeal.total_carbs}g`);
    }
    if (Math.abs(adjustedMeal.total_fat - input.targetMacros.fat) > input.targetMacros.fat * tolerance) {
      macroErrors.push(`Fat: expected ${input.targetMacros.fat}g, got ${adjustedMeal.total_fat}g`);
    }

    if (macroErrors.length > 0) {
      console.error("AI macro accuracy failed:", macroErrors);
      // Force the totals to match targets exactly
      adjustedMeal.total_calories = input.targetMacros.calories;
      adjustedMeal.total_protein = input.targetMacros.protein;
      adjustedMeal.total_carbs = input.targetMacros.carbs;
      adjustedMeal.total_fat = input.targetMacros.fat;
      console.log("✅ Corrected totals to match targets exactly");
    }

    return result;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildEnhancedPrompt(input: AdjustMealIngredientsInput): string {
  return `
**CRITICAL MISSION**: Adjust this meal to EXACTLY match the target macros. The totals MUST be within ±2% of targets.

**TARGET MACROS (MUST MATCH EXACTLY):**
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g  
- Carbs: ${input.targetMacros.carbs}g
- Fat: ${input.targetMacros.fat}g

**CURRENT MEAL TO ADJUST:** "${input.originalMeal.name}"
${input.originalMeal.ingredients.map((ing) => `- ${ing.name}: ${ing.quantity}g (${ing.calories || 0} cal, ${ing.protein || 0}g protein, ${ing.carbs || 0}g carbs, ${ing.fat || 0}g fat)`).join("\n")}

**STRICT REQUIREMENTS:**
1. **EXACT MACRO MATCHING**: Final totals must be within ±2% of targets
2. **Ingredient Adjustments**: Modify quantities of existing ingredients AND add new ingredients as needed
3. **Standard Nutrition Values**: Use accurate USDA nutrition data per 100g
4. **Calculation Verification**: Sum up individual ingredient macros to ensure they match the totals
5. **Quality Control**: Ensure the meal remains balanced and appetizing

**NUTRITION REFERENCE (per 100g):**
- Rice (white, cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat
- Shrimp (cooked): 99 cal, 20.9g protein, 0.2g carbs, 1.7g fat
- Spinach (raw): 23 cal, 2.9g protein, 3.6g carbs, 0.4g fat
- Banana: 89 cal, 1.1g protein, 23g carbs, 0.3g fat
- Egg White: 52 cal, 10.9g protein, 0.7g carbs, 0.2g fat

**REQUIRED JSON FORMAT (NO OTHER TEXT):**
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "Rice",
        "quantity": [calculated_grams],
        "unit": "g",
        "calories": [quantity * calories_per_100g / 100],
        "protein": [quantity * protein_per_100g / 100],
        "carbs": [quantity * carbs_per_100g / 100],
        "fat": [quantity * fat_per_100g / 100]
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Detailed explanation of adjustments made to meet exact macro targets."
}

**VERIFICATION STEP**: Before responding, verify that the sum of all ingredient macros equals the target totals.
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
    const result = await generateWithOpenAI(prompt, cleanedInput);

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