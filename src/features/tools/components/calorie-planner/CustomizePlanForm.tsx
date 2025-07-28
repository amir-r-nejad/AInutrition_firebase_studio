'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import {
  ExtendedProfileData,
  GlobalCalculatedTargets,
  UserPlanType,
} from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCcw, Save } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { editPlan } from '@/features/profile/actions/apiUserPlan';

// Create a simple form schema for the customize plan
const CustomizePlanFormSchema = {
  custom_total_calories: null as number | null,
  custom_protein_per_kg: null as number | null,
  remaining_calories_carbs_percentage: 50 as number,
};

type CustomizePlanFormValues = typeof CustomizePlanFormSchema;

type CustomizePlanFormProps = {
  plan: UserPlanType;
  profile: ExtendedProfileData;
  clientId?: string;
};

function CustomizePlanForm({
  plan,
  profile,
  clientId,
}: CustomizePlanFormProps) {
  const { toast } = useToast();

  const form = useForm<CustomizePlanFormValues>({
    defaultValues: {
      custom_total_calories: null,
      custom_protein_per_kg: null,
      remaining_calories_carbs_percentage: 50,
    },
  });

  if (!plan) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No plan data available. Please complete your profile setup first.
      </div>
    );
  }

  const [customPlanResults, setCustomPlanResults] =
    useState<GlobalCalculatedTargets | null>(null);

  const [isResetting, startResetting] = useTransition();

  const isLoading = form.formState.isSubmitting;
  const watchedCustomInputs = form.watch([
    'custom_total_calories',
    'custom_protein_per_kg',
    'remaining_calories_carbs_percentage',
  ]);

  async function handleResetForm() {
    startResetting(async () => {
      form.reset({
        custom_total_calories: null,
        custom_protein_per_kg: null,
        remaining_calories_carbs_percentage: 50,
      });
      setCustomPlanResults(null);

      try {
        await editPlan({}, clientId);

        toast({
          title: 'Custom Plan Reset',
          description: 'Custom plan inputs have been reset.',
        });
      } catch (error: any) {
        toast({
          title: 'Reset Error',
          description: error,
          variant: 'destructive',
        });
      }
    });
  }

  async function onSubmit(formData: CustomizePlanFormValues) {
    if (!customPlanResults) return;

    try {
      await editPlan(
        {
          ...formData,
          ...customPlanResults,
        },
        clientId
      );

      toast({
        title: 'Plan Saved',
        description: 'Your custom plan has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  useEffect(() => {
    const [customTotalCalories, customProteinPerKg, remainingCarbPct] =
      watchedCustomInputs;

    // Use plan.daily_calories instead of target_daily_calories
    const effectiveTotalCalories =
      customTotalCalories && customTotalCalories > 0
        ? customTotalCalories
        : plan.daily_calories || 0;

    const defaultProteinPerKg = 1.6; // Default value

    const effectiveProteinPerKg =
      customProteinPerKg && customProteinPerKg >= 0
        ? customProteinPerKg
        : defaultProteinPerKg;

    // Use profile.current_weight_kg instead of current_weight
    const calculatedProteinGrams =
      (profile.current_weight_kg || 70) * effectiveProteinPerKg;
    const calculatedProteinCalories = calculatedProteinGrams * 4;

    let remainingCaloriesForCustom =
      effectiveTotalCalories - calculatedProteinCalories;
    let calculatedCarbGrams = 0;
    let calculatedFatGrams = 0;
    let calculatedCarbCalories = 0;
    let calculatedFatCalories = 0;

    if (remainingCaloriesForCustom > 0) {
      const carbRatio = (remainingCarbPct ?? 50) / 100;
      const fatRatio = 1 - carbRatio;

      calculatedCarbCalories = remainingCaloriesForCustom * carbRatio;
      calculatedFatCalories = remainingCaloriesForCustom * fatRatio;

      calculatedCarbGrams = calculatedCarbCalories / 4;
      calculatedFatGrams = calculatedFatCalories / 9;
    } else if (remainingCaloriesForCustom < 0) {
      remainingCaloriesForCustom = 0;
    }

    calculatedCarbGrams = Math.max(0, calculatedCarbGrams);
    calculatedFatGrams = Math.max(0, calculatedFatGrams);
    calculatedCarbCalories = Math.max(0, calculatedCarbCalories);
    calculatedFatCalories = Math.max(0, calculatedFatCalories);

    const finalCustomTotalCalories =
      calculatedProteinCalories +
      calculatedCarbCalories +
      calculatedFatCalories;

    const newCustomPlan: GlobalCalculatedTargets = {
      custom_total_calories_final: Math.round(finalCustomTotalCalories),
      custom_protein_g: Math.round(calculatedProteinGrams),
      custom_protein_percentage:
        finalCustomTotalCalories > 0
          ? Math.round(
              (calculatedProteinCalories / finalCustomTotalCalories) * 100
            )
          : calculatedProteinGrams > 0
          ? 100
          : 0,
      custom_carbs_g: Math.round(calculatedCarbGrams),
      custom_carbs_percentage:
        finalCustomTotalCalories > 0
          ? Math.round(
              (calculatedCarbCalories / finalCustomTotalCalories) * 100
            )
          : 0,
      custom_fat_g: Math.round(calculatedFatGrams),
      custom_fat_percentage:
        finalCustomTotalCalories > 0
          ? Math.round((calculatedFatCalories / finalCustomTotalCalories) * 100)
          : 0,
      bmr_kcal: plan.bmr,
      maintenance_calories_tdee: plan.tdee,

      current_weight_for_custom_calc: profile.current_weight_kg,
      estimated_weekly_weight_change_kg:
        plan.tdee && finalCustomTotalCalories
          ? ((plan.tdee - finalCustomTotalCalories) * 7) / 7700
          : undefined,

      carb_calories: Math.round(calculatedCarbCalories),
      protein_calories: Math.round(calculatedProteinCalories),
      fat_calories: Math.round(calculatedFatCalories),
    };

    if (JSON.stringify(customPlanResults) !== JSON.stringify(newCustomPlan))
      setCustomPlanResults(newCustomPlan);
  }, [customPlanResults, plan, profile, watchedCustomInputs]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid md:grid-cols-2 gap-x-6 gap-y-4 items-start'>
          <FormField
            control={form.control}
            name='custom_total_calories'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center'>
                  Custom Total Calories
                  <span className="ml-2 text-xs text-muted-foreground">
                    Override the system-calculated total daily calories. Leave blank to use the original estimate:
                    {plan?.daily_calories
                      ? formatNumber(plan.daily_calories, {
                          maximumFractionDigits: 0,
                        })
                      : 'N/A'} kcal.
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder={`e.g., ${
                      plan?.daily_calories
                        ? formatNumber(plan.daily_calories, {
                            maximumFractionDigits: 0,
                          })
                        : '2000'
                    }`}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? null
                          : parseInt(e.target.value, 10)
                      )
                    }
                    step='1'
                    onWheel={(e) =>
                      (e.currentTarget as HTMLInputElement).blur()
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='custom_protein_per_kg'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center'>
                  Custom Protein (g/kg)
                  <span className="ml-2 text-xs text-muted-foreground">
                    Set your desired protein intake in grams per kg of your current body weight (
                    {profile?.current_weight_kg
                      ? formatNumber(profile.current_weight_kg, {
                          maximumFractionDigits: 1,
                        })
                      : 'N/A'} kg). Affects protein, carbs, and fat distribution.
                    Original estimate: 1.6 g/kg.
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='e.g., 1.6'
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? null
                          : parseFloat(e.target.value)
                      )
                    }
                    step='0.1'
                    onWheel={(e) =>
                      (e.currentTarget as HTMLInputElement).blur()
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='remaining_calories_carbs_percentage'
            render={({ field }) => {
              const currentCarbPct = field.value ?? 50;
              const currentFatPct = 100 - currentCarbPct;
              return (
                <FormItem className='md:col-span-2'>
                  <FormLabel className='flex items-center'>
                    Remaining Calories from Carbs (%)
                    <span className="ml-2 text-xs text-muted-foreground">
                      After protein is set, this slider determines how the remaining calories are split between carbohydrates and fat. Slide to adjust the carbohydrate percentage; fat will be the remainder.
                    </span>
                  </FormLabel>

                  <FormControl>
                    <div className='flex flex-col space-y-2 pt-1'>
                      <Slider
                        value={[currentCarbPct]}
                        onValueChange={(value) => field.onChange(value[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <div className='flex justify-between text-xs text-muted-foreground'>
                        <span>
                          Carbs:{' '}
                          {formatNumber(currentCarbPct, {
                            maximumFractionDigits: 0,
                          })}
                          %
                        </span>
                        <span>
                          Fat:{' '}
                          {formatNumber(currentFatPct, {
                            maximumFractionDigits: 0,
                          })}
                          %
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Results Display */}
        {customPlanResults && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Custom Plan Results</h3>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Total Calories</div>
                <div className='text-2xl font-bold'>
                  {formatNumber(customPlanResults.custom_total_calories_final || 0, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  kcal
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Protein</div>
                <div className='text-xl font-bold'>
                  {formatNumber(customPlanResults.custom_protein_g || 0, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g ({formatNumber(customPlanResults.custom_protein_percentage || 0, {
                    maximumFractionDigits: 0,
                  })}%)
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Carbs</div>
                <div className='text-xl font-bold'>
                  {formatNumber(customPlanResults.custom_carbs_g || 0, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g ({formatNumber(customPlanResults.custom_carbs_percentage || 0, {
                    maximumFractionDigits: 0,
                  })}%)
                </div>
              </div>
              <div className='p-4 border rounded-lg'>
                <div className='text-sm text-muted-foreground'>Fat</div>
                <div className='text-xl font-bold'>
                  {formatNumber(customPlanResults.custom_fat_g || 0, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g ({formatNumber(customPlanResults.custom_fat_percentage || 0, {
                    maximumFractionDigits: 0,
                  })}%)
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='mt-6 flex justify-end gap-2'>
          <Button
            disabled={isLoading || isResetting}
            type='button'
            variant='outline'
            onClick={handleResetForm}
            size='sm'
          >
            <RefreshCcw className='h-4 w-4' />
            Reset
          </Button>

          <Button
            type='submit'
            disabled={isLoading || !customPlanResults}
            size='sm'
          >
            <Save className='h-4 w-4' />
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CustomizePlanForm;