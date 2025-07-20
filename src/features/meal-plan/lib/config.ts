import { ChartConfig } from '@/components/ui/chart';
import { BaseProfileData } from '@/lib/schemas';

export const chartConfig: ChartConfig = {
  calories: { label: 'Calories (kcal)', color: 'hsl(var(--chart-1))' },
  protein: { label: 'Protein (g)', color: 'hsl(var(--chart-2))' },
  fat: { label: 'Fat (g)', color: 'hsl(var(--chart-3))' },
  carbs: { label: 'Carbs (g)', color: 'hsl(var(--chart-4))' },
};

export const requiredFields: (keyof BaseProfileData)[] = [
  'age',
  'biological_sex',
  'current_weight_kg',
  'height_cm',
  'physical_activity_level',
  'primary_diet_goal',
];
