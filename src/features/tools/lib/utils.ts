import {
  MealMacroDistribution,
  SuggestMealsForMacrosInput,
  type MacroSplitterFormValues,
} from '@/lib/schemas';
import {
  AiMealInputTypes,
  CalculatedMealMacros,
  TotalMacros,
} from '../types/toolsGlobalTypes';
import { UseFormReturn } from 'react-hook-form';
import { defaultMacroPercentages } from '@/lib/constants';

export function customMacroSplit(
  totalMacros: TotalMacros,
  mealMacroDistribution: MacroSplitterFormValues['meal_distributions']
): CalculatedMealMacros[] {
  return mealMacroDistribution.map((mealPct) => ({
    mealName: mealPct.mealName,
    Calories: Number(
      (totalMacros.calories * ((mealPct.calories_pct || 0) / 100)).toFixed(1)
    ),
    'Protein (g)': Number(
      (totalMacros.protein_g * ((mealPct.calories_pct || 0) / 100)).toFixed(1)
    ),
    'Carbs (g)': Number(
      (totalMacros.carbs_g * ((mealPct.calories_pct || 0) / 100)).toFixed(1)
    ),
    'Fat (g)': Number(
      (totalMacros.fat_g * ((mealPct.calories_pct || 0) / 100)).toFixed(1)
    ),
  }));
}

export function getMealMacroStats(
  form: UseFormReturn<{
    meal_distributions: {
      mealName: string;
      calories_pct: number;
    }[];
  }>
) {
  const watchedMealDistributions = form.watch('meal_distributions');
  const calculateColumnSum = (
    macroKey: keyof Omit<MealMacroDistribution, 'mealName'>
  ) => {
    return watchedMealDistributions.reduce(
      (sum, meal) => sum + (Number(meal[macroKey]) || 0),
      0
    );
  };

  const columnSums = {
    calories_pct: calculateColumnSum('calories_pct'),
  };

  return { columnSums, watchedMealDistributions };
}

export function getExampleTargetsForMeal(mealName: string) {
  const exampleDailyTotals = {
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFat: 67,
  };

  const mealDistribution = defaultMacroPercentages[mealName];

  return {
    mealName,
    calories: Math.round(
      exampleDailyTotals.targetCalories * (mealDistribution.calories_pct / 100)
    ),
    protein: Math.round(
      exampleDailyTotals.targetProtein * (mealDistribution.protein_pct / 100)
    ),
    carbs: Math.round(
      exampleDailyTotals.targetCarbs * (mealDistribution.carbs_pct / 100)
    ),
    fat: Math.round(
      exampleDailyTotals.targetFat * (mealDistribution.fat_pct / 100)
    ),
  };
}

export function prepareAiMealInput({
  targetMacros,
  profile,
}: AiMealInputTypes): SuggestMealsForMacrosInput {
  const aiInput: SuggestMealsForMacrosInput = {
    meal_name: targetMacros.mealName,
    target_calories: targetMacros.calories,
    target_protein_grams: targetMacros.protein,
    target_carbs_grams: targetMacros.carbs,
    target_fat_grams: targetMacros.fat,
    age: profile.age ?? undefined,
    gender: profile.biological_sex ?? undefined,
    activity_level: profile.physical_activity_level ?? undefined,
    diet_goal: profile.primary_diet_goal ?? undefined,
    preferred_diet: profile.preferred_diet ?? undefined,
    preferred_cuisines: profile.preferred_cuisines ?? undefined,
    dispreferrred_cuisines: profile.dispreferrred_cuisines ?? undefined,
    preferred_ingredients: profile.preferred_ingredients ?? undefined,
    dispreferrred_ingredients: profile.dispreferrred_ingredients ?? undefined,
    allergies: profile.allergies ?? undefined,
  };

  Object.keys(aiInput).forEach(
    (key) =>
      aiInput[key as keyof SuggestMealsForMacrosInput] === undefined &&
      delete aiInput[key as keyof SuggestMealsForMacrosInput]
  );

  return aiInput;
}
