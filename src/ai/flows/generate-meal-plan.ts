"use server";

import { geminiModel } from "@/ai/genkit";
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  AIDailyPlanOutputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
  type AIGeneratedMeal,
  DayPlan,
} from "@/lib/schemas";
import { daysOfWeek } from "@/lib/constants";
import { getAIApiErrorMessage } from "@/lib/utils";
import { z } from "zod";

export type { GeneratePersonalizedMealPlanOutput };

function isValidNumber(val: any): boolean {
  return typeof val === "number" && !isNaN(val) && isFinite(val);
}

function preprocessMealTargets(mealTargets: any[]): any[] {
  console.log(
    "1. preprocessMealTargets input:",
    JSON.stringify(mealTargets, null, 2),
  );
  const defaultMacroSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 };

  const processed = mealTargets
    .map((meal, index) => {
      const mealName = meal.mealName || `Meal ${index + 1}`;
      const rawCalories = Number(meal.calories);
      const calories =
        isValidNumber(rawCalories) && rawCalories > 0 ? rawCalories : 0;

      const protein = isValidNumber(meal.protein)
        ? Number(meal.protein)
        : (calories * defaultMacroSplit.protein) / 4;

      const carbs = isValidNumber(meal.carbs)
        ? Number(meal.carbs)
        : (calories * defaultMacroSplit.carbs) / 4;

      const fat = isValidNumber(meal.fat)
        ? Number(meal.fat)
        : (calories * defaultMacroSplit.fat) / 9;

      const allValid = [calories, protein, carbs, fat].every(isValidNumber);
      if (!allValid) {
        console.warn(`🚨 Invalid macros in meal index ${index}:`, {
          mealName,
          calories,
          protein,
          carbs,
          fat,
        });
        return null;
      }

      return {
        mealName,
        calories: Number(calories.toFixed(2)),
        protein: Number(protein.toFixed(2)),
        carbs: Number(carbs.toFixed(2)),
        fat: Number(fat.toFixed(2)),
      };
    })
    .filter(Boolean);

  console.log(
    "2. preprocessMealTargets output:",
    JSON.stringify(processed, null, 2),
  );
  return processed;
}

const DailyPromptInputSchema = z.object({
  dayOfWeek: z.string(),
  mealTargets: z.array(
    z.object({
      mealName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  ),
  preferredDiet: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  dispreferredIngredients: z.array(z.string()).nullable().optional(),
  preferredIngredients: z.array(z.string()).nullable().optional(),
  preferredCuisines: z.array(z.string()).nullable().optional(),
  dispreferredCuisines: z.array(z.string()).nullable().optional(),
  medicalConditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
});

type DailyPromptInput = z.infer<typeof DailyPromptInputSchema>;

const dailyPrompt = geminiModel.definePrompt({
  name: "generateDailyMealPlanPrompt",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `You are a highly precise nutritional data generation service. Your ONLY task is to create a list of meals for a single day, {{dayOfWeek}}, that strictly matches the provided macronutrient targets for each meal, while adhering to the user's dietary preferences.

{{#if preferredDiet}}- Dietary Preference: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- Allergies to Avoid: {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- Disliked Ingredients: {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- Favorite Ingredients: {{#each preferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- Favorite Cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredCuisines.length}}- Cuisines to Avoid: {{#each dispreferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medicalConditions.length}}- Medical Conditions: {{#each medicalConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medications.length}}- Medications: {{#each medications}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**ABSOLUTE REQUIREMENTS FOR MEAL GENERATION:**
For each meal listed below, you MUST generate a corresponding meal object. The total macros for the ingredients you list for each meal MUST fall within a 5% tolerance of the targets.

{{#each mealTargets}}
- **Meal: {{this.mealName}}**
  - **TARGET Calories:** {{this.calories}} kcal
  - **TARGET Protein:** {{this.protein}}g
  - **TARGET Carbohydrates:** {{this.carbs}}g
  - **TARGET Fat:** {{this.fat}}g
{{/each}}

**CRITICAL OUTPUT INSTRUCTIONS:**
- Respond with ONLY a valid JSON object matching the provided schema. Do NOT include any text or markdown.
- Each meal must include a "meal_title" and a list of ingredients, each with name, calories, protein, carbs, fat.
- All macro totals must be within 5% of the provided target.
`,
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generatePersonalizedMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log(
      "3. generatePersonalizedMealPlanFlow input:",
      JSON.stringify(input, null, 2),
    );
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    for (const dayOfWeek of daysOfWeek) {
      console.log(`4. Processing day: ${dayOfWeek}`);
      try {
        const dailyPromptInput: DailyPromptInput = {
          dayOfWeek,
          mealTargets: input.mealTargets,
          preferredDiet: input.preferred_diet || input.preferredDiet || null,
          allergies: input.allergies || [],
          dispreferredIngredients: input.dispreferrred_ingredients || input.dispreferredIngredients || [],
          preferredIngredients: input.preferred_ingredients || input.preferredIngredients || [],
          preferredCuisines: input.preferredCuisines || [],
          dispreferredCuisines: input.dispreferredCuisines || [],
          medicalConditions: input.medical_conditions || input.medicalConditions || [],
          medications: input.medications || [],
        };

        console.log(
          "5. dailyPrompt input:",
          JSON.stringify(dailyPromptInput, null, 2),
        );
        const { output: dailyOutput } = await dailyPrompt(dailyPromptInput);
        console.log(
          "6. dailyPrompt output:",
          JSON.stringify(dailyOutput, null, 2),
        );

        if (
          !dailyOutput ||
          !dailyOutput.meals ||
          dailyOutput.meals.length === 0
        ) {
          console.warn(`AI returned no meals for ${dayOfWeek}. Skipping.`);
          continue;
        }

        const processedMeals: AIGeneratedMeal[] = dailyOutput.meals
          .map((meal, index) => {
            if (!meal || !meal.ingredients || meal.ingredients.length === 0) {
              console.warn(`Invalid meal at index ${index} for ${dayOfWeek}`);
              return null;
            }
            const sanitizedIngredients = meal.ingredients.map((ing) => ({
              name: ing.name ?? "Unknown Ingredient",
              calories: Number(ing.calories) || 0,
              protein: Number(ing.protein) || 0,
              carbs: Number(ing.carbs) || 0,
              fat: Number(ing.fat) || 0,
            }));
            const mealTotals = sanitizedIngredients.reduce(
              (totals, ing) => {
                totals.calories += ing.calories;
                totals.protein += ing.protein;
                totals.carbs += ing.carbs;
                totals.fat += ing.fat;
                return totals;
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 },
            );

            const processedMeal: AIGeneratedMeal = {
              meal_name:
                input.mealTargets[index]?.mealName || `Meal ${index + 1}`,
              meal_title: meal.meal_title || `Generated ${index + 1}`,
              ingredients: sanitizedIngredients,
              total_calories: mealTotals.calories,
              total_protein: mealTotals.protein,
              total_carbs: mealTotals.carbs,
              total_fat: mealTotals.fat,
            };
            return processedMeal;
          })
          .filter((meal): meal is AIGeneratedMeal => meal !== null);

        if (processedMeals.length > 0) {
          const dailyTotals = processedMeals.reduce(
            (totals, meal) => ({
              calories: totals.calories + (meal.total_calories || 0),
              protein: totals.protein + (meal.total_protein || 0),
              carbs: totals.carbs + (meal.total_carbs || 0),
              fat: totals.fat + (meal.total_fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );

          processedWeeklyPlan.push({
            day: dayOfWeek,
            meals: processedMeals,
            daily_totals: dailyTotals,
          });

          weeklySummary.totalCalories += dailyTotals.calories;
          weeklySummary.totalProtein += dailyTotals.protein;
          weeklySummary.totalCarbs += dailyTotals.carbs;
          weeklySummary.totalFat += dailyTotals.fat;
        }
      } catch (e) {
        console.error(`❌ Failed to generate plan for ${dayOfWeek}:`, e);
      }
    }

    console.log(
      "7. Processed weekly plan:",
      JSON.stringify(processedWeeklyPlan, null, 2),
    );
    console.log("8. Weekly summary:", JSON.stringify(weeklySummary, null, 2));

    if (processedWeeklyPlan.length === 0) {
      throw new Error(
        getAIApiErrorMessage({
          message:
            "The AI failed to generate a valid meal plan for any day of the week. Please try again.",
        }),
      );
    }

    return {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary,
    };
  },
);

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput,
): Promise<GeneratePersonalizedMealPlanOutput> {
  try {
    console.log(
      "0. generatePersonalizedMealPlan input:",
      JSON.stringify(input, null, 2),
    );
    const processedInput = {
      ...input,
      mealTargets: preprocessMealTargets(input.mealTargets),
    };

    console.log("9. Processed input:", JSON.stringify(processedInput, null, 2));

    if (
      !processedInput.mealTargets ||
      processedInput.mealTargets.length === 0
    ) {
      throw new Error("No valid meal targets could be derived from input.");
    }

    const parsedInput =
      GeneratePersonalizedMealPlanInputSchema.parse(processedInput);
    const result = await generatePersonalizedMealPlanFlow(parsedInput);
    console.log("10. Final result:", JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    console.error("❌ Input validation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message:
          "Invalid input data. Please ensure all required fields (e.g., mealName, calories, protein, carbs, fat) are provided and valid in mealTargets.",
      }),
    );
  }
}
