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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  defaultMacroPercentages,
  mealNames as defaultMealNames,
  genders,
  onboardingStepsData,
  smartPlannerDietGoals,
} from '@/lib/constants';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  FullProfileType,
  type GlobalCalculatedTargets,
  type MealMacroDistribution,
  OnboardingFormSchema,
  type OnboardingFormValues,
  preprocessDataForFirestore,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Leaf, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
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
      age: undefined,
      gender: undefined,
      height_cm: undefined,
      current_weight: undefined,
      goal_weight_1m: undefined,
      ideal_goal_weight: undefined,
      activityLevel: undefined,
      dietGoalOnboarding: 'fat_loss',
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    },
  });

  const activeStepData = onboardingStepsData.find(
    (s) => s.stepNumber === currentStep
  );

  const updateCalculatedTargetsForStep3 = useCallback(() => {
    const data = form.getValues();
    if (
      data.age &&
      data.gender &&
      data.height_cm &&
      data.current_weight &&
      data.activityLevel &&
      data.dietGoalOnboarding
    ) {
      const estimated = calculateEstimatedDailyTargets({
        age: data.age,
        gender: data.gender,
        currentWeight: data.current_weight,
        height: data.height_cm,
        activityLevel: data.activityLevel,
        dietGoal: data.dietGoalOnboarding,
        goalWeight: data.goal_weight_1m,
      });

      if (
        estimated.targetCalories &&
        estimated.targetProtein &&
        estimated.targetCarbs &&
        estimated.targetFat
      ) {
        const proteinCals = estimated.targetProtein! * 4;
        const carbCals = estimated.targetCarbs! * 4;
        const fatCals = estimated.targetFat! * 9;
        const newTargets: GlobalCalculatedTargets = {
          bmr: Math.round(estimated.bmr || 0),
          tdee: Math.round(estimated.tdee || 0),
          finalTargetCalories: Math.round(estimated.targetCalories),
          proteinGrams: Math.round(estimated.targetProtein),
          proteinCalories: Math.round(proteinCals),
          proteinTargetPct:
            estimated.targetProtein > 0
              ? Math.round((proteinCals / estimated.targetCalories) * 100)
              : undefined,
          carbGrams: Math.round(estimated.targetCarbs),
          carbCalories: Math.round(carbCals),
          carbTargetPct:
            estimated.targetCalories > 0
              ? Math.round((carbCals / estimated.targetCalories) * 100)
              : undefined,
          fatGrams: Math.round(estimated.targetFat),
          fatCalories: Math.round(fatCals),
          fatTargetPct:
            estimated.targetCalories > 0
              ? Math.round((fatCals / estimated.targetCalories) * 100)
              : undefined,
          current_weight_for_custom_calc: data.current_weight,
          estimatedWeeklyWeightChangeKg: estimated.tdee,
        };
        setCalculatedTargets(newTargets);
      } else {
        setCalculatedTargets(null);
      }
    } else {
      setCalculatedTargets(null);
    }
  }, [form]);

  // Update calculated targets when we reach step 3 (after basic info collected)
  useEffect(() => {
    if (currentStep === 3) {
      updateCalculatedTargetsForStep3();
    }
  }, [currentStep, updateCalculatedTargetsForStep3]);

  const watchedCustomInputs = form.watch([
    'custom_total_calories',
    'custom_protein_per_kg',
    'remaining_calories_carb_pct',
    'current_weight',
  ]);

  // Handle custom calculations for step 4 (custom targets step)
  useEffect(() => {
    if (currentStep !== 4 || !calculatedTargets) {
      if (customCalculatedTargets !== null) setCustomCalculatedTargets(null);
      return;
    }

    const [
      customTotalCaloriesInput,
      customProteinPerKgInput,
      remainingCarbPctInput,
      formCurrentWeight,
    ] = watchedCustomInputs;

    const baseWeight =
      formCurrentWeight || calculatedTargets?.current_weight_for_custom_calc;

    if (!baseWeight || baseWeight <= 0) {
      if (customCalculatedTargets !== null) setCustomCalculatedTargets(null);
      return;
    }

    const effectiveTotalCalories =
      customTotalCaloriesInput !== undefined && customTotalCaloriesInput > 0
        ? customTotalCaloriesInput
        : calculatedTargets?.finalTargetCalories || 0;

    const defaultProteinPerKg =
      calculatedTargets?.proteinGrams &&
      calculatedTargets?.current_weight_for_custom_calc &&
      calculatedTargets.current_weight_for_custom_calc > 0
        ? calculatedTargets.proteinGrams /
          calculatedTargets.current_weight_for_custom_calc
        : 1.6;

    const effectiveProteinPerKg =
      customProteinPerKgInput !== undefined && customProteinPerKgInput >= 0
        ? customProteinPerKgInput
        : defaultProteinPerKg;

    const calculatedProteinGrams = baseWeight * effectiveProteinPerKg;
    const calculatedProteinCalories = calculatedProteinGrams * 4;
    let remainingCaloriesForCustom =
      effectiveTotalCalories - calculatedProteinCalories;

    let calculatedCarbGrams = 0,
      calculatedFatGrams = 0;
    let calculatedCarbCalories = 0,
      calculatedFatCalories = 0;

    if (remainingCaloriesForCustom > 0) {
      const carbRatio = (remainingCarbPctInput ?? 50) / 100;
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
      carbGrams: Math.round(Math.max(0, calculatedCarbGrams)),
      carbCalories: Math.round(Math.max(0, calculatedCarbCalories)),
      carbTargetPct:
        finalCustomTotalCalories > 0
          ? Math.round(
              (Math.max(0, calculatedCarbCalories) / finalCustomTotalCalories) *
                100
            )
          : 0,
      fatGrams: Math.round(Math.max(0, calculatedFatGrams)),
      fatCalories: Math.round(Math.max(0, calculatedFatCalories)),
      fatTargetPct:
        finalCustomTotalCalories > 0
          ? Math.round(
              (Math.max(0, calculatedFatCalories) / finalCustomTotalCalories) *
                100
            )
          : 0,
      bmr: calculatedTargets?.bmr,
      tdee: calculatedTargets?.tdee,
      current_weight_for_custom_calc: baseWeight,
      estimatedWeeklyWeightChangeKg:
        calculatedTargets?.tdee && finalCustomTotalCalories
          ? ((calculatedTargets.tdee - finalCustomTotalCalories) * 7) / 7700
          : undefined,
    };

    if (
      JSON.stringify(customCalculatedTargets) !== JSON.stringify(newCustomPlan)
    ) {
      setCustomCalculatedTargets(newCustomPlan);
    }
  }, [
    currentStep,
    watchedCustomInputs,
    calculatedTargets,
    customCalculatedTargets,
  ]);

  const handleNext = async () => {
    if (
      activeStepData?.fieldsToValidate &&
      activeStepData.fieldsToValidate.length > 0
    ) {
      const result = await form.trigger(
        activeStepData.fieldsToValidate as FieldPath<OnboardingFormValues>[]
      );
      console.log('Getting new result from form on next', form.getValues());
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

    // Calculate targets after completing step 2 (basic info)
    if (currentStep === 2) {
      updateCalculatedTargetsForStep3();
    }

    // Set default custom targets when entering step 4
    if (currentStep === 3 && !customCalculatedTargets && calculatedTargets) {
      setCustomCalculatedTargets(calculatedTargets);
    }

    // Move to next step if not at the end
    if (currentStep < 5) {
      // Changed from onboardingStepsData.length to 5
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (
      activeStepData?.isOptional &&
      currentStep < 5 // Changed from onboardingStepsData.length to 5
    ) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const processAndSaveData = async (data: OnboardingFormValues) => {
    console.log('processing the data', data);
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated.',
        variant: 'destructive',
      });
      return;
    }

    let processedData: Record<string, any> = { ...data };

    const arrayLikeFields: (keyof OnboardingFormValues)[] = [
      'allergies',
      'preferredCuisines',
      'dispreferredCuisines',
      'preferredIngredients',
      'dispreferredIngredients',
      'preferredMicronutrients',
      'medicalConditions',
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

    let finalResultsToSave: GlobalCalculatedTargets | null = null;
    if (
      customCalculatedTargets &&
      ((data.custom_total_calories !== undefined &&
        data.custom_total_calories !== null) ||
        (data.custom_protein_per_kg !== undefined &&
          data.custom_protein_per_kg !== null))
    ) {
      finalResultsToSave = customCalculatedTargets;
    } else if (calculatedTargets) {
      finalResultsToSave = calculatedTargets;
    }

    const smartPlannerFormValuesForStorage = {
      age: processedData.age,
      gender: processedData.gender,
      height_cm: processedData.height_cm,
      current_weight: processedData.current_weight,
      goal_weight_1m: processedData.goal_weight_1m,
      ideal_goal_weight: processedData.ideal_goal_weight,
      activity_factor_key: processedData.activityLevel,
      dietGoal: processedData.dietGoalOnboarding,
      bf_current: processedData.bf_current,
      bf_target: processedData.bf_target,
      bf_ideal: processedData.bf_ideal,
      mm_current: processedData.mm_current,
      mm_target: processedData.mm_target,
      mm_ideal: processedData.mm_ideal,
      bw_current: processedData.bw_current,
      bw_target: processedData.bw_target,
      bw_ideal: processedData.bw_ideal,
      waist_current: processedData.waist_current,
      waist_goal_1m: processedData.waist_goal_1m,
      waist_ideal: processedData.waist_ideal,
      hips_current: processedData.hips_current,
      hips_goal_1m: processedData.hips_goal_1m,
      hips_ideal: processedData.hips_ideal,
      right_leg_current: processedData.right_leg_current,
      right_leg_goal_1m: processedData.right_leg_goal_1m,
      right_leg_ideal: processedData.right_leg_ideal,
      left_leg_current: processedData.left_leg_current,
      left_leg_goal_1m: processedData.left_leg_goal_1m,
      left_leg_ideal: processedData.left_leg_ideal,
      right_arm_current: processedData.right_arm_current,
      right_arm_goal_1m: processedData.right_arm_goal_1m,
      right_arm_ideal: processedData.right_arm_ideal,
      left_arm_current: processedData.left_arm_current,
      left_arm_goal_1m: processedData.left_arm_goal_1m,
      left_arm_ideal: processedData.left_arm_ideal,
      custom_total_calories: processedData.custom_total_calories,
      custom_protein_per_kg: processedData.custom_protein_per_kg,
      remaining_calories_carb_pct: processedData.remaining_calories_carb_pct,
    };

    const firestoreReadyData: Partial<FullProfileType> = {
      ...preprocessDataForFirestore(processedData),
      onboardingComplete: true,
      smartPlannerData: {
        formValues: preprocessDataForFirestore(
          smartPlannerFormValuesForStorage
        ),
        results: preprocessDataForFirestore(finalResultsToSave),
      },
      mealDistributions:
        processedData.mealDistributions &&
        processedData.mealDistributions.length > 0
          ? (preprocessDataForFirestore(
              processedData.mealDistributions
            ) as MealMacroDistribution[])
          : defaultMealNames.map(
              (name) =>
                ({
                  mealName: name,
                  calories_pct:
                    defaultMacroPercentages[name]?.calories_pct || 0,
                  protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
                  carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
                  fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
                } as MealMacroDistribution)
            ),
    };

    await completeOnboarding(firestoreReadyData);
    toast({
      title: 'Onboarding Complete!',
      description: 'Your profile has been saved. Welcome to NutriPlan!',
    });
  };

  const renderNumberField = (
    name: FieldPath<OnboardingFormValues>,
    label: string,
    placeholder: string,
    description?: string,
    step: string = '1'
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {' '}
          <FormLabel>{label}</FormLabel>{' '}
          <FormControl>
            <div>
              <Input
                type='number'
                placeholder={placeholder}
                {...field}
                value={
                  field.value === undefined ||
                  field.value === null ||
                  isNaN(Number(field.value))
                    ? ''
                    : String(field.value)
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ''
                      ? undefined
                      : parseFloat(e.target.value)
                  )
                }
                step={step}
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              />
            </div>
          </FormControl>{' '}
          {description && <FormDescription>{description}</FormDescription>}{' '}
          <FormMessage />{' '}
        </FormItem>
      )}
    />
  );

  const renderSelectField = (
    name: FieldPath<OnboardingFormValues>,
    label: string,
    placeholder: string,
    options: { value: string | number; label: string }[],
    description?: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {' '}
          <FormLabel>{label}</FormLabel>{' '}
          <Select
            onValueChange={field.onChange}
            value={String(field.value || '')}
          >
            {' '}
            <FormControl>
              <div>
                <SelectTrigger>
                  {' '}
                  <SelectValue placeholder={placeholder} />{' '}
                </SelectTrigger>
              </div>
            </FormControl>{' '}
            <SelectContent>
              {' '}
              {options.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}{' '}
            </SelectContent>{' '}
          </Select>{' '}
          {description && <FormDescription>{description}</FormDescription>}{' '}
          <FormMessage />{' '}
        </FormItem>
      )}
    />
  );

  if (!activeStepData)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading step...</p>
      </div>
    );
  if (!user)
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='flex justify-center items-center'>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          <p>Loading user information...</p>
        </div>
      </div>
    );

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
              onSubmit={form.handleSubmit((data) => {
                processAndSaveData(data), console.log('Submiting data' + data);
              })}
              className='space-y-8'
            >
              {currentStep === 1 && (
                <div className='text-center p-4'>
                  {/* Welcome/Introduction content for step 1 */}
                </div>
              )}

              {currentStep === 2 && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {renderNumberField(
                    'age',
                    'Age (Years)',
                    'e.g., 30',
                    undefined,
                    '1'
                  )}
                  {renderSelectField(
                    'gender',
                    'Biological Sex',
                    'Select sex',
                    genders
                  )}
                  {renderNumberField(
                    'height_cm',
                    'Height (cm)',
                    'e.g., 175',
                    undefined,
                    '0.1'
                  )}
                  {renderNumberField(
                    'current_weight',
                    'Current Weight (kg)',
                    'e.g., 70',
                    undefined,
                    '0.1'
                  )}
                  {renderNumberField(
                    'goal_weight_1m',
                    'Target Weight After 1 Month (kg)',
                    'e.g., 68',
                    undefined,
                    '0.1'
                  )}
                  {renderNumberField(
                    'ideal_goal_weight',
                    'Long-Term Goal Weight (kg, Optional)',
                    'e.g., 65',
                    undefined,
                    '0.1'
                  )}
                  {renderSelectField(
                    'activityLevel',
                    'Physical Activity Level',
                    'Select activity level',
                    activityLevels
                  )}
                  {renderSelectField(
                    'dietGoalOnboarding',
                    'Primary Diet Goal',
                    'Select your diet goal',
                    smartPlannerDietGoals
                  )}
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
                        {calculatedTargets.bmr?.toFixed(0) ?? 'N/A'} kcal
                      </p>
                      <p>
                        <strong>Maintenance Calories (TDEE):</strong>{' '}
                        {calculatedTargets.tdee?.toFixed(0) ?? 'N/A'} kcal
                      </p>
                      <p className='font-bold text-primary mt-2'>
                        Target Daily Calories:{' '}
                        {calculatedTargets.finalTargetCalories?.toFixed(0) ??
                          'N/A'}{' '}
                        kcal
                      </p>
                      <p>
                        Target Protein:{' '}
                        {calculatedTargets.proteinGrams?.toFixed(1) ?? 'N/A'} g
                        (
                        {calculatedTargets.proteinTargetPct?.toFixed(0) ??
                          'N/A'}
                        %)
                      </p>
                      <p>
                        Target Carbs:{' '}
                        {calculatedTargets.carbGrams?.toFixed(1) ?? 'N/A'} g (
                        {calculatedTargets.carbTargetPct?.toFixed(0) ?? 'N/A'}%)
                      </p>
                      <p>
                        Target Fat:{' '}
                        {calculatedTargets.fatGrams?.toFixed(1) ?? 'N/A'} g (
                        {calculatedTargets.fatTargetPct?.toFixed(0) ?? 'N/A'}%)
                      </p>
                      <p className='text-sm'>
                        Estimated Weekly Progress:{' '}
                        {calculatedTargets.estimatedWeeklyWeightChangeKg &&
                        calculatedTargets.estimatedWeeklyWeightChangeKg <= 0
                          ? `${Math.abs(
                              calculatedTargets.estimatedWeeklyWeightChangeKg ??
                                0
                            ).toFixed(2)} kg deficit/week (Potential Loss)`
                          : `${(
                              calculatedTargets.estimatedWeeklyWeightChangeKg ??
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
                    step or later in the app's tools.
                  </FormDescription>
                </div>
              )}

              {currentStep === 4 && (
                <div className='space-y-6 p-4 border rounded-md bg-muted/50'>
                  <h3 className='text-lg font-semibold text-primary mb-3'>
                    Customize Your Daily Targets
                  </h3>
                  {renderNumberField(
                    'custom_total_calories',
                    'Custom Total Calories (Optional)',
                    `e.g., ${
                      calculatedTargets?.finalTargetCalories?.toFixed(0) ||
                      '2000'
                    }`,
                    'Overrides system-calculated total daily calories.',
                    '1'
                  )}
                  {renderNumberField(
                    'custom_protein_per_kg',
                    'Custom Protein (g/kg body weight) (Optional)',
                    `e.g., ${
                      calculatedTargets?.proteinGrams &&
                      calculatedTargets?.current_weight_for_custom_calc
                        ? (
                            calculatedTargets.proteinGrams /
                            calculatedTargets.current_weight_for_custom_calc
                          ).toFixed(1)
                        : '1.6'
                    }`,
                    'Sets your protein intake in grams per kg of your current body weight.',
                    '0.1'
                  )}
                  <FormField
                    control={form.control}
                    name='remaining_calories_carb_pct'
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
                        {customCalculatedTargets.finalTargetCalories?.toFixed(
                          0
                        ) ?? 'N/A'}{' '}
                        kcal
                      </p>
                      <p className='text-sm'>
                        Protein:{' '}
                        {customCalculatedTargets.proteinGrams?.toFixed(1) ??
                          'N/A'}
                        g (
                        {customCalculatedTargets.proteinTargetPct?.toFixed(0) ??
                          'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Carbs:{' '}
                        {customCalculatedTargets.carbGrams?.toFixed(1) ?? 'N/A'}
                        g (
                        {customCalculatedTargets.carbTargetPct?.toFixed(0) ??
                          'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Fat:{' '}
                        {customCalculatedTargets.fatGrams?.toFixed(1) ?? 'N/A'}g
                        (
                        {customCalculatedTargets.fatTargetPct?.toFixed(0) ??
                          'N/A'}
                        %)
                      </p>
                      <p className='text-sm'>
                        Estimated Weekly Progress:{' '}
                        {customCalculatedTargets.estimatedWeeklyWeightChangeKg &&
                        customCalculatedTargets.estimatedWeeklyWeightChangeKg <=
                          0
                          ? `${Math.abs(
                              customCalculatedTargets.estimatedWeeklyWeightChangeKg ??
                                0
                            ).toFixed(2)} kg deficit/week (Potential Loss)`
                          : `${(
                              customCalculatedTargets.estimatedWeeklyWeightChangeKg ??
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
                    You're all set! Your profile is complete.
                  </p>
                  <p className='text-muted-foreground'>
                    Click "Finish Onboarding" to save your profile and proceed
                    to the dashboard. You can then generate your first
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
