
"use server";

import {
  SuggestMealsForMacrosInputSchema,
  SuggestMealsForMacrosOutputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import { getAIApiErrorMessage } from "@/lib/utils";

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
            content: `You are a nutrition expert. Create meal suggestions that match exact macro targets. Your response must be valid JSON only. Calculate macros precisely - totals must match targets within 5% tolerance.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
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

  return `Create a meal suggestion that EXACTLY matches these macro targets:

**Target Macros:**
- Calories: ${input.target_calories} kcal
- Protein: ${input.target_protein_grams}g  
- Carbs: ${input.target_carbs_grams}g
- Fat: ${input.target_fat_grams}g

**User Preferences:**
- Meal: ${input.meal_name}
- Diet Goal: ${input.diet_goal || "General health"}
- Preferred Cuisines: ${preferredCuisinesText}
- Avoid Cuisines: ${dispreferredCuisinesText}
- Allergies: ${allergiesText}
- Medical Conditions: ${medicalConditionsText}

**Instructions:**
1. Create ONE meal suggestion that matches the exact macro targets (within 5% tolerance)
2. Use real ingredients with accurate nutritional values
3. Avoid any allergens or dispreferred cuisines
4. Make it appropriate for the meal type (${input.meal_name})
5. Calculate totals precisely - they MUST match targets

**Output Format (JSON only):**
{
  "suggestions": [
    {
      "mealTitle": "Meal Name",
      "description": "Brief description of the meal and why it fits your goals",
      "ingredients": [
        {
          "name": "Ingredient Name",
          "amount": "100",
          "unit": "g", 
          "calories": 100,
          "protein": 10,
          "carbs": 10,
          "fat": 4,
          "macrosString": "100 cal, 10g protein, 10g carbs, 4g fat"
        }
      ],
      "totalCalories": ${input.target_calories},
      "totalProtein": ${input.target_protein_grams},
      "totalCarbs": ${input.target_carbs_grams},
      "totalFat": ${input.target_fat_grams}
    }
  ]
}

CRITICAL: The totalCalories, totalProtein, totalCarbs, and totalFat MUST exactly match the targets above.`;
}

// Main entry function using OpenAI
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  try {
    // Log input for debugging
    console.log(
      "Input to suggestMealsForMacros (OpenAI):",
      JSON.stringify(input, null, 2),
    );

    // Validate input
    const validatedInput = SuggestMealsForMacrosInputSchema.parse(input);

    let output;
    let attempts = 0;
    const maxAttempts = 3;
    let lastMacroErrors: string[] = [];

    // Retry logic to ensure valid output
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} to generate valid meal suggestions with OpenAI`);

      const prompt = buildPrompt(validatedInput);
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

    return output;
  } catch (error: any) {
    console.error("Error in suggestMealsForMacros (OpenAI):", error);
    throw new Error(getAIApiErrorMessage(error));
  }
}
