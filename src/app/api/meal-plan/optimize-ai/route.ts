import { getUser } from "@/features/profile/lib/data-services";
import { editAiPlan } from "@/features/meal-plan/lib/data-service";
import {
  convertMealToIngredients,
  createTargetsFromMacros,
  optimizeMeal,
  convertOptimizationToMeal,
  type Ingredient,
} from "@/lib/optimization/meal-optimizer";

export const maxDuration = 60; // 1 minute timeout

function json(body: any, init?: number) {
  return new Response(JSON.stringify(body), {
    status: init ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    console.log("🚀 API: Starting AI meal plan optimization");

    const body = await request.json();
    const { mealPlan, dayIndex, mealIndex, targetMacros } = body;

    if (!mealPlan || typeof dayIndex !== 'number' || typeof mealIndex !== 'number' || !targetMacros) {
      console.error("❌ API: Missing required data", {
        mealPlan: !!mealPlan,
        dayIndex: typeof dayIndex,
        mealIndex: typeof mealIndex,
        targetMacros: !!targetMacros,
      });
      return json({ error: "Missing required data for optimization" }, 400);
    }

    // Validate target macros
    if (
      typeof targetMacros.calories !== 'number' ||
      typeof targetMacros.protein !== 'number' ||
      typeof targetMacros.carbs !== 'number' ||
      typeof targetMacros.fat !== 'number'
    ) {
      console.error("❌ API: Invalid target macros");
      return json({ error: "Invalid target macros - all values must be numbers" }, 400);
    }

    // Get user ID
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.error("❌ API: User not authenticated");
      return json({ error: "User not authenticated" }, 401);
    }

    // Extract the specific meal to optimize
    const weeklyPlan = mealPlan.weeklyMealPlan || mealPlan;
    if (!weeklyPlan || !weeklyPlan[dayIndex] || !weeklyPlan[dayIndex].meals || !weeklyPlan[dayIndex].meals[mealIndex]) {
      console.error("❌ API: Invalid meal plan structure", {
        weeklyPlan: !!weeklyPlan,
        day: weeklyPlan?.[dayIndex] ? "exists" : "missing",
        meals: weeklyPlan?.[dayIndex]?.meals ? "exists" : "missing",
        mealExists: weeklyPlan?.[dayIndex]?.meals?.[mealIndex] ? "exists" : "missing",
      });
      return json({ error: "Invalid meal plan structure or meal not found" }, 400);
    }

    const mealToOptimize = weeklyPlan[dayIndex].meals[mealIndex];
    console.log("🔧 API: Optimizing meal:", JSON.stringify(mealToOptimize, null, 2));
    console.log("🎯 API: Target macros:", targetMacros);

    // Convert meal to ingredients format for optimization
    const ingredients: Ingredient[] = convertMealToIngredients(mealToOptimize);
    
    if (ingredients.length === 0) {
      console.error("❌ API: No valid ingredients found for optimization");
      return json({ error: "No valid ingredients found for optimization" }, 400);
    }

    console.log("🧮 API: Converted ingredients:", JSON.stringify(ingredients, null, 2));

    // Create optimization targets
    const targets = createTargetsFromMacros(targetMacros);
    console.log("🎯 API: Optimization targets:", targets);

    // Helper: check ±5% macro accuracy
    const within5 = (value: number, target: number) => Math.abs(value - target) <= 0.05 * Math.max(50, target);

    // Run optimization with current ingredients
    let workingIngredients: Ingredient[] = [...ingredients];
    let optimizationResult = optimizeMeal(workingIngredients, targets);

    // If infeasible or outside ±5%, try augmenting with helper raw ingredients and re-optimize
    const needsAugment =
      !optimizationResult.feasible ||
      !(
        within5(optimizationResult.achieved.calories, targets.calories) &&
        within5(optimizationResult.achieved.protein, targets.protein) &&
        within5(optimizationResult.achieved.carbs, targets.carbs) &&
        within5(optimizationResult.achieved.fat, targets.fat)
      );

    if (needsAugment) {
      console.warn("⚠️ API: Augmenting ingredients to improve feasibility/accuracy");

      // Normalize/canonicalize names helper to avoid duplicates like "Greek Yogurt" vs "Greek Yogurt (Non-Fat)"
      const norm = (s: string) => (s || "")
        .toLowerCase()
        .replace(/\([^\)]*\)/g, "") // remove parentheses content
        .replace(/\s+/g, " ")
        .trim();
      const canonical = (s: string) => {
        const n = norm(s);
        if (n.includes("greek") && n.includes("yogurt")) return "greek yogurt";
        if (n.includes("cottage") && n.includes("cheese")) return "cottage cheese";
        if (n.includes("whey")) return "whey protein isolate";
        if (n.includes("egg") && n.includes("white")) return "egg whites";
        if (n.includes("olive") && n.includes("oil")) return "olive oil";
        if (n.includes("peanut") && n.includes("butter")) return "peanut butter";
        if (n.includes("oat")) return "oats";
        if (n.includes("banana")) return "banana";
        return n;
      };
      const existingCanonical = new Set(workingIngredients.map((i) => canonical(i.name)));

      // Define raw helper ingredients (per-gram values) - Updated with accurate USDA data
      const helpers: Ingredient[] = [
        {
          name: "Greek Yogurt Non-Fat",
          cal: 0.59, // 59 kcal / 100g
          prot: 0.10, // 10 g / 100g
          carb: 0.036, // 3.6 g / 100g
          fat: 0.004, // 0.4 g / 100g
        },
        {
          name: "Cottage Cheese Low-Fat",
          cal: 0.98, // 98 kcal / 100g
          prot: 0.11, // 11 g / 100g
          carb: 0.03, // 3 g / 100g
          fat: 0.04, // 4 g / 100g
        },
        {
          name: "Whey Protein Isolate",
          cal: 3.7,  // ~370 kcal / 100g
          prot: 0.90, // ~90 g / 100g
          carb: 0.03, // ~3 g / 100g
          fat: 0.01,  // ~1 g / 100g
        },
        {
          name: "Egg Whites",
          cal: 0.52,  // 52 kcal / 100g
          prot: 0.109, // 10.9 g / 100g
          carb: 0.011, // 1.1 g / 100g
          fat: 0.002,  // 0.2 g / 100g
        },
        {
          name: "Extra Lean Ground Beef",
          cal: 1.37, // 137 kcal / 100g (95% lean, 5% fat)
          prot: 0.30, // 30 g / 100g
          carb: 0.0, // 0 g / 100g
          fat: 0.026, // 2.6 g / 100g
        },
        // New vegetables with accurate USDA values (per gram)
        {
          name: "Broccoli Raw",
          cal: 0.34, // 34 kcal / 100g
          prot: 0.028, // 2.8 g / 100g
          carb: 0.07, // 7.0 g / 100g
          fat: 0.004, // 0.4 g / 100g
        },
        {
          name: "Carrot Raw",
          cal: 0.41, // 41 kcal / 100g
          prot: 0.009, // 0.9 g / 100g
          carb: 0.096, // 9.6 g / 100g
          fat: 0.002, // 0.2 g / 100g
        },
        {
          name: "Tomato Raw",
          cal: 0.18, // 18 kcal / 100g
          prot: 0.009, // 0.9 g / 100g
          carb: 0.039, // 3.9 g / 100g
          fat: 0.002, // 0.2 g / 100g
        },
        {
          name: "Cucumber Raw",
          cal: 0.16, // 16 kcal / 100g
          prot: 0.007, // 0.7 g / 100g
          carb: 0.036, // 3.6 g / 100g
          fat: 0.001, // 0.1 g / 100g
        },
        {
          name: "Lettuce Raw",
          cal: 0.15, // 15 kcal / 100g
          prot: 0.014, // 1.4 g / 100g
          carb: 0.029, // 2.9 g / 100g
          fat: 0.002, // 0.2 g / 100g
        },
        {
          name: "Cabbage Raw",
          cal: 0.25, // 25 kcal / 100g
          prot: 0.013, // 1.3 g / 100g
          carb: 0.058, // 5.8 g / 100g
          fat: 0.001, // 0.1 g / 100g
        },
        {
          name: "Cauliflower Raw",
          cal: 0.25, // 25 kcal / 100g
          prot: 0.019, // 1.9 g / 100g
          carb: 0.05, // 5.0 g / 100g
          fat: 0.003, // 0.3 g / 100g
        },
        // Updated grains and pasta to raw values
        {
          name: "White Rice Raw",
          cal: 3.65, // 365 kcal / 100g
          prot: 0.071, // 7.1 g / 100g
          carb: 0.80, // 80 g / 100g
          fat: 0.007, // 0.7 g / 100g
        },
        {
          name: "Brown Rice Raw",
          cal: 3.70, // 370 kcal / 100g
          prot: 0.079, // 7.9 g / 100g
          carb: 0.77, // 77 g / 100g
          fat: 0.029, // 2.9 g / 100g
        },
        {
          name: "Pasta Raw",
          cal: 3.71, // 371 kcal / 100g
          prot: 0.13, // 13 g / 100g
          carb: 0.75, // 75 g / 100g
          fat: 0.015, // 1.5 g / 100g
        },
        {
          name: "Oats",
          cal: 3.89, // 389 kcal / 100g
          prot: 0.169, // 16.9 g / 100g
          carb: 0.663, // 66.3 g / 100g
          fat: 0.069, // 6.9 g / 100g
        },
        // Bread types
        {
          name: "White Bread",
          cal: 2.65, // 265 kcal / 100g
          prot: 0.09, // 9 g / 100g
          carb: 0.49, // 49 g / 100g
          fat: 0.032, // 3.2 g / 100g
        },
        {
          name: "Whole Wheat Bread",
          cal: 2.47, // 247 kcal / 100g
          prot: 0.13, // 13 g / 100g
          carb: 0.41, // 41 g / 100g
          fat: 0.042, // 4.2 g / 100g
        },
        {
          name: "Banana",
          cal: 0.89, // 89 kcal / 100g
          prot: 0.011, // 1.1 g / 100g
          carb: 0.23, // 23 g / 100g
          fat: 0.003, // 0.3 g / 100g
        },
        {
          name: "Olive Oil",
          cal: 8.84, // 884 kcal / 100g
          prot: 0.0,
          carb: 0.0,
          fat: 1.0, // 100 g / 100g
        },
        {
          name: "Peanut Butter",
          cal: 5.88, // 588 kcal / 100g
          prot: 0.25, // 25 g / 100g
          carb: 0.20, // 20 g / 100g
          fat: 0.50, // 50 g / 100g
        },
      ];

      const achieved = optimizationResult.achieved || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const deficits = {
        cal: targets.calories - achieved.calories,
        prot: targets.protein - achieved.protein,
        carb: targets.carbs - achieved.carbs,
        fat: targets.fat - achieved.fat,
      };

      // Add helpers based on deficits
      if (deficits.prot > 0) {
        if (!existingCanonical.has(canonical("Whey Protein Isolate"))) {
          workingIngredients.push(helpers[2]);
          existingCanonical.add(canonical("Whey Protein Isolate"));
        } else if (!existingCanonical.has(canonical("Egg Whites"))) {
          workingIngredients.push(helpers[3]);
          existingCanonical.add(canonical("Egg Whites"));
        } else if (!existingCanonical.has(canonical("Greek Yogurt (Non-Fat)"))) {
          workingIngredients.push(helpers[0]);
          existingCanonical.add(canonical("Greek Yogurt (Non-Fat)"));
        } else if (!existingCanonical.has(canonical("Cottage Cheese (Low-Fat)"))) {
          workingIngredients.push(helpers[1]);
          existingCanonical.add(canonical("Cottage Cheese (Low-Fat)"));
        }
      }
      if (deficits.carb > 0) {
        if (!existingCanonical.has(canonical("Oats"))) {
          workingIngredients.push(helpers[4]);
          existingCanonical.add(canonical("Oats"));
        } else if (!existingCanonical.has(canonical("Banana"))) {
          workingIngredients.push(helpers[5]);
          existingCanonical.add(canonical("Banana"));
        }
      }
      if (deficits.fat > 0) {
        if (!existingCanonical.has(canonical("Olive Oil"))) {
          workingIngredients.push(helpers[6]);
          existingCanonical.add(canonical("Olive Oil"));
        } else if (!existingCanonical.has(canonical("Peanut Butter"))) {
          workingIngredients.push(helpers[7]);
          existingCanonical.add(canonical("Peanut Butter"));
        }
      }

      // If calories are still under and none added, add a balanced carb (oats)
      if (
        (deficits.cal > 0 && workingIngredients.length === ingredients.length) &&
        !existingCanonical.has(canonical("Oats"))
      ) {
        workingIngredients.push(helpers[4]);
        existingCanonical.add(canonical("Oats"));
      }

      // Re-run optimization with augmented list
      optimizationResult = optimizeMeal(workingIngredients, targets);

      // If still not within ±5%, and protein is low while carbs or fat are high, try adding pure protein and re-optimize once more
      const stillOutside =
        !(
          within5(optimizationResult.achieved.calories, targets.calories) &&
          within5(optimizationResult.achieved.protein, targets.protein) &&
          within5(optimizationResult.achieved.carbs, targets.carbs) &&
          within5(optimizationResult.achieved.fat, targets.fat)
        );

      if (stillOutside) {
        const ach = optimizationResult.achieved;
        const protLow = ach.protein < targets.protein * 0.95;
        const carbsHigh = ach.carbs > targets.carbs * 1.05;
        const fatHigh = ach.fat > targets.fat * 1.05;
        if (protLow && (carbsHigh || fatHigh)) {
          if (!existingCanonical.has(canonical("Whey Protein Isolate")) && !workingIngredients.find(i => canonical(i.name)===canonical("Whey Protein Isolate"))) {
            workingIngredients.push(helpers[2]);
            existingCanonical.add(canonical("Whey Protein Isolate"));
          } else if (!existingCanonical.has(canonical("Egg Whites")) && !workingIngredients.find(i => canonical(i.name)===canonical("Egg Whites"))) {
            workingIngredients.push(helpers[3]);
            existingCanonical.add(canonical("Egg Whites"));
          }
          optimizationResult = optimizeMeal(workingIngredients, targets);
        }
      }

      if (!optimizationResult.feasible) {
        console.error("❌ API: Optimization failed even after augmentation");
        return json({ error: "Optimization not feasible even after adding helper ingredients" }, 400);
      }
    }

    console.log("✅ API: Optimization successful:", JSON.stringify(optimizationResult, null, 2));

    // Convert back to meal format
    const optimizedMeal = convertOptimizationToMeal(
      mealToOptimize,
      optimizationResult,
      workingIngredients,
    );

    console.log("🍽️ API: Optimized meal:", JSON.stringify(optimizedMeal, null, 2));

    // Update the meal plan with optimized meal
    const updatedWeeklyPlan = [...weeklyPlan];
    updatedWeeklyPlan[dayIndex] = {
      ...updatedWeeklyPlan[dayIndex],
      meals: [...updatedWeeklyPlan[dayIndex].meals],
    };

    // Replace the meal with optimized version
    updatedWeeklyPlan[dayIndex].meals[mealIndex] = {
      meal_name: mealToOptimize.meal_name,
      meal_title: optimizedMeal.mealTitle,
      ingredients: optimizedMeal.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount, // grams
        unit: ing.unit || "g",
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        macrosString: ing.macrosString,
      })),
      total_calories: optimizedMeal.totalCalories,
      total_protein: optimizedMeal.totalProtein,
      total_carbs: optimizedMeal.totalCarbs,
      total_fat: optimizedMeal.totalFat,
    };

    // Recalculate daily totals
    const dayMeals = updatedWeeklyPlan[dayIndex].meals;
    const dailyTotals: { calories: number; protein: number; carbs: number; fat: number } = dayMeals.reduce(
      (
        totals: { calories: number; protein: number; carbs: number; fat: number },
        meal: any,
      ) => ({
        calories: totals.calories + (meal.total_calories || 0),
        protein: totals.protein + (meal.total_protein || 0),
        carbs: totals.carbs + (meal.total_carbs || 0),
        fat: totals.fat + (meal.total_fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    updatedWeeklyPlan[dayIndex].daily_totals = {
      calories: Math.round(dailyTotals.calories * 100) / 100,
      protein: Math.round(dailyTotals.protein * 100) / 100,
      carbs: Math.round(dailyTotals.carbs * 100) / 100,
      fat: Math.round(dailyTotals.fat * 100) / 100,
    };

    // Recalculate weekly summary
    const weeklySummary: { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number } = updatedWeeklyPlan.reduce(
      (
        summary: { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number },
        day: any,
      ) => ({
        totalCalories: summary.totalCalories + (day.daily_totals?.calories || 0),
        totalProtein: summary.totalProtein + (day.daily_totals?.protein || 0),
        totalCarbs: summary.totalCarbs + (day.daily_totals?.carbs || 0),
        totalFat: summary.totalFat + (day.daily_totals?.fat || 0),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
    );

    const finalWeeklySummary = {
      totalCalories: Math.round(weeklySummary.totalCalories * 100) / 100,
      totalProtein: Math.round(weeklySummary.totalProtein * 100) / 100,
      totalCarbs: Math.round(weeklySummary.totalCarbs * 100) / 100,
      totalFat: Math.round(weeklySummary.totalFat * 100) / 100,
    };

    // Save updated AI plan to database
    const updatedAiPlan = {
      weeklyMealPlan: updatedWeeklyPlan,
      weeklySummary: finalWeeklySummary,
    };

    console.log("💾 API: Saving optimized AI plan to database");
    await editAiPlan({ ai_plan: updatedAiPlan }, userId);

    console.log("✅ API: AI meal plan optimization completed successfully");

    return json({
      success: true,
      optimizedMeal,
      updatedMealPlan: updatedAiPlan,
      achieved: optimizationResult.achieved,
    });

  } catch (error: any) {
    console.error("❌ API: AI meal plan optimization error:", error);
    return json({
      error: error.message || "Failed to optimize AI meal plan",
      details: error.toString(),
    }, 500);
  }
}
