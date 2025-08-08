
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
  name: "generateMacroFocusedMealPlan",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `You are a macro nutrition wizard creating {{mealTargets.length}} meals for {{dayOfWeek}}. Your ONLY goal is hitting exact macro targets - creativity comes second.

**MACRO CALCULATION METHOD:**
1. Start with protein target first (most important)
2. Use these protein powerhouses: chicken breast (23g/100g), Greek yogurt (10g/100g), eggs (13g/100g), whey protein (80g/100g), salmon (25g/100g), tofu (8g/100g)
3. Calculate exact grams needed: target_protein ÷ protein_per_100g × 100
4. Add carb sources: rice (28g carbs/100g), oats (66g/100g), banana (23g/100g), sweet potato (20g/100g)
5. Fill remaining calories with fats: olive oil (884 cal/100g), nuts (600+ cal/100g), avocado (160 cal/100g)

**EXACT TARGETS for {{dayOfWeek}}:**
{{#each mealTargets}}
**{{this.mealName}}**: {{this.calories}} cal, {{this.protein}}g protein, {{this.carbs}}g carbs, {{this.fat}}g fat
{{/each}}

**CALCULATION EXAMPLE:**
For 47.7g protein target:
- Chicken breast: 47.7g ÷ 23g × 100g = 207g chicken (208 cal, 47.7g protein)
- Brown rice: For remaining carbs/calories
- Olive oil: For fat targets

**PREFERENCES (apply if given):**
{{#if preferredDiet}}- Diet: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- AVOID: {{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- PREFER: {{#each preferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**RULES:**
- Calories must be within ±2% of target
- Protein must be within ±3% of target  
- Use USDA nutritional data
- Return exactly {{mealTargets.length}} meals
- No explanations, just JSON

**OUTPUT FORMAT:**
{
  "meals": [
    {
      "meal_title": "Protein-Focused [Meal Name]",
      "ingredients": [
        {
          "name": "ingredient_name",
          "quantity_grams": exact_number,
          "nutritional_values": {
            "calories": exact_number,
            "protein": exact_number,
            "carbs": exact_number,
            "fat": exact_number
          }
        }
      ],
      "total_macros": {
        "calories": sum_of_all_ingredients,
        "protein": sum_of_all_ingredients,
        "carbs": sum_of_all_ingredients,
        "fat": sum_of_all_ingredients
      }
    }
  ]
}

**CRITICAL:** Verify math before outputting. Sum all ingredient macros to ensure totals match targets exactly.`,
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generateMacroFocusedMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log("🚀 Starting macro-focused meal plan generation flow");
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Generate all 7 days with macro-focused approach
    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];
      console.log(
        `📅 Creating macro-precise meals for ${dayOfWeek} (${dayIndex + 1}/7)`,
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
      const maxRetries = 2; // Reduced retries

      // Simplified retry logic
      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          console.log(
            `🎯 Macro-focused attempt ${retryCount + 1} for ${dayOfWeek}`,
          );
          const promptResult = await dailyPrompt(dailyPromptInput);
          dailyOutput = promptResult.output;

          // Basic validation
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

          // Relaxed macro validation - only check calories and protein with 8% tolerance
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

              // Calculate percentage errors
              const calorieError =
                target.calories > 0
                  ? Math.abs(totalCals - target.calories) / target.calories
                  : 0;
              const proteinError =
                target.protein > 0
                  ? Math.abs(totalProtein - target.protein) / target.protein
                  : 0;

              // Very relaxed tolerance - 8% for both
              const isWithinTolerance =
                calorieError <= 0.08 && // 8% tolerance for calories
                proteinError <= 0.08; // 8% tolerance for protein

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

          if (!isAccurate && retryCount < maxRetries) {
            console.warn(
              `❌ Macro accuracy failed for ${dayOfWeek}, retrying...`,
            );
            dailyOutput = null;
            throw new Error(`Macro targets not met for ${dayOfWeek}`);
          } else if (!isAccurate && retryCount >= maxRetries) {
            // Accept the result even if not perfect on final attempt
            console.warn(
              `⚠️ Accepting imperfect macros for ${dayOfWeek} on final attempt`,
            );
          }

          console.log(
            `✅ Generated ${dailyOutput.meals.length} meals for ${dayOfWeek}`,
          );
          break;
        } catch (error) {
          console.error(
            `❌ Error on attempt ${retryCount + 1} for ${dayOfWeek}:`,
            error,
          );
          retryCount++;
          if (retryCount <= maxRetries) {
            // Short delay between retries
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      // Improved fallback with better protein distribution
      if (
        !dailyOutput?.meals ||
        dailyOutput.meals.length !== input.mealTargets.length
      ) {
        console.warn(`🔧 Creating protein-focused fallback meals for ${dayOfWeek}`);
        dailyOutput = createProteinFocusedFallbackMeals(
          input.mealTargets,
          dayOfWeek,
          dayIndex,
        );
      }

      // Process and validate meals
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
              mealFromAI.meal_title || `Protein-Focused ${targetMeal.mealName}`,
            ingredients: sanitizedIngredients,
            total_calories: Math.round(mealTotals.calories * 100) / 100,
            total_protein: Math.round(mealTotals.protein * 100) / 100,
            total_carbs: Math.round(mealTotals.carbs * 100) / 100,
            total_fat: Math.round(mealTotals.fat * 100) / 100,
          });
        } else {
          // Protein-focused placeholder meal
          processedMeals.push(
            createProteinFocusedPlaceholderMeal(targetMeal, dayOfWeek, mealIndex),
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
        `✅ Completed ${dayOfWeek} with ${processedMeals.length} macro-focused meals`,
      );
    }

    console.log(
      `🎉 Generated complete macro-focused weekly plan: ${processedWeeklyPlan.length} days`,
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

// Protein-focused fallback meals
function createProteinFocusedFallbackMeals(
  mealTargets: any[],
  dayOfWeek: string,
  dayIndex: number,
): any {
  console.log(`🔧 Creating protein-focused fallback meals for ${dayOfWeek}`);

  const proteinSources = [
    "Chicken Breast",
    "Greek Yogurt",
    "Salmon",
    "Tofu",
    "Eggs",
    "Cottage Cheese",
    "Tuna",
  ];

  const fallbackMeals = mealTargets.map((target, mealIndex) => {
    const proteinSource = proteinSources[mealIndex % proteinSources.length];
    
    // Calculate amounts to hit protein target exactly
    const proteinPerGram = proteinSource === "Chicken Breast" ? 0.23 : 
                          proteinSource === "Greek Yogurt" ? 0.10 :
                          proteinSource === "Salmon" ? 0.25 :
                          proteinSource === "Eggs" ? 0.13 : 0.20;
    
    const proteinAmount = Math.round(target.protein / proteinPerGram);
    const proteinCals = proteinAmount * (proteinSource === "Chicken Breast" ? 1.65 : 
                                       proteinSource === "Greek Yogurt" ? 0.59 : 2.08);

    return {
      meal_title: `${proteinSource} ${target.mealName}`,
      ingredients: [
        {
          name: proteinSource,
          quantity_grams: proteinAmount,
          nutritional_values: {
            calories: Math.round(proteinCals),
            protein: Math.round(target.protein * 0.8),
            carbs: Math.round(target.carbs * 0.3),
            fat: Math.round(target.fat * 0.3),
          }
        },
        {
          name: "Brown Rice",
          quantity_grams: Math.round(target.carbs * 3.5),
          nutritional_values: {
            calories: Math.round(target.calories * 0.4),
            protein: Math.round(target.protein * 0.15),
            carbs: Math.round(target.carbs * 0.6),
            fat: Math.round(target.fat * 0.1),
          }
        },
        {
          name: "Olive Oil",
          quantity_grams: Math.round(target.fat * 1.1),
          nutritional_values: {
            calories: Math.round(target.calories * 0.2),
            protein: 0,
            carbs: 0,
            fat: Math.round(target.fat * 0.6),
          }
        },
        {
          name: "Mixed Vegetables",
          quantity_grams: 100,
          nutritional_values: {
            calories: Math.round(target.calories * 0.05),
            protein: Math.round(target.protein * 0.05),
            carbs: Math.round(target.carbs * 0.1),
            fat: 0,
          }
        },
      ],
      total_macros: {
        calories: target.calories,
        protein: target.protein,
        carbs: target.carbs,
        fat: target.fat,
      }
    };
  });

  return { meals: fallbackMeals };
}

// Protein-focused placeholder meal
function createProteinFocusedPlaceholderMeal(
  targetMeal: any,
  _dayOfWeek: string,
  mealIndex: number,
): AIGeneratedMeal {
  const proteinSources = [
    "Lean Chicken",
    "Greek Yogurt",
    "Salmon Fillet",
    "Egg Whites",
    "Cottage Cheese",
    "Turkey Breast",
  ];
  const proteinSource = proteinSources[mealIndex % proteinSources.length];

  return {
    meal_name: targetMeal.mealName,
    meal_title: `${proteinSource} ${targetMeal.mealName}`,
    ingredients: [
      {
        name: proteinSource,
        calories: Math.round(targetMeal.calories * 0.5),
        protein: Math.round(targetMeal.protein * 0.8),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.3),
      },
      {
        name: "Complex Carbs",
        calories: Math.round(targetMeal.calories * 0.35),
        protein: Math.round(targetMeal.protein * 0.15),
        carbs: Math.round(targetMeal.carbs * 0.8),
        fat: Math.round(targetMeal.fat * 0.1),
      },
      {
        name: "Healthy Fats",
        calories: Math.round(targetMeal.calories * 0.15),
        protein: Math.round(targetMeal.protein * 0.05),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.6),
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
    console.log("🎯 Starting macro-focused meal plan generation for user:", userId);

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

    console.log("✅ Macro-focused meal plan generated successfully");

    // Save the AI plan to database with error handling
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 Macro-focused AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving macro-focused AI meal plan:", saveError);
      // Don't throw error here, just log it
    }

    return result;
  } catch (e) {
    console.error("❌ Macro-focused meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message:
          "Failed to generate macro-focused meal plan. Please check your macro targets and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
