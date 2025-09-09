
"use server";

import {
  SuggestMealsForMacrosInputSchema,
  SuggestMealsForMacrosOutputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import { getAIApiErrorMessage } from "@/lib/utils";
import { saveMealSuggestions } from "@/lib/supabase/database/meal-suggestions-service";
import { getUserProfile } from "@/lib/supabase/data-service";

// OpenAI function for meal suggestions
async function generateWithOpenAI(
  prompt: string,
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  try {
    console.log("Sending request to OpenAI with prompt:", prompt.substring(0, 200) + "...");
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
            content: `You are a nutrition expert. Your ONLY job is to create meals where the total calories, protein, carbs, and fat EXACTLY match the target numbers provided. Calculate each ingredient's macros and adjust quantities until the totals equal the targets. Your response must be valid JSON only.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      console.error("Response status:", response.status);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`,
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

    const validationResult = SuggestMealsForMacrosOutputSchema.safeParse(parsed);
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

function buildPrompt(input: SuggestMealsForMacrosInput): string {
  console.log("Input data received:", {
    meal_name: input.meal_name,
    preferred_cuisines: input.preferred_cuisines,
    dispreferrred_cuisines: input.dispreferrred_cuisines,
    preferred_ingredients: input.preferred_ingredients,
    dispreferrred_ingredients: input.dispreferrred_ingredients,
    allergies: input.allergies,
    medical_conditions: input.medical_conditions,
    target_calories: input.target_calories,
    target_protein_grams: input.target_protein_grams,
    target_carbs_grams: input.target_carbs_grams,
    target_fat_grams: input.target_fat_grams
  });

  const allergiesText = input.allergies && input.allergies.length > 0 
    ? input.allergies.join(", ") 
    : "None";
  
  const medicalConditionsText = input.medical_conditions && input.medical_conditions.length > 0 
    ? input.medical_conditions.join(", ") 
    : "None";

  const preferredCuisinesText = input.preferred_cuisines && input.preferred_cuisines.length > 0 
    ? input.preferred_cuisines.join(", ") 
    : "None";
  
  const dispreferredCuisinesText = input.dispreferrred_cuisines && input.dispreferrred_cuisines.length > 0 
    ? input.dispreferrred_cuisines.join(", ") 
    : "None";

  const preferredIngredientsText = input.preferred_ingredients && input.preferred_ingredients.length > 0 
    ? input.preferred_ingredients.join(", ") 
    : "None";
  
  const dispreferredIngredientsText = input.dispreferrred_ingredients && input.dispreferrred_ingredients.length > 0 
    ? input.dispreferrred_ingredients.join(", ") 
    : "None";

  const prompt = `Act like an expert nutritionist, meal planner, and macro-tracking specialist. Your goal is to create a ${input.meal_name} meal that matches the specified macro targets exactly. No approximations are allowed. Totals must be mathematically exact.

TARGETS (MUST MATCH EXACTLY)
- Calories: ${input.target_calories} kcal
- Protein: ${input.target_protein_grams} g
- Carbs: ${input.target_carbs_grams} g
- Fat: ${input.target_fat_grams} g

USER PREFERENCES
- Preferred cuisines: ${preferredCuisinesText}
- Avoid cuisines: ${dispreferredCuisinesText}
- Preferred ingredients: ${preferredIngredientsText}
- Avoid ingredients: ${dispreferredIngredientsText}
- Allergies: ${allergiesText}

RAW & REALISTIC RULES
1. Prefer raw, uncooked ingredients: if an ingredient is normally consumed raw, use the format "Ingredient (raw)". Example: "carrot (raw)".  
2. For ingredients usually consumed cooked, use the closest raw form if it exists; otherwise use the regular ingredient without "(raw)". Example: "potato (raw)" or "chicken breast (raw)".  
3. Units and weights refer to the raw or natural weight of the ingredient.  
4. Allow a mix of raw and non-raw ingredients as appropriate for realistic meals.

STEP-BY-STEP PROCESS
1. Candidate selection:
   a. Select 4–8 ingredients based on preferences, avoidances, and allergens. Include a protein source, a carbohydrate source, a fat source, and vegetables/fruits as needed.
2. Data lookup:
   a. For each ingredient, fetch authoritative nutrition data per 100 g (calories, protein, carbs, fat) from USDA FoodData Central or equivalent.
3. Mathematical setup:
   a. Let w_i be grams for ingredient i. Set up equations to exactly match target calories, protein, carbs, and fat:
      - sum_i (cal_per100_i * w_i / 100) = target_calories
      - sum_i (prot_per100_i * w_i / 100) = target_protein
      - sum_i (carb_per100_i * w_i / 100) = target_carbs
      - sum_i (fat_per100_i * w_i / 100) = target_fat
   b. Solve exactly; if underdetermined, prioritize protein, then carbs/fat, keeping non-negative weights.
4. Precision:
   a. Keep fractional gram weights (up to 4 decimals or more) for exact arithmetic. Only round in final JSON to match totals exactly.
   b. CRITICAL: For each ingredient, calculate calories as: (calories_per_100g * amount_in_grams) / 100
   c. CRITICAL: For each ingredient, calculate protein as: (protein_per_100g * amount_in_grams) / 100
   d. CRITICAL: For each ingredient, calculate carbs as: (carbs_per_100g * amount_in_grams) / 100
   e. CRITICAL: For each ingredient, calculate fat as: (fat_per_100g * amount_in_grams) / 100
5. Verification:
   a. Compute each ingredient's macros and sum totals. Totals MUST match targets exactly.
   b. Double-check: Each ingredient's calories must equal (calories_per_100g * amount_in_grams) / 100
6. JSON output:
   a. Use only this format. Include per-ingredient macros and totals. All numeric fields must sum exactly to targets.

{
  "suggestions": [
    {
      "mealTitle": "meal name",
      "description": "Brief description; must state the meal uses raw ingredients where applicable.",
      "ingredients": [
        {
          "name": "Walnuts (raw)",
          "amount": 13.16,
          "unit": "g",
          "calories": 86.13,
          "protein": 2.00,
          "carbs": 1.80,
          "fat": 8.58,
          "macrosString": "86.13 cal, 2.00g protein, 1.80g carbs, 8.58g fat"
        }
      ],
      "totalCalories": ${input.target_calories},
      "totalProtein": ${input.target_protein_grams},
      "totalCarbs": ${input.target_carbs_grams},
      "totalFat": ${input.target_fat_grams},
      "instructions": "Step-by-step cooking instructions for preparing this meal"
    }
  ]
}

FINAL RULES
- JSON must be the only output. No text outside JSON.  
- Ingredient names must include "(raw)" only if appropriate.  
- Totals must equal targets exactly. Use fractional grams if needed.  
- Always provide detailed step-by-step cooking instructions in the "instructions" field.  
- If exact solution is impossible, provide the best exact rational solution with totals matching targets if mathematically achievable.
- CRITICAL: Each ingredient's calories, protein, carbs, fat must be calculated as (nutrition_per_100g * amount_in_grams) / 100
- NEVER use the per-100g values directly as the ingredient values
`;

  console.log("Generated prompt for AI:", prompt);
  return prompt;
}

// Main entry function using OpenAI
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  try {
    // Log input for debugging
    console.log(
      "Raw input to suggestMealsForMacros (OpenAI):",
      JSON.stringify(input, null, 2),
    );
    
    console.log("Input keys:", Object.keys(input));
    console.log("Input values:", Object.values(input));

    // Validate input
    const validatedInput = SuggestMealsForMacrosInputSchema.parse(input);
    
    console.log(
      "Validated input after schema parsing:",
      JSON.stringify(validatedInput, null, 2),
    );

    let output;
    let attempts = 0;
    const maxAttempts = 3;
    let lastMacroErrors: string[] = [];

    // Retry logic to ensure valid output
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} to generate valid meal suggestions with OpenAI`);

      // Add retry context to prompt for better results
      const retryContext = attempts > 1 ? `\n\n**RETRY ATTEMPT ${attempts}:** Previous attempt did not match targets. Please recalculate and ensure totals match exactly.` : '';
      const prompt = buildPrompt(validatedInput) + retryContext;
      const result = await generateWithOpenAI(prompt, validatedInput);

      if (!result || !result.suggestions) {
        console.warn(`Attempt ${attempts}: OpenAI did not return suggestions.`);
        lastMacroErrors = ["OpenAI did not return suggestions."];
        continue;
      }

      // Log raw AI output for debugging
      console.log(
        `Raw OpenAI output (Attempt ${attempts}):`,
        JSON.stringify(result, null, 2),
      );

      const { suggestions } = result;
      let valid = true;
      const macroErrors: string[] = [];

      // Validate macro accuracy
      suggestions.forEach((meal, index) => {
        const tolerances = {
          calories: validatedInput.target_calories * 0.05,
          protein: validatedInput.target_protein_grams * 0.05,
          carbs: validatedInput.target_carbs_grams * 0.05,
          fat: validatedInput.target_fat_grams * 0.05,
        };

        const errors: string[] = [];
        if (
          Math.abs(meal.totalCalories - validatedInput.target_calories) >
          tolerances.calories
        ) {
          errors.push(
            `Calories: ${meal.totalCalories} (target: ${validatedInput.target_calories}, allowed: ${validatedInput.target_calories - tolerances.calories}-${validatedInput.target_calories + tolerances.calories})`,
          );
        }
        if (
          Math.abs(meal.totalProtein - validatedInput.target_protein_grams) >
          tolerances.protein
        ) {
          errors.push(
            `Protein: ${meal.totalProtein}g (target: ${validatedInput.target_protein_grams}g, allowed: ${validatedInput.target_protein_grams - tolerances.protein}-${validatedInput.target_protein_grams + tolerances.protein})`,
          );
        }
        if (
          Math.abs(meal.totalCarbs - validatedInput.target_carbs_grams) >
          tolerances.carbs
        ) {
          errors.push(
            `Carbs: ${meal.totalCarbs}g (target: ${validatedInput.target_carbs_grams}g, allowed: ${validatedInput.target_carbs_grams - tolerances.carbs}-${validatedInput.target_carbs_grams + tolerances.carbs})`,
          );
        }
        if (
          Math.abs(meal.totalFat - validatedInput.target_fat_grams) > tolerances.fat
        ) {
          errors.push(
            `Fat: ${meal.totalFat}g (target: ${validatedInput.target_fat_grams}g, allowed: ${validatedInput.target_fat_grams - tolerances.fat}-${validatedInput.target_fat_grams + tolerances.fat})`,
          );
        }

        if (errors.length > 0) {
          valid = false;
          macroErrors.push(
            `Meal suggestion at index ${index} does not meet macro targets: ${errors.join("; ")}`,
          );
          console.error(
            `Attempt ${attempts}: Meal suggestion at index ${index} does not meet macro targets within 5% margin:`,
            {
              meal: {
                mealTitle: meal.mealTitle,
                totals: {
                  calories: meal.totalCalories,
                  protein: meal.totalProtein,
                  carbs: meal.totalCarbs,
                  fat: meal.totalFat,
                },
              },
              targets: {
                calories: validatedInput.target_calories,
                protein: validatedInput.target_protein_grams,
                carbs: validatedInput.target_carbs_grams,
                fat: validatedInput.target_fat_grams,
              },
              errors,
            },
          );
        }
      });

      if (valid) {
        output = result;
        break;
      } else {
        lastMacroErrors = macroErrors;
        console.warn(
          `Attempt ${attempts}: Invalid macros detected. Retrying...`,
        );
      }
    }

    if (!output) {
      throw new Error(
        `Failed to generate valid meal suggestions after ${maxAttempts} attempts. Last error: ${lastMacroErrors.join("; ") || "No valid output generated."}`,
      );
    }

    // Log final output for debugging
    console.log(
      "Final OpenAI suggestions:",
      JSON.stringify(output, null, 2),
    );

    // Save suggestions to database
    try {
      const profile = await getUserProfile();
      if (profile?.user_id) {
        await saveMealSuggestions(
          profile.user_id,
          validatedInput.meal_name ?? "",
          validatedInput.target_calories,
          validatedInput.target_protein_grams,
          validatedInput.target_carbs_grams,
          validatedInput.target_fat_grams,
          output
        );
        console.log("✅ Meal suggestions saved to database");
      }
    } catch (saveError) {
      console.error("❌ Failed to save meal suggestions to database:", saveError);
      // Don't throw error here, just log it - the suggestions are still valid
    }

    return output;
  } catch (error: any) {
    console.error("Error in suggestMealsForMacros (OpenAI):", error);
    throw new Error(getAIApiErrorMessage(error));
  }
}
