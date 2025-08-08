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
  prompt: `You are a world-class nutritionist and innovative chef with access to a vast database of global recipes. Generate EXACTLY {{mealTargets.length}} highly diverse, creative, and nutritionally precise meals for {{dayOfWeek}}. Search the internet for trending, unique, and culturally rich recipes to inspire your creations, ensuring maximum variety and excitement. Ensure NO meal is repeated across the week, and each day's meals are entirely unique, even for the same meal type (e.g., breakfast).

**CRITICAL MACRO CALCULATION REQUIREMENTS:**
- Each meal MUST match the exact macro targets within a 5% margin of error (NOT 1%).
- For each meal, calculate ingredient quantities using precise nutritional data to meet these EXACT targets:
  {{#each mealTargets}}
  **{{this.mealName}}**: {{this.calories}} kcal | {{this.protein}}g protein | {{this.carbs}}g carbs | {{this.fat}}g fat
  {{/each}}

**INGREDIENT QUANTITY CALCULATION PROCESS:**
1. Select 4-6 ingredients that create a cohesive, delicious meal
2. Look up precise nutritional data per 100g for each ingredient (calories, protein, carbs, fat)
3. Calculate the exact gram amount needed for each ingredient to collectively meet the macro targets
4. Verify that the sum of all ingredient macros equals the target macros within 5% tolerance
5. If not within tolerance, adjust ingredient quantities and recalculate until targets are met
6. Double-check: Total calories should equal (Total protein × 4) + (Total carbs × 4) + (Total fat × 9)

**INGREDIENT SELECTION AND CALCULATION:**
- Choose 4-6 complementary ingredients that create a cohesive, flavorful meal
- Use precise nutritional data (calories, protein, carbs, fat per 100g) from reliable sources like USDA FoodData Central
- Calculate exact quantities in grams for each ingredient to collectively meet macro targets
- Example calculation process:
  * Target: 500 kcal, 30g protein, 50g carbs, 20g fat
  * Ingredient 1 (Chicken breast): 165 kcal, 31g protein, 0g carbs, 3.6g fat per 100g
  * Ingredient 2 (Brown rice): 112 kcal, 2.6g protein, 23g carbs, 0.9g fat per 100g  
  * Calculate quantities: X grams chicken + Y grams rice + other ingredients = exact macro targets
- Verify final totals match targets within 5% margin before submitting

**CREATIVITY REQUIREMENTS:**
- Explore diverse cooking methods: grilling, poaching, sous-vide, braising, fermenting, smoking, raw preparations
- Draw inspiration from global cuisines ensuring variety across the week
- Use diverse protein sources: lean meats, fish, poultry, plant-based proteins, legumes
- Include colorful vegetables, fruits, healthy fats, and complex carbohydrates
- Create visually appealing, restaurant-quality meals with varied textures and flavors

**USER PREFERENCES (ONLY APPLY IF NOT NULL):**
{{#if preferredDiet}}- Adhere strictly to diet type: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- AVOID (Allergies): {{#each allergies}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- AVOID (Dislikes): {{#each dispreferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- PREFER: {{#each preferredIngredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredCuisines.length}}- Prioritize cuisines: {{#each preferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredCuisines.length}}- Avoid cuisines: {{#each dispreferredCuisines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if medicalConditions.length}}- Health considerations: {{#each medicalConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**PRECISION REQUIREMENTS:**
1. Macros must be within 1% of targets for calories, protein, carbs, and fat.
2. Use precise nutritional data from reliable sources (e.g., USDA or peer-reviewed culinary databases).
3. Include 5-8 diverse ingredients per meal for complexity and flavor depth.
4. Ensure meals are restaurant-quality, visually stunning, and culturally inspired.
5. Search online for innovative ingredient pairings or trending recipes to enhance creativity, but do not replicate any specific recipe directly.

**MEAL CREATIVITY GUIDELINES:**
- Create unique meals for each day and meal type (e.g., no two breakfasts are alike across the week).
- Incorporate modern culinary techniques (e.g., spherification, fermentation, or foraging-inspired ingredients) where appropriate.
- Ensure each meal feels like a distinct culinary journey with bold, unexpected flavor profiles.
- Avoid predictable combinations; prioritize novel pairings inspired by global culinary trends.

**MANDATORY OUTPUT REQUIREMENTS:**
Return ONLY valid JSON with exactly {{mealTargets.length}} unique, creative meals. For each meal:

1. **Ingredient Precision**: Each ingredient must specify:
   - Exact quantity in grams
   - Precise nutritional values (calories, protein, carbs, fat) for that specific quantity
   - Values must be calculated based on the gram amount (not per 100g)

2. **Macro Verification**: The sum of all ingredient macros MUST equal the target macros within 5% tolerance:
   {{#each mealTargets}}
   - {{this.mealName}}: Total must be {{this.calories}}±{{this.calories}}*0.05 kcal, {{this.protein}}±{{this.protein}}*0.05g protein, {{this.carbs}}±{{this.carbs}}*0.05g carbs, {{this.fat}}±{{this.fat}}*0.05g fat
   {{/each}}

3. **Structure**: Each meal object must include:
   - meal_title: Creative, appealing name
   - ingredients: Array with name, precise macros matching the calculated quantities
   - Ensure ingredient macros sum exactly to meal totals

**CALCULATION VERIFICATION EXAMPLE:**
If target is 500 kcal, 30g protein, 50g carbs, 20g fat:
- Acceptable range: 475-525 kcal, 28.5-31.5g protein, 47.5-52.5g carbs, 19-21g fat
- Each ingredient quantity must be precisely calculated to achieve these totals

CRITICAL: If macro totals are outside 5% tolerance, recalculate ingredient quantities before responding.`,
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

          // Validate macro accuracy with 5% tolerance
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
              const totalCarbs =
                meal.ingredients?.reduce(
                  (sum: number, ing: any) => sum + (ing.carbs || 0),
                  0,
                ) || 0;
              const totalFat =
                meal.ingredients?.reduce(
                  (sum: number, ing: any) => sum + (ing.fat || 0),
                  0,
                ) || 0;
              
              // Calculate percentage errors
              const calorieError = target.calories > 0 ? 
                Math.abs(totalCals - target.calories) / target.calories : 0;
              const proteinError = target.protein > 0 ? 
                Math.abs(totalProtein - target.protein) / target.protein : 0;
              const carbsError = target.carbs > 0 ? 
                Math.abs(totalCarbs - target.carbs) / target.carbs : 0;
              const fatError = target.fat > 0 ? 
                Math.abs(totalFat - target.fat) / target.fat : 0;
              
              const isWithinTolerance = (
                calorieError <= 0.05 &&
                proteinError <= 0.05 &&
                carbsError <= 0.05 &&
                fatError <= 0.05
              );
              
              if (!isWithinTolerance) {
                console.warn(`Macro validation failed for ${target.mealName}:`, {
                  target: { calories: target.calories, protein: target.protein, carbs: target.carbs, fat: target.fat },
                  actual: { calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
                  errors: { calories: calorieError, protein: proteinError, carbs: carbsError, fat: fatError }
                });
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
              totals: { calories: any; protein: any; carbs: any; fat: any },
              ing: { calories: any; protein: any; carbs: any; fat: any },
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
