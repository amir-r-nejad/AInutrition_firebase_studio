
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { useToast } from '@/hooks/use-toast';
import {
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/constants';
import { db } from '@/lib/firebase/clientApp';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  preprocessDataForFirestore,
  type MacroSplitterFormValues,
  type MealMacroDistribution,
  MacroSplitterFormSchema,
} from '@/lib/schemas';
import { cn, formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Loader2,
  RefreshCw,
  Save,
  SplitSquareHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

interface TotalMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source?: string;
}

// REFACTORED: Use standard keys for easier processing
interface CalculatedMealMacros {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// REFACTORED: Updated to return the new, cleaner interface
function customMacroSplit(
  totalMacros: TotalMacros,
  mealMacroDistribution: MacroSplitterFormValues['mealDistributions']
): CalculatedMealMacros[] {
  return mealMacroDistribution.map((mealPct) => ({
    mealName: mealPct.mealName,
    calories: Math.round(
      totalMacros.calories * ((mealPct.calories_pct || 0) / 100)
    ),
    protein: Math.round(
      totalMacros.protein_g * ((mealPct.protein_pct || 0) / 100)
    ),
    carbs: Math.round(
      totalMacros.carbs_g * ((mealPct.carbs_pct || 0) / 100)
    ),
    fat: Math.round(totalMacros.fat_g * ((mealPct.fat_pct || 0) / 100)),
  }));
}

export default function MacroSplitterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
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
    mode: 'onChange', // Validate on change for better UX with live totals
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

  const watchedMealDistributions = form.watch('mealDistributions');

  // NEW: Effect to automatically calculate and show the split whenever inputs change
  useEffect(() => {
    if (dailyTargets && watchedMealDistributions) {
      const result = customMacroSplit(dailyTargets, watchedMealDistributions);
      setCalculatedSplit(result);
    }
  }, [dailyTargets, watchedMealDistributions]);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        const profile = docSnap.exists() ? docSnap.data() : null;

        if (!profile) {
          toast({
            title: 'Profile not found',
            description: 'Could not load your user profile.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        let targets: TotalMacros | null = null;
        let sourceMessage: string | null = null;

        if (
          profile.smartPlannerData?.results?.finalTargetCalories !== undefined &&
          profile.smartPlannerData?.results?.finalTargetCalories !== null
        ) {
          const smartResults = profile.smartPlannerData.results;
          targets = {
            calories: smartResults.finalTargetCalories || 0,
            protein_g: smartResults.proteinGrams || 0,
            carbs_g: smartResults.carbGrams || 0,
            fat_g: smartResults.fatGrams || 0,
            source: 'Smart Calorie Planner Targets',
          };
          sourceMessage =
            "Daily totals from 'Smart Calorie Planner'. Adjust there for changes.";
        } else if (
          profile.age &&
          profile.gender &&
          profile.current_weight &&
          profile.height_cm &&
          profile.activityLevel &&
          profile.dietGoalOnboarding
        ) {
          const estimatedTargets = calculateEstimatedDailyTargets({
            age: profile.age,
            gender: profile.gender,
            currentWeight: profile.current_weight,
            height: profile.height_cm,
            activityLevel: profile.activityLevel,
            dietGoal: profile.dietGoalOnboarding,
            goalWeight: profile.goal_weight_1m,
            bf_current: profile.bf_current,
            bf_target: profile.bf_target,
            waist_current: profile.waist_current,
            waist_goal_1m: profile.waist_goal_1m,
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
          }
        }

        setDailyTargets(targets);
        setDataSourceMessage(sourceMessage);

        const mealDistributions = profile.mealDistributions;
        if (
          mealDistributions &&
          Array.isArray(mealDistributions) &&
          mealDistributions.length > 0
        ) {
          form.reset({
            mealDistributions:
              mealDistributions as MacroSplitterFormValues['mealDistributions'],
          });
        }

        if (sourceMessage && targets) {
          toast({
            title: 'Daily Totals Loaded',
            description: sourceMessage,
            duration: 6000,
          });
        }

        if (!targets) {
          toast({
            title: 'No Daily Totals',
            description:
              'Could not find or calculate daily macro totals. Please use the Smart Calorie Planner or complete your profile.',
            variant: 'destructive',
            duration: 6000,
          });
        }
      } catch (error) {
        toast({
          title: 'Error Loading Data',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to load data for the Macro Splitter.',
          variant: 'destructive',
        });
        console.error('Error in loadData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user?.uid, form, toast]);

  const onSubmit = async (data: MacroSplitterFormValues) => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const distributionsToSave = preprocessDataForFirestore(
        data.mealDistributions
      );
      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(
        userProfileRef,
        { mealDistributions: distributionsToSave },
        { merge: true }
      );

      toast({
        title: 'Percentages Saved',
        description:
          'Your custom macro distribution has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save your distribution percentages.',
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
    if (user?.uid) {
      try {
        const userProfileRef = doc(db, 'users', user.uid);
        await setDoc(userProfileRef, { mealDistributions: null }, { merge: true });
        toast({
          title: 'Reset Complete',
          description: 'Percentages reset to defaults and saved.',
        });
      } catch (error) {
        toast({
          title: 'Reset Warning',
          description:
            error instanceof Error
              ? error.message
              : 'Percentages reset locally, but failed to clear saved defaults in the cloud.',
          variant: 'destructive',
        });
        console.error('Error resetting meal distributions:', error);
      }
    } else {
      toast({
        title: 'Reset Complete',
        description: 'Percentages reset to defaults.',
      });
    }
  };

  // REFACTORED: Uses the new clean keys from the refactored interface
  const handleSuggestMeals = (mealData: CalculatedMealMacros) => {
    const queryParams = new URLSearchParams({
      mealName: mealData.mealName,
      calories: mealData.calories.toString(),
      protein: mealData.protein.toString(),
      carbs: mealData.carbs.toString(),
      fat: mealData.fat.toString(),
    }).toString();
    router.push(`/tools/meal-suggestions?${queryParams}`);
  };

  const calculateColumnSum = (
    macroKey: keyof Omit<MealMacroDistribution, 'mealName'>
  ) => {
    return watchedMealDistributions.reduce(
      (sum, meal) => sum + (Number(meal[macroKey]) || 0),
      0
    );
  };

  const columnSums = {
    calories_pct: calculateColumnSum('calories_pct'),
    protein_pct: calculateColumnSum('protein_pct'),
    carbs_pct: calculateColumnSum('carbs_pct'),
    fat_pct: calculateColumnSum('fat_pct'),
  };

  const headerLabels = [
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

  const macroPctKeys: (keyof Omit<MealMacroDistribution, 'mealName'>)[] = [
    'calories_pct',
    'protein_pct',
    'carbs_pct',
    'fat_pct',
  ];

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading data...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold flex items-center'>
            <SplitSquareHorizontal className='mr-3 h-8 w-8 text-primary' />
            Macro Splitter Tool
          </CardTitle>
          <CardDescription>
            Distribute your total daily macros across your meals by percentage.
            Percentages can include decimals (e.g., 21.7).
          </CardDescription>
        </CardHeader>
        {dailyTargets ? (
          <CardContent>
            <h3 className='text-xl font-semibold mb-1 text-primary'>
              Your Estimated Total Daily Macros:
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50 mb-3'>
              <p>
                <span className='font-medium'>Calories:</span>{' '}
                {dailyTargets.calories.toFixed(0)} kcal
              </p>
              <p>
                <span className='font-medium'>Protein:</span>{' '}
                {dailyTargets.protein_g.toFixed(1)} g
              </p>
              <p>
                <span className='font-medium'>Carbs:</span>{' '}
                {dailyTargets.carbs_g.toFixed(1)} g
              </p>
              <p>
                <span className='font-medium'>Fat:</span>{' '}
                {dailyTargets.fat_g.toFixed(1)} g
              </p>
            </div>
            {dataSourceMessage && (
              <div className='text-sm text-muted-foreground flex items-center gap-2 p-2 rounded-md border border-dashed bg-background'>
                <Info className='h-4 w-4 text-accent shrink-0' />
                <span>{dataSourceMessage}</span>
              </div>
            )}
          </CardContent>
        ) : (
          <CardContent>
            <div className='text-destructive text-center p-4 border border-destructive/50 rounded-md bg-destructive/10'>
              <p className='mb-2'>
                Could not load or calculate your total daily macros.
              </p>
              <p className='text-sm'>
                Please ensure your profile is complete or use the{' '}
                <Link
                  href='/tools/smart-calorie-planner'
                  className='underline hover:text-destructive/80'
                >
                  Smart Calorie Planner
                </Link>{' '}
                to set your targets.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <Card className='shadow-lg'>
            <CardHeader>
              <CardTitle className='text-2xl'>
                Meal Macro Percentage & Value Distribution
              </CardTitle>
              <CardDescription>
                Enter percentages for each meal. Each percentage column should sum to 100%. Calculated macro values will update live based on your inputs.
              </CardDescription>
            </CardHeader>
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
                      const currentSplit = calculatedSplit?.[index];
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
                                            if (val === '') {
                                              itemField.onChange(undefined);
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
                            {currentSplit ? currentSplit.calories.toFixed(0) : 'N/A'}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                             {currentSplit ? currentSplit.protein.toFixed(1) : 'N/A'}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                            {currentSplit ? currentSplit.carbs.toFixed(1) : 'N/A'}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>
                            {currentSplit ? currentSplit.fat.toFixed(1) : 'N/A'}
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
                            {formatNumber(sum, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}%
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
                      {calculatedSplit ? (
                        <>
                          <TableCell className='px-2 py-1 text-right tabular-nums'>
                            {calculatedSplit.reduce((sum, meal) => sum + meal.calories, 0).toFixed(0)}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-right tabular-nums'>
                            {calculatedSplit.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-right tabular-nums'>
                            {calculatedSplit.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}
                          </TableCell>
                          <TableCell className='px-2 py-1 text-right tabular-nums'>
                             {calculatedSplit.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}
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
                              {error.message.replace(/"/g, '')}
                            </p>
                          )
                      );
                    }
                    return null;
                  }
                )}
            </CardContent>
          </Card>

          <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6'>
            <Button
              type='submit'
              className='flex-1 text-lg py-3'
              disabled={
                !dailyTargets || form.formState.isSubmitting || isLoading
              }
            >
              {form.formState.isSubmitting ? (
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              ) : <Save className='mr-2 h-5 w-5' />}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Percentages'}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={handleReset}
              className='flex-1 text-lg py-3'
            >
              <RefreshCw className='mr-2 h-5 w-5' /> Reset to Default
            </Button>
          </div>
        </form>
      </Form>

      {calculatedSplit && (
        <Card className='shadow-lg mt-8'>
          <CardHeader>
            <CardTitle className='text-2xl'>
              Final Meal Macros
            </CardTitle>
            <CardDescription>
              This table updates automatically as you change percentages above. Use the buttons below to get meal ideas for a specific row.
            </CardDescription>
          </CardHeader>
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
                        {mealData.calories}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {mealData.protein.toFixed(1)}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {mealData.carbs.toFixed(1)}
                      </TableCell>
                      <TableCell className='px-2 py-1 text-sm text-right tabular-nums'>
                        {mealData.fat.toFixed(1)}
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
                      {calculatedSplit.reduce((sum, meal) => sum + meal.calories, 0)}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {calculatedSplit.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {calculatedSplit.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)}
                    </TableCell>
                    <TableCell className='px-2 py-1 text-right tabular-nums'>
                      {calculatedSplit.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)}
                    </TableCell>
                    <TableCell className='px-2 py-1'></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
