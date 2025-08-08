
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
  return `
I need to adjust this meal to hit specific macro targets. You have access to comprehensive nutrition databases and can look up accurate nutrition information for any food.

CURRENT MEAL:
${JSON.stringify(input.originalMeal, null, 2)}

TARGET MACROS:
- Calories: ${input.targetMacros.calories} kcal
- Protein: ${input.targetMacros.protein}g
- Carbs: ${input.targetMacros.carbs}g  
- Fat: ${input.targetMacros.fat}g

CRITICAL INSTRUCTIONS:
1. **Look up accurate nutrition data**: For each ingredient, research and use the most accurate nutrition information from reliable databases (USDA, nutrition labels, etc.)
2. **Adjust quantities first**: Modify ONLY the quantities of existing ingredients to get as close as possible to targets
3. **Add ingredients if needed**: If adjusting quantities alone cannot reach the macro targets (within 10%), suggest adding complementary ingredients that fit the meal profile
4. **Match targets precisely**: Final macros must be within ±5% of target values
5. **Realistic portions**: Use realistic amounts (no negative or zero values)
6. **Meal coherence**: Ensure the meal remains appetizing and cohesive

USER PREFERENCES TO RESPECT:
${input.userProfile.allergies?.length ? `Allergies: ${input.userProfile.allergies.join(", ")}` : "No allergies specified"}
${input.userProfile.preferred_diet ? `Diet: ${input.userProfile.preferred_diet}` : "No specific diet"}
${input.userProfile.dispreferrred_ingredients?.length ? `Avoid: ${input.userProfile.dispreferrred_ingredients.join(", ")}` : "No ingredients to avoid"}
${input.userProfile.preferred_ingredients?.length ? `Prefer: ${input.userProfile.preferred_ingredients.join(", ")}` : "No preferred ingredients"}

PROCESS:
1. Look up accurate nutrition data for each current ingredient
2. Calculate current total macros
3. Adjust quantities of existing ingredients proportionally to get closer to targets
4. If still not within 10% of targets, suggest adding 1-3 complementary ingredients that:
   - Fit the meal's theme/cuisine
   - Help bridge the macro gap
   - Respect user preferences and restrictions
   - Are commonly paired with existing ingredients

EXAMPLE COMPLEMENTARY ADDITIONS:
- If protein is low: add Greek yogurt, eggs, lean meat, legumes, protein powder
- If carbs are low: add fruits, whole grains, vegetables
- If fat is low: add nuts, seeds, oils, avocado
- If calories are low: add calorie-dense healthy options

Return JSON format:
{
  "adjustedMeal": {
    "name": "${input.originalMeal.name}",
    "custom_name": "${input.originalMeal.custom_name || ""}",
    "ingredients": [
      {
        "name": "ingredient name with accurate amount",
        "quantity": number_in_grams,
        "unit": "grams",
        "calories": accurate_calories_per_serving,
        "protein": accurate_protein_per_serving,
        "carbs": accurate_carbs_per_serving,
        "fat": accurate_fat_per_serving
      }
    ],
    "total_calories": calculated_total_calories,
    "total_protein": calculated_total_protein,
    "total_carbs": calculated_total_carbs,
    "total_fat": calculated_total_fat
  },
  "explanation": "Detailed explanation of: 1) nutrition data sources used, 2) quantity adjustments made, 3) any ingredients added and why, 4) how macro targets were achieved"
}

Make sure the final totals exactly match the sum of individual ingredient macros and are within ±5% of the target macros.
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
