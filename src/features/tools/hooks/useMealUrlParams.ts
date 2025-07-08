import { useQueryParams } from '@/hooks/useQueryParams';

type TargetMacros = {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const PARAMS_NAME = [
  'mealName',
  'calories',
  'protein',
  'carbs',
  'fat',
  'demo',
] as const;

export function useMealUrlParams() {
  const { getQueryParams, updateQueryParams, removeQueryParams } =
    useQueryParams();

  function updateUrlWithMeal(mealName: string) {
    updateQueryParams('mealName', mealName);

    PARAMS_NAME.forEach((name) => {
      if (name !== 'mealName') removeQueryParams(name);
    });
  }

  function updateUrlWithTargets(targets: TargetMacros) {
    if (!targets) return;

    updateQueryParams('mealName', targets.mealName);
    updateQueryParams('calories', targets.calories.toString());
    updateQueryParams('protein', targets.protein.toString());
    updateQueryParams('carbs', targets.carbs.toString());
    updateQueryParams('fat', targets.fat.toString());
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

  function clearMealParams() {
    PARAMS_NAME.forEach((name) => removeQueryParams(name));
  }

  return {
    getQueryParams,
    updateUrlWithMeal,
    updateUrlWithTargets,
    getCurrentMealParams,
    clearMealParams,
    updateQueryParams,
  };
}
