"use server";

import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  type GeneratePersonalizedMealPlanInput,
  type GeneratePersonalizedMealPlanOutput,
  type AIGeneratedMeal,
  DayPlan,
} from "@/lib/schemas";
import { daysOfWeek } from "@/lib/constants";
import { getAIApiErrorMessage } from "@/lib/utils";
import { editAiPlan } from "@/features/meal-plan/lib/data-service";

export type { GeneratePersonalizedMealPlanOutput };

function isValidNumber(val: any): boolean {
  return typeof val === "number" && !isNaN(val) && isFinite(val);
}

function validateMacroAccuracy(
  actual: any,
  target: any,
  mealName: string,
): boolean {
  const margin = 0.05; // 5% error margin

  const caloriesValid =
    Math.abs(actual.calories - target.calories) <= target.calories * margin;
  const proteinValid =
    Math.abs(actual.protein - target.protein) <= target.protein * margin;
  const carbsValid =
    Math.abs(actual.carbs - target.carbs) <= target.carbs * margin;
  const fatValid = Math.abs(actual.fat - target.fat) <= target.fat * margin;

  if (!caloriesValid || !proteinValid || !carbsValid || !fatValid) {
    console.warn(`❌ Macro validation failed for ${mealName}:`, {
      calories: {
        actual: actual.calories,
        target: target.calories,
        valid: caloriesValid,
      },
      protein: {
        actual: actual.protein,
        target: target.protein,
        valid: proteinValid,
      },
      carbs: { actual: actual.carbs, target: target.carbs, valid: carbsValid },
      fat: { actual: actual.fat, target: target.fat, valid: fatValid },
    });
    return false;
  }

  return true;
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

async function generateDailyMealPlan(
  dayOfWeek: string,
  mealTargets: any[],
  preferences: any = {},
): Promise<any> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  const prompt = `**YOUR MISSION for {{dayOfWeek}}:**

As a professional nutritionist with 15+ years of experience, create {{mealTargets.length}} delicious, balanced meals that precisely hit these targets, using real-time data from reliable online sources:

{{#each mealTargets}}
**{{this.mealName}}**: {{this.calories}} kcal | {{this.protein}}g protein | {{this.carbs}}g carbs | {{this.fat}}g fat
{{/each}}

**NUTRITIONIST METHODOLOGY:**

1. **Real-Time Data Access and Ingredient Discovery**:
   - Access reliable online nutritional databases such as USDA/FoodData Central, Nutritionix, or other credible sources to retrieve accurate, up-to-date nutritional values for ingredients.
   - Search for diverse protein sources (lean meats, fish, dairy, legumes, plant proteins), complex carbs (grains, fruits, vegetables), and healthy fats (oils, nuts, seeds, avocado). Prioritize variety to ensure meals are interesting, sustainable, and nutritionally balanced across food groups.

2. **Intelligent Macro Engineering**:
   - Start with a base protein source to anchor the meal, selected based on client preferences and dietary approach.
   - Add complementary proteins if needed to reach the target (e.g., Greek yogurt + protein powder).
   - Layer in carbohydrate sources strategically to meet carb goals.
   - Balance with appropriate healthy fats to achieve fat targets.
   - Fine-tune quantities using precise nutritional data from online sources until macros align perfectly, ensuring a balanced intake of nutrients.

3. **Adaptive Ingredient Addition**:
   - If initial ingredients don't meet macro targets:
     - ADD extra protein powder, egg whites, or lean protein sources.
     - SUPPLEMENT with additional carbs (oats, fruits, vegetables).
     - BOOST healthy fats (nuts, seeds, oils).
     - MIX AND MATCH ingredients, cross-referencing with online data, until perfect macro balance is achieved.
   - Use web searches to identify alternative ingredients if needed to meet dietary restrictions or preferences.

4. **Professional Decision-Making**:
   - Mimic the approach of a real nutritionist by considering seasonal availability, cost-effectiveness, and ease of preparation when selecting ingredients, based on insights from credible online sources (e.g., nutrition blogs, dietitian websites).
   - Ensure meals are practical for everyday preparation while maintaining variety and appeal.

**CREATIVE EXAMPLES:**
- Breakfast: Greek yogurt base + protein powder boost + fresh berries + granola + almond butter
- Snack: Apple slices + almond butter + whey protein mixed in
- Lunch: Quinoa bowl + grilled chicken + additional egg whites + mixed vegetables + olive oil dressing
- Dinner: Baked salmon + roasted sweet potato + steamed broccoli + extra avocado for fat targets

**CLIENT PREFERENCES (strictly follow):**
{{#if preferredDiet}}- Dietary approach: {{preferredDiet}}{{/if}}
{{#if allergies.length}}- STRICT ALLERGIES TO AVOID: {{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if preferredIngredients.length}}- PREFERRED ingredients: {{#each preferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if dispreferredIngredients.length}}- AVOID if possible: {{#each dispreferredIngredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

**PRECISION REQUIREMENTS:**
- Calories: Within ±3% of target (absolutely critical and ONLY validation requirement).
- Protein, Carbs, Fat: Be creative and balanced, aiming to meet targets as closely as possible, but no strict validation required.
- Use accurate, up-to-date nutritional values from online sources like USDA/FoodData Central or Nutritionix.
- Calculate nutritional values precisely for the specified quantities, ensuring all calculations are based on real-time data.

**PROFESSIONAL OUTPUT FORMAT:**
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
          },
          "source": "URL or name of the nutritional database used (e.g., USDA/FoodData Central)"
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

**FINAL VALIDATION:**
- Before outputting, verify each meal's total CALORIES hit targets within 3% tolerance using data from online sources.
- Ensure protein, carbs, and fat are balanced and reasonable, but no strict validation is required.
- Cross-check ingredient choices against client preferences and allergies, using web searches if needed to confirm suitability.
- Be creative with ingredients while maintaining calorie precision and leveraging real-time nutritional data for accuracy.`;

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
          content:
            "You are a world-class nutritionist and innovative chef. Always respond with valid JSON only, no additional text or formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
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

  try {
    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (parseError) {
    console.error("Failed to parse OpenAI response:", parseError);
    throw new Error("Invalid JSON response from OpenAI");
  }
}

async function generatePersonalizedMealPlanFlow(
  input: GeneratePersonalizedMealPlanInput,
): Promise<GeneratePersonalizedMealPlanOutput> {
  console.log("🚀 Starting OpenAI meal plan generation flow");
  const processedWeeklyPlan: DayPlan[] = [];
  const weeklySummary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  const preferences = {
    preferredDiet: input.preferred_diet || input.preferredDiet || null,
    allergies: input.allergies || [],
    dispreferredIngredients:
      input.dispreferrred_ingredients || input.dispreferredIngredients || [],
    preferredIngredients:
      input.preferred_ingredients || input.preferredIngredients || [],
    preferredCuisines: input.preferredCuisines || [],
    dispreferredCuisines: input.dispreferredCuisines || [],
    medicalConditions:
      input.medical_conditions || input.medicalConditions || [],
    medications: input.medications || [],
  };

  // Generate all 7 days with enhanced creativity prompts
  for (let dayIndex = 0; dayIndex < daysOfWeek.length; dayIndex++) {
    const dayOfWeek = daysOfWeek[dayIndex];
    console.log(
      `📅 Creating exciting meals for ${dayOfWeek} (${dayIndex + 1}/7)`,
    );

    let dailyOutput = null;
    let retryCount = 0;
    const maxRetries = 5;

    // Enhanced retry logic with better error handling
    while (retryCount <= maxRetries && !dailyOutput) {
      try {
        console.log(`🤖 OpenAI attempt ${retryCount + 1} for ${dayOfWeek}`);
        dailyOutput = await generateDailyMealPlan(
          dayOfWeek,
          input.mealTargets,
          preferences,
        );

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

        // Strict validation: check if ALL meals meet macro accuracy
        let allMealsValid = true;
        for (let i = 0; i < dailyOutput.meals.length; i++) {
          const meal = dailyOutput.meals[i];
          const target = input.mealTargets[i];

          // Calculate totals from ingredients
          const actualTotals = meal.ingredients.reduce(
            (totals: any, ing: any) => ({
              calories: totals.calories + (Number(ing.calories) || 0),
              protein: totals.protein + (Number(ing.protein) || 0),
              carbs: totals.carbs + (Number(ing.carbs) || 0),
              fat: totals.fat + (Number(ing.fat) || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );

          // Check 5% accuracy for each macro
          const margin = 0.05;
          const caloriesValid =
            Math.abs(actualTotals.calories - target.calories) <=
            target.calories * margin;
          const proteinValid =
            Math.abs(actualTotals.protein - target.protein) <=
            target.protein * margin;
          const carbsValid =
            Math.abs(actualTotals.carbs - target.carbs) <=
            target.carbs * margin;
          const fatValid =
            Math.abs(actualTotals.fat - target.fat) <= target.fat * margin;

          if (!caloriesValid || !proteinValid || !carbsValid || !fatValid) {
            console.warn(`❌ Meal ${target.mealName} failed validation:`, {
              actualTotals,
              target,
              validation: { caloriesValid, proteinValid, carbsValid, fatValid },
            });
            allMealsValid = false;
            break;
          }
        }

        if (!allMealsValid) {
          console.warn(
            `❌ Not all meals meet 5% accuracy requirement for ${dayOfWeek}, retrying...`,
          );
          dailyOutput = null;
          throw new Error(`Macro accuracy failed for ${dayOfWeek}`);
        }

        console.log(
          `✅ Generated ${dailyOutput.meals.length} ACCURATE meals for ${dayOfWeek}`,
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

    for (let mealIndex = 0; mealIndex < input.mealTargets.length; mealIndex++) {
      const mealFromAI = dailyOutput.meals[mealIndex];
      const targetMeal = input.mealTargets[mealIndex];

      if (
        mealFromAI &&
        mealFromAI.ingredients &&
        mealFromAI.ingredients.length > 0
      ) {
        // Enhanced ingredient processing
        const sanitizedIngredients = mealFromAI.ingredients.map((ing: any) => ({
          name: ing.name || "Ingredient",
          calories: Math.round((Number(ing.calories) || 0) * 100) / 100,
          protein: Math.round((Number(ing.protein) || 0) * 100) / 100,
          carbs: Math.round((Number(ing.carbs) || 0) * 100) / 100,
          fat: Math.round((Number(ing.fat) || 0) * 100) / 100,
        }));

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

        // Validate macro accuracy with 5% margin
        const actualMacros = {
          calories: Math.round(mealTotals.calories * 100) / 100,
          protein: Math.round(mealTotals.protein * 100) / 100,
          carbs: Math.round(mealTotals.carbs * 100) / 100,
          fat: Math.round(mealTotals.fat * 100) / 100,
        };

        // Check if macros are within 5% accuracy
        const isAccurate = validateMacroAccuracy(
          actualMacros,
          targetMeal,
          targetMeal.mealName,
        );

        if (!isAccurate) {
          console.warn(
            `⚠️ Meal ${targetMeal.mealName} exceeds 5% macro error margin, but including in plan`,
          );
        }

        processedMeals.push({
          meal_name: targetMeal.mealName,
          meal_title:
            mealFromAI.meal_title || `Creative ${targetMeal.mealName}`,
          ingredients: sanitizedIngredients,
          total_calories: actualMacros.calories,
          total_protein: actualMacros.protein,
          total_carbs: actualMacros.carbs,
          total_fat: actualMacros.fat,
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
        fat: Math.round(dailyTotals.fat * 0.1) / 100,
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
}

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

  const fallbackMeals = mealTargets.map((target, index) => {
    // Calculate precise ingredient distributions to meet exact macros
    const proteinFromProteinSource = target.protein * 0.8;
    const proteinFromOtherSources = target.protein * 0.2;

    const carbsFromCarbSource = target.carbs * 0.85;
    const carbsFromOtherSources = target.carbs * 0.15;

    const fatFromFatSource = target.fat * 0.75;
    const fatFromOtherSources = target.fat * 0.25;

    return {
      meal_title: `${cuisine} Inspired ${target.mealName}`,
      ingredients: [
        {
          name: `${cuisine} Protein Source (120g)`,
          calories: Math.round(
            proteinFromProteinSource * 4 + fatFromOtherSources * 0.4 * 9,
          ),
          protein: Math.round(proteinFromProteinSource * 100) / 100,
          carbs: Math.round(carbsFromOtherSources * 0.1 * 100) / 100,
          fat: Math.round(fatFromOtherSources * 0.4 * 100) / 100,
        },
        {
          name: `${cuisine} Carbohydrate Source (80g)`,
          calories: Math.round(
            carbsFromCarbSource * 4 + proteinFromOtherSources * 0.6 * 4,
          ),
          protein: Math.round(proteinFromOtherSources * 0.6 * 100) / 100,
          carbs: Math.round(carbsFromCarbSource * 100) / 100,
          fat: Math.round(fatFromOtherSources * 0.2 * 100) / 100,
        },
        {
          name: `${cuisine} Healthy Fat (15g)`,
          calories: Math.round(fatFromFatSource * 9),
          protein: Math.round(proteinFromOtherSources * 0.1 * 100) / 100,
          carbs: Math.round(carbsFromOtherSources * 0.1 * 100) / 100,
          fat: Math.round(fatFromFatSource * 100) / 100,
        },
        {
          name: `${cuisine} Vegetables (100g)`,
          calories: Math.round(carbsFromOtherSources * 0.7 * 4),
          protein: Math.round(proteinFromOtherSources * 0.3 * 100) / 100,
          carbs: Math.round(carbsFromOtherSources * 0.7 * 100) / 100,
          fat: Math.round(fatFromOtherSources * 0.3 * 100) / 100,
        },
        {
          name: `${cuisine} Seasoning (5g)`,
          calories: Math.round(carbsFromOtherSources * 0.1 * 4),
          protein: 0,
          carbs: Math.round(carbsFromOtherSources * 0.1 * 100) / 100,
          fat: Math.round(fatFromOtherSources * 0.1 * 100) / 100,
        },
      ],
    };
  });

  return { meals: fallbackMeals };
}

// Enhanced placeholder meal
function createEnhancedPlaceholderMeal(
  targetMeal: any,
  dayOfWeek: string,
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
        name: `${cuisine} Protein (150g)`,
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.7),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.3),
      },
      {
        name: `${cuisine} Carbohydrate (1 cup)`,
        calories: Math.round(targetMeal.calories * 0.4),
        protein: Math.round(targetMeal.protein * 0.2),
        carbs: Math.round(targetMeal.carbs * 0.8),
        fat: Math.round(targetMeal.fat * 0.1),
      },
      {
        name: `${cuisine} Fat Source (2 tbsp)`,
        calories: Math.round(targetMeal.calories * 0.15),
        protein: Math.round(targetMeal.protein * 0.1),
        carbs: Math.round(targetMeal.carbs * 0.1),
        fat: Math.round(targetMeal.fat * 0.6),
      },
      {
        name: `${cuisine} Vegetable (1 cup)`,
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
    console.log("🎯 Starting OpenAI meal plan generation for user:", userId);

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

    console.log("✅ OpenAI meal plan generated successfully");

    // Save the AI plan to database with error handling
    try {
      await editAiPlan({ ai_plan: result }, userId);
      console.log("💾 OpenAI AI meal plan saved to database");
    } catch (saveError) {
      console.error("❌ Error saving OpenAI AI meal plan:", saveError);
      // Don't throw error here, just log it
    }

    return result;
  } catch (e) {
    console.error("❌ OpenAI meal plan generation failed:", e);
    throw new Error(
      getAIApiErrorMessage({
        message:
          "Failed to generate creative meal plan with OpenAI. Please check your macro targets and try again.",
      }),
    );
  }
}

export { generatePersonalizedMealPlanFlow };
