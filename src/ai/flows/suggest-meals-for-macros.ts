
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
            content: `You are NutriMind, an expert AI nutritionist. Your PRIMARY task is to generate meal suggestions where the total calories, protein, carbs, and fat EXACTLY match the target macronutrients or are within a strict 5% margin of error. This is ABSOLUTELY NON-NEGOTIABLE. You MUST calculate and verify all macros before returning a response to ensure they meet the target. Adhere strictly to all user preferences and dietary restrictions. Your entire response MUST be a single, valid JSON object and nothing else.`,
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

  return `
Generate 1-3 highly personalized meal suggestions for the user's profile and meal target below. The total calories, protein, carbs, and fat for each meal MUST EXACTLY match the target macros or be within a strict 5% margin of error (e.g., for ${input.target_calories} kcal, the meal must have ${(input.target_calories * 0.95).toFixed(1)}-${(input.target_calories * 1.05).toFixed(1)} kcal; for ${input.target_protein_grams}g protein, ${(input.target_protein_grams * 0.95).toFixed(1)}-${(input.target_protein_grams * 1.05).toFixed(1)}g). Macro accuracy is the HIGHEST PRIORITY and MUST be achieved before returning any response.

**User Profile:**
- Age: ${input.age}
- Gender: ${input.gender}
- Activity Level: ${input.activity_level}
- Primary Diet Goal: ${input.diet_goal}
- Allergies: ${allergiesText}
- Medical Conditions: ${medicalConditionsText}

**🎯 Target for "${input.meal_name}"**
- Calories: ${input.target_calories} kcal
- Protein: ${input.target_protein_grams}g
- Carbohydrates: ${input.target_carbs_grams}g
- Fat: ${input.target_fat_grams}g

**STRICT NUTRITIONAL DATABASE REQUIREMENT:**
You MUST use ONLY accurate nutritional data from verified sources like USDA FoodData Central. Use these EXACT values per 100g:

**PROTEINS:**
- Chicken Breast (skinless): 165 kcal, 31g protein, 0g carbs, 3.6g fat
- Lean Ground Beef (93/7): 152 kcal, 22.6g protein, 0g carbs, 6.2g fat
- Salmon (Atlantic): 208 kcal, 25.4g protein, 0g carbs, 12.4g fat
- Greek Yogurt (non-fat): 59 kcal, 10.3g protein, 3.6g carbs, 0.4g fat
- Eggs (whole): 155 kcal, 13g protein, 1.1g carbs, 11g fat
- Egg Whites: 52 kcal, 10.9g protein, 0.7g carbs, 0.2g fat
- Tofu (firm): 144 kcal, 15.8g protein, 4.3g carbs, 8.7g fat

**CARBOHYDRATES:**
- White Rice (cooked): 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
- Brown Rice (cooked): 112 kcal, 2.6g protein, 23g carbs, 0.9g fat
- Quinoa (cooked): 120 kcal, 4.4g protein, 21.3g carbs, 1.9g fat
- Oats (dry): 389 kcal, 16.9g protein, 66.3g carbs, 6.9g fat
- Sweet Potato: 86 kcal, 1.6g protein, 20.1g carbs, 0.1g fat
- Banana: 89 kcal, 1.1g protein, 22.8g carbs, 0.3g fat

**FATS:**
- Olive Oil: 884 kcal, 0g protein, 0g carbs, 100g fat
- Avocado: 160 kcal, 2g protein, 8.5g carbs, 14.7g fat
- Almonds: 579 kcal, 21.2g protein, 21.6g carbs, 49.9g fat
- Peanut Butter: 588 kcal, 25.8g protein, 20g carbs, 50g fat

**VEGETABLES:**
- Spinach: 23 kcal, 2.9g protein, 3.6g carbs, 0.4g fat
- Broccoli: 34 kcal, 2.8g protein, 7g carbs, 0.4g fat
- Bell Peppers: 31 kcal, 1g protein, 7g carbs, 0.3g fat

**CRITICAL RULES - NON-NEGOTIABLE:**
1. **Meal Generation and Macro Accuracy**:
   - Use ONLY the nutritional values provided above or other verified USDA data
   - DO NOT make up or estimate nutritional values
   - Calculate exact quantities needed: quantity_needed = (target_macro ÷ macro_per_100g) × 100
   - First, generate a meal concept that aligns with the user's dietary preferences, restrictions, meal type (e.g., snack, breakfast), and ingredient preferences/avoidances.
   - Select ingredients from the verified nutritional database above, prioritizing user preferences and avoiding allergies.
   - Calculate the macro contribution of each ingredient based on its quantity using EXACT nutritional data.
   - Iteratively adjust ingredient quantities to minimize the difference between total macros and targets, ensuring ALL macros are within the 5% margin.
   - Verify the final totals for calories, protein, carbs, and fat against the target ranges before returning the response.
   - If any macro is outside the 5% margin, adjust quantities and recalculate until ALL macros are within range.
   - All nutritional values (calories, protein, carbs, fat) MUST be numbers, not null, undefined, or "n/a".

2. **Meal Appropriateness**: Suggestions MUST be appropriate for the meal type (e.g., light and quick for "Snack," substantial for "Dinner").

3. **Strict Personalization**: Adhere to ALL allergies, medical conditions, and dietary preferences. No exceptions.

4. **Expert Description**: The 'description' field MUST:
   - Be engaging, conversational, and motivational, explaining why the meal is ideal for the user's diet goal, activity level, and preferences.
   - Highlight specific ingredients and their benefits.
   - Concisely confirm macro calculations.
   - Confirm all macros are within 5% of the target.
   - Reference specific user data for personalization.

**JSON OUTPUT:**
Respond with ONLY a raw JSON object with a single root key: "suggestions".

**EXAMPLE OUTPUT:**
{
  "suggestions": [
    {
      "mealTitle": "Personalized Protein-Packed Snack",
      "description": "This snack is tailored for your ${input.diet_goal} goal, providing high protein to keep you full and steady carbs for energy. Ingredient A delivers 10g protein, Ingredient B adds 5g, totaling 15g protein (within 5% of target). With ${input.target_calories} kcal, ${input.target_carbs_grams}g carbs, and ${input.target_fat_grams}g fat, this snack supports your ${input.activity_level} lifestyle!",
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

REMEMBER: The totals MUST be within 5% of the target macros. Calculate precisely and verify before responding.
`;
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
