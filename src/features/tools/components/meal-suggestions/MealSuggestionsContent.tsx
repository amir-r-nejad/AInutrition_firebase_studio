'use client';

import {
  suggestMealsForMacros,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from '@/ai/flows/suggest-meals-for-macros';
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
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useFetchProfile } from '@/features/meal-plan/hooks/useFetchProfile';
import { getMissingProfileFields } from '@/features/meal-plan/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  defaultMacroPercentages,
  mealNames,
  preferredDiets,
} from '@/lib/constants';
import type { BaseProfileData } from '@/lib/schemas';
import {
  MealSuggestionPreferencesSchema,
  type MealSuggestionPreferencesValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  ChefHat,
  Loader2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMealUrlParams } from '../../hooks/useMealUrlParams';
import { updateMealSuggestion } from '../../lib/data-service';
import { getExampleTargetsForMeal, prepareAiMealInput } from '../../lib/utils';
import PreferenceTextarea from './PreferenceTextarea';

function MealSuggestionsContent() {
  const { user, profileData, isLoadingProfile, fetchUserData } =
    useFetchProfile();

  const { updateUrlWithMeal, getQueryParams, getCurrentMealParams } =
    useMealUrlParams();

  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [error, setError] = useState<string | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<
    SuggestMealsForMacrosOutput['suggestions']
  >([]);

  // Derive values from URL query parameters
  const selectedMealName = useMemo(() => {
    const mealNameParam = getQueryParams('mealName');
    return mealNameParam && mealNames.includes(mealNameParam)
      ? mealNameParam
      : null;
  }, [getQueryParams]);

  const targetMacros = useMemo(() => {
    return getCurrentMealParams(selectedMealName);
  }, [getCurrentMealParams, selectedMealName]);

  // Check if we're in demo mode from URL
  const isDemoModeFromUrl = useMemo(() => {
    return getQueryParams('demo') === 'true';
  }, [getQueryParams]);

  const preferenceForm = useForm<MealSuggestionPreferencesValues>({
    resolver: zodResolver(MealSuggestionPreferencesSchema),
    defaultValues: {
      preferredDiet: undefined,
      preferredCuisines: [],
      dispreferredCuisines: [],
      preferredIngredients: [],
      dispreferredIngredients: [],
      allergies: [],
      preferredMicronutrients: [],
      medicalConditions: [],
      medications: [],
    },
  });

  // Function to update URL with all target macros
  const updateUrlWithTargets = useCallback(
    (targets: typeof targetMacros, isDemo: boolean = false) => {
      if (!targets) return;

      const urlSearchParams = new URLSearchParams(searchParams);
      urlSearchParams.set('mealName', targets.mealName);
      urlSearchParams.set('calories', targets.calories.toString());
      urlSearchParams.set('protein', targets.protein.toString());
      urlSearchParams.set('carbs', targets.carbs.toString());
      urlSearchParams.set('fat', targets.fat.toString());

      if (isDemo) urlSearchParams.set('demo', 'true');
      else urlSearchParams.delete('demo');

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    function onSuccess(data: Partial<BaseProfileData>) {
      if (!preferenceForm.formState.isDirty) {
        preferenceForm.reset({
          preferredDiet: data.preferredDiet || undefined,
          preferredCuisines: data.preferredCuisines || [],
          dispreferredCuisines: data.dispreferredCuisines || [],
          preferredIngredients: data.preferredIngredients || [],
          dispreferredIngredients: data.dispreferredIngredients || [],
          allergies: data.allergies || [],
          preferredMicronutrients: data.preferredMicronutrients || [],
          medicalConditions: data.medicalConditions || [],
          medications: data.medications || [],
        });
      }
    }

    function onFallBack() {
      if (!preferenceForm.formState.isDirty) {
        preferenceForm.reset({
          preferredDiet: undefined,
          preferredCuisines: [],
          dispreferredCuisines: [],
          preferredIngredients: [],
          dispreferredIngredients: [],
          allergies: [],
          preferredMicronutrients: [],
          medicalConditions: [],
          medications: [],
        });
      }
    }

    function onError() {
      toast({
        title: 'Error',
        description: 'Could not load profile data.',
        variant: 'destructive',
      });
    }

    fetchUserData(onError, onSuccess, onFallBack);
  }, [fetchUserData, toast, preferenceForm]);

  const calculateTargetsForSelectedMeal = useCallback(() => {
    if (!selectedMealName) return;

    // Clear previous suggestions and errors when calculating new targets
    setSuggestions([]);
    setError(null);

    const profileToUse = profileData;
    const missingFields = getMissingProfileFields(profileToUse!);

    if (missingFields.length === 0 && profileToUse) {
      const dailyTotals = {
        targetCalories:
          profileData.smartPlannerData?.formValues?.custom_total_calories,
        targetProtein: profileData.smartPlannerData?.formValues?.proteinGrams,
        targetCarbs: profileData.smartPlannerData?.formValues?.carbGrams,
        targetFat: profileData.smartPlannerData?.formValues?.fatGrams,
      };

      let mealDistribution;
      const userMealDistributions = profileData.mealDistributions;
      if (!userMealDistributions)
        mealDistribution = defaultMacroPercentages[selectedMealName];
      else
        mealDistribution = userMealDistributions.filter(
          (meal) => meal.mealName === selectedMealName
        )[0];

      if (
        dailyTotals.targetCalories &&
        dailyTotals.targetProtein &&
        dailyTotals.targetCarbs &&
        dailyTotals.targetFat &&
        mealDistribution
      ) {
        const newTargets = {
          mealName: selectedMealName,
          calories:
            dailyTotals.targetCalories * (mealDistribution.calories_pct / 100),
          protein:
            dailyTotals.targetProtein * (mealDistribution.calories_pct / 100),
          carbs:
            dailyTotals.targetCarbs * (mealDistribution.calories_pct / 100),
          fat: dailyTotals.targetFat * (mealDistribution.calories_pct / 100),
        };

        // Update URL with calculated targets
        updateUrlWithTargets(newTargets, false);
      } else {
        // Set demo mode and use example targets
        const exampleTargets = getExampleTargetsForMeal(selectedMealName);
        updateUrlWithTargets(exampleTargets, true);
        toast({
          title: 'Using Example Targets',
          description: `Could not calculate specific targets for ${selectedMealName} from profile. Ensure profile basics (age, weight, height, gender, activity, goal) are complete.`,
          duration: 6000,
          variant: 'default',
        });
      }
    } else {
      // Set demo mode and use example targets
      const exampleTargets = getExampleTargetsForMeal(selectedMealName);
      updateUrlWithTargets(exampleTargets, true);
      toast({
        title: 'Profile Incomplete or Demo',
        description: `Showing example targets for ${selectedMealName}. Please complete your profile via Onboarding or Smart Calorie Planner for personalized calculations.`,
        duration: 7000,
        variant: 'default',
      });
    }
  }, [selectedMealName, profileData, updateUrlWithTargets, toast]);

  useEffect(() => {
    if (selectedMealName && !isLoadingProfile) {
      calculateTargetsForSelectedMeal();
    }
  }, [selectedMealName, isLoadingProfile, calculateTargetsForSelectedMeal]);

  const handleMealSelectionChange = (mealValue: string) => {
    // Clear suggestions and errors when changing meal
    setSuggestions([]);
    setError(null);

    // Update URL with selected meal (this will trigger recalculation)
    updateUrlWithMeal(mealValue);
  };

  const handleGetSuggestions = async () => {
    if (!targetMacros) {
      toast({
        title: 'Error',
        description: 'Target macros not loaded. Select a meal first.',
        variant: 'destructive',
      });
      return;
    }
    if (
      isLoadingProfile &&
      !isDemoModeFromUrl &&
      (!profileData || Object.keys(profileData).length === 0)
    ) {
      toast({
        title: 'Please wait',
        description: 'User profile is still loading.',
        variant: 'default',
      });
      return;
    }

    setIsLoadingAiSuggestions(true);
    setSuggestions([]);
    setError(null);

    const currentPreferences = preferenceForm.getValues();

    try {
      if (!user?.uid || !profileData) return;
      const aiInput = prepareAiMealInput({
        targetMacros,
        profileData,
        currentPreferences,
      });

      await updateMealSuggestion(user?.uid, currentPreferences);

      const result = await suggestMealsForMacros(aiInput);
      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
      } else {
        setError('AI did not return valid suggestions.');
        toast({
          title: 'AI Response Error',
          description: 'Received an unexpected response from the AI.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Error getting meal suggestions:', err);
      console.error('Full AI error object (MealSuggestionsPage):', err);
      const errorMessage = err.message || 'An unknown error occurred';
      setError(
        `Failed to fetch meal suggestions: ${errorMessage}. Please try again.`
      );
      toast({
        title: 'AI Error',
        description: `Could not get meal suggestions from AI: ${errorMessage}`,
        variant: 'destructive',
        duration: 7000,
      });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const showContentBelowSelection =
    selectedMealName && targetMacros && !isLoadingProfile;

  return (
    <div className='space-y-6'>
      <Card className='shadow-xl'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold flex items-center'>
            <ChefHat className='mr-3 h-8 w-8 text-primary' />
            AI Meal Suggestions
          </CardTitle>
          <CardDescription>
            Select a meal, adjust preferences if needed, and get AI-powered
            ideas tailored to your macronutrient targets.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='preferences'
          >
            <AccordionItem value='preferences'>
              <AccordionTrigger>
                <div className='flex items-center gap-2'>
                  <Settings className='h-5 w-5 text-primary' />
                  <span className='text-lg font-semibold'>
                    1. Adjust Preferences for this Suggestion (Optional)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Form {...preferenceForm}>
                  <form className='space-y-6 pt-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-xl'>
                          Dietary Preferences & Restrictions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='grid md:grid-cols-2 gap-x-6 gap-y-4'>
                        <FormField
                          control={preferenceForm.control}
                          name='preferredDiet'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Diet</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? undefined}
                              >
                                <FormControl>
                                  <div>
                                    <SelectTrigger>
                                      <SelectValue placeholder='Select preferred diet' />
                                    </SelectTrigger>
                                  </div>
                                </FormControl>
                                <SelectContent>
                                  {preferredDiets.map((pd) => (
                                    <SelectItem key={pd.value} value={pd.value}>
                                      {pd.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <PreferenceTextarea
                          fieldName='allergies'
                          label='Allergies (comma-separated)'
                          placeholder='e.g., Peanuts, Shellfish'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='preferredCuisines'
                          label='Preferred Cuisines'
                          placeholder='e.g., Italian, Mexican'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='dispreferredCuisines'
                          label='Dispreferred Cuisines'
                          placeholder='e.g., Thai, French'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='preferredIngredients'
                          label='Preferred Ingredients'
                          placeholder='e.g., Chicken, Broccoli'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='dispreferredIngredients'
                          label='Dispreferred Ingredients'
                          placeholder='e.g., Tofu, Mushrooms'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='preferredMicronutrients'
                          label='Targeted Micronutrients (Optional)'
                          placeholder='e.g., Vitamin D, Iron'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='medicalConditions'
                          label='Medical Conditions (Optional)'
                          placeholder='e.g., Diabetes, Hypertension'
                          control={preferenceForm.control}
                        />

                        <PreferenceTextarea
                          fieldName='medications'
                          label='Medications (Optional)'
                          placeholder='e.g., Metformin, Lisinopril'
                          control={preferenceForm.control}
                        />
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className='space-y-2'>
            <Label
              htmlFor='meal-select'
              className='text-lg font-semibold text-primary'
            >
              2. Choose a Meal:
            </Label>
            <Select
              onValueChange={handleMealSelectionChange}
              value={selectedMealName || ''}
            >
              <SelectTrigger
                id='meal-select'
                className='w-full md:w-1/2 lg:w-1/3'
              >
                <SelectValue placeholder='Select a meal...' />
              </SelectTrigger>
              <SelectContent>
                {mealNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingProfile && !selectedMealName && (
            <div className='flex justify-center items-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin text-primary' />
              <p className='ml-2'>Loading profile data...</p>
            </div>
          )}

          {selectedMealName && !targetMacros && isLoadingProfile && (
            <div className='flex justify-center items-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin text-primary' />
              <p className='ml-2'>
                Loading profile and calculating targets for {selectedMealName}
                ...
              </p>
            </div>
          )}

          {showContentBelowSelection && (
            <>
              <div className='p-4 border rounded-md bg-muted/50'>
                <h3 className='text-lg font-semibold mb-2 text-primary'>
                  Target Macros for {targetMacros.mealName}:
                </h3>
                {isDemoModeFromUrl && (
                  <p className='text-sm text-amber-600 dark:text-amber-400 mb-2'>
                    (Displaying example targets. Complete your profile via
                    Onboarding or Smart Calorie Planner for personalized
                    calculations.)
                  </p>
                )}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <p>
                    <span className='font-medium'>Calories:</span>{' '}
                    {targetMacros.calories.toFixed(1)} kcal
                  </p>
                  <p>
                    <span className='font-medium'>Protein:</span>{' '}
                    {targetMacros.protein.toFixed(1)} g
                  </p>
                  <p>
                    <span className='font-medium'>Carbs:</span>{' '}
                    {targetMacros.carbs.toFixed(1)} g
                  </p>
                  <p>
                    <span className='font-medium'>Fat:</span>{' '}
                    {targetMacros.fat.toFixed(1)} g
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGetSuggestions}
                disabled={
                  targetMacros.calories === 0 ||
                  isLoadingAiSuggestions ||
                  (isLoadingProfile && !isDemoModeFromUrl)
                }
                size='lg'
                className='w-full md:w-auto'
              >
                {isLoadingAiSuggestions ? (
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                ) : (
                  <Sparkles className='mr-2 h-5 w-5' />
                )}
                {isLoadingProfile &&
                !isDemoModeFromUrl &&
                !isLoadingAiSuggestions
                  ? 'Loading Profile...'
                  : isLoadingAiSuggestions
                  ? 'Getting Suggestions...'
                  : targetMacros.calories !== 0
                  ? 'Get AI Meal Suggestions'
                  : 'Meals must contains a certain amount of calories'}
              </Button>

              {error && (
                <p className='text-destructive mt-4'>
                  <AlertTriangle className='inline mr-1 h-4 w-4' />
                  {error}
                </p>
              )}
            </>
          )}

          {!selectedMealName && !isLoadingProfile && (
            <div className='text-center py-6 text-muted-foreground'>
              <p>Please select a meal type above to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoadingAiSuggestions && (
        <div className='flex flex-col items-center justify-center py-8 space-y-2'>
          <Loader2 className='h-10 w-10 animate-spin text-primary' />
          <p className='text-lg text-muted-foreground'>
            Fetching creative meal ideas for your{' '}
            {targetMacros?.mealName || 'meal'}...
          </p>
        </div>
      )}

      {suggestions.length > 0 && !isLoadingAiSuggestions && (
        <div className='space-y-4'>
          <h2 className='text-2xl font-semibold text-primary mt-8 mb-4'>
            Here are some ideas for your {targetMacros?.mealName || 'meal'}:
          </h2>
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className='shadow-md hover:shadow-lg transition-shadow'
            >
              <CardHeader>
                <CardTitle className='text-xl font-semibold'>
                  {suggestion.mealTitle}
                </CardTitle>
                <CardDescription className='text-sm'>
                  {suggestion.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className='font-medium text-md mb-2 text-primary'>
                  Ingredients:
                </h4>
                <ScrollArea className='w-full mb-4'>
                  <Table className='min-w-[500px]'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[30%]'>Ingredient</TableHead>
                        <TableHead className='text-right'>Amount</TableHead>
                        <TableHead className='text-right'>Unit</TableHead>
                        <TableHead className='text-right'>Calories</TableHead>
                        <TableHead className='text-right'>
                          Macros (P/C/F)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suggestion.ingredients.map((ing, i) => (
                        <TableRow key={i}>
                          <TableCell className='font-medium py-1.5'>
                            {ing.name}
                          </TableCell>
                          <TableCell className='text-right py-1.5'>
                            {ing.amount}
                          </TableCell>
                          <TableCell className='text-right py-1.5'>
                            {ing.unit}
                          </TableCell>
                          <TableCell className='text-right py-1.5'>
                            {ing.calories.toFixed(0)}
                          </TableCell>
                          <TableCell className='text-right py-1.5 whitespace-nowrap'>
                            {ing.macrosString}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>

                <div className='text-sm font-semibold p-2 border-t border-muted-foreground/20 bg-muted/40 rounded-b-md'>
                  Total: {suggestion.totalCalories.toFixed(0)} kcal | Protein:{' '}
                  {suggestion.totalProtein.toFixed(1)}g | Carbs:{' '}
                  {suggestion.totalCarbs.toFixed(1)}g | Fat:{' '}
                  {suggestion.totalFat.toFixed(1)}g
                </div>

                {suggestion.instructions && (
                  <div className='mt-4'>
                    <h4 className='font-medium text-md mb-1 text-primary'>
                      Instructions:
                    </h4>
                    <p className='text-sm text-muted-foreground whitespace-pre-line'>
                      {suggestion.instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MealSuggestionsContent;
