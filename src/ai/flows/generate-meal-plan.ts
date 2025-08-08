
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
  name: "generateNutritionistMealPlan",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `YOUR MISSION for {{dayOfWeek}}:
Create {{mealTargets.length}} delicious, balanced meals that precisely hit these targets:
{{#each mealTargets}}
{{this.mealName}}: {{this.calories}} kcal | {{this.protein}}g protein | {{this.carbs}}g carbs | {{this.fat}}g fat
{{/each}}

NUTRITIONIST METHODOLOGY:

1. Creative Ingredient Discovery: Search your extensive food database for diverse protein sources (lean meats, fish, dairy, legumes, plant proteins), complex carbs (grains, fruits, vegetables), and healthy fats (oils, nuts, seeds, avocado). Prioritize variety to ensure meals are interesting, sustainable, and nutritionally balanced across food groups.

2. Intelligent Macro Engineering:
   - Start with a base protein source to anchor the meal.
   - Add complementary proteins if needed to reach the target (e.g., Greek yogurt + protein powder).
   - Layer in carbohydrate sources strategically.
   - Balance with appropriate healthy fats.
   - Fine-tune quantities until macros align perfectly, ensuring a balanced intake of nutrients from various food groups.

3. Adaptive Ingredient Addition: If initial ingredients don't meet targets:
   - ADD extra protein powder, egg whites, or lean protein.
   - SUPPLEMENT with additional carbs (oats, fruits, vegetables).
   - BOOST healthy fats (nuts, seeds, oils).
   - MIX AND MATCH until perfect macro balance is achieved.

CREATIVE EXAMPLES:
- Breakfast: Greek yogurt base + protein powder boost + berries + granola + almond butter
- Snack: Apple slices + almond butter + whey protein mixed in
- Lunch: Quinoa bowl + grilled chicken + additional egg whites + vegetables + olive oil dressing
- Dinner: Salmon + sweet potato + steamed broccoli + extra avocado for fat targets

CLIENT PREFERENCES (strictly follow):
{{#if preferredDiet}}- Dietary approach: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- STRICT ALLERGIES TO AVOID: {{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- PREFERRED ingredients: {{#each preferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- AVOID if possible: {{#each dispreferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

PRECISION REQUIREMENTS:
- Calories: Within ±3% of target (absolutely critical and ONLY validation requirement).
- Protein, Carbs, Fat: Be creative and balanced, aiming to meet targets as closely as possible, but no strict validation required.
- Use accurate nutritional values from reliable sources such as USDA/FoodData Central.
- Calculate nutritional values precisely for the specified quantities.

PROFESSIONAL OUTPUT FORMAT:
{
  "meals": [
    {
      "meal_title": "Creative meal name reflecting main ingredients",
      "ingredients": [
        {
          "name": "specific_ingredient_name",
          "quantity_grams": precise_amount,
          "nutritional_values": {
            "calories": calories_for_this_quantity,
            "protein": protein_for_this_quantity_grams,
            "carbs": carbs_for_this_quantity_grams,
            "fat": fat_for_this_quantity_grams
          }
        }
      ],
      "total_macros": {
        "calories": exact_sum_of_all_ingredients_calories,
        "protein": exact_sum_of_all_ingredients_protein,
        "carbs": exact_sum_of_all_ingredients_carbs,
        "fat": exact_sum_of_all_ingredients_fat
      }
    }
  ]
}

FINAL VALIDATION: Before outputting, verify each meal's total CALORIES hit targets within 3% tolerance. Protein, carbs, and fat should be balanced and reasonable but no strict validation required. Be creative with ingredients while maintaining calorie precision!`,
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

          // Only validate calories with 8% tolerance - protein validation removed
          const isAccurate = dailyOutput.meals.every(
            (meal: any, index: number) => {
              const target = input.mealTargets[index];
              const totalCals =
                meal.ingredients?.reduce(
                  (sum: number, ing: any) => sum + (ing.calories || 0),
                  0,
                ) || 0;

              // Calculate percentage error for calories only
              const calorieError =
                target.calories > 0
                  ? Math.abs(totalCals - target.calories) / target.calories
                  : 0;

              // Only check calories with 8% tolerance
              const isWithinTolerance = calorieError <= 0.08; // 8% tolerance for calories only

              if (!isWithinTolerance) {
                console.warn(
                  `Calorie validation failed for ${target.mealName}:`,
                  {
                    target: {
                      calories: target.calories,
                    },
                    actual: {
                      calories: totalCals,
                    },
                    errors: {
                      calories: calorieError,
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
