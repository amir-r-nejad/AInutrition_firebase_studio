import { MealMacroDistribution } from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';

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

export const macroColumns = [
  {
    key: 'name',
    header: 'Macronutrient',
    cellClassName: 'font-medium',
  },
  {
    key: 'percentage',
    header: '% of Daily Calories',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row: any) =>
      `${formatNumber(row.percentage, { maximumFractionDigits: 0 })}%`,
  },
  {
    key: 'grams',
    header: 'Grams per Day',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row: any) =>
      `${formatNumber(row.grams, { maximumFractionDigits: 1 })} g`,
  },
  {
    key: 'calories',
    header: 'Calories per Day',
    headerClassName: 'text-right',
    cellClassName: 'text-right',
    render: (row: any) =>
      `${formatNumber(row.calories, { maximumFractionDigits: 0 })} kcal`,
  },
] as const;
