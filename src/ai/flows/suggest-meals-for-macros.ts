"use server";

import { geminiModel } from "@/ai/genkit";
import {
  SuggestMealsForMacrosInputSchema,
  SuggestMealsForMacrosOutputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import { getAIApiErrorMessage } from "@/lib/utils";

// Main entry function
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  return suggestMealsForMacrosFlow(input);
}

// AI Prompt
const prompt = geminiModel.definePrompt({
  name: "suggestMealsForMacrosPrompt",
  input: { schema: SuggestMealsForMacrosInputSchema },
  output: { schema: SuggestMealsForMacrosOutputSchema },
  system: `You are NutriMind, an expert AI nutritionist. Your PRIMARY task is to generate meal suggestions where the total calories, protein, carbs, and fat EXACTLY match the target macronutrients or are within a strict 5% margin of error. This is ABSOLUTELY NON-NEGOTIABLE. You MUST calculate and verify all macros before returning a response to ensure they meet the target. Adhere strictly to all user preferences and dietary restrictions. Your entire response MUST be a single, valid JSON object and nothing else.`,

  prompt: `
Generate 1-3 highly personalized meal suggestions for the user's profile and meal target below. The total calories, protein, carbs, and fat for each meal MUST EXACTLY match the target macros or be within a strict 5% margin of error (e.g., for 233.2 kcal, the meal must have 221.54-244.86 kcal; for 20.5g protein, 19.475-21.525g). Macro accuracy is the HIGHEST PRIORITY and MUST be achieved before returning any response.

**User Profile:**
- Age: {{age}}
- Gender: {{gender}}
- Activity Level: {{activity_level}}
- Primary Diet Goal: {{diet_goal}}
- Dietary Preference: {{preferred_diet}}
- Allergies: {{#if allergies.length}}{{allergies}}{{else}}None{{/if}}
- Medical Conditions: {{#if medical_conditions.length}}{{medical_conditions}}{{else}}None{{/if}}
- Preferred Cuisines: {{#if preferred_cuisines.length}}{{preferred_cuisines}}{{else}}None{{/if}}
- Cuisines to Avoid: {{#if dispreferrred_cuisines.length}}{{dispreferrred_cuisines}}{{else}}None{{/if}}
- Liked Ingredients: {{#if preferred_ingredients.length}}{{preferred_ingredients}}{{else}}None{{/if}}
- Disliked Ingredients: {{#if dispreferrred_ingredients.length}}{{dispreferrred_ingredients}}{{else}}None{{/if}}

**🎯 Target for "{{meal_name}}"**
- Calories: {{target_calories}} kcal
- Protein: {{target_protein_grams}}g
- Carbohydrates: {{target_carbs_grams}}g
- Fat: {{target_fat_grams}}g

**CRITICAL RULES - NON-NEGOTIABLE:**
1. **Meal Generation and Macro Accuracy**:
   - First, generate a meal concept that aligns with the user's dietary preferences, restrictions, meal type (e.g., snack, breakfast), and ingredient preferences/avoidances.
   - Do NOT suggest specific food types or cuisines unless explicitly aligned with user preferences (e.g., preferred_cuisines or preferred_ingredients).
   - Select ingredients from a broad nutritional database, prioritizing user-preferred ingredients and avoiding disliked ingredients or allergens.
   - Use standard nutritional data for ingredients (e.g., provide accurate kcal, protein, carbs, and fat per unit, such as per 100g or per piece).
   - Calculate the macro contribution of each ingredient based on its quantity (e.g., for 100g of an ingredient with 0.1g protein per gram, contribution is 100 * 0.1 = 10g protein).
   - Iteratively adjust ingredient quantities to minimize the difference between total macros and targets, ensuring ALL macros are within the 5% margin.
   - Verify the final totals for calories, protein, carbs, and fat against the target ranges before returning the response.
   - If any macro is outside the 5% margin, adjust quantities and recalculate until ALL macros are within range or discard the meal suggestion.
   - Do NOT return a meal suggestion if ANY macro exceeds the 5% margin.
   - All nutritional values (calories, protein, carbs, fat) MUST be numbers, not null, undefined, or "n/a".
2. **Meal Appropriateness**: Suggestions MUST be appropriate for the meal type (e.g., light and quick for "Snack," substantial for "Dinner").
3. **Strict Personalization**: Adhere to ALL allergies, medical conditions, preferred cuisines, liked ingredients, and disliked ingredients. No exceptions.
4. **Expert Description**: The 'description' field MUST:
   - Be engaging, conversational, and motivational, explaining why the meal is ideal for the user's diet goal, activity level, and preferences (e.g., "This meal supports your muscle gain with high protein and keeps energy steady for your active lifestyle").
   - Highlight specific ingredients and their benefits (e.g., "This ingredient provides sustained energy, while another boosts recovery with high protein").
   - Concisely confirm macro calculations (e.g., "Ingredient A contributes 10g protein, Ingredient B adds 5g, totaling 15g protein, within 5% of your target").
   - Confirm all macros are within 5% of the target (e.g., "Delivers 233.2 kcal, 20.9g protein, 20.5g carbs, and 7.6g fat, perfectly aligned with your goals").
   - Avoid overly technical or repetitive phrasing; keep it user-friendly and encouraging.
   - Reference specific user data (e.g., diet goal, medical conditions, preferred cuisines) for personalization.

**JSON OUTPUT INSTRUCTIONS:**
- Respond with ONLY a raw JSON object with a single root key: "suggestions".
- "suggestions" must be an array of 1 to 3 meal objects matching the required schema.
- Each meal object must include:
  - "mealTitle": A descriptive, appealing name for the meal, generated based on ingredients and user preferences.
  - "description": An engaging, motivational explanation as described above, including macro calculations and 5% margin confirmation.
  - "ingredients": An array of ingredients with accurate "calories", "protein", "carbs", and "fat" values (numbers, not null or "n/a").
  - "totalCalories", "totalProtein", "totalCarbs", "totalFat": Numbers within 5% of the target macros.
- Do NOT include any introductory text, explanations, or markdown wrappers like \`\`\`json.

**EXAMPLE OUTPUT:**
{
  "suggestions": [
    {
      "mealTitle": "Personalized Protein-Packed Snack",
      "description": "This snack is tailored for your fat loss goal, providing high protein to keep you full and steady carbs for energy. Ingredient A delivers 10g protein, Ingredient B adds 5g, and Ingredient C contributes 0.5g, totaling 15.5g protein (within 5% of 15g: 14.25-15.75g). With 200 kcal (within 5% of 200: 190-210), 20g carbs (within 5% of 20: 19-21), and 7g fat (within 5% of 7: 6.65-7.35), this snack supports your active lifestyle and dietary preferences!",
      "ingredients": [
        {
          "name": "Ingredient A",
          "amount": "100",
          "unit": "g",
          "calories": 100,
          "protein": 10,
          "carbs": 10,
          "fat": 4,
          "macrosString": "100 cal, 10g protein, 10g carbs, 4g fat"
        },
        {
          "name": "Ingredient B",
          "amount": "50",
          "unit": "g",
          "calories": 80,
          "protein": 5,
          "carbs": 8,
          "fat": 2.5,
          "macrosString": "80 cal, 5g protein, 8g carbs, 2.5g fat"
        },
        {
          "name": "Ingredient C",
          "amount": "20",
          "unit": "g",
          "calories": 20,
          "protein": 0.5,
          "carbs": 2,
          "fat": 0.5,
          "macrosString": "20 cal, 0.5g protein, 2g carbs, 0.5g fat"
        }
      ],
      "totalCalories": 200,
      "totalProtein": 15.5,
      "totalCarbs": 20,
      "totalFat": 7
    }
  ]
}
`,
});

// Genkit Flow
const suggestMealsForMacrosFlow = geminiModel.defineFlow(
  {
    name: "suggestMealsForMacrosFlow",
    inputSchema: SuggestMealsForMacrosInputSchema,
    outputSchema: SuggestMealsForMacrosOutputSchema,
  },
  async (
    input: SuggestMealsForMacrosInput,
  ): Promise<SuggestMealsForMacrosOutput> => {
    try {
      // Log input for debugging
      console.log(
        "Input to suggestMealsForMacrosFlow:",
        JSON.stringify(input, null, 2),
      );

      let output;
      let attempts = 0;
      const maxAttempts = 3;
      let lastMacroErrors: string[] = []; // Store errors from the last attempt

      // Retry logic to ensure valid output
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Attempt ${attempts} to generate valid meal suggestions`);

        const result = await prompt(input);
        if (!result.output) {
          console.warn(`Attempt ${attempts}: AI did not return output.`);
          lastMacroErrors = ["AI did not return output."];
          continue;
        }

        // Log raw AI output for debugging
        console.log(
          `Raw AI output (Attempt ${attempts}):`,
          JSON.stringify(result.output, null, 2),
        );

        const validationResult = SuggestMealsForMacrosOutputSchema.safeParse(
          result.output,
        );
        if (!validationResult.success) {
          console.error(
            `Attempt ${attempts}: AI output validation error:`,
            validationResult.error.flatten(),
          );
          lastMacroErrors = [
            `Schema validation failed: ${validationResult.error.message}`,
          ];
          continue;
        }

        const { suggestions } = validationResult.data;
        let valid = true;
        const macroErrors: string[] = [];

        // Validate macro accuracy
        suggestions.forEach((meal, index) => {
          const tolerances = {
            calories: input.target_calories * 0.05,
            protein: input.target_protein_grams * 0.05,
            carbs: input.target_carbs_grams * 0.05,
            fat: input.target_fat_grams * 0.05,
          };

          const errors: string[] = [];
          if (
            Math.abs(meal.totalCalories - input.target_calories) >
            tolerances.calories
          ) {
            errors.push(
              `Calories: ${meal.totalCalories} (target: ${input.target_calories}, allowed: ${input.target_calories - tolerances.calories}-${input.target_calories + tolerances.calories})`,
            );
          }
          if (
            Math.abs(meal.totalProtein - input.target_protein_grams) >
            tolerances.protein
          ) {
            errors.push(
              `Protein: ${meal.totalProtein}g (target: ${input.target_protein_grams}g, allowed: ${input.target_protein_grams - tolerances.protein}-${input.target_protein_grams + tolerances.protein})`,
            );
          }
          if (
            Math.abs(meal.totalCarbs - input.target_carbs_grams) >
            tolerances.carbs
          ) {
            errors.push(
              `Carbs: ${meal.totalCarbs}g (target: ${input.target_carbs_grams}g, allowed: ${input.target_carbs_grams - tolerances.carbs}-${input.target_carbs_grams + tolerances.carbs})`,
            );
          }
          if (
            Math.abs(meal.totalFat - input.target_fat_grams) > tolerances.fat
          ) {
            errors.push(
              `Fat: ${meal.totalFat}g (target: ${input.target_fat_grams}g, allowed: ${input.target_fat_grams - tolerances.fat}-${input.target_fat_grams + tolerances.fat})`,
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
                  ingredients: meal.ingredients,
                  totals: {
                    calories: meal.totalCalories,
                    protein: meal.totalProtein,
                    carbs: meal.totalCarbs,
                    fat: meal.totalFat,
                  },
                },
                targets: {
                  calories: input.target_calories,
                  protein: input.target_protein_grams,
                  carbs: input.target_carbs_grams,
                  fat: input.target_fat_grams,
                },
                errors,
              },
            );
          }
        });

        if (valid) {
          output = result.output;
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

      const validationResult =
        SuggestMealsForMacrosOutputSchema.safeParse(output);
      if (!validationResult.success) {
        console.error(
          "Final AI output validation error:",
          validationResult.error.flatten(),
        );
        throw new Error(
          `AI returned data in an unexpected format. Details: ${validationResult.error.message}`,
        );
      }

      // Log final output for debugging
      console.log(
        "Final suggestions:",
        JSON.stringify(validationResult.data, null, 2),
      );

      return validationResult.data;
    } catch (error: any) {
      console.error("Error in suggestMealsForMacrosFlow:", error);
      throw new Error(getAIApiErrorMessage(error));
    }
  },
);
