import { MealMacroDistribution } from '@/lib/schemas';

export const headerLabels = [
  {
    key: 'meal',
    label: 'Meal',
    className: 'sticky left-0 bg-card z-10 w-[120px] text-left font-medium',
  },
  { key: 'cal_pct', label: '%Cal', className: 'text-right min-w-[70px]' },

  { key: 'kcal', label: 'kcal', className: 'text-right min-w-[60px]' },
  { key: 'p_g', label: 'P(g)', className: 'text-right min-w-[60px]' },
  { key: 'c_g', label: 'C(g)', className: 'text-right min-w-[60px]' },
  { key: 'f_g', label: 'F(g)', className: 'text-right min-w-[60px]' },
];

export const macroPctKeys: (keyof Omit<MealMacroDistribution, 'mealName'>)[] = [
  'calories_pct',
];
