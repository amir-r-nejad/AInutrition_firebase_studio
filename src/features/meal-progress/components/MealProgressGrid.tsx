'use client';

import { Meal } from '@/lib/schemas';
import { MealCard } from './MealCard';
import { MealProgressEntry } from '../types';

type MealProgressGridProps = {
  meals: Meal[];
  progressMeals: MealProgressEntry[];
};

export function MealProgressGrid({
  meals,
  progressMeals,
}: MealProgressGridProps) {
  return (
    <div className='grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4'>
      {meals.map((meal) => (
        <MealCard
          key={meal.name}
          mealType={meal.name}
          meal={meal}
          progressMeal={progressMeals.find(
            (progressMeal) =>
              progressMeal?.meal_type?.toLowerCase() ===
              meal.name?.toLowerCase()
          )}
        />
      ))}
    </div>
  );
}
