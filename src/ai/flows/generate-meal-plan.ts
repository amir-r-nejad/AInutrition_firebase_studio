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
import { editAiPlan } from "@/features/meal-plan/lib/data-service";

export type { GeneratePersonalizedMealPlanOutput };

function isValidNumber(val: any): boolean {
  return typeof val === "number" && !isNaN(val) && isFinite(val);
}

function preprocessMealTargets(mealTargets: any[]): any[] {
  console.log(
    "🔧 Preprocessing meal targets:",
    JSON.stringify(mealTargets, null, 2),
  );

  const processed = mealTargets
    .map((meal, index) => {
      const mealName = meal.mealName || `Meal ${index + 1}`;
      const calories = Number(meal.calories) || 0;
      const protein = Number(meal.protein) || 0;
      const carbs = Number(meal.carbs) || 0;
      const fat = Number(meal.fat) || 0;

      if (calories <= 0 || !isValidNumber(calories)) {
        console.warn(`Invalid calories for ${mealName}: ${calories}`);
        return null;
      }

      return {
        mealName,
        calories: Math.round(calories * 100) / 100,
        protein: Math.round(protein * 100) / 100,
        carbs: Math.round(carbs * 100) / 100,
        fat: Math.round(fat * 100) / 100,
      };
    })
    .filter(Boolean);

  console.log("✅ Processed meal targets:", JSON.stringify(processed, null, 2));
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
  name: "generateCreativeMealPlanPrompt",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `You are a precision nutritionist tasked with designing EXACTLY {{mealTargets.length}} meals for {{dayOfWeek}}. Your primary goal is to ensure macronutrient values precisely match the provided targets. Accuracy is critical; creativity is secondary.

**Macro Accuracy Requirements:**
- Calories and protein must be within ±3% of target values.
- Carbohydrates and fat must be within ±10% of target values.

**Calculation Process:**
1. Select 4–6 ingredients with verified nutritional data from USDA FoodData Central.
2. Prioritize ingredients to meet protein and calorie targets first, ensuring they are within ±3%.
   - Use high-protein ingredients (e.g., chicken, fish, tofu) but adjust quantities carefully to avoid exceeding protein targets.
3. Adjust remaining ingredients to meet carbohydrate and fat targets within ±10%.
4. Calculate total macros by summing ingredient values.
5. If any macro is outside the allowed range, adjust ingredient quantities (increase/decrease grams) and recalculate until all targets are met.
6. Verify total calories using: (Protein × 4) + (Carbs × 4) + (Fat × 9).
7. Perform a final check to ensure all macros are within the required ranges.

**Meal Design Guidelines:**
- Use 4–6 ingredients to create a cohesive, flavorful meal.
- Include varied protein sources (e.g., lean meats, fish, legumes), vegetables, complex carbs, and healthy fats.
- Use diverse cooking methods (e.g., grilling, steaming) and global flavors.
- Ensure meals are visually appealing with varied textures.

**User Preferences (apply only if provided):**
{{#if preferredDiet}}- Follow diet: {{preferredDiet}}
{{/if}}{{#if allergies.length}}- Avoid allergens: {{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}{{#if dispreferredIngredients.length}}- Avoid: {{#each dispreferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}{{#if preferredIngredients.length}}- Prefer: {{#each preferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}{{#if preferredCuisines.length}}- Prioritize cuisines: {{#each preferredCuisines}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}{{#if dispreferredCuisines.length}}- Avoid cuisines: {{#each dispreferredCuisines}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}{{#if medicalConditions.length}}- Consider conditions: {{#each medicalConditions}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

**Output Requirements:**
Return ONLY valid JSON with exactly {{mealTargets.length}} meals, each with:
- **meal_title**: A creative meal name.
- **ingredients**: Array of 4–6 ingredients, each with:
  * name
  * quantity_grams (exact for macro precision)
  * nutritional_values (calories, protein, carbs, fat for the quantity)
- **total_macros**: Sum of calories, protein, carbs, and fat, ensuring:
  * Calories: ±3%
  * Protein: ±3%
  * Carbs: ±10%
  * Fat: ±10%

**Macro Targets:**
{{#each mealTargets}}
- {{this.mealName}}: {{this.calories}} kcal (±3%), {{this.protein}} g protein (±3%), {{this.carbs}} g carbs (±10%), {{this.fat}} g fat (±10%)
{{/each}}

**Example Target and Ranges:**
- Target: 637.2 kcal, 47.7 g protein, 50 g carbs, 20 g fat
- Ranges:
  * Calories: 618.084–656.316 kcal
  * Protein: 46.269–49.131 g
  * Carbs: 45–55 g
  * Fat: 18–22 g

**Additional Instructions:**
- Use USDA FoodData Central for precise nutritional data.
- If protein exceeds the target range, reduce the quantity of high-protein ingredients (e.g., chicken, fish) and recalculate.
- Do not output any meal unless all macros are within the specified ranges.
- Recalculate ingredient quantities up to 3 times if needed to meet targets.
- Return only the JSON output, no explanations.

Begin generating the meals now.`,
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generateCreativeMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log("🚀 Starting creative meal plan generation flow");
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Generate all 7 days with enhanced creativity prompts
    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];
      console.log(
        `📅 Creating exciting meals for ${dayOfWeek} (${dayIndex + 1}/7)`,
      );

      const dailyPromptInput: DailyPromptInput = {
        dayOfWeek,
        mealTargets: input.mealTargets,
        preferredDiet: input.preferred_diet || input.preferredDiet || null,
        allergies: input.allergies || [],
        dispreferredIngredients:
          input.dispreferrred_ingredients ||
          input.dispreferredIngredients ||
          [],
        preferredIngredients:
          input.preferred_ingredients || input.preferredIngredients || [],
        preferredCuisines: input.preferredCuisines || [],
        dispreferredCuisines: input.dispreferredCuisines || [],
        medicalConditions:
          input.medical_conditions || input.medicalConditions || [],
        medications: input.medications || [],
      };

      let dailyOutput = null;
      let retryCount = 0;
      const maxRetries = 3;

      // Enhanced retry logic with better error handling
      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          console.log(
            `🤖 Creative AI attempt ${retryCount + 1} for ${dayOfWeek}`,
          );
          const promptResult = await dailyPrompt(dailyPromptInput);
          dailyOutput = promptResult.output;

          // Validate output quality and macro accuracy
          if (
            !dailyOutput?.meals ||
            dailyOutput.meals.length !== input.mealTargets.length
          ) {
            console.warn(
              `❌ Invalid meal count for ${dayOfWeek}: got ${dailyOutput?.meals?.length || 0}, expected ${input.mealTargets.length}`,
            );
            dailyOutput = null;
            throw new Error(`Invalid meal structure for ${dayOfWeek}`);
          }

          // Validate ONLY calories and protein accuracy (ignore carbs and fat)
          const isAccurate = dailyOutput.meals.every(
            (meal: any, index: number) => {
              const target = input.mealTargets[index];
              const totalCals =
                meal.ingredients?.reduce(
                  (sum: number, ing: any) => sum + (ing.calories || 0),
                  0,
                ) || 0;
              const totalProtein =
                meal.ingredients?.reduce(
                  (sum: number, ing: any) => sum + (ing.protein || 0),
                  0,
                ) || 0;

              // Calculate percentage errors ONLY for calories and protein
              const calorieError =
                target.calories > 0
                  ? Math.abs(totalCals - target.calories) / target.calories
                  : 0;
              const proteinError =
                target.protein > 0
                  ? Math.abs(totalProtein - target.protein) / target.protein
                  : 0;

              // Only check calories and protein (5% tolerance for easier success)
              const isWithinTolerance =
                calorieError <= 0.05 && // 5% tolerance for calories
                proteinError <= 0.05; // 5% tolerance for protein

              if (!isWithinTolerance) {
                console.warn(
                  `Macro validation failed for ${target.mealName}:`,
                  {
                    target: {
                      calories: target.calories,
                      protein: target.protein,
                    },
                    actual: {
                      calories: totalCals,
                      protein: totalProtein,
                    },
                    errors: {
                      calories: calorieError,
                      protein: proteinError,
                    },
                  },
                );
              }

              return isWithinTolerance;
            },
          );

          if (!isAccurate) {
            console.warn(
              `❌ Macro accuracy failed for ${dayOfWeek}, retrying...`,
            );
            dailyOutput = null;
            throw new Error(`Macro targets not met for ${dayOfWeek}`);
          }

          console.log(
            `✅ Generated ${dailyOutput.meals.length} creative meals for ${dayOfWeek}`,
          );
          break;
        } catch (error) {
          console.error(
            `❌ Error on attempt ${retryCount + 1} for ${dayOfWeek}:`,
            error,
          );
          retryCount++;
          if (retryCount <= maxRetries) {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          }
        }
      }

      // Enhanced fallback with dynamic variety
      if (
        !dailyOutput?.meals ||
        dailyOutput.meals.length !== input.mealTargets.length
      ) {
        console.warn(`🔧 Creating enhanced fallback meals for ${dayOfWeek}`);
        dailyOutput = createEnhancedFallbackMeals(
          input.mealTargets,
          dayOfWeek,
          dayIndex,
        );
      }

      // Process and validate meals with better error handling
      const processedMeals: AIGeneratedMeal[] = [];

      for (
        let mealIndex = 0;
        mealIndex < input.mealTargets.length;
        mealIndex++
      ) {
        const mealFromAI = dailyOutput.meals[mealIndex];
        const targetMeal = input.mealTargets[mealIndex];

        if (
          mealFromAI &&
          mealFromAI.ingredients &&
          mealFromAI.ingredients.length > 0
        ) {
          // Enhanced ingredient processing
          const sanitizedIngredients = mealFromAI.ingredients.map(
            (ing: any) => ({
              name: ing.name || "Ingredient",
              calories: Math.round((Number(ing.calories) || 0) * 100) / 100,
              protein: Math.round((Number(ing.protein) || 0) * 100) / 100,
              carbs: Math.round((Number(ing.carbs) || 0) * 100) / 100,
              fat: Math.round((Number(ing.fat) || 0) * 100) / 100,
            }),
          );

          const mealTotals = sanitizedIngredients.reduce(
            (
              totals: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
              },
              ing: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
              },
            ) => ({
              calories: totals.calories + ing.calories,
              protein: totals.protein + ing.protein,
              carbs: totals.carbs + ing.carbs,
              fat: totals.fat + ing.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );

          processedMeals.push({
            meal_name: targetMeal.mealName,
            meal_title:
              mealFromAI.meal_title || `Creative ${targetMeal.mealName}`,
            ingredients: sanitizedIngredients,
            total_calories: Math.round(mealTotals.calories * 100) / 100,
            total_protein: Math.round(mealTotals.protein * 100) / 100,
            total_carbs: Math.round(mealTotals.carbs * 100) / 100,
            total_fat: Math.round(mealTotals.fat * 100) / 100,
          });
        } else {
          // Enhanced placeholder meal
          processedMeals.push(
            createEnhancedPlaceholderMeal(targetMeal, dayOfWeek, mealIndex),
          );
        }
      }

      // Calculate daily totals
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
        daily_totals: {
          calories: Math.round(dailyTotals.calories * 100) / 100,
          protein: Math.round(dailyTotals.protein * 100) / 100,
          carbs: Math.round(dailyTotals.carbs * 100) / 100,
          fat: Math.round(dailyTotals.fat * 100) / 100,
        },
      });

      weeklySummary.totalCalories += dailyTotals.calories;
      weeklySummary.totalProtein += dailyTotals.protein;
      weeklySummary.totalCarbs += dailyTotals.carbs;
      weeklySummary.totalFat += dailyTotals.fat;

      console.log(
        `✅ Completed creative ${dayOfWeek} with ${processedMeals.length} diverse meals`,
      );
    }

    console.log(
      `🎉 Generated complete creative weekly plan: ${processedWeeklyPlan.length} days`,
    );

    return {
      weeklyMealPlan: processedWeeklyPlan,
      weeklySummary: {
        totalCalories: Math.round(weeklySummary.totalCalories * 100) / 100,
        totalProtein: Math.round(weeklySummary.totalProtein * 100) / 100,
        totalCarbs: Math.round(weeklySummary.totalCarbs * 100) / 100,
        totalFat: Math.round(weeklySummary.totalFat * 100) / 100,
      },
    };
  },
);

// Enhanced fallback meals with dynamic variety
function createEnhancedFallbackMeals(
  mealTargets: any[],
  dayOfWeek: string,
  dayIndex: number,
): any {
  console.log(`🔧 Creating enhanced fallback meals for ${dayOfWeek}`);

  const cuisines = [
    "West African",
    "Malaysian",
    "Colombian",
    "Tunisian",
    "Korean",
    "Argentinian",
    "Russian",
  ];
  const cuisine = cuisines[dayIndex % cuisines.length];

  const fallbackMeals = mealTargets.map((target, _index) => {
    const proteinCals = target.calories * 0.35;
    const carbCals = target.calories * 0.45;
    const fatCals = target.calories * 0.2;

    return {
      meal_title: `${cuisine} Inspired ${target.mealName}`,
      ingredients: [
        {
          name: `${cuisine} Protein`,
          calories: Math.round(proteinCals),
          protein: Math.round(target.protein * 0.7),
          carbs: Math.round(target.carbs * 0.1),
          fat: Math.round(target.fat * 0.2),
        },
        {
          name: `${cuisine} Carbohydrate`,
          calories: Math.round(carbCals),
          protein: Math.round(target.protein * 0.2),
          carbs: Math.round(target.carbs * 0.8),
          fat: Math.round(target.fat * 0.1),
        },
        {
          name: `${cuisine} Fat Source`,
          calories: Math.round(fatCals),
          protein: Math.round(target.protein * 0.1),
          carbs: Math.round(target.carbs * 0.1),
          fat: Math.round(target.fat * 0.7),
        },
        {
          name: `${cuisine} Vegetable`,
          calories: Math.round(target.calories * 0.05),
          protein: Math.round(target.protein * 0.05),
          carbs: Math.round(target.carbs * 0.05),
          fat: 0,
        },
        {
          name: `${cuisine} Garnish`,
          calories: Math.round(target.calories * 0.05),
          protein: Math.round(target.protein * 0.05),
          carbs: Math.round(target.carbs * 0.05),
          fat: 0,
        },
      ],
    };
  });

  return { meals: fallbackMeals };
}

// Enhanced placeholder meal
function createEnhancedPlaceholderMeal(
  targetMeal: any,
  _dayOfWeek: string,
  mealIndex: number,
): AIGeneratedMeal {
  const creativeCuisines = [
    "Ethiopian",
    "Vietnamese",
    "Peruvian",
    "Moroccan",
    "Japanese",
    "Brazilian",
    "Indian",
  ];
  const cuisine = creativeCuisines[mealIndex % creativeCuisines.length];

  return {
    meal_name: targetMeal.mealName,
    meal_title: `${cuisine} ${targetMeal.mealName}`,
    ingredients: [
      {
        name: `${cuisine} Protein`,
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.7),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.3),
      },
      {
        name: `${cuisine} Carbohydrate`,
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.2),
        carbs: Math.round(targetMeal.carbs * 0.8),
        fat: Math.round(targetMeal.fat * 0.1),
      },
      {
        name: `${cuisine} Fat Source`,
        calories: Math.round(targetMeal.calories * 0.15),
        protein: Math.round(targetMeal.protein * 0.1),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.6),
      },
      {
        name: `${cuisine} Vegetable`,
        calories: Math.round(targetMeal.calories * 0.05),
        protein: 0,
        carbs: Math.round(targetMeal.carbs * 0.05),
        fat: 0,
      },
    ],
    total_calories: targetMeal.calories,
    total_protein: targetMeal.protein,
    total_carbs: targetMeal.carbs,
    total_fat: targetMeal.fat,
  };
}

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput,
  userId: string,
): Promise<GeneratePersonalizedMealPlanOutput> {
  try {
    console.log("🎯 Starting enhanced meal plan generation for user:", userId);

    const processedInput = {
      ...input,
      mealTargets: preprocessMealTargets(input.mealTargets),
    };

    if (
      !processedInput.mealTargets ||
      processedInput.mealTargets.length === 0
    ) {
      throw new Error("No valid meal targets could be derived from input.");
    }

    console.log(
      "🔧 Final processed input:",
      JSON.stringify(processedInput.mealTargets, null, 2),
    );

    const parsedInput =
      GeneratePersonalizedMealPlanInputSchema.parse(processedInput);
    const result = await generatePersonalizedMealPlanFlow(parsedInput);

    console.log("✅ Enhanced meal plan generated successfully");

    // Save the AI plan to database with error handling
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 Enhanced AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving enhanced AI meal plan:", saveError);
      // Don't throw error here, just log it
    }

    return result;
  } catch (e) {
    console.error("❌ Enhanced meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message:
          "Failed to generate creative meal plan. Please check your macro targets and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
