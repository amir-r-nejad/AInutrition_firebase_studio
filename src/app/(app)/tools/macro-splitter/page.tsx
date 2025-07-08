'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Added ScrollBar
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
import { useAuth } from '@/features/auth/contexts/AuthContext';
import DailyMacroSummary from '@/features/tools/components/macro-splitter/DailyMacroSummary';
import { headerLabels, macroPctKeys } from '@/features/tools/lib/config';
import {
  customMacroSplit,
  getMealMacroStats,
} from '@/features/tools/lib/utils';
import {
  CalculatedMealMacros,
  TotalMacros,
} from '@/features/tools/types/toolsGlobalTypes';
import { useToast } from '@/hooks/use-toast';
import {
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/constants';
import { db } from '@/lib/firebase/clientApp';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  MacroSplitterFormSchema,
  preprocessDataForFirestore,
  type FullProfileType,
  type MacroSplitterFormValues,
} from '@/lib/schemas';
import { cn, formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  RefreshCw,
  SplitSquareHorizontal,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

export default function MacroSplitterPage() {
  const router = useRouter();
  const pathname = usePathname();

  const { user } = useAuth();
  const { toast } = useToast();
  const [dailyTargets, setDailyTargets] = useState<TotalMacros | null>(null);
  const [calculatedSplit, setCalculatedSplit] = useState<
    CalculatedMealMacros[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSourceMessage, setDataSourceMessage] = useState<string | null>(
    null
  );

  const form = useForm<MacroSplitterFormValues>({
    resolver: zodResolver(MacroSplitterFormSchema),
    defaultValues: {
      mealDistributions: defaultMealNames.map((name) => ({
        mealName: name,
        calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
        protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
        carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
        fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'mealDistributions',
  });

  const { columnSums, watchedMealDistributions } = getMealMacroStats(form);

  const loadDataForSplitter = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let targets: TotalMacros | null = null;
    let sourceMessage = '';

    try {
      const userProfileRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userProfileRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as FullProfileType;

        // Load meal distributions if saved
        if (
          profileData.mealDistributions &&
          Array.isArray(profileData.mealDistributions) &&
          profileData.mealDistributions.length === defaultMealNames.length
        ) {
          form.reset({ mealDistributions: profileData.mealDistributions });
          toast({
            title: 'Loaded Saved Split',
            description:
              'Your previously saved macro split percentages have been loaded.',
            duration: 3000,
          });
        } else {
          form.reset({
            // Reset to default percentages if none saved or invalid
            mealDistributions: defaultMealNames.map((name) => ({
              mealName: name,
              calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
              protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
              carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
              fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
            })),
          });
        }

        // Priority: Manual Macro Breakdown results, then Smart Planner results, then Profile estimation
        if (
          profileData.manualMacroResults &&
          profileData.manualMacroResults.totalCalories !== undefined &&
          profileData.manualMacroResults.totalCalories !== null
        ) {
          const manualResults = profileData.manualMacroResults;
          targets = {
            calories: manualResults.totalCalories || 0,
            protein_g: manualResults.proteinGrams || 0,
            carbs_g: manualResults.carbGrams || 0,
            fat_g: manualResults.fatGrams || 0,
            source: 'Manual Macro Breakdown (Smart Planner)',
          };
          sourceMessage =
            "Daily totals from 'Manual Macro Breakdown' in Smart Planner. Adjust there for changes.";
        } else if (
          profileData.smartPlannerData?.results?.finalTargetCalories !==
            undefined &&
          profileData.smartPlannerData?.results?.finalTargetCalories !== null
        ) {
          const usersCustomPlan = profileData.smartPlannerData.formValues;
          const defaultPlan = profileData.smartPlannerData.results;

          const calories = usersCustomPlan?.custom_total_calories
            ? usersCustomPlan.custom_total_calories
            : defaultPlan.finalTargetCalories;

          let smartResults;
          if (
            usersCustomPlan?.proteinGrams ||
            usersCustomPlan?.fatGrams ||
            usersCustomPlan?.carbGrams
          )
            smartResults = profileData.smartPlannerData.formValues;
          else smartResults = profileData.smartPlannerData.results;

          targets = {
            calories: calories || 0,
            protein_g: smartResults?.proteinGrams || 0,
            carbs_g: smartResults?.carbGrams || 0,
            fat_g: smartResults?.fatGrams || 0,
            source: 'Smart Calorie Planner Targets',
          };

          sourceMessage =
            "Daily totals from 'Smart Calorie Planner'. Adjust there for changes.";
        } else if (
          profileData.age &&
          profileData.gender &&
          profileData.current_weight &&
          profileData.height_cm &&
          profileData.activityLevel &&
          profileData.dietGoalOnboarding
        ) {
          const estimatedTargets = calculateEstimatedDailyTargets({
            age: profileData.age,
            gender: profileData.gender,
            currentWeight: profileData.current_weight,
            height: profileData.height_cm,
            activityLevel: profileData.activityLevel,
            dietGoal: profileData.dietGoalOnboarding,
            goalWeight: profileData.goal_weight_1m,
            bf_current: profileData.bf_current,
            bf_target: profileData.bf_target,
            waist_current: profileData.waist_current,
            waist_goal_1m: profileData.waist_goal_1m,
          });
          if (
            estimatedTargets.finalTargetCalories &&
            estimatedTargets.proteinGrams &&
            estimatedTargets.carbGrams &&
            estimatedTargets.fatGrams
          ) {
            targets = {
              calories: estimatedTargets.finalTargetCalories,
              protein_g: estimatedTargets.proteinGrams,
              carbs_g: estimatedTargets.carbGrams,
              fat_g: estimatedTargets.fatGrams,
              source: 'Profile Estimation',
            };
            sourceMessage =
              'Daily totals estimated from Profile. Use Smart Calorie Planner for more precision or manual input.';
          } else {
            toast({
              title: 'Profile Incomplete for Calculation',
              description:
                'Could not calculate daily totals from profile. Ensure all basic info, activity, and diet goal are set in Onboarding or Smart Planner.',
              variant: 'destructive',
              duration: 5000,
            });
          }
        } else {
          toast({
            title: 'Profile Incomplete',
            description:
              'Profile is incomplete. Please fill it via Onboarding or Smart Calorie Planner for daily totals.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } else {
        toast({
          title: 'Profile Not Found',
          description: 'Could not find user profile for daily totals.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load data for macro estimation.',
        variant: 'destructive',
      });
      console.error('Error in loadDataForSplitter:', error);
    }

    setDailyTargets(targets);
    setDataSourceMessage(sourceMessage);

    if (targets && sourceMessage) {
      toast({
        title: 'Daily Totals Loaded',
        description: sourceMessage,
        duration: 6000,
      });
    } else if (!targets) {
      toast({
        title: 'No Daily Totals',
        description:
          'Could not find or calculate daily macro totals. Please use the Smart Calorie Planner or complete your profile.',
        variant: 'destructive',
        duration: 6000,
      });
    }

    setIsLoading(false);
  }, [form, toast, user?.uid]);

  useEffect(() => {
    loadDataForSplitter();
  }, [loadDataForSplitter]);

  const onSubmit = async (data: MacroSplitterFormValues) => {
    if (!dailyTargets) {
      toast({
        title: 'Error',
        description:
          'Daily macro totals not available. Please ensure your profile is complete or use the Smart Calorie Planner.',
        variant: 'destructive',
      });
      return;
    }
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated.',
        variant: 'destructive',
      });
      return;
    }

    const result = customMacroSplit(dailyTargets, data.mealDistributions);
    setCalculatedSplit(result);

    try {
      const userProfileRef = doc(db, 'users', user.uid);
      const distributionsToSave = preprocessDataForFirestore(
        data.mealDistributions
      );

      await setDoc(
        userProfileRef,
        { mealDistributions: distributionsToSave },
        { merge: true }
      );

      toast({
        title: 'Split Calculated & Saved',
        description:
          'Macro split calculated and your percentages have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Calculation Complete (Save Failed)',
        description: 'Macro split calculated, but failed to save percentages.',
        variant: 'destructive',
      });
      console.error('Error saving meal distributions:', error);
    }
  };

  const handleReset = async () => {
    const defaultValues = defaultMealNames.map((name) => ({
      mealName: name,
      calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
      protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
      carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
      fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
    }));
    form.reset({ mealDistributions: defaultValues });
    setCalculatedSplit(null);
    if (user?.uid) {
      try {
        const userProfileRef = doc(db, 'users', user.uid);
        await setDoc(
          userProfileRef,
          { mealDistributions: null },
          { merge: true }
        );
        toast({
          title: 'Reset Complete',
          description: 'Percentages reset to defaults and saved.',
        });
      } catch (error) {
        toast({
          title: 'Reset Warning',
          description:
            'Percentages reset locally, but failed to save defaults to cloud.',
          variant: 'destructive',
        });
        console.error(
          'Error saving default meal distributions to Firestore:',
          error
        );
      }
    } else {
      toast({
        title: 'Reset Complete',
        description: 'Percentages reset to defaults.',
      });
    }
  };

  function handleSuggestMeals(mealData: CalculatedMealMacros) {
    const queryParams = new URLSearchParams({
      mealName: mealData.mealName,
      calories: mealData.Calories.toString(),
      protein: mealData['Protein (g)'].toString(),
      carbs: mealData['Carbs (g)'].toString(),
      fat: mealData['Fat (g)'].toString(),
    });

    router.push(`${pathname}?${queryParams.toString()}`);
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <Card className='shadow-lg'>
        <SectionHeader
          className='text-3xl font-bold flex items-center'
          title='Macro Splitter Tool'
          description='Distribute your total daily macros across your meals by percentage. Percentages must be whole numbers (e.g., 20, not 20.5).'
          icon={<SplitSquareHorizontal className='mr-3 h-8 w-8 text-primary' />}
        />

        <DailyMacroSummary targets={dailyTargets} message={dataSourceMessage} />
      </Card>

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

                      if (dailyTargets && currentPercentages) {
                        mealCalories =
                          dailyTargets.calories *
                          ((currentPercentages.calories_pct || 0) / 100);
                        mealProteinGrams =
                          dailyTargets.protein_g *
                          ((currentPercentages.protein_pct || 0) / 100);
                        mealCarbsGrams =
                          dailyTargets.carbs_g *
                          ((currentPercentages.carbs_pct || 0) / 100);
                        mealFatGrams =
                          dailyTargets.fat_g *
                          ((currentPercentages.fat_pct || 0) / 100);
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
                                'px-1 py-1 text-right tabular-nums h-10',
                                macroKey === 'fat_pct' ? 'border-r' : ''
                              )}
                            >
                              <FormField
                                control={form.control}
                                name={`mealDistributions.${index}.${macroKey}`}
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
                                            // Allow empty string for temporary state, Zod will validate on blur/submit
                                            if (val === '') {
                                              itemField.onChange(undefined); // Or null, depending on how Zod handles empty string for numbers
                                            } else {
                                              const numVal = parseFloat(val);
                                              itemField.onChange(
                                                isNaN(numVal)
                                                  ? undefined
                                                  : numVal
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
                              isSum100 ? 'text-green-600' : 'text-destructive',
                              key === 'fat_pct' ? 'border-r' : ''
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
                      <TableCell colSpan={4} className='px-2 py-1'></TableCell>
                    </TableRow>
                    <TableRow className='font-semibold text-sm bg-muted/70 h-10'>
                      <TableCell
                        className={cn('px-2 py-1', headerLabels[0].className)}
                      >
                        Calc. Value Totals:
                      </TableCell>
                      <TableCell
                        colSpan={4}
                        className='px-2 py-1 border-r'
                      ></TableCell>
                      {dailyTargets ? (
                        <>
                          <TableCell className='px-2 py-1 text-right tabular-nums'>
                            {formatNumber(
                              watchedMealDistributions.reduce(
                                (sum, meal) =>
                                  sum +
                                  dailyTargets.calories *
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
                                  dailyTargets.protein_g *
                                    ((meal.protein_pct || 0) / 100),
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
                                  dailyTargets.carbs_g *
                                    ((meal.carbs_pct || 0) / 100),
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
                                  dailyTargets.fat_g *
                                    ((meal.fat_pct || 0) / 100),
                                0
                              ),
                              {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              }
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={4} className='px-2 py-1 text-right'>
                          N/A
                        </TableCell>
                      )}
                    </TableRow>
                  </TableFooter>
                </Table>
                <ScrollBar orientation='horizontal' />
              </ScrollArea>
              {form.formState.errors.mealDistributions?.root?.message && (
                <p className='text-sm font-medium text-destructive mt-2'>
                  {form.formState.errors.mealDistributions.root.message}
                </p>
              )}
              {form.formState.errors.mealDistributions &&
                !form.formState.errors.mealDistributions.root &&
                Object.values(form.formState.errors.mealDistributions).map(
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
              disabled={
                !dailyTargets || form.formState.isSubmitting || isLoading
              }
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
              className='flex-1 text-lg py-3'
            >
              <RefreshCw className='mr-2 h-5 w-5' /> Reset
            </Button>
          </div>
        </form>
      </Form>

      {calculatedSplit && (
        <Card className='shadow-lg mt-8'>
          <SectionHeader
            className='text-2xl'
            title='Final Meal Macros (Snapshot)'
            description='This was the calculated split when you last clicked "Save &amp; Show Final Split".'
          />

          <CardContent>
            <ScrollArea className='w-full'>
              <Table className='min-w-[700px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='sticky left-0 bg-card z-10 w-[150px] px-2 py-2 text-left text-xs font-medium'>
                      Meal
                    </TableHead>
                    <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                      Calories (kcal)
                    </TableHead>
                    <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                      Protein (g)
                    </TableHead>
                    <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                      Carbs (g)
                    </TableHead>
                    <TableHead className='px-2 py-2 text-right text-xs font-medium'>
                      Fat (g)
                    </TableHead>
                    <TableHead className='px-2 py-2 text-right text-xs font-medium w-[180px]'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedSplit.map((mealData) => (
                    <TableRow key={mealData.mealName}>
                      <TableCell className='font-medium sticky left-0 bg-card z-10 px-2 py-1 text-sm'>
                        {mealData.mealName}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {formatNumber(mealData.Calories, {
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {formatNumber(mealData['Protein (g)'], {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {formatNumber(mealData['Carbs (g)'], {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {formatNumber(mealData['Fat (g)'], {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-right'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleSuggestMeals(mealData)}
                          className='h-8 text-xs'
                        >
                          <Lightbulb className='mr-1.5 h-3.5 w-3.5' /> Suggest
                          Meals
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className='font-semibold border-t-2 text-sm bg-muted/70'>
                    <TableCell className='sticky left-0 bg-muted/70 z-10 px-2 py-1'>
                      Total
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {formatNumber(
                        calculatedSplit.reduce(
                          (sum, meal) => sum + meal.Calories,
                          0
                        ),
                        { maximumFractionDigits: 0 }
                      )}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {formatNumber(
                        calculatedSplit.reduce(
                          (sum, meal) => sum + meal['Protein (g)'],
                          0
                        ),
                        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                      )}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {formatNumber(
                        calculatedSplit.reduce(
                          (sum, meal) => sum + meal['Carbs (g)'],
                          0
                        ),
                        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                      )}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {formatNumber(
                        calculatedSplit.reduce(
                          (sum, meal) => sum + meal['Fat (g)'],
                          0
                        ),
                        { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                      )}
                    </TableCell>
                    <TableCell className='px-2 py-1'></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
