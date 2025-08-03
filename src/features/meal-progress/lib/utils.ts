import { Meal, MealNameType } from '@/lib/schemas';
import { MealProgressEntry, ChartData } from '../types'; // Update import path

export function getPlannedMealByType(
  plannedMeals: Meal[],
  mealType: MealNameType
) {
  return plannedMeals.find((meal) => meal.name === mealType);
}

export function getMealProgressByType(
  progress: MealProgressEntry[],
  mealType: MealProgressEntry['meal_type']
): MealProgressEntry | undefined {
  return progress.find((p) => p.meal_type === mealType);
}

export function generateChartData(
  plannedMeals: Meal[],
  progress: MealProgressEntry[]
): ChartData[] {
  const mealTypes: MealProgressEntry['meal_type'][] = [
    'Breakfast',
    'Morning Snack',
    'Lunch',
    'Afternoon Snack',
    'Dinner',
    'Evening Snack',
  ];

  return mealTypes.map((mealType) => {
    const planned = getPlannedMealByType(
      plannedMeals,
      mealType as MealNameType
    );
    const tracked = getMealProgressByType(progress, mealType);

    return {
      meal_type: mealType,
      consumed_calories: tracked?.consumed_calories || 0,
      target_calories: planned?.total_calories || 0,
    };
  });
}

export function calculateDayTotals(
  plannedMeals: Meal[],
  progress: MealProgressEntry[]
) {
  const totalTarget = plannedMeals.reduce(
    (sum, meal) => sum + meal.total_calories!,
    0
  );
  const totalConsumed = progress.reduce(
    (sum, p) => sum + p.consumed_calories,
    0
  );

  return {
    totalTarget,
    totalConsumed,
    difference: totalConsumed - totalTarget,
    percentage:
      totalTarget > 0 ? Math.round((totalConsumed / totalTarget) * 100) : 0,
  };
}
