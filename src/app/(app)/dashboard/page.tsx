import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import SectionHeader from '@/components/ui/SectionHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import { createClient } from '@/lib/supabase/server';
import { calculateProgress, formatValue } from '@/lib/utils';
import {
  Activity,
  Calendar,
  Download,
  Dumbbell,
  FileText,
  Heart,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface WorkoutPlan {
  currentFitnessLevel: string;
  targetFitnessLevel: string;
  dailyActivity: number;
  dailyActivityGoal: number;
  workoutDaysPerWeek: number;
  workoutDaysGoal: number;
  strengthLevel: number;
  strengthTarget: number;
  enduranceLevel: number;
  enduranceTarget: number;
  fitnessGoalProgress: number;
  weeklyTargets: {
    cardio: number;
    strength: number;
    flexibility: number;
  };
}

const workoutPlan = {
  currentFitnessLevel: 'Intermediate',
  targetFitnessLevel: 'Advanced',
  dailyActivity: 45,
  dailyActivityGoal: 60,
  workoutDaysPerWeek: 4,
  workoutDaysGoal: 5,
  strengthLevel: 65,
  strengthTarget: 80,
  enduranceLevel: 70,
  enduranceTarget: 85,
  fitnessGoalProgress: 72,
  weeklyTargets: {
    cardio: 150,
    strength: 120,
    flexibility: 45,
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (error) redirect('/error');

  const profile = await getUserProfile();
  const userPlan = await getUserPlan();

  return (
    <div className='max-w-7xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <SectionHeader
          className='text-2xl'
          title='Dashboard'
          description='Overview of your nutrition journey and progress'
        />
        <Link href='/pdf'>
          <Button className='bg-primary hover:bg-primary/90 text-primary-foreground'>
            <Download className='h-4 w-4 mr-2' />
            Download PDF Report
          </Button>
        </Link>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue='nutrition' className='w-full'>
        <TabsList className='grid w-full grid-cols-2 bg-card backdrop-blur-sm shadow-sm'>
          <TabsTrigger
            value='nutrition'
            className='data-[state=active]:bg-primary data-[state=active]:text-secondary-foreground'
          >
            <Heart className='w-4 h-4 mr-2' />
            Nutrition Plan
          </TabsTrigger>
          <TabsTrigger
            value='workout'
            className='data-[state=active]:bg-primary data-[state=active]:text-secondary-foreground'
          >
            <Dumbbell className='w-4 h-4 mr-2' />
            Workout Plan
          </TabsTrigger>
        </TabsList>

        {/* Nutrition Tab */}
        <TabsContent value='nutrition' className='space-y-6'>
          {/* Quick Stats Grid */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Current Weight
                </CardTitle>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {formatValue(profile?.current_weight_kg, ' kg')}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Target: {formatValue(profile?.target_weight_1month_kg, ' kg')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Daily Calories
                </CardTitle>
                <Target className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {formatValue(userPlan?.target_daily_calories, ' kcal')}
                </div>
                <p className='text-xs text-muted-foreground'>
                  TDEE:{' '}
                  {formatValue(userPlan?.maintenance_calories_tdee, ' kcal')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Body Fat %
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {formatValue(profile?.bf_current, '%')}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Target: {formatValue(profile?.bf_target, '%')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Activity Level
                </CardTitle>
                <Calendar className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {profile?.physical_activity_level || 'Not set'}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Goal: {profile?.primary_diet_goal || 'Not set'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='text-primary'>Weight Progress</CardTitle>
                <CardDescription>
                  Progress towards your 1-month goal
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>
                      Current: {formatValue(profile?.current_weight_kg, ' kg')}
                    </span>
                    <span>
                      Target:{' '}
                      {formatValue(profile?.target_weight_1month_kg, ' kg')}
                    </span>
                  </div>
                  <Progress
                    value={calculateProgress(
                      profile?.current_weight_kg,
                      profile?.target_weight_1month_kg
                    )}
                    className='h-2'
                  />
                </div>
                <p className='text-xs text-muted-foreground'>
                  Long-term goal:{' '}
                  {formatValue(profile?.long_term_goal_weight_kg, ' kg')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-primary'>Body Composition</CardTitle>
                <CardDescription>
                  Body fat and muscle mass targets
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Body Fat</span>
                    <span>
                      {formatValue(profile?.bf_current, '%')} /{' '}
                      {formatValue(profile?.bf_target, '%')}
                    </span>
                  </div>
                  <Progress
                    value={
                      profile?.bf_current && profile?.bf_target
                        ? Math.max(
                            0,
                            100 - (profile.bf_current / profile.bf_target) * 100
                          )
                        : 0
                    }
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Muscle Mass</span>
                    <span>
                      {formatValue(profile?.mm_current, '%')} /{' '}
                      {formatValue(profile?.mm_target, '%')}
                    </span>
                  </div>
                  <Progress
                    value={calculateProgress(
                      profile?.mm_current,
                      profile?.mm_target
                    )}
                    className='h-2'
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Macronutrient Targets */}
          <Card>
            <CardHeader>
              <CardTitle className='text-primary'>
                Daily Macronutrient Targets
              </CardTitle>
              <CardDescription>
                Your personalized macro breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 lg:grid-cols-3'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='font-medium'>Protein</span>
                    <span>
                      {formatValue(userPlan?.target_protein_g!.toFixed(2), 'g')}{' '}
                      (
                      {formatValue(
                        userPlan?.target_protein_percentage!.toFixed(2),
                        '%'
                      )}
                      )
                    </span>
                  </div>
                  <Progress
                    value={userPlan?.target_protein_percentage || 0}
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='font-medium'>Carbohydrates</span>
                    <span>
                      {formatValue(userPlan?.target_carbs_g!.toFixed(2), 'g')} (
                      {formatValue(
                        userPlan?.target_carbs_percentage!.toFixed(2),
                        '%'
                      )}
                      )
                    </span>
                  </div>
                  <Progress
                    value={userPlan?.target_carbs_percentage || 0}
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='font-medium'>Fat</span>
                    <span>
                      {formatValue(userPlan?.target_fat_g!.toFixed(2), 'g')} (
                      {formatValue(
                        userPlan?.target_fat_percentage!.toFixed(2),
                        '%'
                      )}
                      )
                    </span>
                  </div>
                  <Progress
                    value={userPlan?.target_fat_percentage || 0}
                    className='h-2'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workout Tab */}
        <TabsContent value='workout' className='space-y-6'>
          {/* Current Fitness Stats Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-green-700'>
                  Current Fitness Level
                </CardTitle>
                <Target className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {workoutPlan?.currentFitnessLevel || 'Not set'}
                </div>
                <p className='text-xs text-green-600'>
                  Target: {workoutPlan?.targetFitnessLevel || 'Not set'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-green-700'>
                  Daily Activity
                </CardTitle>
                <Activity className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {workoutPlan?.dailyActivity || 0} min
                </div>
                <p className='text-xs text-green-600'>
                  Goal: {workoutPlan?.dailyActivityGoal || 0} min
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-green-700'>
                  Workout Days/Week
                </CardTitle>
                <Dumbbell className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {workoutPlan?.workoutDaysPerWeek || 0} days
                </div>
                <p className='text-xs text-green-600'>
                  Goal: {workoutPlan?.workoutDaysGoal || 0} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-green-700'>
                  Fitness Level
                </CardTitle>
                <TrendingUp className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  <Badge variant='secondary'>
                    {workoutPlan?.currentFitnessLevel || 'Not set'}
                  </Badge>
                </div>
                <p className='text-xs text-green-600'>Goal for strength</p>
              </CardContent>
            </Card>
          </div>

          {/* Fitness Progress Charts */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-green-800'>
                  Workout Progress
                </CardTitle>
                <p className='text-sm text-green-600'>
                  Progress towards your 1-month fitness goal
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between text-sm'>
                  <span className='text-green-700'>Current Progress</span>
                  <span className='text-green-700'>
                    {workoutPlan?.fitnessGoalProgress || 0}%
                  </span>
                </div>
                <Progress
                  value={workoutPlan?.fitnessGoalProgress || 0}
                  className='h-3'
                />
                <p className='text-xs text-green-600'>
                  Long-term goal: Monthly fitness improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-green-800'>
                  Fitness Composition
                </CardTitle>
                <p className='text-sm text-green-600'>
                  Strength and endurance targets
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-700'>Strength Level</span>
                    <span className='text-green-700'>
                      {workoutPlan?.strengthLevel || 0}% /{' '}
                      {workoutPlan?.strengthTarget || 0}%
                    </span>
                  </div>
                  <Progress
                    value={workoutPlan?.strengthLevel || 0}
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-700'>Endurance Level</span>
                    <span className='text-green-700'>
                      {workoutPlan?.enduranceLevel || 0}% /{' '}
                      {workoutPlan?.enduranceTarget || 0}%
                    </span>
                  </div>
                  <Progress
                    value={workoutPlan?.enduranceLevel || 0}
                    className='h-2'
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Workout Targets */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-800'>
                Weekly Workout Targets
              </CardTitle>
              <p className='text-sm text-green-600'>
                Your personalized workout breakdown
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-700'>Cardio</span>
                    <span className='text-green-700'>
                      {workoutPlan?.weeklyTargets.cardio || 0} min
                    </span>
                  </div>
                  <Progress
                    value={(workoutPlan?.weeklyTargets.cardio || 0) / 2}
                    className='h-2'
                  />
                  <p className='text-xs text-green-600'>Weekly target</p>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-700'>Strength</span>
                    <span className='text-green-700'>
                      {workoutPlan?.weeklyTargets.strength || 0} min
                    </span>
                  </div>
                  <Progress
                    value={(workoutPlan?.weeklyTargets.strength || 0) / 2}
                    className='h-2'
                  />
                  <p className='text-xs text-green-600'>Weekly target</p>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-700'>Flexibility</span>
                    <span className='text-green-700'>
                      {workoutPlan?.weeklyTargets.flexibility || 0} min
                    </span>
                  </div>
                  <Progress
                    value={(workoutPlan?.weeklyTargets.flexibility || 0) / 2}
                    className='h-2'
                  />
                  <p className='text-xs text-green-600'>Weekly target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className='text-primary'>Quick Actions</CardTitle>
          <CardDescription>
            Jump to your most used tools and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
            <Link href='/profile'>
              <Button variant='outline' className='w-full justify-start'>
                <User className='h-4 w-4 mr-2' />
                Update Profile
              </Button>
            </Link>
            <Link href='/tools/smart-calorie-planner'>
              <Button variant='outline' className='w-full justify-start'>
                <Target className='h-4 w-4 mr-2' />
                Calorie Planner
              </Button>
            </Link>
            <Link href='/meal-plan/current'>
              <Button variant='outline' className='w-full justify-start'>
                <Calendar className='h-4 w-4 mr-2' />
                Meal Plan
              </Button>
            </Link>
            <Link href='/pdf'>
              <Button
                variant='outline'
                className='w-full justify-start border-primary/50 hover:bg-primary/5 hover:text-primary'
              >
                <FileText className='h-4 w-4 mr-2' />
                View Full Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
