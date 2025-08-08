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
  console.log("🔧 Preprocessing meal targets:", JSON.stringify(mealTargets, null, 2));

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
  prompt: `You are a world-class nutritionist and innovative chef...` // متن پرامپت بدون تغییر برای اختصار حذف شده
});

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: "generateCreativeMealPlanFlow",
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (input: GeneratePersonalizedMealPlanInput): Promise<GeneratePersonalizedMealPlanOutput> => {
    console.log("🚀 Starting creative meal plan generation flow");
    const processedWeeklyPlan: DayPlan[] = [];
    const weeklySummary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };

    for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
      const dayOfWeek = daysOfWeek[dayIndex];
      console.log(`📅 Creating exciting meals for ${dayOfWeek} (${dayIndex + 1}/7)`);

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

      let dailyOutput = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries && !dailyOutput) {
        try {
          console.log(`🤖 Creative AI attempt ${retryCount + 1} for ${dayOfWeek}`);
          const promptResult = await dailyPrompt(dailyPromptInput);
          dailyOutput = promptResult.output;

          if (!dailyOutput?.meals || dailyOutput.meals.length !== input.mealTargets.length) {
            console.warn(`❌ Invalid meal count for ${dayOfWeek}`);
            dailyOutput = null;
            throw new Error(`Invalid meal structure for ${dayOfWeek}`);
          }

          const isAccurate = dailyOutput.meals.every((meal: any, index: number) => {
            const target = input.mealTargets[index];
            const totalCals = meal.ingredients?.reduce((sum: number, ing: any) => sum + (ing.calories || 0), 0) || 0;
            const totalProtein = meal.ingredients?.reduce((sum: number, ing: any) => sum + (ing.protein || 0), 0) || 0;
            const totalCarbs = meal.ingredients?.reduce((sum: number, ing: any) => sum + (ing.carbs || 0), 0) || 0;
            const totalFat = meal.ingredients?.reduce((sum: number, ing: any) => sum + (ing.fat || 0), 0) || 0;
            const calorieError = Math.abs(totalCals - target.calories) / target.calories;
            const proteinError = Math.abs(totalProtein - target.protein) / target.protein;
            const carbsError = Math.abs(totalCarbs - target.carbs) / target.carbs;
            const fatError = Math.abs(totalFat - target.fat) / target.fat;
            return (
              calorieError <= 0.05 &&
              proteinError <= 0.05 &&
              carbsError <= 0.05 &&
              fatError <= 0.05
            );
          });

          if (!isAccurate) {
            console.warn(`❌ Macro accuracy failed for ${dayOfWeek}, retrying...`);
            dailyOutput = null;
            throw new Error(`Macro targets not met for ${dayOfWeek}`);
          }

          console.log(`✅ Generated ${dailyOutput.meals.length} creative meals for ${dayOfWeek}`);
          break;
        } catch (error) {
          console.error(`❌ Error on attempt ${retryCount + 1} for ${dayOfWeek}:`, error);
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (!dailyOutput?.meals || dailyOutput.meals.length !== input.mealTargets.length) {
        console.warn(`🔧 Creating enhanced fallback meals for ${dayOfWeek}`);
        dailyOutput = createEnhancedFallbackMeals(input.mealTargets, dayOfWeek, dayIndex);
      }

      const processedMeals: AIGeneratedMeal[] = [];

      for (let mealIndex = 0; mealIndex < input.mealTargets.length; mealIndex++) {
        const mealFromAI = dailyOutput.meals[mealIndex];
        const targetMeal = input.mealTargets[mealIndex];

        if (mealFromAI && mealFromAI.ingredients && mealFromAI.ingredients.length > 0) {
          const sanitizedIngredients = mealFromAI.ingredients.map((ing: any) => ({
            name: ing.name || "Ingredient",
            calories: Math.round((Number(ing.calories) || 0) * 100) / 100,
            protein: Math.round((Number(ing.protein) || 0) * 100) / 100,
            carbs: Math.round((Number(ing.carbs) || 0) * 100) / 100,
            fat: Math.round((Number(ing.fat) || 0) * 100) / 100,
          }));

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
            meal_title: mealFromAI.meal_title || `Creative ${targetMeal.mealName}`,
            ingredients: sanitizedIngredients,
            total_calories: Math.round(mealTotals.calories * 100) / 100,
            total_protein: Math.round(mealTotals.protein * 100) / 100,
            total_carbs: Math.round(mealTotals.carbs * 100) / 100,
            total_fat: Math.round(mealTotals.fat * 100) / 100,
          });
        } else {
          processedMeals.push(createEnhancedPlaceholderMeal(targetMeal, dayOfWeek, mealIndex));
        }
      }

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

      console.log(`✅ Completed creative ${dayOfWeek} with ${processedMeals.length} diverse meals`);
    }

    console.log(`🎉 Generated complete creative weekly plan: ${processedWeeklyPlan.length} days`);

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

function createEnhancedFallbackMeals(mealTargets: any[], dayOfWeek: string, dayIndex: number): any {
  console.log(`🔧 Creating enhanced fallback meals for ${dayOfWeek}`);
  const cuisines = ["West African", "Malaysian", "Colombian", "Tunisian", "Korean", "Argentinian", "Russian"];
  const cuisine = cuisines[dayIndex % cuisines.length];

  const realisticFoods = [
    { protein: `${cuisine} Grilled Chicken`, carb: `${cuisine} Spiced Rice`, fat: `${cuisine} Peanut Sauce`, veg: `${cuisine} Steamed Vegetables`, garnish: `${cuisine} Fresh Herbs` },
    { protein: `${cuisine} Seared Fish`, carb: `${cuisine} Couscous`, fat: `${cuisine} Olive Oil Drizzle`, veg: `${cuisine} Roasted Vegetables`, garnish: `${cuisine} Citrus Zest` },
    { protein: `${cuisine} Lentil Stew`, carb: `${cuisine} Flatbread`, fat: `${cuisine} Tahini Sauce`, veg: `${cuisine} Pickled Vegetables`, garnish: `${cuisine} Fresh Coriander` },
  ];

  return {
    meals: mealTargets.map((target, index) => {
      const choice = realisticFoods[index % realisticFoods.length];
      const proteinCals = target.calories * 0.35;
      const carbCals = target.calories * 0.45;
      const fatCals = target.calories * 0.2;
      return {
        meal_title: `${cuisine} Inspired ${target.mealName}`,
        ingredients: [
          { name: choice.protein, calories: Math.round(proteinCals), protein: Math.round(target.protein * 0.7), carbs: Math.round(target.carbs * 0.1), fat: Math.round(target.fat * 0.2) },
          { name: choice.carb, calories: Math.round(carbCals), protein: Math.round(target.protein * 0.2), carbs: Math.round(target.carbs * 0.8), fat: Math.round(target.fat * 0.1) },
          { name: choice.fat, calories: Math.round(fatCals), protein: Math.round(target.protein * 0.1), carbs: Math.round(target.carbs * 0.1), fat: Math.round(target.fat * 0.7) },
          { name: choice.veg, calories: Math.round(target.calories * 0.05), protein: Math.round(target.protein * 0.05), carbs: Math.round(target.carbs * 0.05), fat: 0 },
          { name: choice.garnish, calories: Math.round(target.calories * 0.03), protein: Math.round(target.protein * 0.03), carbs: Math.round(target.carbs * 0.03), fat: 0 },
        ],
      };
    }),
  };
}

function createEnhancedPlaceholderMeal(targetMeal: any, dayOfWeek: string, mealIndex: number): AIGeneratedMeal {
  const creativeCuisines = ["Ethiopian", "Vietnamese", "Peruvian", "Moroccan", "Japanese", "Brazilian", "Indian"];
  const cuisine = creativeCuisines[mealIndex % creativeCuisines.length];
  return {
    meal_name: targetMeal.mealName,
    meal_title: `${cuisine} ${targetMeal.mealName}`,
    ingredients: [
      { name: `${cuisine} Protein`, calories: Math.round(targetMeal.calories * 0.4), protein: Math.round(targetMeal.protein * 0.7), carbs: Math.round(targetMeal.carbs * 0.1), fat: Math.round(targetMeal.fat * 0.3) },
      { name: `${cuisine} Carbohydrate`, calories: Math.round(targetMeal.calories * 0.4), protein: Math.round(targetMeal.protein * 0.2), carbs: Math.round(targetMeal.carbs * 0.8), fat: Math.round(targetMeal.fat * 0.1) },
      { name: `${cuisine} Fat Source`, calories: Math.round(targetMeal.calories * 0.15), protein: Math.round(targetMeal.protein * 0.1), carbs: Math.round(targetMeal.carbs * 0.1), fat: Math.round(targetMeal.fat * 0.6) },
      { name: `${cuisine} Vegetable`, calories: Math.round(targetMeal.calories * 0.05), protein: 0, carbs: Math.round(targetMeal.carbs * 0.05), fat: 0 },
    ],
    total_calories: targetMeal.calories,
    total_protein: targetMeal.protein,
    total_carbs: targetMeal.carbs,
    total_fat: targetMeal.fat,
  };
}

export async function generatePersonalizedMealPlan(input: GeneratePersonalizedMealPlanInput, userId: string): Promise<GeneratePersonalizedMealPlanOutput> {
  try {
    console.log("🎯 Starting enhanced meal plan generation for user:", userId);
    const processedInput = { ...input, mealTargets: preprocessMealTargets(input.mealTargets) };
    if (!processedInput.mealTargets || processedInput.mealTargets.length === 0) {
      throw new Error("No valid meal targets could be derived from input.");
    }
    const parsedInput = GeneratePersonalizedMealPlanInputSchema.parse(processedInput);
    const result = await generatePersonalizedMealPlanFlow(parsedInput);
    console.log("✅ Enhanced meal plan generated successfully");
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 Enhanced AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving enhanced AI meal plan:", saveError);
    }
    return result;
  } catch (e) {
    console.error("❌ Enhanced meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message: "Failed to generate creative meal plan. Please check your macro targets and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
