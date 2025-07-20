'use client';

import ReusableTable from '@/components/ui/ReusableTable';
import { GlobalCalculatedTargets } from '@/lib/schemas';
import { macroColumns } from '../../lib/config';

function CustomizePlanTable({
  plan,
}: {
  plan: GlobalCalculatedTargets | null;
}) {
  if (!plan) return null;

  return (
    <ReusableTable<typeof macroColumns>
      title=' Your Custom Plan Breakdown'
      columns={macroColumns}
      data={[
        {
          name: 'Protein',
          percentage: plan.custom_protein_percentage ?? 'N/A',
          grams: plan.custom_protein_g ?? 'N/A',
          calories: plan.protein_calories ?? 'N/A',
        },
        {
          name: 'Carbohydrates',
          percentage: plan.custom_carbs_percentage ?? 'N/A',
          grams: plan.custom_carbs_g ?? 'N/A',
          calories: plan.carb_calories ?? 'N/A',
        },
        {
          name: 'Fat',
          percentage: plan.custom_fat_percentage ?? 'N/A',
          grams: plan.custom_fat_g ?? 'N/A',
          calories: plan.fat_calories ?? 'N/A',
        },
      ]}
    />
  );
}

export default CustomizePlanTable;
