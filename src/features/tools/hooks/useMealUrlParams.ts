import { useQueryParams } from '@/hooks/useQueryParams';

type TargetMacros = {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const PARAMS_NAME = ['mealName', 'calories', 'protein', 'carbs', 'fat', 'demo'];

export function useMealUrlParams() {
  const { getQueryParams, updateQueryParams, updateAndRemoveQueryParams } =
    useQueryParams();

  function updateUrlWithMeal(mealName: string) {
    const [, ...paramsToRemove] = PARAMS_NAME;

    updateAndRemoveQueryParams({ mealName: mealName }, paramsToRemove);
  }

  function updateUrlWithTargets(targets: TargetMacros) {
    if (!targets) return;

    updateQueryParams(
      ['mealName', 'calories', 'protein', 'carbs', 'fat'],
      [
        targets.mealName,
        targets.calories.toString(),
        targets.protein.toString(),
        targets.carbs.toString(),
        targets.fat.toString(),
      ]
    );
  }

  function getCurrentMealParams(selectedMealName: string | null) {
    if (!selectedMealName) return null;

    const caloriesParam = getQueryParams('calories');
    const proteinParam = getQueryParams('protein');
    const carbsParam = getQueryParams('carbs');
    const fatParam = getQueryParams('fat');

    if (caloriesParam && proteinParam && carbsParam && fatParam) {
      return {
        mealName: selectedMealName,
        calories: parseFloat(caloriesParam),
        protein: parseFloat(proteinParam),
        carbs: parseFloat(carbsParam),
        fat: parseFloat(fatParam),
      };
    }

    return null;
  }

  return {
    getQueryParams,
    getCurrentMealParams,
    updateUrlWithMeal,
    updateUrlWithTargets,
  };
}
