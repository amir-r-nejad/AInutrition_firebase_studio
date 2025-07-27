'use client';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import NumberField from '@/features/auth/components/shared/NumberField';
import { default as SelectField } from '@/features/auth/components/shared/SelectField';
import { editPlan } from '@/features/profile/actions/apiUserPlan';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import { useToast } from '@/hooks/use-toast';
import {
  activityLevels,
  genders,
  onboardingStepsData,
  smartPlannerDietGoals,
} from '@/lib/constants';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  type GlobalCalculatedTargets,
  OnboardingFormSchema,
  type OnboardingFormValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';

export default function ClientOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const [calculatedTargets, setCalculatedTargets] =
    useState<GlobalCalculatedTargets | null>(null);
  const [customCalculatedTargets, setCustomCalculatedTargets] =
    useState<GlobalCalculatedTargets | null>(null);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingFormSchema),
    mode: 'onChange',
    defaultValues: {
      user_role: 'client',
      age: undefined,
      biological_sex: undefined,
      height_cm: undefined,
      current_weight_kg: undefined,
      target_weight_1month_kg: undefined,
      long_term_goal_weight_kg: undefined,
      physical_activity_level: undefined,
      primary_diet_goal: 'fat_loss',
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carbs_percentage: 50,
    },
  });

  const watchedCustomInputs = form.watch([
    'custom_total_calories',
    'custom_protein_per_kg',
    'remaining_calories_carbs_percentage',
    'current_weight_kg',
  ]);

  const activeStepData = onboardingStepsData.find(
    (s) => s.stepNumber === currentStep
  );

  const updateCalculatedTargetsForStep3 = useCallback(() => {
    const data = form.getValues();
    if (
      data.age &&
      data.biological_sex &&
      data.height_cm &&
      data.current_weight_kg &&
      data.physical_activity_level &&
      data.primary_diet_goal
    ) {
      const estimated = calculateEstimatedDailyTargets({
        age: data.age,
        biological_sex: data.biological_sex,
        current_weight_kg: data.current_weight_kg,
        height_cm: data.height_cm,
        physical_activity_level: data.physical_activity_level,
        primary_diet_goal: data.primary_diet_goal,
        long_term_goal_weight_kg: data.target_weight_1month_kg,
      });

      if (
        estimated.target_daily_calories &&
        estimated.target_protein_g &&
        estimated.target_carbs_g &&
        estimated.target_fat_g
      ) {
        const proteinCals = estimated.target_protein_g! * 4;
        const carbCals = estimated.target_carbs_g! * 4;
        const fatCals = estimated.target_fat_g! * 9;
        const newTargets: GlobalCalculatedTargets = {
          bmr_kcal: Math.round(estimated.bmr_kcal || 0),
          maintenance_calories_tdee: Math.round(
            estimated.maintenance_calories_tdee || 0
          ),
          target_daily_calories: Math.round(estimated.target_daily_calories),
          target_protein_g: Math.round(estimated.target_protein_g),
          protein_calories: Math.round(proteinCals),
          target_protein_percentage: Math.round(
            (proteinCals / estimated.target_daily_calories) * 100
          ),
          target_carbs_g: Math.round(estimated.target_carbs_g),
          carb_calories: Math.round(carbCals),
          target_carbs_percentage: Math.round(
            (carbCals / estimated.target_daily_calories) * 100
          ),
          target_fat_g: Math.round(estimated.target_fat_g),
          fat_calories: Math.round(fatCals),
          target_fat_percentage: Math.round(
            (fatCals / estimated.target_daily_calories) * 100
          ),
          current_weight_for_custom_calc: data.current_weight_kg,
          estimated_weekly_weight_change_kg: estimated.maintenance_calories_tdee
            ? ((estimated.maintenance_calories_tdee -
                estimated.target_daily_calories) *
                7) /
              7700
            : undefined,
        };
        setCalculatedTargets(newTargets);
      } else {
        setCalculatedTargets(null);
      }
    } else {
      setCalculatedTargets(null);
    }
  }, [form]);

  const handleNext = async () => {
    if (
      activeStepData?.fieldsToValidate &&
      activeStepData.fieldsToValidate.length > 0
    ) {
      const result = await form.trigger(
        activeStepData.fieldsToValidate as FieldPath<OnboardingFormValues>[]
      );

      if (!result) {
        let firstErrorField: FieldPath<OnboardingFormValues> | undefined =
          undefined;
        for (const field of activeStepData.fieldsToValidate) {
          if (form.formState.errors[field as keyof OnboardingFormValues]) {
            firstErrorField = field as FieldPath<OnboardingFormValues>;
            break;
          }
        }
        const errorMessage = firstErrorField
          ? form.formState.errors[firstErrorField as keyof OnboardingFormValues]
              ?.message
          : 'Please correct the errors.';
        toast({
          title: `Input Error: ${activeStepData.title}`,
          description:
            typeof errorMessage === 'string'
              ? errorMessage
              : 'Please fill all required fields correctly.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (currentStep === 2) {
      updateCalculatedTargetsForStep3();
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    if (activeStepData?.isOptional && currentStep < 5)
      setCurrentStep((prev) => prev + 1);
  };

  const processAndSaveData = async (data: OnboardingFormValues) => {
    const processedData: Record<string, any> = { ...data };

    const arrayLikeFields: (keyof OnboardingFormValues)[] = [
      'allergies',
      'preferred_cuisines',
      'dispreferrred_cuisines',
      'preferred_ingredients',
      'dispreferrred_ingredients',
      'preferred_micronutrients',
      'medical_conditions',
      'medications',
    ];

    arrayLikeFields.forEach((field) => {
      if (
        typeof processedData[field] === 'string' &&
        (processedData[field] as string).trim() !== ''
      ) {
        processedData[field] = (processedData[field] as string)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s);
      } else if (
        typeof processedData[field] === 'string' &&
        (processedData[field] as string).trim() === ''
      ) {
        processedData[field] = [];
      } else if (
        processedData[field] === undefined ||
        processedData[field] === null
      ) {
        processedData[field] = [];
      }
    });

    const profileToEdit = {
      is_onboarding_complete: true,
      user_role: processedData.user_role,
      age: processedData.age,
      biological_sex: processedData.biological_sex,
      height_cm: processedData.height_cm,
      current_weight_kg: processedData.current_weight_kg,
      target_weight_1month_kg: processedData.target_weight_1month_kg,
      long_term_goal_weight_kg: processedData.long_term_goal_weight_kg,
      physical_activity_level: processedData.physical_activity_level,
      primary_diet_goal: processedData.primary_diet_goal,
    };

    const planToEdit = {
      bmr_kcal: calculatedTargets?.bmr_kcal ?? null,
      maintenance_calories_tdee:
        calculatedTargets?.maintenance_calories_tdee ?? null,
      target_daily_calories: calculatedTargets?.target_daily_calories ?? null,
      target_protein_g: calculatedTargets?.target_protein_g ?? null,
      target_protein_percentage:
        calculatedTargets?.target_protein_percentage ?? null,
      target_carbs_g: calculatedTargets?.target_carbs_g ?? null,
      target_carbs_percentage:
        calculatedTargets?.target_carbs_percentage ?? null,
      target_fat_g: calculatedTargets?.target_fat_g ?? null,
      target_fat_percentage: calculatedTargets?.target_fat_percentage ?? null,

      custom_total_calories: processedData.custom_total_calories ?? null,
      custom_protein_per_kg: processedData.custom_protein_per_kg ?? null,
      remaining_calories_carbs_percentage:
        processedData.remaining_calories_carbs_percentage ?? null,

      custom_total_calories_final:
        customCalculatedTargets?.custom_total_calories_final ?? null,
      custom_protein_g: customCalculatedTargets?.custom_protein_g ?? null,
      custom_protein_percentage:
        customCalculatedTargets?.custom_protein_percentage ?? null,
      custom_carbs_g: customCalculatedTargets?.custom_carbs_g ?? null,
      custom_carbs_percentage:
        customCalculatedTargets?.custom_carbs_percentage ?? null,
      custom_fat_g: customCalculatedTargets?.custom_fat_g ?? null,
      custom_fat_percentage:
        customCalculatedTargets?.custom_fat_percentage ?? null,
    };

    try {
      await editPlan(planToEdit);
      await editProfile(profileToEdit);

      toast({
        title: 'Onboarding Complete!',
        description: 'Your profile has been saved. Welcome to NutriPlan!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error Saving Profile',
        description: error,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (currentStep === 3) updateCalculatedTargetsForStep3();
  }, [currentStep, updateCalculatedTargetsForStep3]);

  useEffect(() => {
    if ((currentStep !== 4 && currentStep !== 5) || !calculatedTargets) {
      if (customCalculatedTargets !== null) setCustomCalculatedTargets(null);
      return;
    }

    const [
      custom_total_calories,
      custom_protein_per_kg,
      remaining_calories_carbs_percentage,
      current_weight_kg,
    ] = watchedCustomInputs;

    const effectiveCustomTotalCalories =
      custom_total_calories && custom_total_calories > 0
        ? custom_total_calories
        : null;

    const effectiveCustomProteinPerKg =
      custom_protein_per_kg && custom_protein_per_kg >= 0
        ? custom_protein_per_kg
        : null;

    const baseWeight =
      current_weight_kg || calculatedTargets?.current_weight_for_custom_calc;

    if (!baseWeight || baseWeight <= 0) {
      if (customCalculatedTargets !== null) setCustomCalculatedTargets(null);
      return;
    }

    const effectiveTotalCalories =
      effectiveCustomTotalCalories ||
      calculatedTargets?.target_daily_calories ||
      0;

    const defaultProteinPerKg =
      calculatedTargets?.target_protein_g &&
      calculatedTargets?.current_weight_for_custom_calc &&
      calculatedTargets.current_weight_for_custom_calc > 0
        ? calculatedTargets.target_protein_g /
          calculatedTargets.current_weight_for_custom_calc
        : 1.6;

    const effectiveProteinPerKg =
      effectiveCustomProteinPerKg || defaultProteinPerKg;

    const calculatedProteinGrams = baseWeight * effectiveProteinPerKg;
    const calculatedProteinCalories = calculatedProteinGrams * 4;
    let remainingCaloriesForCustom =
      effectiveTotalCalories - calculatedProteinCalories;

    let calculatedCarbGrams = 0,
      calculatedFatGrams = 0;
    let calculatedCarbCalories = 0,
      calculatedFatCalories = 0;

    if (remainingCaloriesForCustom > 0) {
      const carbRatio = (remaining_calories_carbs_percentage ?? 50) / 100;
      const fatRatio = 1 - carbRatio;
      calculatedCarbCalories = remainingCaloriesForCustom * carbRatio;
      calculatedFatCalories = remainingCaloriesForCustom * fatRatio;
      calculatedCarbGrams = calculatedCarbCalories / 4;
      calculatedFatGrams = calculatedFatCalories / 9;
    } else {
      remainingCaloriesForCustom = 0;
    }

    const finalCustomTotalCalories =
      calculatedProteinCalories +
      Math.max(0, calculatedCarbCalories) +
      Math.max(0, calculatedFatCalories);

    const newCustomPlan: GlobalCalculatedTargets = {
      custom_total_calories_final: effectiveCustomTotalCalories
        ? Math.round(finalCustomTotalCalories)
        : null,
      custom_protein_g: effectiveCustomProteinPerKg
        ? Math.round(calculatedProteinGrams)
        : null,
      protein_calories: effectiveCustomProteinPerKg
        ? Math.round(calculatedProteinCalories)
        : null,
      custom_protein_percentage:
        effectiveCustomProteinPerKg && finalCustomTotalCalories > 0
          ? Math.round(
              (calculatedProteinCalories / finalCustomTotalCalories) * 100
            )
          : effectiveCustomProteinPerKg && calculatedProteinGrams > 0
          ? 100
          : null,
      custom_carbs_g: effectiveCustomTotalCalories
        ? Math.round(Math.max(0, calculatedCarbGrams))
        : null,
      carb_calories: effectiveCustomTotalCalories
        ? Math.round(Math.max(0, calculatedCarbCalories))
        : null,
      custom_carbs_percentage:
        effectiveCustomTotalCalories && finalCustomTotalCalories > 0
          ? Math.round(
              (Math.max(0, calculatedCarbCalories) / finalCustomTotalCalories) *
                100
            )
          : null,
      custom_fat_g: effectiveCustomTotalCalories
        ? Math.round(Math.max(0, calculatedFatGrams))
        : null,
      fat_calories: effectiveCustomTotalCalories
        ? Math.round(Math.max(0, calculatedFatCalories))
        : null,
      custom_fat_percentage:
        effectiveCustomTotalCalories && finalCustomTotalCalories > 0
          ? Math.round(
              (Math.max(0, calculatedFatCalories) / finalCustomTotalCalories) *
                100
            )
          : null,
      bmr_kcal: calculatedTargets?.bmr_kcal,
      maintenance_calories_tdee: calculatedTargets?.maintenance_calories_tdee,
      current_weight_for_custom_calc: baseWeight,
      estimated_weekly_weight_change_kg:
        calculatedTargets?.maintenance_calories_tdee && finalCustomTotalCalories
          ? ((calculatedTargets.maintenance_calories_tdee -
              finalCustomTotalCalories) *
              7) /
            7700
          : undefined,

      custom_total_calories: effectiveCustomTotalCalories,
      custom_protein_per_kg: effectiveCustomProteinPerKg,
    };
    if (
      JSON.stringify(customCalculatedTargets) !== JSON.stringify(newCustomPlan)
    )
      setCustomCalculatedTargets(newCustomPlan);
  }, [
    currentStep,
    watchedCustomInputs,
    calculatedTargets,
    customCalculatedTargets,
  ]);

  if (!activeStepData) return <LoadingScreen loadingLabel='Loading step...' />;

  const progressValue = (currentStep / onboardingStepsData.length) * 100;

  return (
    <TooltipProvider>
      <Card className='w-full max-w-2xl shadow-xl'>
        <CardHeader className='text-center'>
          <div className='flex justify-center items-center mb-4'>
            <Leaf className='h-10 w-10 text-primary' />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <CardTitle className='text-2xl font-bold cursor-help'>
                  {activeStepData.title}
                </CardTitle>
              </span>
            </TooltipTrigger>
            <TooltipContent side='top' className='max-w-xs'>
              <p>{activeStepData.tooltipText}</p>
            </TooltipContent>
          </Tooltip>
          <CardDescription>{activeStepData.explanation}</CardDescription>
          <Progress value={progressValue} className='w-full mt-4' />
          <p className='text-sm text-muted-foreground mt-1'>
            Step {currentStep} of 5
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => processAndSaveData(data))}
              className='space-y-8'
            >
              {currentStep === 1 && (
                <div className='text-center p-4 space-y-6'>
                  <div className='space-y-4'>
                    <h3 className='text-xl font-semibold text-primary'>
                      Welcome to Your Nutrition Journey!
                    </h3>
                    <p className='text-muted-foreground'>
                      Let&apos;s personalize your experience. We&apos;ll ask a
                      few questions about your health and preferences to
                      generate your ideal meal plan. It only takes 3–5 minutes.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <NumberField
                    name='age'
                    label='Age (Years)'
                    placeholder='e.g., 30'
                    step='1'
                    control={form.control}
                  />

                  <SelectField
                    name='biological_sex'
                    label='Biological Sex'
                    placeholder='Select sex'
                    options={genders}
                    control={form.control}
                  />

                  <NumberField
                    name='height_cm'
                    label='Height (cm)'
                    placeholder='e.g., 175'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField
                    name='current_weight_kg'
                    label='Current Weight (kg)'
                    placeholder='e.g., 70'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField
                    name='target_weight_1month_kg'
                    label='Target Weight After 1 Month (kg)'
                    placeholder='e.g., 68'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField
                    name='long_term_goal_weight_kg'
                    label='Long-Term Goal Weight (kg, Optional)'
                    placeholder='e.g., 65'
                    step='0.1'
                    control={form.control}
                  />

                  <SelectField
                    name='physical_activity_level'
                    label='Physical Activity Level'
                    placeholder='Select activity level'
                    options={activityLevels}
                    control={form.control}
                  />

                  <SelectField
                    name='primary_diet_goal'
                    label='Primary Diet Goal'
                    placeholder='Select your diet goal'
                    options={smartPlannerDietGoals}
                    control={form.control}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className='space-y-4 p-4 border rounded-md bg-muted/50'>
                  <h3 className='text-lg font-semibold text-primary'>
                    Your Estimated Daily Targets:
                  </h3>
                  {calculatedTargets ? (
                    <>
                      <p>
                        <strong>Basal Metabolic Rate (BMR):</strong>{' '}
                        {calculatedTargets.bmr_kcal?.toFixed(0) ?? 'N/A'} kcal
                      </p>
                      <p>
                        <strong>Maintenance Calories (TDEE):</strong>{' '}
                        {calculatedTargets.maintenance_calories_tdee?.toFixed(
                          0
                        ) ?? 'N/A'}{' '}
                        kcal
                      </p>
                      <p className='font-bold text-primary mt-2'>
                        Target Daily Calories:{' '}
                        {calculatedTargets.target_daily_calories?.toFixed(0) ??
                          'N/A'}{' '}
                        kcal
                      </p>
                      <p>
                        Target Protein:{' '}
                        {calculatedTargets.target_protein_g?.toFixed(1) ??
                          'N/A'}{' '}
                        g (
                        {calculatedTargets.target_protein_percentage?.toFixed(
                          0
                        ) ?? 'N/A'}
                        %)
                      </p>
                      <p>
                        Target Carbs:{' '}
                        {calculatedTargets.target_carbs_g?.toFixed(1) ?? 'N/A'}{' '}
                        g (
                        {calculatedTargets.target_carbs_percentage?.toFixed(
                          0
                        ) ?? 'N/A'}
                        %)
                      </p>
                      <p>
                        Target Fat:{' '}
                        {calculatedTargets.target_fat_g?.toFixed(1) ?? 'N/A'} g
                        (
                        {calculatedTargets.target_fat_percentage?.toFixed(0) ??
                          'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Estimated Weekly Progress:{' '}
                        {calculatedTargets.estimated_weekly_weight_change_kg &&
                        calculatedTargets.estimated_weekly_weight_change_kg <= 0
                          ? `${Math.abs(
                              calculatedTargets.estimated_weekly_weight_change_kg ??
                                0
                            ).toFixed(2)} kg deficit/week (Potential Loss)`
                          : `${(
                              calculatedTargets.estimated_weekly_weight_change_kg ??
                              0
                            )?.toFixed(2)} kg surplus/week (Potential Gain)`}
                      </p>
                    </>
                  ) : (
                    <p className='text-destructive flex items-center'>
                      <AlertCircle className='mr-2 h-4 w-4' /> Not enough
                      information from previous steps to calculate. Please go
                      back and complete required fields.
                    </p>
                  )}
                  <FormDescription className='text-xs mt-2'>
                    These are estimates. You can fine-tune these in the next
                    step or later in the app&apos;s tools.
                  </FormDescription>
                </div>
              )}

              {currentStep === 4 && (
                <div className='space-y-6 p-4 border rounded-md bg-muted/50'>
                  <h3 className='text-lg font-semibold text-primary mb-3'>
                    Customize Your Daily Targets
                  </h3>
                  <NumberField
                    name='custom_total_calories'
                    label='Custom Total Calories (Optional)'
                    placeholder={`e.g., ${
                      calculatedTargets?.target_daily_calories?.toFixed(0) ||
                      '2000'
                    }`}
                    description='Overrides system-calculated total daily calories.'
                    step='1'
                    control={form.control}
                  />
                  <NumberField
                    name='custom_protein_per_kg'
                    label='Custom Protein (g/kg body weight) (Optional)'
                    placeholder={`e.g., ${
                      calculatedTargets?.target_protein_g &&
                      calculatedTargets?.current_weight_for_custom_calc
                        ? (
                            calculatedTargets.target_protein_g /
                            calculatedTargets.current_weight_for_custom_calc
                          ).toFixed(1)
                        : '1.6'
                    }`}
                    description='Sets your protein intake in grams per kg of your current body weight.'
                    step='0.1'
                    control={form.control}
                  />
                  <FormField
                    control={form.control}
                    name='remaining_calories_carbs_percentage'
                    render={({ field }) => {
                      const carbPct = field.value ?? 50;
                      const fatPct = 100 - carbPct;
                      return (
                        <FormItem>
                          <FormLabel>
                            Remaining Calories Split (Carbs %)
                          </FormLabel>
                          <FormControl>
                            <div>
                              <Slider
                                value={[carbPct]}
                                onValueChange={(value) =>
                                  field.onChange(value[0])
                                }
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>
                          </FormControl>
                          <div className='flex justify-between text-xs text-muted-foreground'>
                            <span>Carbs: {carbPct.toFixed(0)}%</span>
                            <span>Fat: {fatPct.toFixed(0)}%</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  {customCalculatedTargets && (
                    <div className='mt-4 space-y-1'>
                      <h4 className='font-medium text-primary'>
                        Your Custom Plan:
                      </h4>
                      <p className='text-sm'>
                        Total Calories:{' '}
                        {customCalculatedTargets.custom_total_calories_final?.toFixed(
                          0
                        ) ?? 'N/A'}{' '}
                        kcal
                      </p>
                      <p className='text-sm'>
                        Protein:{' '}
                        {customCalculatedTargets.custom_protein_g?.toFixed(1) ??
                          'N/A'}
                        g (
                        {customCalculatedTargets.custom_protein_percentage?.toFixed(
                          0
                        ) ?? 'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Carbs:{' '}
                        {customCalculatedTargets.custom_carbs_g?.toFixed(1) ??
                          'N/A'}
                        g (
                        {customCalculatedTargets.custom_carbs_percentage?.toFixed(
                          0
                        ) ?? 'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Fat:{' '}
                        {customCalculatedTargets.custom_fat_g?.toFixed(1) ??
                          'N/A'}
                        g (
                        {customCalculatedTargets.custom_fat_percentage?.toFixed(
                          0
                        ) ?? 'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Estimated Weekly Progress:{' '}
                        {customCalculatedTargets.estimated_weekly_weight_change_kg &&
                        customCalculatedTargets.estimated_weekly_weight_change_kg <=
                          0
                          ? `${Math.abs(
                              customCalculatedTargets.estimated_weekly_weight_change_kg ??
                                0
                            ).toFixed(2)} kg deficit/week (Potential Loss)`
                          : `${(
                              customCalculatedTargets.estimated_weekly_weight_change_kg ??
                              0
                            )?.toFixed(2)} kg surplus/week (Potential Gain)`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className='text-center space-y-4'>
                  <CheckCircle className='h-16 w-16 text-green-500 mx-auto' />
                  <p className='text-lg'>
                    You&apos;re all set! Your profile is complete.
                  </p>
                  <p className='text-muted-foreground'>
                    Click &quot;Finish Onboarding&quot; to save your profile and
                    proceed to the dashboard. You can then generate your first
                    AI-powered meal plan.
                  </p>
                </div>
              )}

              <div className='flex justify-between items-center pt-6'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <div className='space-x-2'>
                  {activeStepData.isOptional && currentStep < 5 && (
                    <Button type='button' variant='ghost' onClick={handleSkip}>
                      Skip
                    </Button>
                  )}
                  {currentStep < 5 ? (
                    <Button type='button' onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={() => processAndSaveData(form.getValues())}
                      type='submit'
                    >
                      Finish Onboarding
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
