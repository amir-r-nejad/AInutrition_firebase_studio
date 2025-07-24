
import { getUserProfile, getUserPlan } from '@/lib/supabase/data-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Dumbbell, Target, TrendingUp, Calendar, User } from 'lucide-react';
import Link from 'next/link';

export default async function ComprehensiveOverview() {
  const profile = await getUserProfile();
  const userPlan = await getUserPlan();

  const calculateAge = (birthDate: number | null) => {
    if (!birthDate) return null;
    return new Date().getFullYear() - birthDate;
  };

  const getBMIStatus = (height: number | null, weight: number | null) => {
    if (!height || !weight) return null;
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    
    if (bmi < 18.5) return { value: bmi, status: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { value: bmi, status: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { value: bmi, status: 'Overweight', color: 'text-yellow-600' };
    return { value: bmi, status: 'Obese', color: 'text-red-600' };
  };

  const bmiData = getBMIStatus(profile?.height_cm, profile?.current_weight);
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-800">Comprehensive Health Overview</h1>
        <p className="text-green-600">Complete view of your nutrition and fitness journey</p>
      </div>

      {/* Profile Summary Card */}
      <Card className="bg-gradient-to-r from-green-100 to-yellow-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <User className="w-6 h-6" />
            Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-green-600">Name</p>
              <p className="font-semibold text-green-800">{profile?.full_name || 'Not set'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Age</p>
              <p className="font-semibold text-green-800">{profile?.age || 'N/A'} years</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Gender</p>
              <p className="font-semibold text-green-800">{profile?.gender || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Height</p>
              <p className="font-semibold text-green-800">{profile?.height_cm || 'N/A'} cm</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Experience</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {profile?.workout_experience || 'Beginner'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-600">Activity</p>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {profile?.activity_level || 'Moderate'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">BMI Status</CardTitle>
          </CardHeader>
          <CardContent>
            {bmiData ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-800">{bmiData.value.toFixed(1)}</div>
                <p className={`text-sm font-medium ${bmiData.color}`}>{bmiData.status}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Complete height & weight to calculate</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Weight Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.current_weight && profile?.target_weight ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current: {profile.current_weight} kg</span>
                  <span>Target: {profile.target_weight} kg</span>
                </div>
                <Progress 
                  value={Math.abs((profile.current_weight - profile.target_weight) / profile.current_weight * 100)} 
                  className="h-3" 
                />
                <p className="text-xs text-green-600 text-center">
                  {Math.abs(profile.current_weight - profile.target_weight).toFixed(1)} kg to goal
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Set weight goals to track progress</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Body Fat Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.body_fat_percentage && profile?.target_body_fat ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current: {profile.body_fat_percentage}%</span>
                  <span>Target: {profile.target_body_fat}%</span>
                </div>
                <Progress 
                  value={Math.abs((profile.body_fat_percentage - profile.target_body_fat) / profile.body_fat_percentage * 100)} 
                  className="h-3" 
                />
                <p className="text-xs text-green-600 text-center">
                  {Math.abs(profile.body_fat_percentage - profile.target_body_fat).toFixed(1)}% to goal
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center">Set body fat goals to track progress</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nutrition & Fitness Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nutrition Section */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Nutrition Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {userPlan?.daily_calories || 0}
                </div>
                <p className="text-sm text-green-600">Daily Calories</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {userPlan?.protein_grams || 0}g
                </div>
                <p className="text-sm text-green-600">Protein Target</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Protein</span>
                  <span className="text-green-700">{userPlan?.protein_grams || 0}g</span>
                </div>
                <Progress value={userPlan?.protein_grams ? (userPlan.protein_grams / 200) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Carbs</span>
                  <span className="text-green-700">{userPlan?.carbs_grams || 0}g</span>
                </div>
                <Progress value={userPlan?.carbs_grams ? (userPlan.carbs_grams / 300) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Fat</span>
                  <span className="text-green-700">{userPlan?.fat_grams || 0}g</span>
                </div>
                <Progress value={userPlan?.fat_grams ? (userPlan.fat_grams / 100) * 100 : 0} className="h-2" />
              </div>
            </div>

            <div className="pt-4">
              <Link href="/meal-plan/optimized">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Heart className="w-4 h-4 mr-2" />
                  View Meal Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Section */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              Fitness Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {profile?.workout_experience || 'Beginner'}
                </div>
                <p className="text-sm text-green-600">Experience Level</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {profile?.preferred_workout_type || 'Mixed'}
                </div>
                <p className="text-sm text-green-600">Preferred Type</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Weekly Cardio</span>
                  <span className="text-green-700">150 min target</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Strength Training</span>
                  <span className="text-green-700">120 min target</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Flexibility</span>
                  <span className="text-green-700">45 min target</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </div>

            <div className="pt-4">
              <Link href="/tools/workout-planner">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Create Workout Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-green-100 to-yellow-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/profile">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 border-green-300 hover:bg-green-50">
                <User className="w-6 h-6 text-green-600" />
                <span className="text-green-700">Update Profile</span>
              </Button>
            </Link>
            <Link href="/tools/smart-calorie-planner">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 border-green-300 hover:bg-green-50">
                <Calculator className="w-6 h-6 text-green-600" />
                <span className="text-green-700">Calorie Planner</span>
              </Button>
            </Link>
            <Link href="/meal-plan/current">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2 border-green-300 hover:bg-green-50">
                <Calendar className="w-6 h-6 text-green-600" />
                <span className="text-green-700">View Meal Plan</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      {profile && (
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Health Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Nutrition Recommendations:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  {!userPlan?.daily_calories && (
                    <li>• Set up your calorie targets for better tracking</li>
                  )}
                  {profile.dietary_preferences && (
                    <li>• Your dietary preferences: {profile.dietary_preferences}</li>
                  )}
                  {profile.allergies && (
                    <li>• Allergies noted: {profile.allergies}</li>
                  )}
                  <li>• Consider tracking your daily food intake</li>
                  <li>• Stay hydrated throughout the day</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800">Fitness Recommendations:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  {profile.workout_experience === 'Beginner' && (
                    <li>• Start with 2-3 workout days per week</li>
                  )}
                  {profile.injuries_limitations && (
                    <li>• Consider limitations: {profile.injuries_limitations}</li>
                  )}
                  <li>• Aim for 150 minutes of moderate cardio weekly</li>
                  <li>• Include strength training 2-3 times per week</li>
                  <li>• Don't forget flexibility and recovery days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
