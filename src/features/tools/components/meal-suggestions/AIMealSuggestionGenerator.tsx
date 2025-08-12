'use client';

import { suggestMealsForMacros } from '@/ai/flows/suggest-meals-for-macros';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

import { getMissingProfileFields } from '@/features/meal-plan/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { defaultMacroPercentages, mealNames } from '@/lib/constants';
import {
  BaseProfileData,
  SuggestMealsForMacrosOutput,
  UserPlanType,
} from '@/lib/schemas';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useMealUrlParams } from '../../hooks/useMealUrlParams';
import { getExampleTargetsForMeal, prepareAiMealInput } from '../../lib/utils';
import { getUserProfile } from '@/lib/supabase/data-service';

function AIMealSuggestionGenerator({
  profile,
  plan,
}: {
  plan: UserPlanType;
  profile: BaseProfileData;
}) {
  const { updateUrlWithMeal, getQueryParams, getCurrentMealParams } =
    useMealUrlParams();

  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [error, setError] = useState<string | null>(null);
  const [isLoadingAiSuggestions, startLoadingAiSuggestions] = useTransition();

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

  // Function to update URL with all target macros
  const updateUrlWithTargets = useCallback(
    (targets: typeof targetMacros) => {
      if (!targets) return;

      const urlSearchParams = new URLSearchParams(searchParams);
      urlSearchParams.set('mealName', targets.mealName);
      urlSearchParams.set('calories', targets.calories.toFixed(2).toString());
      urlSearchParams.set('protein', targets.protein.toFixed(2).toString());
      urlSearchParams.set('carbs', targets.carbs.toFixed(2).toString());
      urlSearchParams.set('fat', targets.fat.toFixed(2).toString());

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const calculateTargetsForSelectedMeal = useCallback(() => {
    if (!selectedMealName) return;

    setSuggestions([]);
    setError(null);

    const missingFields = getMissingProfileFields(profile);

    if (missingFields.length === 0) {
      const dailyTotals = {
        targetCalories:
          plan?.custom_total_calories ?? plan?.target_daily_calories,
        targetProtein: plan?.custom_protein_g ?? plan?.target_protein_g,
        targetCarbs: plan?.custom_carbs_g ?? plan?.target_carbs_g,
        targetFat: plan?.custom_fat_g ?? plan?.target_fat_g,
      };

      let mealDistribution;
      const userMealDistributions = profile.meal_distributions;
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
        updateUrlWithTargets(newTargets);
      } else {
        // Set demo mode and use example targets
        const exampleTargets = getExampleTargetsForMeal(selectedMealName);
        updateUrlWithTargets(exampleTargets);
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
      updateUrlWithTargets(exampleTargets);
      toast({
        title: 'Profile Incomplete or Demo',
        description: `Showing example targets for ${selectedMealName}. Please complete your profile via Onboarding or Smart Calorie Planner for personalized calculations.`,
        duration: 7000,
        variant: 'default',
      });
    }
  }, [plan, profile, selectedMealName, toast, updateUrlWithTargets]);

  useEffect(() => {
    if (selectedMealName) calculateTargetsForSelectedMeal();
  }, [selectedMealName]);

  function handleMealSelectionChange(mealValue: string) {
    setSuggestions([]);
    setError(null);

    updateUrlWithMeal(mealValue);
  }

  async function handleGetSuggestions() {
    startLoadingAiSuggestions(async () => {
      if (!targetMacros) {
        toast({
          title: 'Error',
          description: 'Target macros not loaded. Select a meal first.',
          variant: 'destructive',
        });
        return;
        console.log('RETURNED');
      }

      setError(null);
      setSuggestions([]);

      try {
        const profile = await getUserProfile();
        const aiInput = prepareAiMealInput({ targetMacros, profile });
        const data = await suggestMealsForMacros(aiInput);

        if (data) setSuggestions(data.suggestions);
        else {
          setError(error);
          toast({
            title: 'AI Response Error',
            description: error,
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch profile or suggestions.');
        toast({
          title: 'Error',
          description:
            err?.message || 'Failed to fetch profile or suggestions.',
          variant: 'destructive',
        });
      }
    });
  }

  const showContentBelowSelection = selectedMealName && targetMacros;

  return (
    <>
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
          <SelectTrigger id='meal-select' className='w-full md:w-1/2 lg:w-1/3'>
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

      {selectedMealName && !targetMacros && (
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
            onClick={() => handleGetSuggestions()}
            disabled={targetMacros.calories <= 0 || isLoadingAiSuggestions}
            size='lg'
            className='w-full md:w-auto'
          >
            {isLoadingAiSuggestions ? (
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            ) : (
              <Sparkles className='mr-2 h-5 w-5' />
            )}
            {isLoadingAiSuggestions
              ? 'Getting Suggestions...'
              : targetMacros.calories > 0
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

      {!selectedMealName && (
        <div className='text-center py-6 text-muted-foreground'>
          <p>Please select a meal type above to get started.</p>
        </div>
      )}

      {isLoadingAiSuggestions && (
        <div className='flex flex-col items-center justify-center py-8 space-y-2'>
          <Loader2 className='h-10 w-10 animate-spin text-primary' />
          <p className='text-lg text-muted-foreground'>
            Fetching creative meal ideas for your{' '}
            {targetMacros?.mealName || 'meal'}...
          </p>
        </div>
      )}

      {suggestions && suggestions.length > 0 && !isLoadingAiSuggestions && (
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
    </>
  );
}

export default AIMealSuggestionGenerator;
