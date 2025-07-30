'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseProfileData } from '@/lib/schemas';
import {
  Activity,
  Award,
  Calendar,
  ChevronDown,
  Clock,
  Dumbbell,
  ExternalLink,
  Heart,
  Play,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Exercise {
  exerciseName: string;
  targetMuscles: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  instructions: string;
  youtubeSearchTerm: string;
  alternatives: Array<{
    name: string;
    instructions: string;
    youtubeSearchTerm?: string;
  }>;
}

interface WarmupCooldown {
  exercises: Array<{
    name: string;
    duration: number;
    instructions: string;
  }>;
}

interface DayWorkout {
  dayName: string;
  focus: string;
  duration: number;
  warmup?: WarmupCooldown;
  mainWorkout: Exercise[];
  cooldown?: WarmupCooldown;
}

interface AIGeneratedPlan {
  weeklyPlan: {
    [key: string]: DayWorkout;
  };
  progressionTips: string[];
  safetyNotes: string[];
  nutritionTips: string[];
}

interface WorkoutPlanGeneratorProps {
  profile: BaseProfileData | null;
}

export default function WorkoutPlanGenerator({
  profile,
}: WorkoutPlanGeneratorProps) {
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleExerciseExpansion = (exerciseKey: string) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseKey]: !prev[exerciseKey],
    }));
  };

  const generateWorkoutPlan = async () => {
    if (!profile) {
      alert(
        'Please complete your profile first to generate a personalized workout plan.'
      );
      return;
    }

    setIsGenerating(true);

    try {
      // First save preferences
      const preferencesResponse = await fetch(
        '/api/exercise-planner/save-preferences',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fitness_level: profile.workout_experience || 'Beginner',
            exercise_experience: [profile.preferred_workout_type || 'Mixed'],
            primary_goal: 'Build muscle',
            exercise_days_per_week: 3,
            available_time_per_session: 30,
            exercise_location: 'Gym',
            available_equipment: ['Dumbbells'],
            existing_medical_conditions: [],
            injuries_or_limitations: '',
            job_type: profile.physical_activity_level || 'Moderate',
            preferred_difficulty_level: 'Medium',
          }),
        }
      );

      if (!preferencesResponse.ok) {
        throw new Error('Failed to save preferences');
      }

      // Generate AI exercise plan
      const generateResponse = await fetch('/api/exercise-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a comprehensive 7-day English workout plan for:
          - Experience: ${profile.workout_experience || 'Beginner'}
          - Goal: Build muscle and improve fitness
          - Age: ${profile.age || 25}
          - Activity Level: ${profile.physical_activity_level || 'Moderate'}
          - Preferred Type: ${profile.preferred_workout_type || 'Mixed'}`,
          preferences: {
            fitness_level: profile.workout_experience || 'Beginner',
            primary_goal: 'Build muscle',
            exercise_days_per_week: 7,
            available_time_per_session: 45,
          },
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate workout plan');
      }

      const result = await generateResponse.json();

      if (result.plan?.weekly_plan?.parsed_plan) {
        setGeneratedPlan(result.plan.weekly_plan.parsed_plan);
      } else {
        throw new Error('Invalid plan format received');
      }
    } catch (error) {
      console.error('Error generating workout plan:', error);
      alert('Error generating workout plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlanStats = () => {
    if (!generatedPlan?.weeklyPlan) return null;

    const days = Object.values(generatedPlan.weeklyPlan);
    const totalWorkouts = days.length;
    const totalDuration = days.reduce(
      (sum, day) => sum + (day.duration || 0),
      0
    );
    const avgDuration =
      totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    return { totalWorkouts, totalDuration, avgDuration };
  };

  const stats = getPlanStats();

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'>
      <div className='max-w-7xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='flex items-center justify-center gap-3 mb-4'>
            <div className='p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full shadow-lg'>
              <Dumbbell className='w-8 h-8 text-white animate-pulse' />
            </div>
            <h1 className='text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'>
              AI Workout Plan Generator
            </h1>
          </div>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Create personalized weekly workout plans powered by artificial
            intelligence, tailored to your fitness level and goals
          </p>
        </div>

        {/* Profile Summary */}
        {profile && (
          <Card className='bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-xl'>
            <CardHeader>
              <CardTitle className='text-green-800 flex items-center gap-3 text-xl'>
                <Target className='w-6 h-6' />
                Your Fitness Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div className='text-center p-4 bg-white/70 rounded-lg backdrop-blur-sm shadow-md'>
                  <div className='flex items-center justify-center mb-2'>
                    <TrendingUp className='w-5 h-5 text-green-600 mr-2' />
                    <p className='text-sm font-medium text-green-700'>
                      Experience Level
                    </p>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-green-100 text-green-800 px-3 py-1 font-semibold'
                  >
                    {profile.workout_experience || 'Beginner'}
                  </Badge>
                </div>
                <div className='text-center p-4 bg-white/70 rounded-lg backdrop-blur-sm shadow-md'>
                  <div className='flex items-center justify-center mb-2'>
                    <Activity className='w-5 h-5 text-blue-600 mr-2' />
                    <p className='text-sm font-medium text-blue-700'>
                      Preferred Type
                    </p>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-blue-100 text-blue-800 px-3 py-1 font-semibold'
                  >
                    {profile.preferred_workout_type || 'Mixed'}
                  </Badge>
                </div>
                <div className='text-center p-4 bg-white/70 rounded-lg backdrop-blur-sm shadow-md'>
                  <div className='flex items-center justify-center mb-2'>
                    <Users className='w-5 h-5 text-purple-600 mr-2' />
                    <p className='text-sm font-medium text-purple-700'>
                      Activity Level
                    </p>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-purple-100 text-purple-800 px-3 py-1 font-semibold'
                  >
                    {profile.physical_activity_level || 'Moderate'}
                  </Badge>
                </div>
                <div className='text-center p-4 bg-white/70 rounded-lg backdrop-blur-sm shadow-md'>
                  <div className='flex items-center justify-center mb-2'>
                    <Calendar className='w-5 h-5 text-orange-600 mr-2' />
                    <p className='text-sm font-medium text-orange-700'>Age</p>
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-orange-100 text-orange-800 px-3 py-1 font-semibold'
                  >
                    {profile.age || 'N/A'} years
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <div className='text-center'>
          <Button
            onClick={generateWorkoutPlan}
            disabled={isGenerating || !profile}
            className='bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50'
          >
            {isGenerating ? (
              <>
                <TrendingUp className='w-6 h-6 mr-3 animate-spin' />
                Generating Your AI Exercise Plan...
              </>
            ) : (
              <>
                <Zap className='w-6 h-6 mr-3' />
                Generate AI Exercise Plan
              </>
            )}
          </Button>
          {!profile && (
            <p className='text-sm text-red-600 mt-2'>
              Please complete your profile first
            </p>
          )}
        </div>

        {/* Generated Plan Display */}
        {generatedPlan && stats && (
          <div className='space-y-8'>
            {/* Plan Header */}
            <Card className='bg-white/80 backdrop-blur-sm border-green-200 shadow-xl'>
              <CardHeader className='bg-gradient-to-r from-green-100 to-blue-100 rounded-t-lg'>
                <CardTitle className='text-2xl text-green-800 flex items-center gap-3'>
                  <Award className='w-6 h-6' />
                  Your Personalized Exercise Plan
                  <Badge className='bg-green-500 text-white ml-auto'>
                    AI Generated
                  </Badge>
                </CardTitle>
                <p className='text-green-600 mt-2'>
                  AI-generated workout plan based on your preferences and goals
                </p>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='text-center p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md'>
                    <div className='text-3xl font-bold text-green-800 mb-2'>
                      {stats.totalWorkouts}
                    </div>
                    <p className='text-sm text-green-700 font-medium'>
                      Weekly Workouts
                    </p>
                  </div>
                  <div className='text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md'>
                    <div className='text-3xl font-bold text-blue-800 mb-2'>
                      {stats.avgDuration} min
                    </div>
                    <p className='text-sm text-blue-700 font-medium'>
                      Average Duration
                    </p>
                  </div>
                  <div className='text-center p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-md'>
                    <div className='text-3xl font-bold text-purple-800 mb-2'>
                      {Math.round(stats.totalDuration / 60)}h
                    </div>
                    <p className='text-sm text-purple-700 font-medium'>
                      Total Weekly Time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Plan Tabs */}
            <Tabs defaultValue='Day1' className='w-full'>
              <TabsList className='grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-2'>
                {Object.keys(generatedPlan.weeklyPlan).map((dayKey) => {
                  const day = generatedPlan.weeklyPlan[dayKey];
                  return (
                    <TabsTrigger
                      key={dayKey}
                      value={dayKey}
                      className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200'
                    >
                      {day.dayName.substring(0, 3)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(generatedPlan.weeklyPlan).map(([dayKey, day]) => (
                <TabsContent key={dayKey} value={dayKey} className='mt-6'>
                  <Card className='bg-white/90 backdrop-blur-sm border-green-200 shadow-xl'>
                    <CardHeader className='bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg'>
                      <CardTitle className='text-green-800 flex items-center justify-between text-xl'>
                        <span className='flex items-center gap-3'>
                          <Calendar className='w-5 h-5' />
                          {day.dayName} - {day.focus}
                        </span>
                        <Badge
                          variant='outline'
                          className='border-green-300 text-green-700 px-3 py-1'
                        >
                          <Clock className='w-4 h-4 mr-1' />
                          {day.duration} min
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-6'>
                      <div className='space-y-6'>
                        {/* Warm-up */}
                        {day.warmup && (
                          <div className='bg-orange-50 rounded-xl p-4 border border-orange-200'>
                            <h4 className='font-semibold text-orange-700 mb-3 flex items-center gap-2'>
                              <Play className='w-4 h-4' />
                              Warm-up Routine
                            </h4>
                            <div className='space-y-2'>
                              {day.warmup.exercises.map((exercise, idx) => (
                                <div
                                  key={idx}
                                  className='bg-white/80 rounded-lg p-3'
                                >
                                  <div className='flex items-center justify-between'>
                                    <h5 className='font-medium text-orange-800'>
                                      {exercise.name}
                                    </h5>
                                    <Badge
                                      variant='secondary'
                                      className='bg-orange-100 text-orange-700'
                                    >
                                      {exercise.duration} sec
                                    </Badge>
                                  </div>
                                  <p className='text-sm text-gray-600 mt-1'>
                                    {exercise.instructions}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Main Exercises */}
                        <div className='space-y-4'>
                          <h4 className='font-semibold text-green-700 text-lg flex items-center gap-2'>
                            <Dumbbell className='w-5 h-5' />
                            Main Workout
                          </h4>
                          {day.mainWorkout.map((exercise, exerciseIndex) => {
                            const exerciseKey = `${dayKey}-${exerciseIndex}`;
                            const isExpanded = expandedExercises[exerciseKey];

                            return (
                              <div
                                key={exerciseIndex}
                                className='border border-green-100 rounded-xl p-6 bg-gradient-to-r from-white to-green-50/30 shadow-md'
                              >
                                <div className='flex items-center justify-between mb-4'>
                                  <h5 className='font-bold text-green-800 text-lg'>
                                    {exercise.exerciseName}
                                  </h5>
                                  <Badge
                                    variant='secondary'
                                    className='bg-green-100 text-green-800'
                                  >
                                    Strength
                                  </Badge>
                                </div>

                                {/* Exercise Details */}
                                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                                  <div className='text-center p-3 bg-white/80 rounded-lg'>
                                    <div className='text-lg font-bold text-blue-600'>
                                      {exercise.sets}
                                    </div>
                                    <div className='text-xs text-blue-500'>
                                      Sets
                                    </div>
                                  </div>
                                  <div className='text-center p-3 bg-white/80 rounded-lg'>
                                    <div className='text-lg font-bold text-green-600'>
                                      {exercise.reps}
                                    </div>
                                    <div className='text-xs text-green-500'>
                                      Reps
                                    </div>
                                  </div>
                                  <div className='text-center p-3 bg-white/80 rounded-lg'>
                                    <div className='text-lg font-bold text-purple-600'>
                                      {exercise.restSeconds}s
                                    </div>
                                    <div className='text-xs text-purple-500'>
                                      Rest
                                    </div>
                                  </div>
                                  <div className='text-center p-3 bg-white/80 rounded-lg'>
                                    <Heart className='w-5 h-5 text-red-500 mx-auto mb-1' />
                                    <div className='text-xs text-red-500'>
                                      Target
                                    </div>
                                  </div>
                                </div>

                                {/* Target Muscles */}
                                <div className='mb-4'>
                                  <p className='text-sm font-medium text-gray-700 mb-2'>
                                    Target Muscles:
                                  </p>
                                  <div className='flex flex-wrap gap-2'>
                                    {exercise.targetMuscles.map(
                                      (muscle, idx) => (
                                        <Badge
                                          key={idx}
                                          variant='outline'
                                          className='border-gray-300'
                                        >
                                          {muscle}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>

                                <p className='text-gray-700 mb-4 leading-relaxed bg-blue-50 p-3 rounded-lg'>
                                  {exercise.instructions}
                                </p>

                                {/* YouTube Tutorial Link */}
                                <div className='mb-4'>
                                  <a
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                      exercise.youtubeSearchTerm
                                    )}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium hover:underline transition-colors bg-red-50 px-3 py-2 rounded-lg'
                                  >
                                    <ExternalLink className='w-4 h-4' />
                                    Watch Tutorial: {exercise.youtubeSearchTerm}
                                  </a>
                                </div>

                                {/* Alternative Exercises */}
                                {exercise.alternatives &&
                                  exercise.alternatives.length > 0 && (
                                    <div className='border-t border-green-200 pt-4'>
                                      <Button
                                        variant='ghost'
                                        onClick={() =>
                                          toggleExerciseExpansion(exerciseKey)
                                        }
                                        className='w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                                      >
                                        <span className='font-medium text-green-800'>
                                          Alternative Exercises (
                                          {exercise.alternatives.length})
                                        </span>
                                        <ChevronDown
                                          className={`w-4 h-4 text-green-600 transition-transform ${
                                            isExpanded ? 'rotate-180' : ''
                                          }`}
                                        />
                                      </Button>

                                      {isExpanded && (
                                        <div className='mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200'>
                                          {exercise.alternatives.map(
                                            (alt, altIdx) => (
                                              <div
                                                key={altIdx}
                                                className='bg-green-50/50 rounded-lg p-4 border border-green-100'
                                              >
                                                <h6 className='font-semibold text-green-800 mb-2'>
                                                  {alt.name}
                                                </h6>
                                                <p className='text-sm text-gray-600 mb-3'>
                                                  {alt.instructions}
                                                </p>
                                                {alt.youtubeSearchTerm && (
                                                  <a
                                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                                      alt.youtubeSearchTerm
                                                    )}`}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium hover:underline transition-colors'
                                                  >
                                                    <ExternalLink className='w-3 h-3' />
                                                    {alt.youtubeSearchTerm}
                                                  </a>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Cool-down */}
                        {day.cooldown && (
                          <div className='bg-blue-50 rounded-xl p-4 border border-blue-200'>
                            <h4 className='font-semibold text-blue-700 mb-3 flex items-center gap-2'>
                              <Activity className='w-4 h-4' />
                              Cool-down Routine
                            </h4>
                            <div className='space-y-2'>
                              {day.cooldown.exercises.map((exercise, idx) => (
                                <div
                                  key={idx}
                                  className='bg-white/80 rounded-lg p-3'
                                >
                                  <div className='flex items-center justify-between'>
                                    <h5 className='font-medium text-blue-800'>
                                      {exercise.name}
                                    </h5>
                                    <Badge
                                      variant='secondary'
                                      className='bg-blue-100 text-blue-700'
                                    >
                                      {exercise.duration} sec
                                    </Badge>
                                  </div>
                                  <p className='text-sm text-gray-600 mt-1'>
                                    {exercise.instructions}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Tips and Notes */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Progression Tips */}
              <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg'>
                <CardHeader>
                  <CardTitle className='text-green-800 flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5' />
                    Progression Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2'>
                    {generatedPlan.progressionTips?.map((tip, idx) => (
                      <li
                        key={idx}
                        className='text-sm text-green-700 flex items-start gap-2'
                      >
                        <span className='text-green-500 mt-1'>•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Safety Notes */}
              <Card className='bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg'>
                <CardHeader>
                  <CardTitle className='text-red-800 flex items-center gap-2'>
                    <Heart className='w-5 h-5' />
                    Safety Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2'>
                    {generatedPlan.safetyNotes?.map((note, idx) => (
                      <li
                        key={idx}
                        className='text-sm text-red-700 flex items-start gap-2'
                      >
                        <span className='text-red-500 mt-1'>⚠</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Nutrition Tips */}
              <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg'>
                <CardHeader>
                  <CardTitle className='text-blue-800 flex items-center gap-2'>
                    <Activity className='w-5 h-5' />
                    Nutrition Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2'>
                    {generatedPlan.nutritionTips?.map((tip, idx) => (
                      <li
                        key={idx}
                        className='text-sm text-blue-700 flex items-start gap-2'
                      >
                        <span className='text-blue-500 mt-1'>💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
