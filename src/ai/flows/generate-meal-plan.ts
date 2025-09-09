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

  // Build meal targets string
  const mealTargetsString = mealTargets
    .map(
      (target) =>
        `**${target.mealName}**: ${target.calories} kcal | ${target.protein}g protein | ${target.carbs}g carbs | ${target.fat}g fat`,
    )
    .join("\n");

  const allergiesText = preferences.allergies && preferences.allergies.length > 0 
    ? preferences.allergies.join(", ") 
    : "None";
  
  const medicalConditionsText = preferences.medicalConditions && preferences.medicalConditions.length > 0 
    ? preferences.medicalConditions.join(", ") 
    : "None";

  const preferredCuisinesText = preferences.preferredCuisines && preferences.preferredCuisines.length > 0 
    ? preferences.preferredCuisines.join(", ") 
    : "None";
  
  const dispreferredCuisinesText = preferences.dispreferredCuisines && preferences.dispreferredCuisines.length > 0 
    ? preferences.dispreferredCuisines.join(", ") 
    : "None";


  const targetedMicronutrientsText = preferences.targetedMicronutrients && preferences.targetedMicronutrients.length > 0 
    ? preferences.targetedMicronutrients.join(", ") 
    : "None";

  const medicationsText = preferences.medications && preferences.medications.length > 0 
    ? preferences.medications.join(", ") 
    : "None";

  const prompt = `Act like an expert nutritionist, meal planner, and macro-tracking specialist. Your goal is to create ${mealTargets.length} meals for ${dayOfWeek} that match the specified macro targets exactly. No approximations are allowed. Totals must be mathematically exact.

TARGETS FOR EACH MEAL (MUST MATCH EXACTLY)
${mealTargetsString}

USER PREFERENCES & RESTRICTIONS
- Preferred diet: ${preferences.preferredDiet || "None specified"}
- Preferred cuisines: ${preferredCuisinesText}
- Avoid cuisines: ${dispreferredCuisinesText}
- Allergies: ${allergiesText}
- Medical conditions: ${medicalConditionsText}
- Targeted micronutrients: ${targetedMicronutrientsText}
- Medications: ${medicationsText}

RAW & REALISTIC RULES
1. Prefer raw, uncooked ingredients: if an ingredient is normally consumed raw, use the format "Ingredient (raw)". Example: "carrot (raw)".  
2. For ingredients usually consumed cooked, use the closest raw form if it exists; otherwise use the regular ingredient without "(raw)". Example: "potato (raw)" or "chicken breast (raw)".  
3. Units and weights refer to the raw or natural weight of the ingredient.  
4. Allow a mix of raw and non-raw ingredients as appropriate for realistic meals.

STEP-BY-STEP PROCESS FOR EACH MEAL
1. Candidate selection:
   a. Select 4–8 ingredients based on dietary preferences, avoidances, and allergens. Include a protein source, a carbohydrate source, a fat source, and vegetables/fruits as needed.
2. Data lookup:
   a. For each ingredient, fetch authoritative nutrition data per 100 g (calories, protein, carbs, fat) from USDA FoodData Central or equivalent.
3. Mathematical setup:
   a. Let w_i be grams for ingredient i. Set up equations to exactly match target calories, protein, carbs, and fat:
      - sum_i (cal_per100_i * w_i / 100) = target_calories
      - sum_i (prot_per100_i * w_i / 100) = target_protein
      - sum_i (carb_per100_i * w_i / 100) = target_carbs
      - sum_i (fat_per100_i * w_i / 100) = target_fat
   b. Solve exactly; if underdetermined, prioritize protein, then carbs/fat, keeping non-negative weights.
4. Precision:
   a. Keep fractional gram weights (up to 4 decimals or more) for exact arithmetic. Only round in final JSON to match totals exactly.
5. Verification:
   a. Compute each ingredient's macros and sum totals. Totals MUST match targets exactly.
6. JSON output:
   a. Use only this format. Include per-ingredient macros and totals. All numeric fields must sum exactly to targets.

Create delicious meals with creative dish names that respect all dietary preferences and restrictions. Each meal should be unique and varied for the week.

JSON format:
{
  "meals": [
${mealTargets
  .map(
    (target, index) => `    {
      "meal_title": "Creative dish name for ${target.mealName}",
      "ingredients": [
        {
          "name": "Ingredient Name (raw)",
          "amount": number,
          "unit": "g",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ],
      "total_macros": {
        "calories": ${target.calories},
        "protein": ${target.protein},
        "carbs": ${target.carbs},
        "fat": ${target.fat}
      }
    }${index < mealTargets.length - 1 ? "," : ""}`,
  )
  .join("\n")}
  ]
}

FINAL RULES
- JSON must be the only output. No text outside JSON.  
- Ingredient names must include "(raw)" only if appropriate.  
- Totals must equal targets exactly. Use fractional grams if needed.  
- Always provide detailed step-by-step cooking instructions in the "instructions" field.  
- If exact solution is impossible, provide the best exact rational solution with totals matching targets if mathematically achievable.
- Each meal should be unique and varied for the week.
- Respect all dietary preferences, restrictions, and medical conditions.
- IMPORTANT: Pay special attention to preferred cuisines and dietary restrictions. If user has specific cuisine preferences, create meals that reflect those cuisines.`;

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
            "You are a nutrition expert. Your ONLY job is to create meals where the total calories, protein, carbs, and fat EXACTLY match the target numbers provided. Calculate each ingredient's macros and adjust quantities until the totals equal the targets. Your response must be valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 1,
      max_tokens: 16384,
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
    console.error(
      "No content received from OpenAI. Full response:",
      JSON.stringify(data, null, 2),
    );
    throw new Error("No content received from OpenAI");
  }

  console.log("Raw OpenAI response content:", content);

  // Clean and parse JSON
  let cleanedContent = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedContent);
    console.log("Parsed OpenAI response:", JSON.stringify(parsed, null, 2));

    // Validate the response structure
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      console.error("Invalid response structure - no meals array:", parsed);
      throw new Error("OpenAI response missing meals array");
    }

    if (parsed.meals.length !== mealTargets.length) {
      console.error(
        `Expected ${mealTargets.length} meals, got ${parsed.meals.length}:`,
        parsed.meals,
      );
      throw new Error(
        `OpenAI returned ${parsed.meals.length} meals instead of ${mealTargets.length}`,
      );
    }

    return parsed;
  } catch (parseError) {
    console.error("Failed to parse OpenAI response:", parseError);
    console.error("Cleaned content:", cleanedContent);
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
    preferredCuisines: input.preferred_cuisines || input.preferredCuisines || [],
    dispreferredCuisines: input.dispreferrred_cuisines || input.dispreferredCuisines || [],
    medicalConditions:
      input.medical_conditions || input.medicalConditions || [],
    medications: input.medications || [],
    targetedMicronutrients: input.preferred_micronutrients || input.preferredMicronutrients || [],
  };

  // Debug logging
  console.log("🔍 DEBUG: Full input received:", JSON.stringify(input, null, 2));
  console.log("🔍 DEBUG: Available input keys:", Object.keys(input));
  console.log("🔍 DEBUG: Cuisine fields check:", {
    preferred_cuisines: input.preferred_cuisines,
    preferredCuisines: input.preferredCuisines,
    dispreferrred_cuisines: input.dispreferrred_cuisines,
    dispreferredCuisines: input.dispreferredCuisines
  });
  console.log("🔍 DEBUG: Extracted preferences:", JSON.stringify(preferences, null, 2));

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

        // Basic validation: just check if meals exist and have ingredients
        let allMealsValid = true;
        for (let i = 0; i < dailyOutput.meals.length; i++) {
          const meal = dailyOutput.meals[i];

          if (!meal.ingredients || meal.ingredients.length === 0) {
            console.warn(`❌ Meal ${i + 1} has no ingredients`);
            allMealsValid = false;
            break;
          }
        }

        if (!allMealsValid) {
          console.warn(
            `❌ Some meals missing ingredients for ${dayOfWeek}, retrying...`,
          );
          dailyOutput = null;
          throw new Error(`AI generated meals with missing ingredients for ${dayOfWeek}`);
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

    // No fallback - all data must come from AI
    if (
      !dailyOutput?.meals ||
      dailyOutput.meals.length !== input.mealTargets.length
    ) {
      console.error(`❌ AI failed to generate meals for ${dayOfWeek}`);
      throw new Error(`AI failed to generate meals for ${dayOfWeek}`);
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
        // Enhanced ingredient processing with proper rounding
        const sanitizedIngredients = mealFromAI.ingredients.map((ing: any) => ({
          name: ing.name || "Ingredient",
          quantity: Math.round(Number(ing.amount) || 0),
          unit: ing.unit || "g",
          calories: Math.round(Number(ing.calories) || 0),
          protein: Math.round((Number(ing.protein) || 0) * 10) / 10,
          carbs: Math.round((Number(ing.carbs) || 0) * 10) / 10,
          fat: Math.round((Number(ing.fat) || 0) * 10) / 10,
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

        // Calculate actual macros from ingredients
        const actualMacros = {
          calories: Math.round(mealTotals.calories * 100) / 100,
          protein: Math.round(mealTotals.protein * 100) / 100,
          carbs: Math.round(mealTotals.carbs * 100) / 100,
          fat: Math.round(mealTotals.fat * 100) / 100,
        };

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
        // No fallback - throw error if AI doesn't provide valid meal
        console.error(`❌ AI failed to generate valid meal ${mealIndex + 1} for ${dayOfWeek}`);
        throw new Error(`AI failed to generate valid meal ${mealIndex + 1} for ${dayOfWeek}`);
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
