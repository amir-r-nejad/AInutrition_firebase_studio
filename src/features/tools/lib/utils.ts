import {
  MealMacroDistribution,
  type MacroSplitterFormValues,
} from '@/lib/schemas';
import { CalculatedMealMacros, TotalMacros } from '../types/toolsGlobalTypes';
import { UseFormReturn } from 'react-hook-form';

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
      totalMacros.protein_g * ((mealPct.protein_pct || 0) / 100)
    ),
    'Carbs (g)': Math.round(
      totalMacros.carbs_g * ((mealPct.carbs_pct || 0) / 100)
    ),
    'Fat (g)': Math.round(totalMacros.fat_g * ((mealPct.fat_pct || 0) / 100)),
  }));
}

export function getMealMacroStats(
  form: UseFormReturn<{
    mealDistributions: {
      mealName: string;
      calories_pct: number;
      protein_pct: number;
      carbs_pct: number;
      fat_pct: number;
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
    protein_pct: calculateColumnSum('protein_pct'),
    carbs_pct: calculateColumnSum('carbs_pct'),
    fat_pct: calculateColumnSum('fat_pct'),
  };

  return { columnSums, watchedMealDistributions };
}
