
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
              "You are a nutrition expert with access to comprehensive nutrition databases. Always respond with valid JSON only, no additional text or formatting. You can look up accurate nutrition information for any food item.",
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
  const currentMacros = {
    calories: input.originalMeal.ingredients.reduce((sum, ing) => sum + (Number(ing.calories) || 0), 0),
    protein: input.originalMeal.ingredients.reduce((sum, ing) => sum + (Number(ing.protein) || 0), 0),
    carbs: input.originalMeal.ingredients.reduce((sum, ing) => sum + (Number(ing.carbs) || 0), 0),
    fat: input.originalMeal.ingredients.reduce((sum, ing) => sum + (Number(ing.fat) || 0), 0),
  };

  return `
I need to adjust this meal to hit EXACT macro targets from the macro splitter. You have access to comprehensive nutrition databases.

CURRENT MEAL WITH ACCURATE NUTRITION DATA:
${JSON.stringify(input.originalMeal, null, 2)}

CURRENT TOTALS:
- Calories: ${currentMacros.calories} kcal
- Protein: ${currentMacros.protein}g
- Carbs: ${currentMacros.carbs}g
- Fat: ${currentMacros.fat}g

TARGET MACROS (FROM MACRO SPLITTER - MUST MATCH EXACTLY):
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g
- Carbs: ${input.targetMacros.carbs}g  
- Fat: ${input.targetMacros.fat}g

DIFFERENCE TO BRIDGE:
- Calories: ${input.targetMacros.calories - currentMacros.calories > 0 ? '+' : ''}${input.targetMacros.calories - currentMacros.calories} kcal
- Protein: ${input.targetMacros.protein - currentMacros.protein > 0 ? '+' : ''}${input.targetMacros.protein - currentMacros.protein}g
- Carbs: ${input.targetMacros.carbs - currentMacros.carbs > 0 ? '+' : ''}${input.targetMacros.carbs - currentMacros.carbs}g
- Fat: ${input.targetMacros.fat - currentMacros.fat > 0 ? '+' : ''}${input.targetMacros.fat - currentMacros.fat}g

CRITICAL INSTRUCTIONS (PRIORITY ORDER):
1. **Look up accurate nutrition data**: Use precise USDA/nutrition database values for each ingredient per 100g
2. **Try quantity adjustments FIRST**: Adjust ONLY existing ingredient quantities to hit targets within ±5% 
3. **ONLY add ingredients if needed**: Add new ingredients ONLY if quantity adjustments alone cannot achieve ±5% accuracy
4. **Final validation**: Ensure ALL macros are within ±5% of targets (±${Math.round(input.targetMacros.calories * 0.05)} cal, ±${Math.round(input.targetMacros.protein * 0.05)}g protein, ±${Math.round(input.targetMacros.carbs * 0.05)}g carbs, ±${Math.round(input.targetMacros.fat * 0.05)}g fat)

STEP-BY-STEP PROCESS:
1. Look up accurate nutrition per 100g for: bread white, cheese, egg whole
2. Calculate what quantities of existing ingredients would hit targets
3. Check if this gives realistic portions (20-300g typically)
4. If targets can be reached with realistic quantities of existing ingredients, DO NOT ADD anything
5. If impossible with existing ingredients, add minimal complementary ingredients

USER PREFERENCES:
${input.userProfile.allergies?.length ? `Allergies: ${input.userProfile.allergies.join(", ")}` : "No allergies"}
${input.userProfile.dispreferrred_ingredients?.length ? `Avoid: ${input.userProfile.dispreferrred_ingredients.join(", ")}` : "No restrictions"}

Return JSON format:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "exact ingredient name",
        "quantity": precise_number_in_grams,
        "unit": "g",
        "calories": precise_calories_for_this_quantity,
        "protein": precise_protein_for_this_quantity,
        "carbs": precise_carbs_for_this_quantity,
        "fat": precise_fat_for_this_quantity
      }
    ],
    "total_calories": ${input.targetMacros.calories},
    "total_protein": ${input.targetMacros.protein},
    "total_carbs": ${input.targetMacros.carbs},
    "total_fat": ${input.targetMacros.fat}
  },
  "explanation": "Detailed explanation of: 1) nutrition values used per 100g, 2) quantity calculations performed, 3) whether targets were achieved by adjusting existing ingredients only or if additions were necessary, 4) final macro accuracy verification"
}

CRITICAL: The total macros MUST exactly match the target values within ±5%. Verify your calculations before responding.
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
    
    console.log(
      "[OpenAI] Success! Result:",
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
