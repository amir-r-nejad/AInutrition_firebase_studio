import { MealMacroDistribution } from '@/lib/schemas';

export const headerLabels = [
  {
    key: 'meal',
    label: 'Meal',
    className: 'sticky left-0 bg-card z-10 w-[120px] text-left font-medium',
  },
  { key: 'cal_pct', label: '%Cal', className: 'text-right min-w-[70px]' },
  { key: 'p_pct', label: '%P', className: 'text-right min-w-[70px]' },
  { key: 'c_pct', label: '%C', className: 'text-right min-w-[70px]' },
  {
    key: 'f_pct',
    label: '%F',
    className: 'text-right min-w-[70px] border-r',
  },
  { key: 'kcal', label: 'kcal', className: 'text-right min-w-[60px]' },
  { key: 'p_g', label: 'P(g)', className: 'text-right min-w-[60px]' },
  { key: 'c_g', label: 'C(g)', className: 'text-right min-w-[60px]' },
  { key: 'f_g', label: 'F(g)', className: 'text-right min-w-[60px]' },
];

export const macroPctKeys: (keyof Omit<MealMacroDistribution, 'mealName'>)[] = [
  'calories_pct',
  'protein_pct',
  'carbs_pct',
  'fat_pct',
];
