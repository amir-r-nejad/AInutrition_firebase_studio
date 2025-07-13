
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  activityLevels,
  genders,
  smartPlannerDietGoals,
} from '@/lib/constants';
import {
  getSmartPlannerData,
  saveSmartPlannerData,
} from '@/app/api/user/database';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition-calculator';
import {
  type CustomCalculatedTargets,
  type GlobalCalculatedTargets,
  preprocessDataForFirestore,
  SmartCaloriePlannerFormSchema,
  type SmartCaloriePlannerFormValues,
} from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BrainCircuit,
  Calculator,
  Edit3,
  HelpCircle,
  Info,
  RefreshCcw,
  Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';

export default function SmartCaloriePlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<GlobalCalculatedTargets | null>(null);
  const [customPlanResults, setCustomPlanResults] =
    useState<CustomCalculatedTargets | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const smartPlannerForm = useForm<SmartCaloriePlannerFormValues>({
    resolver: zodResolver(SmartCaloriePlannerFormSchema),
    defaultValues: {
      age: undefined,
      gender: undefined,
      height_cm: undefined,
      current_weight: undefined,
      goal_weight_1m: undefined,
      ideal_goal_weight: undefined,
      activity_factor_key: 'moderate',
      dietGoal: 'fat_loss',
      bf_current: undefined,
      bf_target: undefined,
      bf_ideal: undefined,
      mm_current: undefined,
      mm_target: undefined,
      mm_ideal: undefined,
      bw_current: undefined,
      bw_target: undefined,
      bw_ideal: undefined,
      waist_current: undefined,
      waist_goal_1m: undefined,
      waist_ideal: undefined,
      hips_current: undefined,
      hips_goal_1m: undefined,
      hips_ideal: undefined,
      right_leg_current: undefined,
      right_leg_goal_1m: undefined,
      right_leg_ideal: undefined,
      left_leg_current: undefined,
      left_leg_goal_1m: undefined,
      left_leg_ideal: undefined,
      right_arm_current: undefined,
      right_arm_goal_1m: undefined,
      right_arm_ideal: undefined,
      left_arm_current: undefined,
      left_arm_goal_1m: undefined,
      left_arm_ideal: undefined,
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    },
  });

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);
      getSmartPlannerData(user.uid)
        .then((data) => {
          if (data.formValues) {
            smartPlannerForm.reset(data.formValues);
          }
          if (
            data.results &&
            typeof data.results.tdee === 'number' &&
            typeof data.results.bmr === 'number'
          ) {
            setResults(data.results);
          } else {
            setResults(null);
          }
        })
        .catch((err) => {
          toast({
            title: 'Error',
            description: 'Could not load saved planner data.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoadingData(false));
    } else {
      setIsLoadingData(false);
    }
  }, [user, smartPlannerForm, toast]);

  async function calculateAndSetResults(data: SmartCaloriePlannerFormValues) {
    const activity = activityLevels.find(
      (al) => al.value === data.activity_factor_key
    );
    if (
      !activity ||
      !data.gender ||
      !data.current_weight ||
      !data.height_cm ||
      !data.age ||
      !data.dietGoal
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required basic info fields.',
        variant: 'destructive',
      });
      return;
    }

    const bmr = calculateBMR(
      data.gender,
      data.current_weight,
      data.height_cm,
      data.age
    );
    const tdee = calculateTDEE(bmr, data.activity_factor_key!);

    let targetCalories = tdee;

    if (data.dietGoal === 'fat_loss') {
        targetCalories = tdee - 500;
    } else if (data.dietGoal === 'muscle_gain') {
        targetCalories = tdee + 300;
    } else if (data.dietGoal === 'recomp') {
        targetCalories = tdee; 
    }

    if (data.goal_weight_1m && data.current_weight) {
      const weightDeltaKg1M = data.current_weight - data.goal_weight_1m;
      const calorieAdjustment = (7700 * weightDeltaKg1M) / 30;
      targetCalories = tdee - calorieAdjustment;
    }

    let finalTargetCalories = Math.max(bmr + 100, Math.round(targetCalories));
    if (data.dietGoal === 'fat_loss') {
      finalTargetCalories = Math.max(finalTargetCalories, 1200);
    }


    const estimatedWeeklyWeightChangeKg =
      ((tdee - finalTargetCalories) * 7) / 7700;

    let proteinTargetPct = 0.35,
      carbTargetPct = 0.4,
      fatTargetPct = 0.25;
    if (data.dietGoal === 'muscle_gain') {
      proteinTargetPct = 0.3;
      carbTargetPct = 0.5;
      fatTargetPct = 0.2;
    } else if (data.dietGoal === 'recomp') {
      proteinTargetPct = 0.4;
      carbTargetPct = 0.35;
      fatTargetPct = 0.25;
    }

    const proteinCalories = finalTargetCalories * proteinTargetPct;
    const proteinGrams = proteinCalories / 4;
    const carbCalories = finalTargetCalories * carbTargetPct;
    const carbGrams = carbCalories / 4;
    const fatCalories = finalTargetCalories * fatTargetPct;
    const fatGrams = fatCalories / 9;

    const newResults: GlobalCalculatedTargets = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      finalTargetCalories: Math.round(finalTargetCalories),
      estimatedWeeklyWeightChangeKg,
      proteinTargetPct,
      proteinGrams,
      proteinCalories,
      carbTargetPct,
      carbGrams,
      carbCalories,
      fatTargetPct,
      fatGrams,
      fatCalories,
      current_weight_for_custom_calc: data.current_weight,
    };

    setResults(newResults);

    if (user?.uid) {
      try {
        await saveSmartPlannerData(user.uid, {
          formValues: data,
          results: newResults,
        });
        toast({
          title: 'Calculation Complete',
          description: 'Your smart calorie plan has been generated and saved.',
        });
      } catch (e) {
        toast({
          title: 'Save Error',
          description: 'Could not save calculation results.',
          variant: 'destructive',
        });
      }
    }
  }

  async function onCustomizePlanForm(data: SmartCaloriePlannerFormValues) {
    if (!user?.uid || !customPlanResults) {
      toast({
        title: 'Error',
        description:
          'Cannot save custom plan. User not found or custom results not calculated.',
        variant: 'destructive',
      });
      return;
    }

    const finalResultsToSave: GlobalCalculatedTargets = {
      ...customPlanResults,
      bmr: results?.bmr,
      tdee: results?.tdee,
    };

    try {
      await saveSmartPlannerData(user.uid, {
        formValues: data,
        results: finalResultsToSave,
      });
      setResults(finalResultsToSave); // Update the main results display
      toast({
        title: 'Custom Plan Saved',
        description:
          'Your custom targets are now the main targets for the app.',
      });
    } catch (e) {
      toast({
        title: 'Save Error',
        description: 'Could not save your custom plan.',
        variant: 'destructive',
      });
    }
  }

  const handleSmartPlannerReset = async () => {
    smartPlannerForm.reset();
    setResults(null);
    setCustomPlanResults(null);
    if (user?.uid) {
      await saveSmartPlannerData(user.uid, {
        formValues: smartPlannerForm.getValues(),
        results: null,
      });
    }
    toast({
      title: 'Smart Planner Reset',
      description: 'All smart planner inputs and results cleared.',
    });
  };

  const handleCustomPlanReset = () => {
    smartPlannerForm.reset({
      ...smartPlannerForm.getValues(),
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    });
    setCustomPlanResults(null);
    toast({
      title: 'Custom Plan Reset',
      description: 'Custom plan inputs have been reset.',
    });
  };

  const watchedCustomInputs = smartPlannerForm.watch([
    'custom_total_calories',
    'custom_protein_per_kg',
    'remaining_calories_carb_pct',
    'current_weight',
  ]);

  useEffect(() => {
    const [
      customTotalCalories,
      customProteinPerKg,
      remainingCarbPct,
      currentWeight,
    ] = watchedCustomInputs;

    if (!results || currentWeight === undefined || currentWeight <= 0) {
      setCustomPlanResults(null);
      return;
    }

    const effectiveTotalCalories =
      customTotalCalories !== undefined && customTotalCalories > 0
        ? customTotalCalories
        : results.finalTargetCalories || 0;

    const defaultProteinPerKg =
      results.proteinGrams && results.current_weight_for_custom_calc
        ? results.proteinGrams / results.current_weight_for_custom_calc
        : 1.6;

    const effectiveProteinPerKg =
      customProteinPerKg !== undefined && customProteinPerKg >= 0
        ? customProteinPerKg
        : defaultProteinPerKg;

    const calculatedProteinGrams = currentWeight * effectiveProteinPerKg;
    const calculatedProteinCalories = calculatedProteinGrams * 4;
    const remainingCalories = effectiveTotalCalories - calculatedProteinCalories;

    let carbGrams = 0,
      fatGrams = 0,
      carbCalories = 0,
      fatCalories = 0;

    if (remainingCalories > 0) {
      const carbRatio = (remainingCarbPct ?? 50) / 100;
      carbCalories = remainingCalories * carbRatio;
      fatCalories = remainingCalories * (1 - carbRatio);
      carbGrams = carbCalories / 4;
      fatGrams = fatCalories / 9;
    }

    const finalTotalCustomCals =
      calculatedProteinCalories + carbCalories + fatCalories;

    const newCustomPlan: CustomCalculatedTargets = {
      finalTargetCalories: Math.round(finalTotalCustomCals),
      proteinGrams: Math.round(calculatedProteinGrams),
      proteinCalories: Math.round(calculatedProteinCalories),
      proteinTargetPct:
        finalTotalCustomCals > 0
          ? (calculatedProteinCalories / finalTotalCustomCals) * 100
          : 0,
      carbGrams: Math.round(carbGrams),
      carbCalories: Math.round(carbCalories),
      carbTargetPct:
        finalTotalCustomCals > 0
          ? (carbCalories / finalTotalCustomCals) * 100
          : 0,
      fatGrams: Math.round(fatGrams),
      fatCalories: Math.round(fatCalories),
      fatTargetPct:
        finalTotalCustomCals > 0 ? (fatCalories / finalTotalCustomCals) * 100 : 0,
    };
    setCustomPlanResults(newCustomPlan);
  }, [watchedCustomInputs, results]);

  if (isLoadingData) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading planner data...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='container mx-auto py-4'>
        <Card className='max-w-3xl mx-auto shadow-xl'>
          <CardHeader>
            <CardTitle className='text-3xl font-bold flex items-center'>
              <BrainCircuit className='mr-3 h-8 w-8 text-primary' />
              Smart Calorie & Macro Planner
            </CardTitle>
            <CardDescription>
              Calculate your daily targets based on your stats and goals. Saved
              data will be used across other tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...smartPlannerForm}>
              <form
                onSubmit={smartPlannerForm.handleSubmit(calculateAndSetResults)}
                className='space-y-8'
              >
                <Accordion
                  type='multiple'
                  defaultValue={['basic-info']}
                  className='w-full'
                >
                  <AccordionItem value='basic-info'>
                    <AccordionTrigger className='text-xl font-semibold'>
                      📋 Basic Info (Required)
                    </AccordionTrigger>
                    <AccordionContent className='grid md:grid-cols-2 gap-x-6 gap-y-4 pt-4 px-1'>
                      <FormField
                        control={smartPlannerForm.control}
                        name='age'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age (Years)</FormLabel>
                            <FormControl>
                              <div>
                                <Input
                                  type='number'
                                  placeholder='e.g., 30'
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
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='gender'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biological Sex</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <div>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select sex' />
                                  </SelectTrigger>
                                </div>
                              </FormControl>
                              <SelectContent>
                                {genders.map((g) => (
                                  <SelectItem key={g.value} value={g.value}>
                                    {g.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='height_cm'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <div>
                                <Input
                                  type='number'
                                  placeholder='e.g., 175'
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
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='current_weight'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weight (kg)</FormLabel>
                            <FormControl>
                              <div>
                                <Input
                                  type='number'
                                  placeholder='e.g., 70'
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
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='goal_weight_1m'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Target Weight After 1 Month (kg)
                            </FormLabel>
                            <FormControl>
                              <div>
                                <Input
                                  type='number'
                                  placeholder='e.g., 68'
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
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='ideal_goal_weight'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Long-Term Goal Weight (kg){' '}
                              <span className='text-xs text-muted-foreground'>
                                (Optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div>
                                <Input
                                  type='number'
                                  placeholder='e.g., 65'
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
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='activity_factor_key'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Physical Activity Level</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <div>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select activity level' />
                                  </SelectTrigger>
                                </div>
                              </FormControl>
                              <SelectContent>
                                {activityLevels.map((al) => (
                                  <SelectItem key={al.value} value={al.value}>
                                    {al.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={smartPlannerForm.control}
                        name='dietGoal'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Diet Goal</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <div>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select diet goal' />
                                  </SelectTrigger>
                                </div>
                              </FormControl>
                              <SelectContent>
                                {smartPlannerDietGoals.map((dg) => (
                                  <SelectItem key={dg.value} value={dg.value}>
                                    {dg.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value='body-comp'>
                    <AccordionTrigger className='text-xl font-semibold'>
                      💪 Body Composition (Optional)
                    </AccordionTrigger>
                    <AccordionContent className='space-y-1 pt-4 px-1'>
                      <div className='grid grid-cols-4 gap-x-2 pb-1 border-b mb-2 text-sm font-medium text-muted-foreground'>
                        <FormLabel className='col-span-1'>Metric</FormLabel>
                        <FormLabel className='text-center'>
                          Current (%)
                        </FormLabel>
                        <FormLabel className='text-center'>
                          Target (1 Mth) (%)
                        </FormLabel>
                        <FormLabel className='text-center'>Ideal (%)</FormLabel>
                      </div>
                      {(['Body Fat', 'Muscle Mass', 'Body Water'] as const).map(
                        (metric) => {
                          const keys = {
                            'Body Fat': ['bf_current', 'bf_target', 'bf_ideal'],
                            'Muscle Mass': [
                              'mm_current',
                              'mm_target',
                              'mm_ideal',
                            ],
                            'Body Water': [
                              'bw_current',
                              'bw_target',
                              'bw_ideal',
                            ],
                          }[metric] as [
                            FieldPath<SmartCaloriePlannerFormValues>,
                            FieldPath<SmartCaloriePlannerFormValues>,
                            FieldPath<SmartCaloriePlannerFormValues>
                          ];
                          return (
                            <div
                              key={metric}
                              className='grid grid-cols-4 gap-x-2 items-start py-1'
                            >
                              <FormLabel className='text-sm pt-2'>
                                {metric}
                              </FormLabel>
                              {keys.map((key) => (
                                <FormField
                                  key={key}
                                  control={smartPlannerForm.control}
                                  name={key}
                                  render={({ field }) => (
                                    <FormItem className='text-center'>
                                      <FormControl>
                                        <div>
                                          <Input
                                            type='number'
                                            placeholder='e.g., 20'
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) =>
                                              field.onChange(
                                                e.target.value === ''
                                                  ? undefined
                                                  : parseFloat(e.target.value)
                                              )
                                            }
                                            className='w-full text-center text-sm h-9'
                                            step='0.1'
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage className='text-xs text-center' />
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          );
                        }
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value='measurements'>
                    <AccordionTrigger className='text-xl font-semibold'>
                      📏 Measurements (Optional)
                    </AccordionTrigger>
                    <AccordionContent className='space-y-1 pt-4 px-1'>
                      <div className='grid grid-cols-4 gap-x-2 pb-1 border-b mb-2 text-sm font-medium text-muted-foreground'>
                        <FormLabel className='col-span-1'>Metric</FormLabel>
                        <FormLabel className='text-center'>
                          Current (cm)
                        </FormLabel>
                        <FormLabel className='text-center'>
                          1-Mth Goal (cm)
                        </FormLabel>
                        <FormLabel className='text-center'>
                          Ideal (cm)
                        </FormLabel>
                      </div>
                      {(
                        [
                          'Waist',
                          'Hips',
                          'Right Leg',
                          'Left Leg',
                          'Right Arm',
                          'Left Arm',
                        ] as const
                      ).map((metric) => {
                        const keys = {
                          Waist: [
                            'waist_current',
                            'waist_goal_1m',
                            'waist_ideal',
                          ],
                          Hips: ['hips_current', 'hips_goal_1m', 'hips_ideal'],
                          'Right Leg': [
                            'right_leg_current',
                            'right_leg_goal_1m',
                            'right_leg_ideal',
                          ],
                          'Left Leg': [
                            'left_leg_current',
                            'left_leg_goal_1m',
                            'left_leg_ideal',
                          ],
                          'Right Arm': [
                            'right_arm_current',
                            'right_arm_goal_1m',
                            'right_arm_ideal',
                          ],
                          'Left Arm': [
                            'left_arm_current',
                            'left_arm_goal_1m',
                            'left_arm_ideal',
                          ],
                        }[metric] as [
                          FieldPath<SmartCaloriePlannerFormValues>,
                          FieldPath<SmartCaloriePlannerFormValues>,
                          FieldPath<SmartCaloriePlannerFormValues>
                        ];
                        return (
                          <div
                            key={metric}
                            className='grid grid-cols-4 gap-x-2 items-start py-1'
                          >
                            <FormLabel className='text-sm pt-2'>
                              {metric}
                            </FormLabel>
                            {keys.map((key) => (
                              <FormField
                                key={key}
                                control={smartPlannerForm.control}
                                name={key}
                                render={({ field }) => (
                                  <FormItem className='text-center'>
                                    <FormControl>
                                      <div>
                                        <Input
                                          type='number'
                                          placeholder='e.g., 80'
                                          {...field}
                                          value={field.value ?? ''}
                                          onChange={(e) =>
                                            field.onChange(
                                              e.target.value === ''
                                                ? undefined
                                                : parseFloat(e.target.value)
                                            )
                                          }
                                          className='w-full text-center text-sm h-9'
                                          step='0.1'
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage className='text-xs text-center' />
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8'>
                  <Button
                    type='submit'
                    className='flex-1 text-lg py-3'
                    disabled={smartPlannerForm.formState.isSubmitting}
                  >
                    <Calculator className='mr-2 h-5 w-5' />
                    {smartPlannerForm.formState.isSubmitting
                      ? 'Calculating...'
                      : 'Calculate & Save Smart Target'}
                  </Button>
                </div>
                <div className='mt-4 flex justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={handleSmartPlannerReset}
                    className='text-sm'
                  >
                    <RefreshCcw className='mr-2 h-4 w-4' /> Reset All Inputs
                  </Button>
                </div>
              </form>
            </Form>

            {results && (
              <Card className='mt-8 bg-muted/30 shadow-inner'>
                <CardHeader>
                  <CardTitle className='text-2xl font-semibold text-primary'>
                    Current Plan (System Generated)
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4 text-base'>
                    <p>
                      <strong>Maintenance Calories (TDEE):</strong>{' '}
                      {formatNumber(results.tdee ?? 0)} kcal
                    </p>
                    <p>
                      <strong>Basal Metabolic Rate (BMR):</strong>{' '}
                      {formatNumber(results.bmr ?? 0)} kcal
                    </p>
                  </div>
                  <hr />
                  <p className='text-lg font-medium'>
                    <strong>
                      Target Daily Calories:{' '}
                      <span className='text-primary'>
                        {formatNumber(results.finalTargetCalories ?? 0)} kcal
                      </span>
                    </strong>
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    (Based on your weight & diet goals)
                  </p>
                  <p>
                    <strong>Estimated Weekly Progress:</strong>{' '}
                    {results.estimatedWeeklyWeightChangeKg &&
                    results.estimatedWeeklyWeightChangeKg >= 0
                      ? `${formatNumber(
                          results.estimatedWeeklyWeightChangeKg,
                          { maximumFractionDigits: 2 }
                        )} kg surplus/week (Potential Gain)`
                      : `${formatNumber(
                          Math.abs(results.estimatedWeeklyWeightChangeKg ?? 0),
                          { maximumFractionDigits: 2 }
                        )} kg deficit/week (Potential Loss)`}
                  </p>
                  <hr />
                  <div className='pt-4'>
                    <CardTitle className='text-xl font-semibold mb-3 text-primary'>
                      Suggested Macronutrient Breakdown
                    </CardTitle>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Macronutrient</TableHead>
                          <TableHead className='text-right'>
                            % of Calories
                          </TableHead>
                          <TableHead className='text-right'>
                            Grams per Day
                          </TableHead>
                          <TableHead className='text-right'>
                            Calories per Day
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className='font-medium'>Protein</TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(
                              (results.proteinTargetPct ?? 0) * 100
                            )}
                            %
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.proteinGrams ?? 0, {
                              maximumFractionDigits: 1,
                            })}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.proteinCalories ?? 0)} kcal
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className='font-medium'>
                            Carbohydrates
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber((results.carbTargetPct ?? 0) * 100)}%
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.carbGrams ?? 0, {
                              maximumFractionDigits: 1,
                            })}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.carbCalories ?? 0)} kcal
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className='font-medium'>Fat</TableCell>
                          <TableCell className='text-right'>
                            {formatNumber((results.fatTargetPct ?? 0) * 100)}%
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.fatGrams ?? 0, {
                              maximumFractionDigits: 1,
                            })}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {formatNumber(results.fatCalories ?? 0)} kcal
                          </TableCell>
                        </TableRow>
                      </TableBody>
                      <TableCaption className='text-xs mt-2 text-left'>
                        Customize this in the next section.
                      </TableCaption>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {results && (
              <Card className='mt-8'>
                <CardHeader>
                  <CardTitle className='text-2xl font-semibold flex items-center'>
                    <Edit3 className='mr-2 h-6 w-6 text-primary' />
                    Customize Your Plan
                  </CardTitle>
                  <CardDescription>
                    Adjust the system-generated plan with your preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...smartPlannerForm}>
                    <form
                      onSubmit={smartPlannerForm.handleSubmit(
                        onCustomizePlanForm
                      )}
                      className='space-y-6'
                    >
                      <div className='grid md:grid-cols-2 gap-x-6 gap-y-4 items-start'>
                        <FormField
                          control={smartPlannerForm.control}
                          name='custom_total_calories'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center'>
                                Custom Total Calories
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className='h-3 w-3 ml-1' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Override the estimate:{' '}
                                      {formatNumber(
                                        results.finalTargetCalories ?? 0
                                      )}{' '}
                                      kcal.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <div>
                                  <Input
                                    type='number'
                                    placeholder={`${formatNumber(
                                      results.finalTargetCalories ?? 2000
                                    )}`}
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
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={smartPlannerForm.control}
                          name='custom_protein_per_kg'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center'>
                                Custom Protein (g/kg)
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className='h-3 w-3 ml-1' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Set g of protein per kg of body weight.
                                      Estimate:{' '}
                                      {formatNumber(
                                        (results.proteinGrams ?? 0) /
                                          (results.current_weight_for_custom_calc ??
                                            1),
                                        { maximumFractionDigits: 1 }
                                      )}{' '}
                                      g/kg
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <div>
                                  <Input
                                    type='number'
                                    placeholder={`${formatNumber(
                                      (results.proteinGrams ?? 0) /
                                        (results.current_weight_for_custom_calc ??
                                          1),
                                      { maximumFractionDigits: 1 }
                                    )}`}
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
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={smartPlannerForm.control}
                          name='remaining_calories_carb_pct'
                          render={({ field }) => {
                            const carbPct = field.value ?? 50;
                            const fatPct = 100 - carbPct;
                            return (
                              <FormItem className='md:col-span-2'>
                                <FormLabel>
                                  Remaining Calories: Carbs vs. Fat
                                </FormLabel>
                                <FormControl>
                                  <div className='pt-1'>
                                    <Slider
                                      value={[carbPct]}
                                      onValueChange={(value) =>
                                        field.onChange(value[0])
                                      }
                                      min={0}
                                      max={100}
                                      step={1}
                                    />
                                    <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                                      <span>Carbs: {carbPct}%</span>
                                      <span>Fat: {fatPct}%</span>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      {customPlanResults && (
                        <div className='mt-6'>
                          <h4 className='text-xl font-semibold mb-2 text-primary'>
                            Your Custom Plan Breakdown
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Macronutrient</TableHead>
                                <TableHead className='text-right'>
                                  % of Calories
                                </TableHead>
                                <TableHead className='text-right'>
                                  Grams
                                </TableHead>
                                <TableHead className='text-right'>
                                  Calories
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className='font-medium'>
                                  Protein
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.proteinTargetPct ?? 0
                                  )}
                                  %
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.proteinGrams ?? 0
                                  )}
                                  g
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.proteinCalories ?? 0
                                  )}{' '}
                                  kcal
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className='font-medium'>
                                  Carbohydrates
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.carbTargetPct ?? 0
                                  )}
                                  %
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.carbGrams ?? 0
                                  )}
                                  g
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.carbCalories ?? 0
                                  )}{' '}
                                  kcal
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className='font-medium'>
                                  Fat
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.fatTargetPct ?? 0
                                  )}
                                  %
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.fatGrams ?? 0
                                  )}
                                  g
                                </TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.fatCalories ?? 0
                                  )}{' '}
                                  kcal
                                </TableCell>
                              </TableRow>
                              <TableRow className='font-semibold bg-muted/50'>
                                <TableCell>Total</TableCell>
                                <TableCell className='text-right'>
                                  100%
                                </TableCell>
                                <TableCell className='text-right'>-</TableCell>
                                <TableCell className='text-right'>
                                  {formatNumber(
                                    customPlanResults.finalTargetCalories ?? 0
                                  )}{' '}
                                  kcal
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className='mt-6 flex justify-end gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              onClick={handleCustomPlanReset}
                            >
                              Reset Custom Values
                            </Button>
                            <Button
                              type='submit'
                              disabled={!customPlanResults}
                            >
                              <Save className='mr-2 h-4 w-4' />
                              Use This Custom Plan
                            </Button>
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
