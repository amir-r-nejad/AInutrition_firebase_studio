
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
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  activityLevels,
  genders,
  onboardingStepsData,
  smartPlannerDietGoals,
  mealNames,
  defaultMacroPercentages,
} from '@/lib/constants';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import {
  type GlobalCalculatedTargets,
  OnboardingFormSchema,
  type OnboardingFormValues,
  type FullProfileType,
  preprocessDataForFirestore,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, Leaf, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user, completeOnboarding, isLoading: isAuthLoading } = useAuth();
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
      age: undefined,
      gender: undefined,
      height_cm: undefined,
      current_weight: undefined,
      goal_weight_1m: undefined,
      ideal_goal_weight: undefined,
      activityLevel: 'moderate',
      dietGoalOnboarding: 'fat_loss',
      custom_total_calories: undefined,
      custom_protein_per_kg: undefined,
      remaining_calories_carb_pct: 50,
    },
  });

  const { isSubmitting } = form.formState;

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
        estimated.finalTargetCalories &&
        estimated.proteinGrams &&
        estimated.carbGrams &&
        estimated.fatGrams
      ) {
        const proteinCals = estimated.proteinGrams * 4;
        const carbCals = estimated.carbGrams * 4;
        const fatCals = estimated.fatGrams * 9;
        const totalCalculatedCals = proteinCals + carbCals + fatCals;

        const newTargets: GlobalCalculatedTargets = {
          bmr: Math.round(estimated.bmr || 0),
          tdee: Math.round(estimated.tdee || 0),
          finalTargetCalories: Math.round(estimated.finalTargetCalories),
          proteinGrams: Math.round(estimated.proteinGrams),
          proteinCalories: Math.round(proteinCals),
          proteinTargetPct:
            totalCalculatedCals > 0
              ? Math.round((proteinCals / totalCalculatedCals) * 100)
              : undefined,
          carbGrams: Math.round(estimated.carbGrams),
          carbCalories: Math.round(carbCals),
          carbTargetPct:
            totalCalculatedCals > 0
              ? Math.round((carbCals / totalCalculatedCals) * 100)
              : undefined,
          fatGrams: Math.round(estimated.fatGrams),
          fatCalories: Math.round(fatCals),
          fatTargetPct:
            totalCalculatedCals > 0
              ? Math.round((fatCals / totalCalculatedCals) * 100)
              : undefined,
          current_weight_for_custom_calc: data.current_weight,
          estimatedWeeklyWeightChangeKg: estimated.tdee
            ? ((estimated.tdee - estimated.finalTargetCalories) * 7) / 7700
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

    if (currentStep === 3 && !customCalculatedTargets && calculatedTargets) {
      setCustomCalculatedTargets(calculatedTargets);
    }
    
    if (currentStep < 5) {
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
      currentStep < 5
    ) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const processAndSaveData = async (data: OnboardingFormValues) => {
    await completeOnboarding(data);
  };


  if (!activeStepData)
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading step...</p>
      </div>
    );
  if (!user || isAuthLoading)
    return <LoadingScreen loadingLabel='Loading user information...' />;

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
              onSubmit={form.handleSubmit(processAndSaveData)}
              className='space-y-8'
            >
              {currentStep === 1 && (
                <div className='text-center p-4'>
                  {/* Welcome/Introduction content for step 1 */}
                </div>
              )}

              {currentStep === 2 && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <NumberField<OnboardingFormValues>
                    name='age'
                    label='Age (Years)'
                    placeholder='e.g., 30'
                    step='1'
                    control={form.control}
                  />

                  <SelectField<OnboardingFormValues>
                    name='gender'
                    label='Biological Sex'
                    placeholder='Select sex'
                    options={genders}
                    control={form.control}
                  />

                  <NumberField<OnboardingFormValues>
                    name='height_cm'
                    label='Height (cm)'
                    placeholder='e.g., 175'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField<OnboardingFormValues>
                    name='current_weight'
                    label='Current Weight (kg)'
                    placeholder='e.g., 70'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField<OnboardingFormValues>
                    name='goal_weight_1m'
                    label='Target Weight After 1 Month (kg)'
                    placeholder='e.g., 68'
                    step='0.1'
                    control={form.control}
                  />

                  <NumberField<OnboardingFormValues>
                    name='ideal_goal_weight'
                    label='Long-Term Goal Weight (kg, Optional)'
                    placeholder='e.g., 65'
                    step='0.1'
                    control={form.control}
                  />

                  <SelectField<OnboardingFormValues>
                    name='activityLevel'
                    label='Physical Activity Level'
                    placeholder='Select activity level'
                    options={activityLevels}
                    control={form.control}
                  />

                  <SelectField<OnboardingFormValues>
                    name='dietGoalOnboarding'
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
                  <NumberField<OnboardingFormValues>
                    name='custom_total_calories'
                    label='Custom Total Calories (Optional)'
                    placeholder={`e.g., ${
                      calculatedTargets?.finalTargetCalories?.toFixed(0) ||
                      '2000'
                    }`}
                    description='Overrides system-calculated total daily calories.'
                    step='1'
                    control={form.control}
                  />
                  <NumberField<OnboardingFormValues>
                    name='custom_protein_per_kg'
                    label='Custom Protein (g/kg body weight) (Optional)'
                    placeholder={`e.g., ${
                      calculatedTargets?.proteinGrams &&
                      calculatedTargets?.current_weight_for_custom_calc
                        ? (
                            calculatedTargets.proteinGrams /
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
                  disabled={currentStep === 1 || isSubmitting}
                >
                  Previous
                </Button>
                <div className='space-x-2'>
                  {activeStepData.isOptional && currentStep < 5 && (
                    <Button type='button' variant='ghost' onClick={handleSkip} disabled={isSubmitting}>
                      Skip
                    </Button>
                  )}
                  {currentStep < 5 ? (
                    <Button type='button' onClick={handleNext} disabled={isSubmitting}>
                      Next
                    </Button>
                  ) : (
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : null}
                      {isSubmitting ? 'Finishing...' : 'Finish Onboarding'}
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
