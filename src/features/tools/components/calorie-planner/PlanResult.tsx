import { Card, CardContent } from '@/components/ui/card';
import ReusableTable from '@/components/ui/ReusableTable';
import SectionHeader from '@/components/ui/SectionHeader';
import { GlobalCalculatedTargets } from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { macroColumns } from '../../lib/config';

function PlanResult({ results }: { results: GlobalCalculatedTargets | null }) {
  if (!results) return null;

  return (
    <Card className='mt-8 bg-muted/30 shadow-inner'>
      <SectionHeader
        title='Original Plan (System Generated)'
        className='text-2xl font-semibold text-primary'
      />

      <CardContent className='space-y-4'>
        <div className='grid md:grid-cols-2 gap-4 text-base'>
          <p>
            <strong>Maintenance Calories (TDEE):</strong>{' '}
            {results.maintenance_calories_tdee
              ? formatNumber(results.maintenance_calories_tdee)
              : 'N/A'}{' '}
            kcal
          </p>
          <p>
            <strong>Basal Metabolic Rate (BMR):</strong>{' '}
            {results.bmr_kcal ? formatNumber(results.bmr_kcal) : 'N/A'} kcal
          </p>
        </div>
        <hr />
        <p className='text-lg font-medium'>
          <strong>
            Primary Target Daily Calories:{' '}
            <span className='text-primary'>
              {results.target_daily_calories
                ? formatNumber(results.target_daily_calories)
                : 'N/A'}{' '}
              kcal
            </span>
          </strong>
        </p>
        <p className='text-sm text-muted-foreground'>
          {' '}
          (Based on your weight &amp; diet goals. Optional BF% goal may refine
          this.)
        </p>

        <p>
          <strong>Estimated Weekly Progress:</strong>{' '}
          {results.estimated_weekly_weight_change_kg &&
          results.estimated_weekly_weight_change_kg >= 0
            ? `${formatNumber(results.estimated_weekly_weight_change_kg ?? 0, {
                maximumFractionDigits: 2,
              })} kg surplus/week (Potential Gain)`
            : `${formatNumber(
                Math.abs(results.estimated_weekly_weight_change_kg ?? 0),
                { maximumFractionDigits: 2 }
              )} kg deficit/week (Potential Loss)`}
        </p>
        <hr />
        <ReusableTable<typeof macroColumns>
          columns={macroColumns}
          data={[
            {
              name: 'Protein',
              percentage: results.target_protein_percentage,
              grams: results.target_protein_g,
              calories: results.protein_calories,
            },
            {
              name: 'Carbohydrates',
              percentage: results.target_carbs_percentage,
              grams: results.target_carbs_g,
              calories: results.carb_calories,
            },
            {
              name: 'Fat',
              percentage: results.target_fat_percentage,
              grams: results.target_fat_g,
              calories: results.fat_calories,
            },
          ]}
          caption="This breakdown is based on your inputs and calculated goal. For custom macro adjustments, use the 'Customize Your Plan' section below."
          title='Suggested Macronutrient Breakdown'
        />
      </CardContent>
    </Card>
  );
}

export default PlanResult;
