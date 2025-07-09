import {
  MealMacroDistribution,
  type MacroSplitterFormValues,
} from '@/lib/schemas';
import {
  AiMealInputTypes,
  CalculatedMealMacros,
  TotalMacros,
} from '../types/toolsGlobalTypes';
import { UseFormReturn } from 'react-hook-form';
import { defaultMacroPercentages } from '@/lib/constants';
import { SuggestMealsForMacrosInput } from '@/ai/flows/suggest-meals-for-macros';

export function customMacroSplit(
  totalMacros: TotalMacros,
  mealMacroDistribution: MacroSplitterFormValues['mealDistributions']
): CalculatedMealMacros[] {
  return mealMacroDistribution.map((mealPct) => ({
    mealName: mealPct.mealName,
    Calories: Math.round(
      totalMacros.calories * ((mealPct.calories_pct || 0) / 100)
    ),
    'Protein (g)': Math.round(
      totalMacros.protein_g * ((mealPct.calories_pct || 0) / 100)
    ),
    'Carbs (g)': Math.round(
      totalMacros.carbs_g * ((mealPct.calories_pct || 0) / 100)
    ),
    'Fat (g)': Math.round(
      totalMacros.fat_g * ((mealPct.calories_pct || 0) / 100)
    ),
  }));
}

export function getMealMacroStats(
  form: UseFormReturn<{
    mealDistributions: {
      mealName: string;
      calories_pct: number;
    }[];
  }>
) {
  const watchedMealDistributions = form.watch('mealDistributions');
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
  profileData,
  currentPreferences,
}: AiMealInputTypes): SuggestMealsForMacrosInput {
  const aiInput = {
    mealName: targetMacros.mealName,
    targetCalories: targetMacros.calories,
    targetProteinGrams: targetMacros.protein,
    targetCarbsGrams: targetMacros.carbs,
    targetFatGrams: targetMacros.fat,
    age: profileData?.age ?? undefined,
    gender: profileData?.gender ?? undefined,
    activityLevel: profileData?.activityLevel ?? undefined,
    dietGoal: profileData?.dietGoalOnboarding ?? undefined,
    preferredDiet: currentPreferences.preferredDiet,
    preferredCuisines: currentPreferences.preferredCuisines,
    dispreferredCuisines: currentPreferences.dispreferredCuisines,
    preferredIngredients: currentPreferences.preferredIngredients,
    dispreferredIngredients: currentPreferences.dispreferredIngredients,
    allergies: currentPreferences.allergies,
  };

  Object.keys(aiInput).forEach(
    (key) =>
      aiInput[key as keyof SuggestMealsForMacrosInput] === undefined &&
      delete aiInput[key as keyof SuggestMealsForMacrosInput]
  );

  return aiInput;
}
