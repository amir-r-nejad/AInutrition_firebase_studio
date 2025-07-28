'use client';

import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import SubmitButton from '@/components/ui/SubmitButton';
import { useToast } from '@/hooks/use-toast';
import {
  ExtendedProfileData,
  UserPlanType,
  type GlobalCalculatedTargets,
} from '@/lib/schemas';
import { formatNumber } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import { editPlan } from '@/features/profile/actions/apiUserPlan';

// Create a simplified form schema for the planner
const PlannerFormSchema = {
  age: null as number | null,
  biological_sex: null as string | null,
  height_cm: null as number | null,
  current_weight_kg: null as number | null,
  target_weight_1month_kg: null as number | null,
  long_term_goal_weight_kg: null as number | null,
  physical_activity_level: null as string | null,
  primary_diet_goal: null as string | null,
  bf_current: null as number | null,
  bf_target: null as number | null,
  bf_ideal: null as number | null,
  mm_current: null as number | null,
  mm_target: null as number | null,
  mm_ideal: null as number | null,
  bw_current: null as number | null,
  bw_target: null as number | null,
  bw_ideal: null as number | null,
  waist_current: null as number | null,
  waist_goal_1m: null as number | null,
  waist_ideal: null as number | null,
  hips_current: null as number | null,
  hips_goal_1m: null as number | null,
  hips_ideal: null as number | null,
  right_leg_current: null as number | null,
  right_leg_goal_1m: null as number | null,
  right_leg_ideal: null as number | null,
  left_leg_current: null as number | null,
  left_leg_goal_1m: null as number | null,
  left_leg_ideal: null as number | null,
  right_arm_current: null as number | null,
  right_arm_goal_1m: null as number | null,
  right_arm_ideal: null as number | null,
  left_arm_current: null as number | null,
  left_arm_goal_1m: null as number | null,
  left_arm_ideal: null as number | null,
};

type PlannerFormValues = typeof PlannerFormSchema;

type PlannerFormProps = {
  plan: UserPlanType;
  profile: ExtendedProfileData;
  clientId?: string;
};

function PlannerForm({ plan, profile, clientId }: PlannerFormProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<GlobalCalculatedTargets | null>(null);

  const form = useForm<PlannerFormValues>({
    defaultValues: {
      age: profile.age || null,
      biological_sex: profile.biological_sex || null,
      height_cm: profile.height_cm || null,
      current_weight_kg: profile.current_weight_kg || null,
      target_weight_1month_kg: profile.target_weight_1month_kg || null,
      long_term_goal_weight_kg: profile.long_term_goal_weight_kg || null,
      physical_activity_level: profile.physical_activity_level || null,
      primary_diet_goal: profile.primary_diet_goal || null,
      bf_current: profile.bf_current || null,
      bf_target: profile.bf_target || null,
      bf_ideal: profile.bf_ideal || null,
      mm_current: profile.mm_current || null,
      mm_target: profile.mm_target || null,
      mm_ideal: profile.mm_ideal || null,
      bw_current: profile.bw_current || null,
      bw_target: profile.bw_target || null,
      bw_ideal: profile.bw_ideal || null,
      waist_current: profile.waist_current || null,
      waist_goal_1m: profile.waist_goal_1m || null,
      waist_ideal: profile.waist_ideal || null,
      hips_current: profile.hips_current || null,
      hips_goal_1m: profile.hips_goal_1m || null,
      hips_ideal: profile.hips_ideal || null,
      right_leg_current: profile.right_leg_current || null,
      right_leg_goal_1m: profile.right_leg_goal_1m || null,
      right_leg_ideal: profile.right_leg_ideal || null,
      left_leg_current: profile.left_leg_current || null,
      left_leg_goal_1m: profile.left_leg_goal_1m || null,
      left_leg_ideal: profile.left_leg_ideal || null,
      right_arm_current: profile.right_arm_current || null,
      right_arm_goal_1m: profile.right_arm_goal_1m || null,
      right_arm_ideal: profile.right_arm_ideal || null,
      left_arm_current: profile.left_arm_current || null,
      left_arm_goal_1m: profile.left_arm_goal_1m || null,
      left_arm_ideal: profile.left_arm_ideal || null,
    },
  });

  async function handleSmartPlannerReset() {
    form.reset({
      age: null,
      biological_sex: null,
      height_cm: null,
      current_weight_kg: null,
      target_weight_1month_kg: null,
      long_term_goal_weight_kg: null,
      physical_activity_level: 'moderate',
      primary_diet_goal: 'fat_loss',
      bf_current: null,
      bf_target: null,
      bf_ideal: null,
      mm_current: null,
      mm_target: null,
      mm_ideal: null,
      bw_current: null,
      bw_target: null,
      bw_ideal: null,
      waist_current: null,
      waist_goal_1m: null,
      waist_ideal: null,
      hips_current: null,
      hips_goal_1m: null,
      hips_ideal: null,
      right_leg_current: null,
      right_leg_goal_1m: null,
      right_leg_ideal: null,
      left_leg_current: null,
      left_leg_goal_1m: null,
      left_leg_ideal: null,
      right_arm_current: null,
      right_arm_goal_1m: null,
      right_arm_ideal: null,
      left_arm_current: null,
      left_arm_goal_1m: null,
      left_arm_ideal: null,
    });

    setResults(null);

    try {
      await editProfile({}, undefined, clientId);
      await editPlan({}, clientId);

      toast({
        title: 'Smart Planner Reset',
        description: 'All smart planner inputs and results cleared.',
      });
    } catch (error: any) {
      toast({
        title: 'Reset Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(data: PlannerFormValues) {
    if (!results) return;

    const newProfile = { ...data };

    try {
      await editProfile(newProfile, undefined, clientId);
      await editPlan(results, clientId);

      toast({
        title: 'Smart Planner Saved',
        description: 'Your smart planner data has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  // Calculate results based on form data
  useEffect(() => {
    const formValues = form.getValues();
    const { age, biological_sex, height_cm, current_weight_kg, physical_activity_level, primary_diet_goal } = formValues;

    if (!age || !biological_sex || !height_cm || !current_weight_kg || !physical_activity_level || !primary_diet_goal) {
        setResults(null);
        return;
      }

    // Basic BMR calculation (Mifflin-St Jeor Equation)
    let bmr = 0;
    if (biological_sex === 'male') {
      bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age - 161;
    }

    // Activity multiplier
    let activityMultiplier = 1.2; // sedentary
    switch (physical_activity_level) {
      case 'light':
        activityMultiplier = 1.375;
        break;
      case 'moderate':
        activityMultiplier = 1.55;
        break;
      case 'active':
        activityMultiplier = 1.725;
        break;
      case 'very_active':
        activityMultiplier = 1.9;
        break;
    }

    const tdee = bmr * activityMultiplier;

    // Calculate target calories based on goal
    let targetCalories = tdee;
    if (primary_diet_goal === 'fat_loss') {
      targetCalories = tdee - 500;
    } else if (primary_diet_goal === 'muscle_gain') {
      targetCalories = tdee + 300;
    }

    // Calculate macro distribution
    let proteinPct = 0.3;
    let carbPct = 0.4;
    let fatPct = 0.3;

    if (primary_diet_goal === 'fat_loss') {
      proteinPct = 0.35;
      carbPct = 0.35;
      fatPct = 0.3;
    } else if (primary_diet_goal === 'muscle_gain') {
      proteinPct = 0.3;
      carbPct = 0.5;
      fatPct = 0.2;
    }

    const proteinGrams = (targetCalories * proteinPct) / 4;
    const carbGrams = (targetCalories * carbPct) / 4;
    const fatGrams = (targetCalories * fatPct) / 9;

    const estimated_weekly_weight_change_kg = ((tdee - targetCalories) * 7) / 7700;

      setResults({
      bmr_kcal: bmr,
      maintenance_calories_tdee: tdee,
      target_daily_calories: targetCalories,
      target_protein_g: proteinGrams,
      protein_calories: proteinGrams * 4,
      target_protein_percentage: proteinPct * 100,
      target_carbs_g: carbGrams,
      carb_calories: carbGrams * 4,
      target_carbs_percentage: carbPct * 100,
      target_fat_g: fatGrams,
      fat_calories: fatGrams * 9,
      target_fat_percentage: fatPct * 100,
      current_weight_for_custom_calc: current_weight_kg,
        estimated_weekly_weight_change_kg,
      });
  }, [form.watch()]);

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
              <AccordionTrigger className='text-lg font-semibold'>
                Basic Information
              </AccordionTrigger>
              <AccordionContent className='grid md:grid-cols-2 gap-x-6 gap-y-4 pt-4 px-1'>
                <FormField
                  control={form.control}
                  name='age'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                          <Input
                            type='number'
                          placeholder='Enter your age'
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                ? null
                                  : parseInt(e.target.value, 10)
                              )
                            }
                          />
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
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder='Select biological sex' />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='male'>Male</SelectItem>
                          <SelectItem value='female'>Female</SelectItem>
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
                          <Input
                            type='number'
                          placeholder='Enter height in cm'
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                ? null
                                : parseInt(e.target.value, 10)
                              )
                            }
                          />
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
                          <Input
                            type='number'
                          step='0.1'
                          placeholder='Enter current weight'
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                ? null
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
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
                      <FormLabel>1-Month Goal Weight (kg)</FormLabel>
                      <FormControl>
                          <Input
                            type='number'
                          step='0.1'
                          placeholder='Enter 1-month goal weight'
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                ? null
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
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
                      <FormLabel>Long-term Goal Weight (kg)</FormLabel>
                      <FormControl>
                          <Input
                            type='number'
                          step='0.1'
                          placeholder='Enter long-term goal weight'
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                ? null
                                  : parseFloat(e.target.value)
                              )
                            }
                          />
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
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select activity level' />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='sedentary'>Sedentary</SelectItem>
                          <SelectItem value='light'>Light</SelectItem>
                          <SelectItem value='moderate'>Moderate</SelectItem>
                          <SelectItem value='active'>Active</SelectItem>
                          <SelectItem value='very_active'>Very Active</SelectItem>
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
                      <FormLabel>Primary Diet Goal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select diet goal' />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='fat_loss'>Fat Loss</SelectItem>
                          <SelectItem value='muscle_gain'>Muscle Gain</SelectItem>
                          <SelectItem value='maintenance'>Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Body Composition Section */}
            <AccordionItem value='body-composition'>
              <AccordionTrigger className='text-lg font-semibold'>
                Body Composition
              </AccordionTrigger>
              <AccordionContent className='grid md:grid-cols-3 gap-x-6 gap-y-4 pt-4 px-1'>
                {Object.entries({
                  bf_current: 'Current Body Fat %',
                  bf_target: 'Target Body Fat %',
                  bf_ideal: 'Ideal Body Fat %',
                  mm_current: 'Current Muscle Mass %',
                  mm_target: 'Target Muscle Mass %',
                  mm_ideal: 'Ideal Muscle Mass %',
                  bw_current: 'Current Bone Weight %',
                  bw_target: 'Target Bone Weight %',
                  bw_ideal: 'Ideal Bone Weight %',
                }).map(([key, label]) => (
                          <FormField
                            key={key}
                            control={form.control}
                    name={key as keyof PlannerFormValues}
                            render={({ field }) => (
                              <FormItem className='text-center'>
                        <FormLabel className='text-sm'>{label}</FormLabel>
                                <FormControl>
                                    <Input
                                      type='number'
                            step='0.1'
                            placeholder='0.0'
                                      {...field}
                                      value={field.value ?? ''}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === ''
                                  ? null
                                            : parseFloat(e.target.value)
                                        )
                                      }
                                    />
                                </FormControl>
                        <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
              </AccordionContent>
            </AccordionItem>

            {/* Measurements Section */}
            <AccordionItem value='measurements'>
              <AccordionTrigger className='text-lg font-semibold'>
                Body Measurements
              </AccordionTrigger>
              <AccordionContent className='grid md:grid-cols-3 gap-x-6 gap-y-4 pt-4 px-1'>
                {Object.entries({
                  waist_current: 'Current Waist (cm)',
                  waist_goal_1m: '1-Month Waist Goal (cm)',
                  waist_ideal: 'Ideal Waist (cm)',
                  hips_current: 'Current Hips (cm)',
                  hips_goal_1m: '1-Month Hips Goal (cm)',
                  hips_ideal: 'Ideal Hips (cm)',
                  right_leg_current: 'Current Right Leg (cm)',
                  right_leg_goal_1m: '1-Month Right Leg Goal (cm)',
                  right_leg_ideal: 'Ideal Right Leg (cm)',
                  left_leg_current: 'Current Left Leg (cm)',
                  left_leg_goal_1m: '1-Month Left Leg Goal (cm)',
                  left_leg_ideal: 'Ideal Left Leg (cm)',
                  right_arm_current: 'Current Right Arm (cm)',
                  right_arm_goal_1m: '1-Month Right Arm Goal (cm)',
                  right_arm_ideal: 'Ideal Right Arm (cm)',
                  left_arm_current: 'Current Left Arm (cm)',
                  left_arm_goal_1m: '1-Month Left Arm Goal (cm)',
                  left_arm_ideal: 'Ideal Left Arm (cm)',
                }).map(([key, label]) => (
                        <FormField
                          key={key}
                          control={form.control}
                    name={key as keyof PlannerFormValues}
                          render={({ field }) => (
                            <FormItem className='text-center'>
                        <FormLabel className='text-sm'>{label}</FormLabel>
                              <FormControl>
                                  <Input
                                    type='number'
                            step='0.1'
                            placeholder='0.0'
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === ''
                                  ? null
                                          : parseFloat(e.target.value)
                                      )
                                    }
                                  />
                              </FormControl>
                        <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Results Display */}
          {results && (
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold mb-4'>
                  Calculated Results
                </h3>
              </div>
              <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>BMR</div>
                  <div className='text-2xl font-bold'>
                    {formatNumber(results.bmr_kcal || 0, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    kcal
                  </div>
                </div>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>TDEE</div>
                  <div className='text-2xl font-bold'>
                    {formatNumber(results.maintenance_calories_tdee || 0, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    kcal
                  </div>
                </div>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Target Calories
                  </div>
                  <div className='text-2xl font-bold'>
                    {formatNumber(results.target_daily_calories || 0, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    kcal
                  </div>
                </div>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Weekly Weight Change
                  </div>
                  <div className='text-2xl font-bold'>
                    {formatNumber(results.estimated_weekly_weight_change_kg || 0, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    kg
                  </div>
                </div>
              </div>
              <div className='grid md:grid-cols-3 gap-4'>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>Protein</div>
                  <div className='text-xl font-bold'>
                    {formatNumber(results.target_protein_g || 0, {
                      maximumFractionDigits: 1,
                    })}{' '}
                    g ({formatNumber(results.target_protein_percentage || 0, {
                      maximumFractionDigits: 0,
                    })}%)
                  </div>
                </div>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>Carbs</div>
                  <div className='text-xl font-bold'>
                    {formatNumber(results.target_carbs_g || 0, {
                      maximumFractionDigits: 1,
                    })}{' '}
                    g ({formatNumber(results.target_carbs_percentage || 0, {
                      maximumFractionDigits: 0,
                    })}%)
                  </div>
                </div>
                <div className='p-4 border rounded-lg'>
                  <div className='text-sm text-muted-foreground'>Fat</div>
                  <div className='text-xl font-bold'>
                    {formatNumber(results.target_fat_g || 0, {
                      maximumFractionDigits: 1,
                    })}{' '}
                    g ({formatNumber(results.target_fat_percentage || 0, {
                      maximumFractionDigits: 0,
                    })}%)
                  </div>
                </div>
              </div>
            </div>
          )}

                    <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleSmartPlannerReset}
            >
              <RefreshCcw className='h-4 w-4' />
              Reset
            </Button>
            <Button
              type='submit'
              disabled={!results}
            >
              <Calculator className='h-4 w-4' />
              Save Results
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

export default PlannerForm;
