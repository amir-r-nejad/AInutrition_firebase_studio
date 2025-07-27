'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserProfile, getUserPlan } from '@/lib/supabase/data-service';
import { BaseProfileData, UserPlanType } from '@/lib/schemas';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Target, TrendingUp, Activity, Dumbbell, Heart, Zap } from 'lucide-react';

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

export default function DashboardPage() {
  const [profile, setProfile] = useState<BaseProfileData | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlanType | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [exercisePlan, setExercisePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, planData] = await Promise.all([
          getUserProfile(),
          getUserPlan()
        ]);

        setProfile(profileData);
        setUserPlan(planData);

        // Mock workout data - in real app, this would come from Supabase
        setWorkoutPlan({
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
            flexibility: 45
          }
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const weightProgress = profile?.current_weight && profile?.target_weight 
    ? Math.round(((profile.current_weight - profile.target_weight) / profile.current_weight) * 100)
    : 0;

  const bodyFatProgress = profile?.body_fat_percentage && profile?.target_body_fat
    ? Math.round(((profile.body_fat_percentage - profile.target_body_fat) / profile.body_fat_percentage) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-green-800">Dashboard</h1>
          <p className="text-green-600">Overview of your nutrition journey and fitness progress</p>

          {profile && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <span className="font-medium">Welcome back, {profile.full_name || 'User'}!</span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                Here's your nutrition overview and progress towards your goals.
              </p>
            </div>
          )}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="nutrition" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="nutrition" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
              <Heart className="w-4 h-4 mr-2" />
              Nutrition Plan
            </TabsTrigger>
            <TabsTrigger value="workout" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
              <Dumbbell className="w-4 h-4 mr-2" />
              Workout Plan
            </TabsTrigger>
          </TabsList>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-6">
            {/* Current Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Current Weight</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {profile?.current_weight ? `${profile.current_weight} kg` : 'Not set'}
                  </div>
                  <p className="text-xs text-green-600">
                    Target: {profile?.target_weight ? `${profile.target_weight} kg` : 'Not set'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Daily Calories</CardTitle>
                  <Zap className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {userPlan?.daily_calories ? `${userPlan.daily_calories}` : 'Not set'}
                  </div>
                  <p className="text-xs text-green-600">
                    Target: {userPlan?.daily_calories ? `${userPlan.daily_calories} kcal` : 'Not set'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Body Fat %</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {profile?.body_fat_percentage ? `${profile.body_fat_percentage}%` : 'Not set'}
                  </div>
                  <p className="text-xs text-green-600">
                    Target: {profile?.target_body_fat ? `${profile.target_body_fat}%` : 'Not set'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Activity Level</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {profile?.activity_level || 'Not set'}
                  </div>
                  <p className="text-xs text-green-600">
                    Goal for fitness
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Weight Progress</CardTitle>
                  <p className="text-sm text-green-600">Progress towards your 1-month goal</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Current: {profile?.current_weight || 0} kg</span>
                    <span className="text-green-700">Target: {profile?.target_weight || 0} kg</span>
                  </div>
                  <Progress value={Math.abs(weightProgress)} className="h-3" />
                  <p className="text-xs text-green-600">
                    Long-term goal: {profile?.target_weight ? 'Set' : 'Not set'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Body Composition</CardTitle>
                  <p className="text-sm text-green-600">Body fat and muscle mass targets</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Body Fat</span>
                      <span className="text-green-700">{profile?.body_fat_percentage || 0}% / {profile?.target_body_fat || 0}%</span>
                    </div>
                    <Progress value={Math.abs(bodyFatProgress)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Muscle Mass</span>
                      <span className="text-green-700">Not set / Not set</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Macronutrient Targets */}
            <Card className="bg-white/80 backdrop-blur-sm border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Daily Macronutrient Targets</CardTitle>
                <p className="text-sm text-green-600">Your personalized macro breakdown</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Protein</span>
                      <span className="text-green-700">{userPlan?.protein_grams || 0}g</span>
                    </div>
                    <Progress value={userPlan?.protein_grams ? (userPlan.protein_grams / 200) * 100 : 0} className="h-2" />
                    <p className="text-xs text-green-600">Not set (Not set)</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Carbohydrates</span>
                      <span className="text-green-700">{userPlan?.carbs_grams || 0}g</span>
                    </div>
                    <Progress value={userPlan?.carbs_grams ? (userPlan.carbs_grams / 300) * 100 : 0} className="h-2" />
                    <p className="text-xs text-green-600">Not set (Not set)</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Fat</span>
                      <span className="text-green-700">{userPlan?.fat_grams || 0}g</span>
                    </div>
                    <Progress value={userPlan?.fat_grams ? (userPlan.fat_grams / 100) * 100 : 0} className="h-2" />
                    <p className="text-xs text-green-600">Not set (Not set)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workout Tab */}
          <TabsContent value="workout" className="space-y-6">
            {/* Current Fitness Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Current Fitness Level</CardTitle>
                  <Target className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {workoutPlan?.currentFitnessLevel || 'Not set'}
                  </div>
                  <p className="text-xs text-green-600">
                    Target: {workoutPlan?.targetFitnessLevel || 'Not set'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Daily Activity</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {workoutPlan?.dailyActivity || 0} min
                  </div>
                  <p className="text-xs text-green-600">
                    Goal: {workoutPlan?.dailyActivityGoal || 0} min
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Workout Days/Week</CardTitle>
                  <Dumbbell className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {workoutPlan?.workoutDaysPerWeek || 0} days
                  </div>
                  <p className="text-xs text-green-600">
                    Goal: {workoutPlan?.workoutDaysGoal || 0} days
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Fitness Level</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {workoutPlan?.currentFitnessLevel || 'Not set'}
                    </Badge>
                  </div>
                  <p className="text-xs text-green-600">
                    Goal for strength
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Fitness Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Workout Progress</CardTitle>
                  <p className="text-sm text-green-600">Progress towards your 1-month fitness goal</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Current Progress</span>
                    <span className="text-green-700">{workoutPlan?.fitnessGoalProgress || 0}%</span>
                  </div>
                  <Progress value={workoutPlan?.fitnessGoalProgress || 0} className="h-3" />
                  <p className="text-xs text-green-600">
                    Long-term goal: Monthly fitness improvement
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800">Fitness Composition</CardTitle>
                  <p className="text-sm text-green-600">Strength and endurance targets</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Strength Level</span>
                      <span className="text-green-700">{workoutPlan?.strengthLevel || 0}% / {workoutPlan?.strengthTarget || 0}%</span>
                    </div>
                    <Progress value={workoutPlan?.strengthLevel || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Endurance Level</span>
                      <span className="text-green-700">{workoutPlan?.enduranceLevel || 0}% / {workoutPlan?.enduranceTarget || 0}%</span>
                    </div>
                    <Progress value={workoutPlan?.enduranceLevel || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Workout Targets */}
            <Card className="bg-white/80 backdrop-blur-sm border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Weekly Workout Targets</CardTitle>
                <p className="text-sm text-green-600">Your personalized workout breakdown</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Cardio</span>
                      <span className="text-green-700">{workoutPlan?.weeklyTargets.cardio || 0} min</span>
                    </div>
                    <Progress value={(workoutPlan?.weeklyTargets.cardio || 0) / 2} className="h-2" />
                    <p className="text-xs text-green-600">Weekly target</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Strength</span>
                      <span className="text-green-700">{workoutPlan?.weeklyTargets.strength || 0} min</span>
                    </div>
                    <Progress value={(workoutPlan?.weeklyTargets.strength || 0) / 2} className="h-2" />
                    <p className="text-xs text-green-600">Weekly target</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Flexibility</span>
                      <span className="text-green-700">{workoutPlan?.weeklyTargets.flexibility || 0} min</span>
                    </div>
                    <Progress value={(workoutPlan?.weeklyTargets.flexibility || 0) / 2} className="h-2" />
                    <p className="text-xs text-green-600">Weekly target</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
            <Target className="w-4 h-4 mr-2" />
            Generate Nutrition Plan
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
            <Dumbbell className="w-4 h-4 mr-2" />
            Generate Workout Plan
          </Button>
        </div>
      </div>
    </div>
  );
}