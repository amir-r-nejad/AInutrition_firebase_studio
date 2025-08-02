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
1. **Macro Accuracy**:
   - The total calories, protein, carbs, and fat for each meal MUST match the target macros EXACTLY or be within a 5% margin (e.g., for 233.2 kcal, acceptable range is 221.54-244.86 kcal; for 20.5g protein, 19.475-21.525g).
   - Follow these steps to ensure macro accuracy:
     1. Select ingredients that align with user preferences, dietary restrictions, and meal type.
     2. Use standard nutritional data (e.g., eggs: 60 kcal, 6g protein, 1g carbs, 4g fat per piece; Greek yogurt: 100 kcal, 10g protein, 4g carbs, 3g fat per 100g; oats: 70 kcal, 3.5g protein, 12g carbs, 1.5g fat per 20g; blueberries: 5.7 kcal, 0.07g protein, 1.4g carbs, 0.03g fat per 10g) or user-provided preferences.
     3. Calculate the macro contribution of each ingredient based on its quantity (e.g., for 200g Greek yogurt: 200 * 0.1 = 20g protein).
     4. Iteratively adjust ingredient quantities to minimize the difference between total macros and targets, ensuring ALL macros are within the 5% margin.
     5. Verify the final totals for calories, protein, carbs, and fat against the target ranges before returning the response.
     6. If any macro is outside the 5% margin, adjust quantities and recalculate until ALL macros are within range or discard the meal suggestion.
   - Do NOT return a meal suggestion if ANY macro exceeds the 5% margin.
   - All nutritional values (calories, protein, carbs, fat) MUST be numbers, not null, undefined, or "n/a".
2. **Meal Appropriateness**: Suggestions MUST be appropriate for the meal type (e.g., Greek yogurt or eggs for "Snack," not steak).
3. **Strict Personalization**: Adhere to ALL allergies, medical conditions, preferred cuisines, liked ingredients, and disliked ingredients. No exceptions.
4. **Expert Description**: The 'description' field MUST:
   - Be engaging, conversational, and motivational, explaining why the meal is ideal for the user's diet goal, activity level, and preferences (e.g., "This snack fuels your fat loss with high protein and keeps your blood sugar steady for diabetes management").
   - Highlight specific ingredients and their benefits (e.g., "Greek yogurt provides a creamy, protein-packed base, while blueberries add a burst of antioxidants").
   - Concisely confirm macro calculations (e.g., "Greek yogurt (20g protein), oats (0.7g), and blueberries (0.2g) total 20.9g protein, within 5% of your target").
   - Confirm all macros are within 5% of the target (e.g., "Delivers 233.2 kcal, 20.9g protein, 20.5g carbs, and 7.6g fat, perfectly aligned with your goals").
   - Avoid overly technical or repetitive phrasing; keep it user-friendly and encouraging.
   - Reference specific user data (e.g., diet goal, medical conditions, preferred cuisines) for personalization.

**JSON OUTPUT INSTRUCTIONS:**
- Respond with ONLY a raw JSON object with a single root key: "suggestions".
- "suggestions" must be an array of 1 to 3 meal objects matching the required schema.
- Each meal object must include:
  - "mealTitle": A descriptive, appealing name for the meal.
  - "description": An engaging, motivational explanation as described above, including macro calculations and 5% margin confirmation.
  - "ingredients": An array of ingredients with accurate "calories", "protein", "carbs", and "fat" values (numbers, not null or "n/a").
  - "totalCalories", "totalProtein", "totalCarbs", "totalFat": Numbers within 5% of the target macros.
- Do NOT include any introductory text, explanations, or markdown wrappers like \`\`\`json.

**EXAMPLE OUTPUT:**
{
  "suggestions": [
    {
      "mealTitle": "Greek Yogurt Berry Power Snack",
      "description": "This delicious snack is crafted for your fat loss goal and diabetes management, offering a perfect balance of protein, carbs, and healthy fats. Creamy Greek yogurt delivers a protein punch to keep you full, while oats provide steady energy and blueberries add antioxidant-rich flavor. Greek yogurt (200g) contributes 20g protein, oats (20g) add 0.7g, and blueberries (10g) add 0.2g, totaling 20.9g protein (within 5% of 20.5g: 19.475-21.525g). With 233.2 kcal (within 5% of 233.2: 221.54-244.86), 20.5g carbs (within 5% of 20.5: 19.475-21.525), and 7.6g fat (within 5% of 7.6: 7.22-7.98), this snack keeps your blood sugar stable and supports your goals!",
      "ingredients": [
        {
          "name": "Greek yogurt",
          "amount": "200",
          "unit": "g",
          "calories": 200,
          "protein": 20,
          "carbs": 8,
          "fat": 6,
          "macrosString": "200 cal, 20g protein, 8g carbs, 6g fat"
        },
        {
          "name": "oats",
          "amount": "20",
          "unit": "g",
          "calories": 70,
          "protein": 0.7,
          "carbs": 12,
          "fat": 1.5,
          "macrosString": "70 cal, 0.7g protein, 12g carbs, 1.5g fat"
        },
        {
          "name": "blueberries",
          "amount": "10",
          "unit": "g",
          "calories": 5.7,
          "protein": 0.2,
          "carbs": 1.4,
          "fat": 0.03,
          "macrosString": "5.7 cal, 0.2g protein, 1.4g carbs, 0.03g fat"
        }
      ],
      "totalCalories": 233.2,
      "totalProtein": 20.9,
      "totalCarbs": 20.5,
      "totalFat": 7.6
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
