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
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GlobalCalculatedTargets } from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { saveSmartPlannerData } from '../../lib/data-service';
import { customizePlanFormSchema } from '../../lib/schema';
import { customizePlanFormValues } from '../../types/toolsGlobalTypes';
import CustomizeToolTip from './CustomizeToolTip';
import CustomizePlanTable from './CustomizePlanTable';
import SubmitButton from '@/components/ui/SubmitButton';

type CustomizePlanFormProps = {
  results: GlobalCalculatedTargets;
  weight: number;
  planData: any;
};

function CustomizePlanForm({
  results,
  weight,
  planData,
}: CustomizePlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<customizePlanFormValues>({
    resolver: zodResolver(customizePlanFormSchema),
    defaultValues: {
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    },
  });

  const [customPlanResults, setCustomPlanResults] =
    useState<GlobalCalculatedTargets | null>(null);

  const isLoading = form.formState.isSubmitting;
  const watchedCustomInputs = form.watch([
    'custom_total_calories',
    'custom_protein_per_kg',
    'remaining_calories_carb_pct',
  ]);

  function handleResetForm() {
    form.reset({
      ...form.getValues(),
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    });
    setCustomPlanResults(null);
    toast({
      title: 'Custom Plan Reset',
      description: 'Custom plan inputs have been reset.',
    });
  }

  async function onSubmit(formData: customizePlanFormValues) {
    if (user?.uid) {
      try {
        await saveSmartPlannerData(user.uid, {
          formValues: formData,
          results,
        });
        toast({
          title: 'Calculation Complete',
          description: 'Your smart calorie plan has been generated and saved.',
        });
      } catch {
        toast({
          title: 'Save Error',
          description: 'Could not save calculation results.',
          variant: 'destructive',
        });
      }
    }
  }

  useEffect(
    function () {
      if (planData) form.reset(planData);
    },
    [form, planData]
  );

  useEffect(() => {
    const [customTotalCalories, customProteinPerKg, remainingCarbPct] =
      watchedCustomInputs;

    const effectiveTotalCalories =
      customTotalCalories !== undefined && customTotalCalories > 0
        ? customTotalCalories
        : results.finalTargetCalories || 0;

    const defaultProteinPerKg =
      results.proteinGrams &&
      results.current_weight_for_custom_calc &&
      results.current_weight_for_custom_calc > 0
        ? results.proteinGrams / results.current_weight_for_custom_calc
        : 1.6;

    const effectiveProteinPerKg =
      customProteinPerKg !== undefined && customProteinPerKg >= 0
        ? customProteinPerKg
        : defaultProteinPerKg;

    const calculatedProteinGrams = weight * effectiveProteinPerKg;
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
      finalTargetCalories: Math.round(finalCustomTotalCalories),
      proteinGrams: Math.round(calculatedProteinGrams),
      proteinCalories: Math.round(calculatedProteinCalories),
      proteinTargetPct:
        finalCustomTotalCalories > 0
          ? Math.round(
              (calculatedProteinCalories / finalCustomTotalCalories) * 100
            )
          : calculatedProteinGrams > 0
          ? 100
          : 0,
      carbGrams: Math.round(calculatedCarbGrams),
      carbCalories: Math.round(calculatedCarbCalories),
      carbTargetPct:
        finalCustomTotalCalories > 0
          ? Math.round(
              (calculatedCarbCalories / finalCustomTotalCalories) * 100
            )
          : 0,
      fatGrams: Math.round(calculatedFatGrams),
      fatCalories: Math.round(calculatedFatCalories),
      fatTargetPct:
        finalCustomTotalCalories > 0
          ? Math.round((calculatedFatCalories / finalCustomTotalCalories) * 100)
          : 0,
      bmr: results?.bmr,
      tdee: results?.tdee,
      current_weight_for_custom_calc: weight,
      estimatedWeeklyWeightChangeKg:
        results?.tdee && finalCustomTotalCalories
          ? ((results.tdee - finalCustomTotalCalories) * 7) / 7700
          : undefined,
    };

    if (JSON.stringify(customPlanResults) !== JSON.stringify(newCustomPlan))
      setCustomPlanResults(newCustomPlan);
  }, [watchedCustomInputs, results, customPlanResults, weight]);

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
                              results.finalTargetCalories
                                ? formatNumber(results.finalTargetCalories, {
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
                        results.finalTargetCalories
                          ? formatNumber(results.finalTargetCalories, {
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
                          results.current_weight_for_custom_calc
                            ? formatNumber(
                                results.current_weight_for_custom_calc,
                                {
                                  maximumFractionDigits: 1,
                                }
                              )
                            : weight
                            ? formatNumber(weight, {
                                maximumFractionDigits: 1,
                              })
                            : 'N/A'
                        } kg). Affects protein, carbs, and fat distribution.
                        Original estimate:
                        ${
                          results.current_weight_for_custom_calc &&
                          results.current_weight_for_custom_calc > 0 &&
                          results.proteinGrams
                            ? formatNumber(
                                results.proteinGrams /
                                  results.current_weight_for_custom_calc,
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
                        results.current_weight_for_custom_calc &&
                        results.current_weight_for_custom_calc > 0 &&
                        results.proteinGrams
                          ? formatNumber(
                              results.proteinGrams /
                                results.current_weight_for_custom_calc,
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
            name='remaining_calories_carb_pct'
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
            disabled={isLoading}
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
