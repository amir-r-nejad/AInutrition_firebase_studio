
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  MacroSplitterFormSchema,
  type MacroSplitterFormValues,
  type MealMacroDistribution,
  type FullProfileType,
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
import { useEffect, useState, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

interface TotalMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface CalculatedMealMacros {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MacroSplitterPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [dailyTargets, setDailyTargets] = useState<TotalMacros | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSourceMessage, setDataSourceMessage] = useState<string | null>(
    null
  );

  const form = useForm<MacroSplitterFormValues>({
    resolver: zodResolver(MacroSplitterFormSchema),
    mode: 'onChange',
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

  const calculatedSplit = useMemo((): CalculatedMealMacros[] | null => {
    if (!dailyTargets) return null;
    return watchedMealDistributions.map((mealPct) => ({
      mealName: mealPct.mealName,
      calories: Math.round(
        dailyTargets.calories * ((mealPct.calories_pct || 0) / 100)
      ),
      protein: Math.round(
        dailyTargets.protein_g * ((mealPct.protein_pct || 0) / 100)
      ),
      carbs: Math.round(
        dailyTargets.carbs_g * ((mealPct.carbs_pct || 0) / 100)
      ),
      fat: Math.round(dailyTargets.fat_g * ((mealPct.fat_pct || 0) / 100)),
    }));
  }, [dailyTargets, watchedMealDistributions]);

  useEffect(() => {
    async function loadDataForSplitter() {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const userProfileRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userProfileRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data() as FullProfileType;

          if (
            profileData.mealDistributions &&
            Array.isArray(profileData.mealDistributions) &&
            profileData.mealDistributions.length === defaultMealNames.length
          ) {
            form.reset({ mealDistributions: profileData.mealDistributions });
          }

          const targets = calculateEstimatedDailyTargets({
            age: profileData.age,
            gender: profileData.gender,
            currentWeight: profileData.current_weight,
            height: profileData.height_cm,
            activityLevel: profileData.activityLevel,
            dietGoal: profileData.dietGoalOnboarding,
          });

          if (
            targets.finalTargetCalories &&
            targets.proteinGrams &&
            targets.carbGrams &&
            targets.fatGrams
          ) {
            setDailyTargets({
              calories: targets.finalTargetCalories,
              protein_g: targets.proteinGrams,
              carbs_g: targets.carbGrams,
              fat_g: targets.fatGrams,
            });
            setDataSourceMessage(
              "Daily totals estimated from your Profile. Use 'Smart Calorie Planner' for more precision."
            );
          } else {
            setDailyTargets(null);
            setDataSourceMessage(null);
          }
        }
      } catch (error) {
        console.error("Error loading data for macro splitter:", error);
        toast({
          title: "Error",
          description: "Could not load your profile data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadDataForSplitter();
  }, [user, form, toast]);

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
        // Setting to null might be better than an empty object
        await setDoc(userProfileRef, { mealDistributions: null }, { merge: true });
        toast({
          title: 'Reset Complete',
          description: 'Percentages reset to defaults and saved.',
        });
      } catch (error) {
        toast({
          title: 'Reset Warning',
          description: error instanceof Error ? error.message : 'Percentages reset locally, but failed to clear saved defaults.',
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

  const macroPctKeys: (keyof Omit<MealMacroDistribution, 'mealName'>)[] = [
    'calories_pct',
    'protein_pct',
    'carbs_pct',
    'fat_pct',
  ];
  
  const calculateColumnSum = (macroKey: keyof Omit<MealMacroDistribution, 'mealName'>) => {
    return watchedMealDistributions.reduce((sum, meal) => sum + (Number(meal[macroKey]) || 0), 0);
  };
  
  const columnSums = {
    calories_pct: calculateColumnSum('calories_pct'),
    protein_pct: calculateColumnSum('protein_pct'),
    carbs_pct: calculateColumnSum('carbs_pct'),
    fat_pct: calculateColumnSum('fat_pct'),
  };
  

  const headerLabels = [
    { key: 'meal', label: 'Meal', className: 'sticky left-0 bg-card z-10 w-[120px] text-left font-medium' },
    { key: 'cal_pct', label: '%Cal', className: 'text-right min-w-[70px]' },
    { key: 'p_pct', label: '%P', className: 'text-right min-w-[70px]' },
    { key: 'c_pct', label: '%C', className: 'text-right min-w-[70px]' },
    { key: 'f_pct', label: '%F', className: 'text-right min-w-[70px] border-r' },
    { key: 'kcal', label: 'kcal', className: 'text-right min-w-[60px]' },
    { key: 'p_g', label: 'P(g)', className: 'text-right min-w-[60px]' },
    { key: 'c_g', label: 'C(g)', className: 'text-right min-w-[60px]' },
    { key: 'f_g', label: 'F(g)', className: 'text-right min-w-[60px]' },
    { key: 'actions', label: 'Actions', className: 'text-right min-w-[120px]' },
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
            Percentages must be whole numbers (e.g., 20, not 20.5).
          </CardDescription>
        </CardHeader>
        {dailyTargets ? (
          <CardContent>
            <h3 className='text-xl font-semibold mb-1 text-primary'>
              Your Estimated Total Daily Macros:
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/50 mb-3'>
              <p><span className='font-medium'>Calories:</span> {dailyTargets.calories.toFixed(0)} kcal</p>
              <p><span className='font-medium'>Protein:</span> {dailyTargets.protein_g.toFixed(1)} g</p>
              <p><span className='font-medium'>Carbs:</span> {dailyTargets.carbs_g.toFixed(1)} g</p>
              <p><span className='font-medium'>Fat:</span> {dailyTargets.fat_g.toFixed(1)} g</p>
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
              <p className='mb-2'>Could not load or calculate your total daily macros.</p>
              <p className='text-sm'>
                Please ensure your profile is complete or use the{' '}
                <Link href='/tools/smart-calorie-planner' className='underline hover:text-destructive/80'>
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
              <CardTitle className='text-2xl'>Meal Macro Distribution</CardTitle>
              <CardDescription>
                Enter percentages for your meals. Each percentage column must sum to 100%. Calculated values update live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='w-full border rounded-md'>
                <Table className='min-w-[800px]'>
                  <TableHeader>
                    <TableRow>
                      {headerLabels.map((header) => (
                        <TableHead key={header.key} className={cn('px-2 py-2 text-xs font-medium h-9', header.className)}>
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
                          <TableCell className={cn('font-medium px-2 py-1 text-sm h-10', headerLabels[0].className)}>
                            {field.mealName}
                          </TableCell>
                          {macroPctKeys.map((macroKey) => (
                            <TableCell key={macroKey} className={cn('px-1 py-1 text-right tabular-nums h-10', macroKey === 'fat_pct' ? 'border-r' : '')}>
                              <FormField
                                control={form.control}
                                name={`mealDistributions.${index}.${macroKey}`}
                                render={({ field: itemField }) => (
                                  <FormItem className='inline-block'>
                                    <FormControl>
                                      <div>
                                        <Input
                                          type='number'
                                          step='1'
                                          {...itemField}
                                          value={itemField.value ?? ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            itemField.onChange(val === '' ? undefined : parseFloat(val));
                                          }}
                                          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                          className='w-16 text-right tabular-nums text-sm px-1 py-0.5 h-8'
                                          min='0' max='100'
                                        />
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          ))}
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>{currentSplit ? currentSplit.calories.toFixed(0) : 'N/A'}</TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>{currentSplit ? currentSplit.protein.toFixed(1) : 'N/A'}</TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>{currentSplit ? currentSplit.carbs.toFixed(1) : 'N/A'}</TableCell>
                          <TableCell className='px-2 py-1 text-sm text-right tabular-nums h-10'>{currentSplit ? currentSplit.fat.toFixed(1) : 'N/A'}</TableCell>
                          <TableCell className='px-2 py-1 text-right'>
                            <Button variant='outline' size='sm' onClick={() => currentSplit && handleSuggestMeals(currentSplit)} disabled={!currentSplit} className='h-8 text-xs'>
                              <Lightbulb className='mr-1.5 h-3.5 w-3.5' /> Suggest Meals
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow className='font-semibold text-xs h-10 bg-muted/70'>
                      <TableCell className={cn('px-2 py-1', headerLabels[0].className)}>Input % Totals:</TableCell>
                      {macroPctKeys.map((key) => {
                        const sum = columnSums[key];
                        const isSum100 = Math.abs(sum - 100) < 0.1;
                        return (
                          <TableCell key={`sum-${key}`} className={cn('px-2 py-1 text-right tabular-nums', isSum100 ? 'text-green-600' : 'text-destructive', key === 'fat_pct' ? 'border-r' : '')}>
                            {formatNumber(sum, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%
                            {isSum100 ? <CheckCircle2 className='ml-1 h-3 w-3 inline-block' /> : <AlertTriangle className='ml-1 h-3 w-3 inline-block' />}
                          </TableCell>
                        );
                      })}
                      <TableCell colSpan={5} className='px-2 py-1'></TableCell>
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
            </CardContent>
          </Card>

          <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-6'>
            <Button type='submit' className='flex-1 text-lg py-3' disabled={!dailyTargets || form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting ? <Loader2 className='mr-2 h-5 w-5 animate-spin' /> : <Save className='mr-2 h-5 w-5' />}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Percentages'}
            </Button>
            <Button type='button' variant='outline' onClick={handleReset} className='flex-1 text-lg py-3'>
              <RefreshCw className='mr-2 h-5 w-5' /> Reset to Default
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
