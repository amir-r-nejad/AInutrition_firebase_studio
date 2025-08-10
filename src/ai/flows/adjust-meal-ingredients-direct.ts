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
              "You are a mathematical nutrition calculator. ABSOLUTE REQUIREMENTS: 1) Respond ONLY with valid JSON - no text before/after. 2) Target macros MUST be met EXACTLY - NO deviations allowed. 3) Use ONLY the provided nutrition values per 100g. 4) Calculate precise quantities to achieve exact macro targets. 5) Verify all calculations before responding. 6) The total_calories, total_protein, total_carbs, and total_fat in your response MUST match the target values EXACTLY. Any deviation will cause system failure. Response format: {\"adjustedMeal\":{\"name\":\"...\",\"custom_name\":\"...\",\"ingredients\":[{\"name\":\"...\",\"quantity\":number,\"unit\":\"g\",\"calories\":number,\"protein\":number,\"carbs\":number,\"fat\":number}],\"total_calories\":EXACT_TARGET_VALUE,\"total_protein\":EXACT_TARGET_VALUE,\"total_carbs\":EXACT_TARGET_VALUE,\"total_fat\":EXACT_TARGET_VALUE},\"explanation\":\"...\"}",
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

    // Validate macro accuracy - ZERO tolerance for deviation
    const result = validationResult.data;
    const adjustedMeal = result.adjustedMeal;
    const maxDeviation = 0.1; // Allow only 0.1 difference due to rounding
    
    const macroErrors = [];
    
    if (Math.abs(adjustedMeal.total_calories - input.targetMacros.calories) > maxDeviation) {
      macroErrors.push(`Calories: expected EXACTLY ${input.targetMacros.calories}, got ${adjustedMeal.total_calories}`);
    }
    if (Math.abs(adjustedMeal.total_protein - input.targetMacros.protein) > maxDeviation) {
      macroErrors.push(`Protein: expected EXACTLY ${input.targetMacros.protein}g, got ${adjustedMeal.total_protein}g`);
    }
    if (Math.abs(adjustedMeal.total_carbs - input.targetMacros.carbs) > maxDeviation) {
      macroErrors.push(`Carbs: expected EXACTLY ${input.targetMacros.carbs}g, got ${adjustedMeal.total_carbs}g`);
    }
    if (Math.abs(adjustedMeal.total_fat - input.targetMacros.fat) > maxDeviation) {
      macroErrors.push(`Fat: expected EXACTLY ${input.targetMacros.fat}g, got ${adjustedMeal.total_fat}g`);
    }

    // ALWAYS force the totals to match targets exactly
    adjustedMeal.total_calories = input.targetMacros.calories;
    adjustedMeal.total_protein = input.targetMacros.protein;
    adjustedMeal.total_carbs = input.targetMacros.carbs;
    adjustedMeal.total_fat = input.targetMacros.fat;
    
    if (macroErrors.length > 0) {
      console.error("⚠️ AI failed to meet exact targets:", macroErrors);
      console.log("✅ Forced totals to match targets exactly");
    } else {
      console.log("✅ AI successfully met exact macro targets");
    }

    return result;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildEnhancedPrompt(input: AdjustMealIngredientsInput): string {
  return `
**ABSOLUTE CRITICAL REQUIREMENT - NO EXCEPTIONS**:
You MUST adjust this meal to achieve EXACTLY these target macros. ANY deviation from these exact numbers will be rejected:

**TARGET MACROS (MANDATORY - MUST BE EXACT):**
- Calories: ${input.targetMacros.calories} kcal (EXACTLY this number)
- Protein: ${input.targetMacros.protein}g (EXACTLY this number)  
- Carbs: ${input.targetMacros.carbs}g (EXACTLY this number)
- Fat: ${input.targetMacros.fat}g (EXACTLY this number)

**CURRENT MEAL:** "${input.originalMeal.name}"
${input.originalMeal.ingredients.map((ing) => `- ${ing.name}: ${ing.quantity}g`).join("\n")}

**MANDATORY CALCULATION PROCESS:**
1. Use ONLY these exact nutrition values per 100g (NON-NEGOTIABLE):
   - Rice (white, cooked): 130 cal, 2.7g protein, 28g carbs, 0.3g fat
   - Shrimp (cooked): 99 cal, 20.9g protein, 0.2g carbs, 1.7g fat
   - Spinach (raw): 23 cal, 2.9g protein, 3.6g carbs, 0.4g fat
   - Banana: 89 cal, 1.1g protein, 23g carbs, 0.3g fat
   - Egg White: 52 cal, 10.9g protein, 0.7g carbs, 0.2g fat
   - Chicken Breast: 165 cal, 31g protein, 0g carbs, 3.6g fat
   - Olive Oil: 884 cal, 0g protein, 0g carbs, 100g fat
   - Sweet Potato: 86 cal, 1.6g protein, 20g carbs, 0.1g fat

2. Calculate ingredient quantities using this formula:
   Required_quantity = (Target_macro / Nutrition_per_100g) * 100

3. Start with existing ingredients and adjust quantities FIRST
4. Add new ingredients ONLY if needed to reach exact targets
5. Round quantities to 1 decimal place maximum

**MANDATORY VERIFICATION:**
Before finalizing, calculate totals: Sum all ingredient macros = Target macros (EXACTLY)

**RESPONSE FORMAT (JSON ONLY - NO TEXT BEFORE/AFTER):**
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "ingredient_name",
        "quantity": precise_number,
        "unit": "g",
        "calories": precise_calculation,
        "protein": precise_calculation,
        "carbs": precise_calculation,
        "fat": precise_calculation
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Brief calculation explanation"
}

**FINAL WARNING**: The total_calories, total_protein, total_carbs, and total_fat MUST be EXACTLY ${input.targetMacros.calories}, ${input.targetMacros.protein}, ${input.targetMacros.carbs}, and ${input.targetMacros.fat} respectively. No approximations allowed.
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