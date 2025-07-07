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

    PARAMS_NAME.forEach(
      (name) => name !== 'mealName' && removeQueryParams(name)
    );
  }

  function updateUrlWithTargets(
    targets: TargetMacros,
    isDemo: boolean = false
  ) {
    if (!targets) return;

    PARAMS_NAME.forEach((name) => {
      if (name !== 'demo') updateQueryParams(name, targets[name].toString());

      if (name === 'demo') {
        isDemo ? updateQueryParams('demo', 'true') : removeQueryParams('demo');
      }
    });
  }

  function getCurrentMealParams() {
    return {
      mealName: getQueryParams('mealName') || '',
      calories: getQueryParams('calories')
        ? Number(getQueryParams('calories'))
        : null,
      protein: getQueryParams('protein')
        ? Number(getQueryParams('protein'))
        : null,
      carbs: getQueryParams('carbs') ? Number(getQueryParams('carbs')) : null,
      fat: getQueryParams('fat') ? Number(getQueryParams('fat')) : null,
      isDemo: getQueryParams('demo') === 'true',
    };
  }

  function clearMealParams() {
    PARAMS_NAME.forEach((name) => removeQueryParams(name));
  }

  return {
    updateUrlWithMeal,
    updateUrlWithTargets,
    getCurrentMealParams,
    clearMealParams,
  };
}
