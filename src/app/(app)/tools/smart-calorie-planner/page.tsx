'use client';

import { getSmartPlannerData } from '@/app/api/user/database';
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
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import CustomizePlanForm from '@/features/tools/components/calorie-planner/CustomizePlanForm';
import { saveSmartPlannerData } from '@/features/tools/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import {
  activityLevels,
  genders,
  smartPlannerDietGoals,
} from '@/lib/constants';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition-calculator';
import {
  SmartCaloriePlannerFormSchema,
  type GlobalCalculatedTargets,
  type SmartCaloriePlannerFormValues,
} from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BrainCircuit,
  Calculator,
  Edit3,
  HelpCircle,
  RefreshCcw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';

export default function SmartCaloriePlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [results, setResults] = useState<GlobalCalculatedTargets | null>(null);
  const [customPlanResults, setCustomPlanResults] =
    useState<GlobalCalculatedTargets | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [smartPlannerData, setSmartPlannerData] = useState<any>();

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

  async function handleSmartPlannerReset() {
    smartPlannerForm.reset({
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
    });
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
  }

  async function onSubmit(data: SmartCaloriePlannerFormValues) {
    const activity = activityLevels.find(
      (al) => al.value === data.activity_factor_key
    );
    if (
      !activity ||
      !data.gender ||
      !data.current_weight ||
      !data.height_cm ||
      !data.age ||
      !data.goal_weight_1m ||
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

    let targetCaloriesS1: number;
    const weightDeltaKg1M = data.current_weight - data.goal_weight_1m;
    const calorieAdjustmentS1 = (7700 * weightDeltaKg1M) / 30;
    targetCaloriesS1 = tdee - calorieAdjustmentS1;

    if (data.dietGoal === 'fat_loss') {
      targetCaloriesS1 = Math.min(targetCaloriesS1, tdee - 200);
      targetCaloriesS1 = Math.max(targetCaloriesS1, bmr + 200, 1200);
    } else if (data.dietGoal === 'muscle_gain') {
      targetCaloriesS1 = Math.max(targetCaloriesS1, tdee + 150);
    } else if (data.dietGoal === 'recomp') {
      targetCaloriesS1 = Math.min(
        Math.max(targetCaloriesS1, tdee - 300),
        tdee + 100
      );
      targetCaloriesS1 = Math.max(targetCaloriesS1, bmr + 100, 1400);
    }

    let finalTargetCalories = targetCaloriesS1;
    let targetCaloriesS2: number | undefined = undefined;
    let targetCaloriesS3: number | undefined = undefined;

    if (
      data.bf_current !== undefined &&
      data.bf_target !== undefined &&
      data.current_weight &&
      data.bf_current > 0 &&
      data.bf_target > 0 &&
      data.bf_current > data.bf_target
    ) {
      const fatMassLossKg =
        data.current_weight * ((data.bf_current - data.bf_target) / 100);
      const calorieAdjustmentS2 = (7700 * fatMassLossKg) / 30;
      targetCaloriesS2 = tdee - calorieAdjustmentS2;
      finalTargetCalories = (finalTargetCalories + targetCaloriesS2) / 2;
    }

    if (
      data.waist_current !== undefined &&
      data.waist_goal_1m !== undefined &&
      data.current_weight &&
      data.waist_current > 0 &&
      data.waist_goal_1m > 0 &&
      data.waist_current > data.waist_goal_1m
    ) {
      const waistChangeCm = data.waist_current - data.waist_goal_1m;
      if (Math.abs(waistChangeCm) > 5) {
        toast({
          title: 'Waist Goal Warning',
          description:
            'A waist change of more than 5cm in 1 month may be unrealistic. Results are indicative.',
          variant: 'default',
          duration: 7000,
        });
      }
      const estimatedFatLossPercent = waistChangeCm * 0.5;
      const estimatedFatLossKg =
        (estimatedFatLossPercent / 100) * data.current_weight;
      const calorieAdjustmentS3 = (7700 * estimatedFatLossKg) / 30;
      targetCaloriesS3 = tdee - calorieAdjustmentS3;
      console.log(targetCaloriesS3);
    }

    finalTargetCalories = Math.max(bmr + 100, Math.round(finalTargetCalories));

    const estimatedWeeklyWeightChangeKg =
      ((tdee - finalTargetCalories) * 7) / 7700;

    let proteinTargetPct = 0,
      carbTargetPct = 0,
      fatTargetPct = 0;
    if (data.dietGoal === 'fat_loss') {
      proteinTargetPct = 0.35;
      carbTargetPct = 0.35;
      fatTargetPct = 0.3;
    } else if (data.dietGoal === 'muscle_gain') {
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
      estimatedWeeklyWeightChangeKg: estimatedWeeklyWeightChangeKg,
      proteinTargetPct: proteinTargetPct,
      proteinGrams: proteinGrams,
      proteinCalories: proteinCalories,
      carbTargetPct: carbTargetPct,
      carbGrams: carbGrams,
      carbCalories: carbCalories,
      fatTargetPct: fatTargetPct,
      fatGrams: fatGrams,
      fatCalories: fatCalories,
      current_weight_for_custom_calc: data.current_weight,
    };
    setResults(newResults);
    if (user?.uid) {
      try {
        const newFormData = {
          ...data,
          carbCalories: customPlanResults?.carbCalories ?? 0,
          carbGrams: customPlanResults?.carbGrams ?? 0,
          carbTargetPct: customPlanResults?.carbTargetPct ?? 0,
          fatCalories: customPlanResults?.fatCalories ?? 0,
          fatGrams: customPlanResults?.fatGrams ?? 0,
          fatTargetPct: customPlanResults?.fatTargetPct ?? 0,
          proteinCalories: customPlanResults?.proteinCalories ?? 0,
          proteinGrams: customPlanResults?.proteinGrams ?? 0,
          proteinTargetPct: customPlanResults?.proteinTargetPct ?? 0,
        };

        await saveSmartPlannerData(user.uid, {
          formValues: newFormData,
          results: newResults,
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

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingData(true);

      getSmartPlannerData(user.uid)
        .then((data) => {
          if (data.formValues) {
            setSmartPlannerData(data.formValues);
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
          setIsLoadingData(false);
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Could not load saved planner data.',
            variant: 'destructive',
          });
          setIsLoadingData(false);
        });
    } else {
      setIsLoadingData(false);
    }
  }, [smartPlannerForm, toast, user?.uid]);

  if (isLoadingData) return <LoadingScreen />;

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
                onSubmit={smartPlannerForm.handleSubmit(onSubmit)}
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
                                            onWheel={(e) =>
                                              (
                                                e.currentTarget as HTMLInputElement
                                              ).blur()
                                            }
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
                                          onWheel={(e) =>
                                            (
                                              e.currentTarget as HTMLInputElement
                                            ).blur()
                                          }
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

                  <AccordionItem value='help-section'>
                    <AccordionTrigger className='text-xl font-semibold'>
                      <div className='flex items-center'>
                        <HelpCircle className='mr-2 h-6 w-6 text-primary' /> How
                        is this calculated?
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='text-sm space-y-4 pt-3 max-h-96 overflow-y-auto'>
                      <div>
                        <h4 className='font-semibold text-base'>
                          1. Basal Metabolic Rate (BMR) &amp; Total Daily Energy
                          Expenditure (TDEE)
                        </h4>{' '}
                        <p>
                          We use the{' '}
                          <strong className='text-primary'>
                            Mifflin-St Jeor Equation
                          </strong>{' '}
                          for BMR, then multiply by an{' '}
                          <strong className='text-primary'>
                            activity factor
                          </strong>{' '}
                          (derived from your selected &lsquo;Physical Activity
                          Level&rsquo;) for TDEE.
                        </p>
                      </div>
                      <div>
                        <h4 className='font-semibold text-base mt-2'>
                          2. Target Daily Calories
                        </h4>
                        <p>
                          This is determined based on your goals, selected
                          &quot;Diet Goal&quot;, and optionally, body
                          composition changes:
                        </p>
                        <ul className='list-disc pl-5 space-y-1 mt-1'>
                          <li>
                            <strong>
                              Primary Goal (Weight &amp; Diet Goal):
                            </strong>{' '}
                            Initially calculated from your 1-month weight
                            target. Your &quot;Diet Goal&quot; (e.g., &quot;Fat
                            loss,&quot; &quot;Muscle gain&quot;) then refines
                            this. For example, &quot;Fat loss&quot; aims for a
                            deficit (e.g., TDEE - 200 to -500 kcal), while
                            &quot;Muscle gain&quot; aims for a surplus (e.g.,
                            TDEE + 150 to +300 kcal). &quot;Recomposition&quot;
                            targets a slight deficit or near-maintenance
                            calories. These adjustments ensure the calorie
                            target aligns with your primary objective.
                          </li>
                          <li>
                            <strong>
                              Body Fat % Goal (Optional Refinement):
                            </strong>{' '}
                            If you provide current and target body fat
                            percentages, the calorie target may be further
                            refined by averaging the weight-goal-based calories
                            with calories estimated to achieve your body fat
                            change.
                          </li>
                          <li>
                            <strong>Waist Goal (Alternative View):</strong> If
                            waist goals are provided, an alternative calorie
                            target is estimated for perspective. This is not the
                            primary target but an additional indicator.
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className='font-semibold text-base mt-2'>
                          3. Suggested Macro Split (Default)
                        </h4>
                        <p>
                          The default suggested protein/carb/fat percentage
                          split (shown in the &lsquo;Original Plan&rsquo;
                          results) is based on your selected &quot;Diet
                          Goal&quot;:
                        </p>
                        <ul className='list-disc pl-5 space-y-1 mt-1'>
                          <li>
                            <strong>Fat Loss:</strong> Approx. 35% Protein / 35%
                            Carbs / 30% Fat
                          </li>
                          <li>
                            <strong>Muscle Gain:</strong> Approx. 30% Protein /
                            50% Carbs / 20% Fat
                          </li>
                          <li>
                            <strong>Recomposition:</strong> Approx. 40% Protein
                            / 35% Carbs / 25% Fat
                          </li>
                        </ul>
                        <p className='mt-1'>
                          You can further customize this in the &quot;Customize
                          Your Plan&quot; section below.
                        </p>
                      </div>
                      <div>
                        {' '}
                        <h4 className='font-semibold text-base mt-2'>
                          4. Safe Pace
                        </h4>{' '}
                        <p>
                          Sustainable weight loss is often around 0.5–1 kg (1–2
                          lbs) per week. Muscle gain is slower, around 0.25–0.5
                          kg (0.5–1 lb) per week. Large body composition or
                          measurement changes in just 1 month may be unrealistic
                          for many.
                        </p>{' '}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8'>
                  <Button
                    type='submit'
                    className='flex-1 text-lg py-3'
                    disabled={smartPlannerForm.formState.isSubmitting}
                  >
                    {' '}
                    <Calculator className='mr-2 h-5 w-5' />{' '}
                    {smartPlannerForm.formState.isSubmitting
                      ? 'Calculating...'
                      : 'Calculate Smart Target'}{' '}
                  </Button>
                </div>
                <div className='mt-4 flex justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={handleSmartPlannerReset}
                    className='text-sm'
                  >
                    {' '}
                    <RefreshCcw className='mr-2 h-4 w-4' /> Reset Smart Planner
                    Inputs{' '}
                  </Button>
                </div>
              </form>
            </Form>

            {results && (
              <Card className='mt-8 bg-muted/30 shadow-inner'>
                <CardHeader>
                  <CardTitle className='text-2xl font-semibold text-primary'>
                    Original Plan (System Generated)
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid md:grid-cols-2 gap-4 text-base'>
                    <p>
                      <strong>Maintenance Calories (TDEE):</strong>{' '}
                      {results.tdee ? formatNumber(results.tdee) : 'N/A'} kcal
                    </p>
                    <p>
                      <strong>Basal Metabolic Rate (BMR):</strong>{' '}
                      {results.bmr ? formatNumber(results.bmr) : 'N/A'} kcal
                    </p>
                  </div>
                  <hr />
                  <p className='text-lg font-medium'>
                    <strong>
                      Primary Target Daily Calories:{' '}
                      <span className='text-primary'>
                        {results.finalTargetCalories
                          ? formatNumber(results.finalTargetCalories)
                          : 'N/A'}{' '}
                        kcal
                      </span>
                    </strong>
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {' '}
                    (Based on your weight &amp; diet goals. Optional BF% goal
                    may refine this.)
                  </p>

                  <p>
                    <strong>Estimated Weekly Progress:</strong>{' '}
                    {results.estimatedWeeklyWeightChangeKg &&
                    results.estimatedWeeklyWeightChangeKg >= 0
                      ? `${formatNumber(
                          results.estimatedWeeklyWeightChangeKg ?? 0,
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
                          {/* */}
                          <TableHead>Macronutrient</TableHead>
                          {/* */}
                          <TableHead className='text-right'>
                            % of Daily Calories
                          </TableHead>
                          {/* */}
                          <TableHead className='text-right'>
                            Grams per Day
                          </TableHead>
                          {/* */}
                          <TableHead className='text-right'>
                            Calories per Day
                          </TableHead>
                          {/* */}
                        </TableRow>
                        {/* */}
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className='font-medium'>Protein</TableCell>
                          <TableCell className='text-right'>
                            {results.proteinTargetPct
                              ? formatNumber(results.proteinTargetPct * 100, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}
                            %
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.proteinGrams
                              ? formatNumber(results.proteinGrams, {
                                  maximumFractionDigits: 1,
                                })
                              : 'N/A'}{' '}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.proteinCalories
                              ? formatNumber(results.proteinCalories, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}{' '}
                            kcal
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className='font-medium'>
                            Carbohydrates
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.carbTargetPct
                              ? formatNumber(results.carbTargetPct * 100, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}
                            %
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.carbGrams
                              ? formatNumber(results.carbGrams, {
                                  maximumFractionDigits: 1,
                                })
                              : 'N/A'}{' '}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.carbCalories
                              ? formatNumber(results.carbCalories, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}{' '}
                            kcal
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className='font-medium'>Fat</TableCell>
                          <TableCell className='text-right'>
                            {results.fatTargetPct
                              ? formatNumber(results.fatTargetPct * 100, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}
                            %
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.fatGrams
                              ? formatNumber(results.fatGrams, {
                                  maximumFractionDigits: 1,
                                })
                              : 'N/A'}{' '}
                            g
                          </TableCell>
                          <TableCell className='text-right'>
                            {results.fatCalories
                              ? formatNumber(results.fatCalories, {
                                  maximumFractionDigits: 0,
                                })
                              : 'N/A'}{' '}
                            kcal
                          </TableCell>
                        </TableRow>
                      </TableBody>
                      <TableCaption className='text-xs mt-2 text-left'>
                        This breakdown is based on your inputs and calculated
                        goal. For custom macro adjustments, use the
                        &lsquo;Customize Your Plan&rsquo; section below.
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
                  <CustomizePlanForm
                    results={results}
                    weight={smartPlannerForm.getValues('current_weight')}
                    planData={smartPlannerData}
                  />
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
