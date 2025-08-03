import {
  daysOfWeek,
  defaultMacroPercentages,
  mealNames,
} from "@/lib/constants";
import {
  UserProfile,
  GeneratePersonalizedMealPlanInput,
  MealNameType,
  WeeklyMealPlan,
  UserPlan,
  UserMealPlan,
} from "@/lib/schemas";
import { DailyTargetsTypes, MealToOptimizeTypes } from "../types";
import { requiredFields } from "./config";

export function mapProfileToMealPlanInput(
  data: {
    meal_data?: UserMealPlan["meal_data"];
    target_daily_calories?: number;
    target_protein_g?: number;
    target_carbs_g?: number;
    target_fat_g?: number;
    meal_distributions?: UserProfile["meal_distributions"];
    preferred_diet?: string;
    allergies?: string[];
    dispreferred_ingredients?: string[];
    preferred_ingredients?: string[];
    medical_conditions?: string[];
  } & Partial<UserProfile> &
    Partial<UserPlan>,
): GeneratePersonalizedMealPlanInput {
  // Extract meal data with proper fallbacks
  const mealData = {
    target_daily_calories:
      data.target_daily_calories || data.custom_total_calories || 2000,
    target_protein_g: data.target_protein_g || data.custom_protein_g || 150,
    target_carbs_g: data.target_carbs_g || data.custom_carbs_g || 200,
    target_fat_g: data.target_fat_g || data.custom_fat_g || 65,
  };

  // Get meal distributions from macro splitter
  const mealDistributions = data.meal_distributions || [
    {
      mealName: "Breakfast",
      calories_pct: 25,
      protein_pct: 25,
      carbs_pct: 25,
      fat_pct: 25,
    },
    {
      mealName: "Morning Snack",
      calories_pct: 10,
      protein_pct: 10,
      carbs_pct: 10,
      fat_pct: 10,
    },
    {
      mealName: "Lunch",
      calories_pct: 30,
      protein_pct: 30,
      carbs_pct: 30,
      fat_pct: 30,
    },
    {
      mealName: "Afternoon Snack",
      calories_pct: 10,
      protein_pct: 10,
      carbs_pct: 10,
      fat_pct: 10,
    },
    {
      mealName: "Dinner",
      calories_pct: 20,
      protein_pct: 20,
      carbs_pct: 20,
      fat_pct: 20,
    },
    {
      mealName: "Evening Snack",
      calories_pct: 5,
      protein_pct: 5,
      carbs_pct: 5,
      fat_pct: 5,
    },
  ];

  // Validate meal distributions
  for (const meal of mealDistributions) {
    if (
      !meal.mealName ||
      typeof meal.calories_pct !== "number" ||
      meal.calories_pct <= 0
    ) {
      console.error("Invalid meal distribution:", meal);
      throw new Error(
        `Invalid meal distribution for ${meal.mealName || "a meal"}: mealName and calories_pct must be valid (calories_pct > 0)`,
      );
    }
  }

  // Check sum of calories_pct
  const totalCaloriesPct = mealDistributions.reduce(
    (sum, meal) => sum + meal.calories_pct,
    0,
  );
  if (Math.abs(totalCaloriesPct - 100) > 0.01) {
    console.error("Invalid total calories_pct:", totalCaloriesPct);
    throw new Error(
      `Total calories_pct must sum to 100%. Current sum: ${totalCaloriesPct.toFixed(0)}%`,
    );
  }

  // Extract user preferences
  let mappedDiet = "Standard";
  if (data.preferred_diet) {
    mappedDiet = data.preferred_diet;
  } else if (data.primary_diet_goal) {
    switch (data.primary_diet_goal) {
      case "fat_loss":
      case "muscle_gain":
      case "recomp":
        mappedDiet = "Standard";
        break;
      default:
        mappedDiet = "Standard";
    }
  }

  const preferences = {
    diet: mappedDiet,
    allergies: data.allergies || [],
    disliked: data.dispreferred_ingredients || [],
    preferred: data.preferred_ingredients || [],
  };

  // Generate mealTargets array
  const mealTargets = mealDistributions.map((meal) => {
    const calories = mealData.target_daily_calories * (meal.calories_pct / 100);
    // Use calories_pct as fallback for protein, carbs, and fat if not provided
    const proteinPct = meal.protein_pct ?? meal.calories_pct;
    const carbsPct = meal.carbs_pct ?? meal.calories_pct;
    const fatPct = meal.fat_pct ?? meal.calories_pct;

    const protein = mealData.target_protein_g * (proteinPct / 100);
    const carbs = mealData.target_carbs_g * (carbsPct / 100);
    const fat = mealData.target_fat_g * (fatPct / 100);

    if (
      !Number.isFinite(calories) ||
      calories <= 0 ||
      !Number.isFinite(protein) ||
      !Number.isFinite(carbs) ||
      !Number.isFinite(fat)
    ) {
      console.error("Invalid calculated macros for meal:", meal);
      throw new Error(
        `Invalid calculated macros for meal ${meal.mealName}: Calories, protein, carbs, and fat must be valid positive numbers`,
      );
    }

    return {
      mealName: meal.mealName,
      calories,
      protein,
      carbs,
      fat,
    };
  });

  console.log("Mapping profile to meal plan input:", {
    mealData,
    mealDistributions,
    mealTargets,
    preferences,
  });

  return {
    age: data.age || 30,
    biological_sex: data.biological_sex || "other",
    height_cm: data.height_cm || 170,
    current_weight: data.current_weight_kg || 70,
    target_weight: data.target_weight || 70,
    physical_activity_level: data.physical_activity_level || "moderate",
    primary_diet_goal: data.primary_diet_goal || "fat_loss",
    mealTargets,
    preferred_diet: preferences.diet,
    allergies: preferences.allergies,
    dispreferrred_ingredients: preferences.disliked,
    preferred_ingredients: preferences.preferred,
    medical_conditions: data.medical_conditions || [],
    medications: data.medications || [],
  };
}

export function getAdjustedMealInput(
  profileData: Partial<UserProfile>,
  dailyTargets: DailyTargetsTypes,
  mealToOptimize: MealToOptimizeTypes,
) {
  let mealDistribution;
  const userMealDistributions = (profileData as any).meal_distributions;
  if (!userMealDistributions) {
    mealDistribution = defaultMacroPercentages[mealToOptimize.name];
  } else {
    mealDistribution = userMealDistributions.find(
      (meal: any) => meal.mealName === mealToOptimize.name,
    );
    if (!mealDistribution) {
      console.error("Meal not found in distributions:", mealToOptimize.name);
      mealDistribution = defaultMacroPercentages[mealToOptimize.name];
    }
  }

  const targetMacrosForMeal = {
    calories:
      dailyTargets.targetCalories! * (mealDistribution.calories_pct / 100),
    protein: dailyTargets.targetProtein! * (mealDistribution.protein_pct / 100),
    carbs: dailyTargets.targetCarbs! * (mealDistribution.carbs_pct / 100),
    fat: dailyTargets.targetFat! * (mealDistribution.fat_pct / 100),
  };

  const preparedIngredients = mealToOptimize.ingredients.map((ing) => ({
    name: ing.name,
    quantity: Number(ing.quantity) || 0,
    unit: ing.unit,
    calories: Number(ing.calories) || 0,
    protein: Number(ing.protein) || 0,
    carbs: Number(ing.carbs) || 0,
    fat: Number(ing.fat) || 0,
  }));

  return {
    originalMeal: {
      name: mealToOptimize.name,
      custom_name: mealToOptimize.custom_name || "",
      ingredients: preparedIngredients,
      total_calories: Number(mealToOptimize.total_calories) || 0,
      total_protein: Number(mealToOptimize.total_protein) || 0,
      total_carbs: Number(mealToOptimize.total_carbs) || 0,
      total_fat: Number(mealToOptimize.total_fat) || 0,
    },
    targetMacros: targetMacrosForMeal,
    userProfile: {
      age: profileData.age ?? undefined,
      biological_sex: profileData.biological_sex ?? undefined,
      physical_activity_level: profileData.physical_activity_level ?? undefined,
      primary_diet_goal: profileData.primary_diet_goal ?? undefined,
      preferred_diet: profileData.preferred_diet ?? undefined,
      allergies: profileData.allergies ?? [],
      medical_conditions: profileData.medical_conditions ?? [],
      medications: profileData.medications ?? [],
    },
  };
}

export function getMissingProfileFields(
  profile: Partial<UserProfile>,
): (keyof Partial<UserProfile>)[] {
  return requiredFields.filter(
    (field) => !profile[field as keyof UserProfile],
  ) as (keyof UserProfile)[];
}

export function generateInitialWeeklyPlan(): WeeklyMealPlan {
  return {
    days: daysOfWeek.map((day) => ({
      dayOfWeek: day,
      meals: mealNames.map((mealName) => ({
        name: mealName,
        custom_name: "",
        ingredients: [],
        total_calories: null,
        total_protein: null,
        total_carbs: null,
        total_fat: null,
      })),
      daily_totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    })),
  };
}
