
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
  name: "generateSimpleMealPlan",
  input: { schema: DailyPromptInputSchema },
  output: { schema: AIDailyPlanOutputSchema },
  prompt: `Create {{mealTargets.length}} simple meals for {{dayOfWeek}}.

MEAL TARGETS:
{{#each mealTargets}}
{{this.mealName}}: {{this.calories}} calories, {{this.protein}}g protein, {{this.carbs}}g carbs, {{this.fat}}g fat
{{/each}}

INSTRUCTIONS:
- Use simple, common food names
- Calculate exact nutrition for each ingredient
- Make sure total calories match the target (within 5%)
- Use normal portions and realistic ingredients

EXAMPLE FORMAT:
{
  "meals": [
    {
      "meal_title": "Chicken and Rice",
      "ingredients": [
        {
          "name": "Chicken Breast",
          "calories": 200,
          "protein": 40,
          "carbs": 0,
          "fat": 4
        },
        {
          "name": "White Rice",
          "calories": 150,
          "protein": 3,
          "carbs": 30,
          "fat": 0
        }
      ],
      "total_macros": {
        "calories": 350,
        "protein": 43,
        "carbs": 30,
        "fat": 4
      }
    }
  ]
}

Create realistic meals with accurate nutrition that match the targets.`,
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generateSimpleMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput,
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log("🚀 Starting simple meal plan generation flow");
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    // Generate all 7 days with simple approach
    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];
      console.log(
        `📅 Creating simple meals for ${dayOfWeek} (${dayIndex + 1}/7)`,
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
      const maxRetries = 2;

      // Simple retry logic
      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          console.log(
            `🎯 Simple attempt ${retryCount + 1} for ${dayOfWeek}`,
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

          // Simple calorie validation (10% tolerance)
          const isAccurate = dailyOutput.meals.every(
            (meal: any, index: number) => {
              const target = input.mealTargets[index];
              const totalCals = meal.total_macros?.calories || 0;

              // Calculate percentage error for calories
              const calorieError =
                target.calories > 0
                  ? Math.abs(totalCals - target.calories) / target.calories
                  : 0;

              // Check calories with 10% tolerance
              const isWithinTolerance = calorieError <= 0.1; // 10% tolerance

              if (!isWithinTolerance) {
                console.warn(
                  `Calorie validation failed for ${target.mealName}:`,
                  {
                    target: target.calories,
                    actual: totalCals,
                    error: calorieError,
                  },
                );
              }

              return isWithinTolerance;
            },
          );

          if (!isAccurate && retryCount < maxRetries) {
            console.warn(
              `❌ Calorie accuracy failed for ${dayOfWeek}, retrying...`,
            );
            dailyOutput = null;
            throw new Error(`Calorie targets not met for ${dayOfWeek}`);
          } else if (!isAccurate && retryCount >= maxRetries) {
            // Accept the result even if not perfect on final attempt
            console.warn(
              `⚠️ Accepting imperfect calories for ${dayOfWeek} on final attempt`,
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
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      // Simple fallback if needed
      if (
        !dailyOutput?.meals ||
        dailyOutput.meals.length !== input.mealTargets.length
      ) {
        console.warn(`🔧 Creating simple fallback meals for ${dayOfWeek}`);
        dailyOutput = createSimpleFallbackMeals(
          input.mealTargets,
          dayOfWeek,
        );
      }

      // Process meals
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
          // Process ingredients
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
            (totals, ing) => ({
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
              mealFromAI.meal_title || `${targetMeal.mealName}`,
            ingredients: sanitizedIngredients,
            total_calories: Math.round(mealTotals.calories * 100) / 100,
            total_protein: Math.round(mealTotals.protein * 100) / 100,
            total_carbs: Math.round(mealTotals.carbs * 100) / 100,
            total_fat: Math.round(mealTotals.fat * 100) / 100,
          });
        } else {
          // Simple placeholder meal
          processedMeals.push(
            createSimplePlaceholderMeal(targetMeal),
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
        `✅ Completed ${dayOfWeek} with ${processedMeals.length} simple meals`,
      );
    }

    console.log(
      `🎉 Generated complete simple weekly plan: ${processedWeeklyPlan.length} days`,
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

// Simple fallback meals
function createSimpleFallbackMeals(
  mealTargets: any[],
  dayOfWeek: string,
): any {
  console.log(`🔧 Creating simple fallback meals for ${dayOfWeek}`);

  const fallbackMeals = mealTargets.map((target, mealIndex) => {
    return {
      meal_title: `${target.mealName}`,
      ingredients: [
        {
          name: "Chicken Breast",
          calories: Math.round(target.calories * 0.4),
          protein: Math.round(target.protein * 0.6),
          carbs: 0,
          fat: Math.round(target.fat * 0.3),
        },
        {
          name: "Rice",
          calories: Math.round(target.calories * 0.4),
          protein: Math.round(target.protein * 0.2),
          carbs: Math.round(target.carbs * 0.8),
          fat: Math.round(target.fat * 0.1),
        },
        {
          name: "Olive Oil",
          calories: Math.round(target.calories * 0.2),
          protein: Math.round(target.protein * 0.2),
          carbs: Math.round(target.carbs * 0.2),
          fat: Math.round(target.fat * 0.6),
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

// Simple placeholder meal
function createSimplePlaceholderMeal(
  targetMeal: any,
): AIGeneratedMeal {
  return {
    meal_name: targetMeal.mealName,
    meal_title: `${targetMeal.mealName}`,
    ingredients: [
      {
        name: "Protein Source",
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.7),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.3),
      },
      {
        name: "Carb Source",
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.2),
        carbs: Math.round(targetMeal.carbs * 0.8),
        fat: Math.round(targetMeal.fat * 0.1),
      },
      {
        name: "Fat Source",
        calories: Math.round(targetMeal.calories * 0.2),
        protein: Math.round(targetMeal.protein * 0.1),
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
    console.log("🎯 Starting simple meal plan generation for user:", userId);

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

    console.log("✅ Simple meal plan generated successfully");

    // Save the AI plan to database
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 Simple AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving simple AI meal plan:", saveError);
    }

    return result;
  } catch (e) {
    console.error("❌ Simple meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message:
          "Failed to generate simple meal plan. Please check your targets and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
