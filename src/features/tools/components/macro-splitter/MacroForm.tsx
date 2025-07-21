'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import FinalMacrosOverview from '@/features/tools/components/macro-splitter/FinalMacrosOverview';
import { headerLabels, macroPctKeys } from '@/features/tools/lib/config';
import {
  customMacroSplit,
  getMealMacroStats,
} from '@/features/tools/lib/utils';
import { CalculatedMealMacros } from '@/features/tools/types/toolsGlobalTypes';
import { useToast } from '@/hooks/use-toast';
import {
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/constants';
import {
  BaseProfileData,
  MacroSplitterFormSchema,
  UserPlanType,
  type MacroSplitterFormValues,
} from '@/lib/schemas';
import { cn, formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SplitSquareHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

function MacroForm({
  plan,
  profile,
}: {
  profile: BaseProfileData;
  plan: UserPlanType;
}) {
  const { toast } = useToast();
  const [calculatedSplit, setCalculatedSplit] = useState<
    CalculatedMealMacros[] | null
  >(null);

  const form = useForm<MacroSplitterFormValues>({
    resolver: zodResolver(MacroSplitterFormSchema),
    defaultValues: {
      ...{
        meal_distributions:
          profile.meal_distributions ??
          defaultMealNames.map((name) => ({
            mealName: name,
            calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
          })),
      },
    },
  });
  const { columnSums, watchedMealDistributions } = getMealMacroStats(form);
  const { fields } = useFieldArray({
    control: form.control,
    name: 'meal_distributions',
  });

  async function handleReset() {
    const defaultValues = defaultMealNames.map((name) => ({
      mealName: name,
      calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
      protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
      carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
      fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
    }));
    form.reset({ meal_distributions: defaultValues });
    setCalculatedSplit(null);

    try {
      await editProfile({
        meal_distributions: defaultValues,
      });

      toast({
        title: 'Success',
        description: 'Meal distributions reset successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(data: MacroSplitterFormValues) {
    const totalCalories =
      plan.custom_total_calories ?? plan.target_daily_calories;
    const protein = plan.custom_protein_g ?? plan.target_protein_g;
    const carbs = plan.custom_carbs_g ?? plan.target_carbs_g;
    const fat = plan.custom_fat_g ?? plan.target_fat_g;

    const macroTargets = {
      calories: totalCalories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    };

    const result = customMacroSplit(macroTargets, data.meal_distributions);

    setCalculatedSplit(result);

    try {
      await editProfile({
        meal_distributions: data.meal_distributions,
      });

      toast({
        title: 'Success',
        description: 'Meal distributions saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <Card className='shadow-lg'>
            <SectionHeader
              className='text-2xl'
              title='Meal Macro Percentage & Value Distribution'
              description='Enter percentages. Each percentage column must sum to 100%. Calculated values update live. Percentages must be whole numbers (e.g., 20, not 20.5).'
            />

            <CardContent>
              <ScrollArea className='w-full border rounded-md'>
                <Table className='min-w-[800px]'>
                  <TableHeader>
                    <TableRow>
                      {headerLabels.map((header) => (
                        <TableHead
                          key={header.key}
                          className={cn(
                            'px-2 py-2 text-xs font-medium h-9',
                            header.className
                          )}
                        >
                          {header.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const currentPercentages =
                        watchedMealDistributions[index];
                      let mealCalories = NaN,
                        mealProteinGrams = NaN,
                        mealCarbsGrams = NaN,
                        mealFatGrams = NaN;

                      if (currentPercentages && plan) {
                        const calories =
                          plan.custom_total_calories ??
                          plan.target_daily_calories ??
                          0;
                        const protein =
                          plan.custom_protein_g ?? plan.target_protein_g ?? 0;
                        const carbs =
                          plan.custom_carbs_g ?? plan.target_carbs_g ?? 0;
                        const fat = plan.custom_fat_g ?? plan.target_fat_g ?? 0;

                        mealCalories =
                          calories *
                          ((currentPercentages.calories_pct || 0) / 100);
                        mealProteinGrams =
                          protein *
                          ((currentPercentages.calories_pct || 0) / 100);
                        mealCarbsGrams =
                          carbs *
                          ((currentPercentages.calories_pct || 0) / 100);
                        mealFatGrams =
                          fat * ((currentPercentages.calories_pct || 0) / 100);
                      }

                      return (
                        <TableRow key={field.id}>
                          <TableCell
                            className={cn(
                              'font-medium px-2 py-1 text-sm h-10',
                              headerLabels[0].className
                            )}
                          >
                            {field.mealName}
                          </TableCell>
                          {macroPctKeys.map((macroKey) => (
                            <TableCell
                              key={macroKey}
                              className={cn(
                                'px-1 py-1 text-right tabular-nums h-10'
                              )}
                            >
                              <FormField
                                control={form.control}
                                name={`meal_distributions.${index}.${macroKey}`}
                                render={({ field: itemField }) => (
                                  <FormItem className='inline-block'>
                                    <FormControl>
                                      <div>
                                        <Input
                                          type='number'
                                          step='0.1'
                                          {...itemField}
                                          value={itemField.value ?? ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                              itemField.onChange(null);
                                            } else {
                                              const numVal = parseFloat(val);
                                              itemField.onChange(
                                                isNaN(numVal) ? null : numVal
                                              );
                                            }
                                          }}
                                          onWheel={(e) =>
                                            (
                                              e.currentTarget as HTMLInputElement
                                            ).blur()
                                          }
                                          className='w-16 text-right tabular-nums text-sm px-1 py-0.5 h-8'
                                          min='0'
                                          max='100'
                                        />
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          ))}
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                            {isNaN(mealCalories)
                              ? 'N/A'
                              : formatNumber(mealCalories, {
                                  maximumFractionDigits: 0,
                                })}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                            {isNaN(mealProteinGrams)
                              ? 'N/A'
                              : formatNumber(mealProteinGrams, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-2 text-right tabular-nums h-10'>
                            {isNaN(mealCarbsGrams)
                              ? 'N/A'
                              : formatNumber(mealCarbsGrams, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                            {isNaN(mealFatGrams)
                              ? 'N/A'
                              : formatNumber(mealFatGrams, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow className='font-semibold text-xs h-10 bg-muted/70'>
                      <TableCell
                        className={cn('px-2 py-1', headerLabels[0].className)}
                      >
                        Input % Totals:
                      </TableCell>
                      {macroPctKeys.map((key) => {
                        const sum = columnSums[key];
                        const isSum100 = Math.abs(sum - 100) < 0.01;

                        return (
                          <TableCell
                            key={`sum-${key}`}
                            className={cn(
                              'px-2 py-1 text-right tabular-nums',
                              isSum100 ? 'text-green-600' : 'text-destructive'
                            )}
                          >
                            {formatNumber(sum / 100, {
                              style: 'percent',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                            {isSum100 ? (
                              <CheckCircle2 className='ml-1 h-3 w-3 inline-block' />
                            ) : (
                              <AlertTriangle className='ml-1 h-3 w-3 inline-block' />
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell className='px-2 py-1 text-right tabular-nums'>
                        {formatNumber(
                          watchedMealDistributions.reduce(
                            (sum, meal) =>
                              sum +
                              (plan?.custom_total_calories ??
                                plan?.target_daily_calories ??
                                0) *
                                ((meal.calories_pct || 0) / 100),
                            0
                          ),
                          { maximumFractionDigits: 0 }
                        )}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-right tabular-nums'>
                        {formatNumber(
                          watchedMealDistributions.reduce(
                            (sum, meal) =>
                              sum +
                              (plan?.custom_protein_g ??
                                plan?.target_protein_g ??
                                0) *
                                ((meal.calories_pct || 0) / 100),
                            0
                          ),
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }
                        )}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-right tabular-nums'>
                        {formatNumber(
                          watchedMealDistributions.reduce(
                            (sum, meal) =>
                              sum +
                              (plan?.custom_carbs_g ??
                                plan?.target_carbs_g ??
                                0) *
                                ((meal.calories_pct || 0) / 100),
                            0
                          ),
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }
                        )}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-right tabular-nums'>
                        {formatNumber(
                          watchedMealDistributions.reduce(
                            (sum, meal) =>
                              sum +
                              (plan?.custom_fat_g ?? plan?.target_fat_g ?? 0) *
                                ((meal.calories_pct || 0) / 100),
                            0
                          ),
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <ScrollBar orientation='horizontal' />
              </ScrollArea>
              {form.formState.errors.meal_distributions?.root?.message && (
                <p className='text-sm font-medium text-destructive mt-2'>
                  {form.formState.errors.meal_distributions.root.message}
                </p>
              )}
              {form.formState.errors.meal_distributions &&
                !form.formState.errors.meal_distributions.root &&
                Object.values(form.formState.errors.meal_distributions).map(
                  (errorObj, index) => {
                    if (
                      errorObj &&
                      typeof errorObj === 'object' &&
                      errorObj !== null &&
                      !Array.isArray(errorObj)
                    ) {
                      return Object.entries(errorObj).map(
                        ([key, error]) =>
                          error &&
                          typeof error === 'object' &&
                          error !== null &&
                          'message' in error &&
                          typeof error.message === 'string' && (
                            <p
                              key={`${index}-${key}`}
                              className='text-sm font-medium text-destructive mt-1'
                            >
                              Error in {defaultMealNames[index]}{' '}
                              {key.replace('_pct', ' %')}:{' '}
                              {error.message.replace(/ף/g, '')}
                            </p>
                          )
                      );
                    }
                    return null;
                  }
                )}
            </CardContent>
          </Card>

          <div className='flex space-x-4 mt-6'>
            <Button
              type='submit'
              className='flex-1 text-lg py-3'
              disabled={form.formState.isSubmitting}
            >
              <SplitSquareHorizontal className='mr-2 h-5 w-5' />
              {form.formState.isSubmitting ? (
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              ) : null}
              Save &amp; Show Final Split
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={handleReset}
              disabled={form.formState.isSubmitting}
              className='flex-1 text-lg py-3'
            >
              <RefreshCw className='mr-2 h-5 w-5' />
              Reset
            </Button>
          </div>
        </form>
      </Form>

      <FinalMacrosOverview calculatedSplit={calculatedSplit} />
    </>
  );
}

export default MacroForm;
