
'use client';

import { generatePersonalizedMealPlan } from '@/ai/flows/generate-meal-plan';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { daysOfWeek, defaultMacroPercentages, mealNames } from '@/lib/constants';
import { db } from '@/lib/firebase/clientApp';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import type {
  FullProfileType,
  GeneratePersonalizedMealPlanInput,
  GeneratePersonalizedMealPlanOutput,
  AIGeneratedIngredient,
} from '@/lib/schemas';
import { preprocessDataForFirestore } from '@/lib/schemas';
import { getAIApiErrorMessage } from '@/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  BarChart3,
  ChefHat,
  Info,
  Loader2,
  Utensils,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

interface MealTarget {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function OptimizedMealPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] =
    useState<GeneratePersonalizedMealPlanOutput | null>(null);
  const [profileData, setProfileData] = useState<FullProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [mealTargets, setMealTargets] = useState<MealTarget[] | null>(null);

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingProfile(true);
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as FullProfileType;
            setProfileData(data);
            if (data?.aiGeneratedMealPlan) {
              setMealPlan(
                data.aiGeneratedMealPlan as GeneratePersonalizedMealPlanOutput
              );
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load profile for AI meal plan', err);
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Could not load your profile data.';
          toast({
            title: 'Error Loading Profile',
            description: errorMessage,
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setIsLoadingProfile(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (profileData && Object.keys(profileData).length > 0) {
      const dailyTargets = calculateEstimatedDailyTargets({
        age: profileData.age,
        gender: profileData.gender,
        currentWeight: profileData.current_weight,
        height: profileData.height_cm,
        activityLevel: profileData.activityLevel,
        dietGoal: profileData.dietGoalOnboarding,
      });

      if (
        !dailyTargets.finalTargetCalories ||
        !dailyTargets.proteinGrams ||
        !dailyTargets.carbGrams ||
        !dailyTargets.fatGrams
      ) {
        setMealTargets(null);
        return;
      }

      const distributions =
        profileData.mealDistributions &&
        profileData.mealDistributions.length > 0
          ? profileData.mealDistributions
          : mealNames.map((name) => ({
              mealName: name,
              calories_pct: defaultMacroPercentages[name].calories_pct,
              protein_pct: defaultMacroPercentages[name].protein_pct,
              carbs_pct: defaultMacroPercentages[name].carbs_pct,
              fat_pct: defaultMacroPercentages[name].fat_pct,
            }));

      const calculatedTargets = distributions.map((dist) => ({
        mealName: dist.mealName,
        calories: Math.round(
          dailyTargets.finalTargetCalories! * (dist.calories_pct / 100)
        ),
        protein: Math.round(
          dailyTargets.proteinGrams! * (dist.protein_pct / 100)
        ),
        carbs: Math.round(dailyTargets.carbGrams! * (dist.carbs_pct / 100)),
        fat: Math.round(dailyTargets.fatGrams! * (dist.fat_pct / 100)),
      }));

      setMealTargets(calculatedTargets);
    } else {
      setMealTargets(null);
    }
  }, [profileData]);

  const handleGeneratePlan = async () => {
    if (!user?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to generate a meal plan.',
        variant: 'destructive',
      });
      return;
    }
    if (!profileData || Object.keys(profileData).length === 0) {
      toast({
        title: 'Profile Incomplete',
        description:
          'Please complete your onboarding profile before generating an AI meal plan.',
        variant: 'destructive',
      });
      return;
    }

    if (!mealTargets) {
      toast({
        title: 'Targets Not Calculated',
        description:
          'Could not calculate meal targets. Please ensure your profile and smart calorie planner are complete.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const input: GeneratePersonalizedMealPlanInput = {
        mealTargets,
        preferredDiet: profileData.preferredDiet ?? undefined,
        allergies: profileData.allergies ?? undefined,
        dispreferredCuisines: profileData.dispreferredCuisines ?? undefined,
        preferredCuisines: profileData.preferredCuisines ?? undefined,
        dispreferredIngredients:
          profileData.dispreferredIngredients ?? undefined,
        preferredIngredients: profileData.preferredIngredients ?? undefined,
        medicalConditions: profileData.medicalConditions ?? undefined,
        medications: profileData.medications ?? undefined,
      };

      const result = await generatePersonalizedMealPlan(input);

      setMealPlan(result);

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { aiGeneratedMealPlan: preprocessDataForFirestore(result) },
        { merge: true }
      );

      toast({
        title: 'Meal Plan Generated!',
        description: 'Your AI-optimized weekly meal plan is ready.',
      });
    } catch (err: any) {
      const errorMessage = getAIApiErrorMessage(err);
      setError(errorMessage);
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig: ChartConfig = {
    calories: { label: 'Calories (kcal)', color: 'hsl(var(--chart-1))' },
    protein: { label: 'Protein (g)', color: 'hsl(var(--chart-2))' },
    fat: { label: 'Fat (g)', color: 'hsl(var(--chart-3))' },
    carbs: { label: 'Carbs (g)', color: 'hsl(var(--chart-4))' },
  };

  if (isLoadingProfile) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <CardHeader className='flex flex-col md:flex-row justify-between items-start md:items-center'>
          <div>
            <CardTitle className='text-3xl font-bold'>
              AI-Optimized Weekly Meal Plan
            </CardTitle>
            <CardDescription>
              Generate a personalized meal plan based on your profile, goals,
              and preferences.
            </CardDescription>
          </div>
          <Button
            onClick={handleGeneratePlan}
            disabled={isLoading || isLoadingProfile || !mealTargets}
            size='lg'
            className='mt-4 md:mt-0'
          >
            {isLoading ? (
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            ) : (
              <Wand2 className='mr-2 h-5 w-5' />
            )}
            {isLoading
              ? 'Generating...'
              : isLoadingProfile
              ? 'Loading Profile...'
              : 'Generate New Plan'}
          </Button>
        </CardHeader>
        <CardContent>
          {mealTargets ? (
            <Card className='mb-6 border-primary/20 shadow-md'>
              <CardHeader>
                <CardTitle className='text-xl flex items-center'>
                  <Info className='mr-2 h-5 w-5 text-primary' />
                  Targets for AI Generation
                </CardTitle>
                <CardDescription>
                  These targets are calculated from your Profile and Macro
                  Splitter settings. The AI will generate a plan to match these
                  numbers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meal</TableHead>
                      <TableHead className='text-right'>Calories</TableHead>
                      <TableHead className='text-right'>Protein (g)</TableHead>
                      <TableHead className='text-right'>Carbs (g)</TableHead>
                      <TableHead className='text-right'>Fat (g)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mealTargets.map((target) => (
                      <TableRow key={target.mealName}>
                        <TableCell className='font-medium'>
                          {target.mealName}
                        </TableCell>
                        <TableCell className='text-right'>
                          {target.calories.toFixed(0)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {target.protein.toFixed(1)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {target.carbs.toFixed(1)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {target.fat.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className='text-center py-10 text-muted-foreground border rounded-lg mb-6'>
              <AlertTriangle className='mx-auto h-12 w-12 mb-4 text-amber-500' />
              <p className='text-lg font-semibold'>
                Cannot Calculate Targets
              </p>
              <p>
                Please complete your profile in the 'Smart Calorie Planner' to
                enable AI meal plan generation.
              </p>
            </div>
          )}

          {error && (
            <p className='text-destructive text-center py-4'>
              <AlertTriangle className='inline mr-2' /> {error}
            </p>
          )}

          {!mealPlan && !isLoading && !error && (
            <div className='text-center py-10 text-muted-foreground'>
              <Utensils className='mx-auto h-12 w-12 mb-4' />
              <p className='text-lg'>
                Your AI-generated meal plan will appear here.
              </p>
              <p>Click "Generate New Plan" to get started!</p>
            </div>
          )}

          {mealPlan && (
            <div className='space-y-8 mt-6'>
              {mealPlan.weeklySummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-2xl flex items-center'>
                      <BarChart3 className='mr-2 h-6 w-6 text-primary' />
                      Weekly Nutritional Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6'>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Calories
                        </p>
                        <p className='text-xl font-bold'>
                          {(
                            mealPlan.weeklySummary?.totalCalories ?? 0
                          ).toFixed(0)}{' '}
                          kcal
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Protein
                        </p>
                        <p className='text-xl font-bold'>
                          {(mealPlan.weeklySummary?.totalProtein ?? 0).toFixed(
                            1
                          )}{' '}
                          g
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Carbs
                        </p>
                        <p className='text-xl font-bold'>
                          {(mealPlan.weeklySummary?.totalCarbs ?? 0).toFixed(
                            1
                          )}{' '}
                          g
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Total Fat
                        </p>
                        <p className='text-xl font-bold'>
                          {(mealPlan.weeklySummary?.totalFat ?? 0).toFixed(1)} g
                        </p>
                      </div>
                    </div>
                    <ChartContainer
                      config={chartConfig}
                      className='w-full h-[250px]'
                    >
                      <BarChart
                        accessibilityLayer
                        data={[
                          {
                            name: 'Protein',
                            value: mealPlan.weeklySummary?.totalProtein ?? 0,
                            fill: 'var(--color-protein)',
                          },
                          {
                            name: 'Carbs',
                            value: mealPlan.weeklySummary?.totalCarbs ?? 0,
                            fill: 'var(--color-carbs)',
                          },
                          {
                            name: 'Fat',
                            value: mealPlan.weeklySummary?.totalFat ?? 0,
                            fill: 'var(--color-fat)',
                          },
                        ]}
                        margin={{ top: 20, right: 0, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid vertical={false} strokeDasharray='3 3' />
                        <XAxis
                          dataKey='name'
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent hideIndicator />}
                        />
                        <Bar dataKey='value' radius={5}>
                          <LabelList
                            position='top'
                            offset={8}
                            className='fill-foreground text-xs'
                            formatter={(value: number) =>
                              `${value.toFixed(0)}g`
                            }
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              <Tabs
                defaultValue={mealPlan.weeklyMealPlan[0]?.day || daysOfWeek[0]}
                className='w-full'
              >
                <ScrollArea className='w-full whitespace-nowrap rounded-md border'>
                  <TabsList className='inline-flex h-auto bg-muted p-1'>
                    {mealPlan.weeklyMealPlan.map((dayPlan) => (
                      <TabsTrigger
                        key={dayPlan.day}
                        value={dayPlan.day}
                        className='px-4 py-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm'
                      >
                        {dayPlan.day}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation='horizontal' />
                </ScrollArea>

                {mealPlan.weeklyMealPlan.map((dayPlan) => (
                  <TabsContent
                    key={dayPlan.day}
                    value={dayPlan.day}
                    className='mt-6'
                  >
                    <div className='space-y-6'>
                      {dayPlan.meals.map((meal, mealIndex) => {
                        if (
                          !meal.ingredients ||
                          meal.ingredients.length === 0
                        ) {
                          return null;
                        }
                        return (
                          <Card key={mealIndex} className='shadow-md'>
                            <CardHeader>
                              <CardTitle className='text-xl font-semibold flex items-center'>
                                <ChefHat className='mr-2 h-5 w-5 text-accent' />
                                {meal.meal_title}
                              </CardTitle>
                              <CardDescription>
                                {meal.meal_name}
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
                                      <TableHead className='w-[40%]'>
                                        Ingredient
                                      </TableHead>
                                      <TableHead className='text-right'>
                                        Calories
                                      </TableHead>
                                      <TableHead className='text-right'>
                                        Protein (g)
                                      </TableHead>
                                      <TableHead className='text-right'>
                                        Carbs (g)
                                      </TableHead>
                                      <TableHead className='text-right'>
                                        Fat (g)
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {meal.ingredients.map(
                                      (
                                        ing: AIGeneratedIngredient,
                                        ingIndex
                                      ) => (
                                        <TableRow key={ingIndex}>
                                          <TableCell className='font-medium py-1.5'>
                                            {ing.name}
                                          </TableCell>
                                          <TableCell className='text-right py-1.5'>
                                            {ing.calories?.toFixed(0) ?? 'N/A'}
                                          </TableCell>
                                          <TableCell className='text-right py-1.5'>
                                            {ing.protein?.toFixed(1) ?? 'N/A'}
                                          </TableCell>
                                          <TableCell className='text-right py-1.5'>
                                            {ing.carbs?.toFixed(1) ?? 'N/A'}
                                          </TableCell>
                                          <TableCell className='text-right py-1.5'>
                                            {ing.fat?.toFixed(1) ?? 'N/A'}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                                <ScrollBar orientation='horizontal' />
                              </ScrollArea>
                              <div className='text-sm font-semibold p-2 border-t border-muted-foreground/20 bg-muted/40 rounded-b-md'>
                                Total:{' '}
                                {(meal.total_calories ?? 0).toFixed(0)} kcal |
                                Protein:{' '}
                                {(meal.total_protein_g ?? 0).toFixed(1)}g |
                                Carbs: {(meal.total_carbs_g ?? 0).toFixed(1)}g |
                                Fat: {(meal.total_fat_g ?? 0).toFixed(1)}g
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
