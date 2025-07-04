import { useSearchParams, useRouter, usePathname } from 'next/navigation';

//FIX => IT SHOULD BE MORE FLEXIABLE AND MORE USEABLE

type TargetMacros = {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function useMealUrlParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function updateUrlWithMeal(mealName: string) {
    const urlSearchParams = new URLSearchParams(searchParams);

    urlSearchParams.set('mealName', mealName);
    urlSearchParams.delete('calories');
    urlSearchParams.delete('protein');
    urlSearchParams.delete('carbs');
    urlSearchParams.delete('fat');
    urlSearchParams.delete('demo');

    router.push(`${pathname}?${urlSearchParams.toString()}`, {
      scroll: false,
    });
  }

  function updateUrlWithTargets(
    targets: TargetMacros,
    isDemo: boolean = false
  ) {
    if (!targets) return;

    const urlSearchParams = new URLSearchParams(searchParams);
    urlSearchParams.set('mealName', targets.mealName);
    urlSearchParams.set('calories', targets.calories.toString());
    urlSearchParams.set('protein', targets.protein.toString());
    urlSearchParams.set('carbs', targets.carbs.toString());
    urlSearchParams.set('fat', targets.fat.toString());

    if (isDemo) urlSearchParams.set('demo', 'true');
    else urlSearchParams.delete('demo');

    router.push(`${pathname}?${urlSearchParams.toString()}`, {
      scroll: false,
    });
  }

  function getCurrentMealParams() {
    return {
      mealName: searchParams.get('mealName') || '',
      calories: searchParams.get('calories')
        ? Number(searchParams.get('calories'))
        : null,
      protein: searchParams.get('protein')
        ? Number(searchParams.get('protein'))
        : null,
      carbs: searchParams.get('carbs')
        ? Number(searchParams.get('carbs'))
        : null,
      fat: searchParams.get('fat') ? Number(searchParams.get('fat')) : null,
      isDemo: searchParams.get('demo') === 'true',
    };
  }

  function clearMealParams() {
    const urlSearchParams = new URLSearchParams(searchParams);
    urlSearchParams.delete('mealName');
    urlSearchParams.delete('calories');
    urlSearchParams.delete('protein');
    urlSearchParams.delete('carbs');
    urlSearchParams.delete('fat');
    urlSearchParams.delete('demo');

    router.push(`${pathname}?${urlSearchParams.toString()}`, {
      scroll: false,
    });
  }

  return {
    updateUrlWithMeal,
    updateUrlWithTargets,
    getCurrentMealParams,
    clearMealParams,
  };
}
