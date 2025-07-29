'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { editPlan } from '@/features/profile/actions/apiUserPlan';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import HelpAccordion from '@/features/tools/components/calorie-planner/HelpAccordion';
import PlanResult from '@/features/tools/components/calorie-planner/PlanResult';
import { useToast } from '@/hooks/use-toast';
import {
  activityLevels,
  genders,
  smartPlannerDietGoals,
} from '@/lib/constants';
import { calculateBMR, calculateTDEE } from '@/lib/nutrition-calculator';
import {
  BaseProfileData,
  SmartCaloriePlannerFormSchema,
  UserPlanType,
  type GlobalCalculatedTargets,
  type SmartCaloriePlannerFormValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldPath, useForm, SubmitHandler } from 'react-hook-form';

type PlannerFormProps = {
  plan: UserPlanType;
  profile: BaseProfileData;
  clientId?: string;
};

function PlannerForm({ plan, profile, clientId }: PlannerFormProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<GlobalCalculatedTargets | null>(null);

  const form = useForm<SmartCaloriePlannerFormValues>({
    resolver: zodResolver(SmartCaloriePlannerFormSchema),
    defaultValues: profile,
  });

  async function handleSmartPlannerReset() {
    form.reset({
      age: undefined,
      biological_sex: undefined,
      height_cm: undefined,
      current_weight_kg: undefined,
      target_weight_1month_kg: undefined,
      long_term_goal_weight_kg: undefined,
      physical_activity_level: 'moderate',
      primary_diet_goal: 'fat_loss',
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
      remaining_calories_carbs_percentage: 50,
    });

    setResults(null);

    const {
      custom_protein_per_kg,
      custom_total_calories,
      remaining_calories_carbs_percentage,
      ...newProfile
    } = form.getValues();

    // Convert null values to undefined for the profile update
    const profileUpdate = Object.fromEntries(
      Object.entries(newProfile).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    ) as Partial<BaseProfileData>;

    try {
      await editProfile(profileUpdate, undefined, clientId);
      await editPlan(
        {
          custom_protein_per_kg,
          custom_total_calories,
          remaining_calories_carbs_percentage,
        },
        clientId
      );

      toast({
        title: 'Smart Planner Reset',
        description: 'All smart planner inputs and results cleared.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  const onSubmit: SubmitHandler<SmartCaloriePlannerFormValues> = async (
    data
  ) => {
    const activity = activityLevels.find(
      (al) => al.value === data.physical_activity_level
    );
    if (
      !activity ||
      !data.physical_activity_level ||
      !data.current_weight_kg ||
      !data.height_cm ||
      !data.age ||
      !data.target_weight_1month_kg ||
      !data.primary_diet_goal ||
      !data.biological_sex
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required basic info fields.',
        variant: 'destructive',
      });

      return;
    }

    const bmr = calculateBMR(
      data.biological_sex,
      data.current_weight_kg,
      data.height_cm,
      data.age
    );
    const tdee = calculateTDEE(bmr, data.physical_activity_level);

    let targetCaloriesS1: number;
    const weightDeltaKg1M =
      data.current_weight_kg - data.target_weight_1month_kg;
    const calorieAdjustmentS1 = (7700 * weightDeltaKg1M) / 30;
    targetCaloriesS1 = tdee - calorieAdjustmentS1;

    if (data.primary_diet_goal === 'fat_loss') {
      targetCaloriesS1 = Math.min(targetCaloriesS1, tdee - 200);
      targetCaloriesS1 = Math.max(targetCaloriesS1, bmr + 200, 1200);
    } else if (data.primary_diet_goal === 'muscle_gain') {
      targetCaloriesS1 = Math.max(targetCaloriesS1, tdee + 150);
    } else if (data.primary_diet_goal === 'recomp') {
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
      data.bf_current &&
      data.bf_target &&
      data.current_weight_kg &&
      data.bf_current > 0 &&
      data.bf_target > 0 &&
      data.bf_current > data.bf_target
    ) {
      const fatMassLossKg =
        data.current_weight_kg * ((data.bf_current - data.bf_target) / 100);
      const calorieAdjustmentS2 = (7700 * fatMassLossKg) / 30;
      targetCaloriesS2 = tdee - calorieAdjustmentS2;
      finalTargetCalories = (finalTargetCalories + targetCaloriesS2) / 2;
    }

    if (
      data.waist_current &&
      data.waist_goal_1m &&
      data.current_weight_kg &&
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
        (estimatedFatLossPercent / 100) * data.current_weight_kg;
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
    if (data.primary_diet_goal === 'fat_loss') {
      proteinTargetPct = 0.35;
      carbTargetPct = 0.35;
      fatTargetPct = 0.3;
    } else if (data.primary_diet_goal === 'muscle_gain') {
      proteinTargetPct = 0.3;
      carbTargetPct = 0.5;
      fatTargetPct = 0.2;
    } else if (data.primary_diet_goal === 'recomp') {
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

    const {
      protein_calories,
      carb_calories,
      fat_calories,
      current_weight_for_custom_calc,
      estimated_weekly_weight_change_kg,
      ...newPlan
    }: GlobalCalculatedTargets = {
      bmr_kcal: Math.round(bmr),
      maintenance_calories_tdee: Math.round(tdee),
      target_daily_calories: Math.round(finalTargetCalories),

      target_protein_percentage: proteinTargetPct * 100,
      target_fat_percentage: fatTargetPct * 100,
      target_carbs_percentage: carbTargetPct * 100,

      target_protein_g: proteinGrams,
      target_carbs_g: carbGrams,
      target_fat_g: fatGrams,

      estimated_weekly_weight_change_kg: estimatedWeeklyWeightChangeKg,
      protein_calories: proteinCalories,
      carb_calories: carbCalories,
      fat_calories: fatCalories,
      current_weight_for_custom_calc: data.current_weight_kg,
    };

    const { remaining_calories_carbs_percentage, ...newProfile } = data;

    // Convert null values to undefined for the profile update
    const profileUpdate = Object.fromEntries(
      Object.entries(newProfile).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ])
    ) as Partial<BaseProfileData>;

    try {
      await editProfile(profileUpdate, undefined, clientId);
      await editPlan(
        {
          ...newPlan,
          remaining_calories_carbs_percentage,
        },
        clientId
      );

      setResults({
        estimated_weekly_weight_change_kg,
        protein_calories,
        carb_calories,
        fat_calories,
        current_weight_for_custom_calc,
        ...newPlan,
      });
      toast({
        title: 'Calculation Complete',
        description: 'Your smart calorie plan has been generated and saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error,
        variant: 'destructive',
      });
    }
  };

  useEffect(
    function () {
      const estimated_weekly_weight_change_kg =
        ((plan.maintenance_calories_tdee! - plan.target_daily_calories!) * 7) /
        7700;

      const proteinCalories =
        (plan.target_protein_percentage! * plan.target_daily_calories!) / 100;
      const carbCalories =
        (plan.target_carbs_percentage! * plan.target_daily_calories!) / 100;
      const fatCalories =
        (plan.target_fat_percentage! * plan.target_daily_calories!) / 100;

      setResults({
        ...plan,
        estimated_weekly_weight_change_kg,
        protein_calories: proteinCalories,
        carb_calories: carbCalories,
        fat_calories: fatCalories,
      });
    },
    [plan]
  );

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
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
                  control={form.control}
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
                                  ? ''
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
                  name='biological_sex'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biological Sex</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) =>
                          value && field.onChange(value)
                        }
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
                  control={form.control}
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
                                  ? ''
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
                  name='current_weight_kg'
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
                                  ? ''
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
                  name='target_weight_1month_kg'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Weight After 1 Month (kg)</FormLabel>
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
                                  ? ''
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
                  name='long_term_goal_weight_kg'
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
                                  ? ''
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
                  name='physical_activity_level'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Activity Level</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) =>
                          value && field.onChange(value)
                        }
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
                  control={form.control}
                  name='primary_diet_goal'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Goal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
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
                  <FormLabel className='text-center'>Current (%)</FormLabel>
                  <FormLabel className='text-center'>
                    Target (1 Mth) (%)
                  </FormLabel>
                  <FormLabel className='text-center'>Ideal (%)</FormLabel>
                </div>
                {(['Body Fat', 'Muscle Mass', 'Body Water'] as const).map(
                  (metric) => {
                    const keys = {
                      'Body Fat': ['bf_current', 'bf_target', 'bf_ideal'],
                      'Muscle Mass': ['mm_current', 'mm_target', 'mm_ideal'],
                      'Body Water': ['bw_current', 'bw_target', 'bw_ideal'],
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
                        <FormLabel className='text-sm pt-2'>{metric}</FormLabel>
                        {keys.map((key) => (
                          <FormField
                            key={key}
                            control={form.control}
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
                                            ? ''
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
                  <FormLabel className='text-center'>Current (cm)</FormLabel>
                  <FormLabel className='text-center'>1-Mth Goal (cm)</FormLabel>
                  <FormLabel className='text-center'>Ideal (cm)</FormLabel>
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
                    Waist: ['waist_current', 'waist_goal_1m', 'waist_ideal'],
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
                      <FormLabel className='text-sm pt-2'>{metric}</FormLabel>
                      {keys.map((key) => (
                        <FormField
                          key={key}
                          control={form.control}
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
                                          ? ''
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

            <HelpAccordion />
          </Accordion>

          <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8'>
            <Button
              type='submit'
              className='flex-1 text-lg py-3'
              disabled={form.formState.isSubmitting}
            >
              {' '}
              <Calculator className='mr-2 h-5 w-5' />{' '}
              {form.formState.isSubmitting
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
              <RefreshCcw className='mr-2 h-4 w-4' /> Reset Smart Planner Inputs{' '}
            </Button>
          </div>
        </form>
      </Form>

      <PlanResult results={results} />
    </>
  );
}

export default PlannerForm;
