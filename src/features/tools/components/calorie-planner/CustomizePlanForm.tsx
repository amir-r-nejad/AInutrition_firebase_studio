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
import SubmitButton from '@/components/ui/SubmitButton';
import { useToast } from '@/hooks/use-toast';
import {
  BaseProfileData,
  GlobalCalculatedTargets,
  UserPlanType,
} from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCcw, Save } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { customizePlanFormSchema } from '../../lib/schema';
import { customizePlanFormValues } from '../../types/toolsGlobalTypes';
import CustomizePlanTable from './CustomizePlanTable';
import CustomizeToolTip from './CustomizeToolTip';
import { editPlan } from '@/features/profile/actions/apiUserPlan';

type CustomizePlanFormProps = {
  plan: UserPlanType;
  profile: BaseProfileData;
  clientId?: string;
};

function CustomizePlanForm({
  plan,
  profile,
  clientId,
}: CustomizePlanFormProps) {
  const { toast } = useToast();

  const form = useForm<customizePlanFormValues>({
    resolver: zodResolver(customizePlanFormSchema),
    defaultValues: {
      ...plan,
      ...{
        remaining_calories_carbs_percentage:
          plan.remaining_calories_carbs_percentage ?? 50,
      },
    },
  });

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
        ...form.getValues(),
        custom_total_calories: null,
        custom_protein_per_kg: null,
        remaining_calories_carbs_percentage: 50,
      });
      setCustomPlanResults(null);

      const planToResest = {
        ...form.getValues(),

        custom_carbs_g: null,
        custom_carbs_percentage: null,
        custom_fat_g: null,
        custom_fat_percentage: null,
        custom_protein_g: null,
        custom_protein_percentage: null,
        custom_total_calories_final: null,
      };

      try {
        await editPlan(planToResest, clientId);

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

  async function onSubmit(formData: customizePlanFormValues) {
    if (!customPlanResults) return;

    const updateObj: GlobalCalculatedTargets = {};
    const excludedKeys = [
      'estimated_weekly_weight_change_kg',
      'carb_calories',
      'protein_calories',
      'fat_calories',
      'current_weight_for_custom_calc',
    ];
    (
      Object.keys(customPlanResults) as (keyof GlobalCalculatedTargets)[]
    ).forEach((key) => {
      if (!excludedKeys.includes(key as string))
        updateObj[key] = customPlanResults[key];
    });

    try {
      await editPlan(
        {
          ...formData,
          ...updateObj,
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

    const effectiveTotalCalories =
      customTotalCalories && customTotalCalories > 0
        ? customTotalCalories
        : plan.target_daily_calories || 0;

    const defaultProteinPerKg =
      plan.target_protein_g &&
      plan.current_weight_for_custom_calc &&
      plan.current_weight_for_custom_calc > 0
        ? plan.target_protein_g / plan.current_weight_for_custom_calc
        : 1.6;

    const effectiveProteinPerKg =
      customProteinPerKg && customProteinPerKg >= 0
        ? customProteinPerKg
        : defaultProteinPerKg;

    const calculatedProteinGrams =
      profile.current_weight_kg! * effectiveProteinPerKg;
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
      bmr_kcal: plan.bmr_kcal,
      maintenance_calories_tdee: plan.maintenance_calories_tdee,

      current_weight_for_custom_calc: profile.current_weight_kg,
      estimated_weekly_weight_change_kg:
        plan.maintenance_calories_tdee && finalCustomTotalCalories
          ? ((plan.maintenance_calories_tdee - finalCustomTotalCalories) * 7) /
            7700
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
                  <CustomizeToolTip
                    message={`Override the system-calculated total daily calories. Leave blank to use the original estimate:
                          ${
                            plan?.target_daily_calories
                              ? formatNumber(plan.target_daily_calories, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'
                          } kcal.`}
                  />
                </FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type='number'
                      placeholder={`e.g., ${
                        plan?.target_daily_calories
                          ? formatNumber(plan.target_daily_calories, {
                              maximumFractionDigits: 0,
                            })
                          : '2000'
                      }`}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : parseInt(e.target.value, 10)
                        )
                      }
                      step='1'
                      onWheel={(e) =>
                        (e.currentTarget as HTMLInputElement).blur()
                      }
                    />
                  </div>
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
                  <CustomizeToolTip
                    message={` Set your desired protein intake in grams per kg of your current body weight (
                      ${
                        plan?.current_weight_for_custom_calc
                          ? formatNumber(plan.current_weight_for_custom_calc, {
                              maximumFractionDigits: 1,
                            })
                          : profile?.current_weight_kg
                          ? formatNumber(profile.current_weight_kg, {
                              maximumFractionDigits: 1,
                            })
                          : 'N/A'
                      } kg). Affects protein, carbs, and fat distribution.
                      Original estimate:
                      ${
                        plan?.current_weight_for_custom_calc &&
                        plan?.current_weight_for_custom_calc > 0 &&
                        plan?.target_protein_g
                          ? formatNumber(
                              plan.target_protein_g /
                                plan.current_weight_for_custom_calc,
                              { maximumFractionDigits: 1 }
                            )
                          : 'N/A'
                      } g/kg.`}
                  />
                </FormLabel>
                <FormControl>
                  <div>
                    <Input
                      type='number'
                      placeholder={`e.g., ${
                        plan?.current_weight_for_custom_calc &&
                        plan?.current_weight_for_custom_calc > 0 &&
                        plan?.target_protein_g
                          ? formatNumber(
                              plan.target_protein_g /
                                plan.current_weight_for_custom_calc,
                              { maximumFractionDigits: 1 }
                            )
                          : '1.6'
                      }`}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : parseFloat(e.target.value)
                        )
                      }
                      step='0.1'
                      onWheel={(e) =>
                        (e.currentTarget as HTMLInputElement).blur()
                      }
                    />
                  </div>
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
                    <CustomizeToolTip message='After protein is set, this slider determines how the remaining calories are split between carbohydrates and fat. Slide to adjust the carbohydrate percentage; fat will be the remainder.' />
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

        <CustomizePlanTable plan={customPlanResults} />

        <div className='mt-6 flex justify-end gap-1'>
          <Button
            disabled={isLoading || isResetting}
            type='button'
            variant='destructive'
            onClick={handleResetForm}
            size='sm'
          >
            <RefreshCcw className='size-3' />
            Reset
          </Button>

          <SubmitButton
            className='w-min'
            icon={<Save className='size-3' />}
            isLoading={isLoading}
            label='Save'
            loadingLabel='Saving..'
            size='sm'
          />
        </div>
      </form>
    </Form>
  );
}

export default CustomizePlanForm;
