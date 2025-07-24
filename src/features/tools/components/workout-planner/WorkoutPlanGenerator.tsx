
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BaseProfileData } from '@/lib/schemas';
import { Dumbbell, Clock, Target, TrendingUp, Activity } from 'lucide-react';

interface Exercise {
  name: string;
  type: 'cardio' | 'strength' | 'flexibility';
  sets?: number;
  reps?: number;
  duration?: number;
  description: string;
}

interface DayWorkout {
  day: string;
  exercises: Exercise[];
  totalDuration: number;
  focus: string;
}

interface WorkoutPlanGeneratorProps {
  profile: BaseProfileData | null;
}

export default function WorkoutPlanGenerator({ profile }: WorkoutPlanGeneratorProps) {
  const [generatedPlan, setGeneratedPlan] = useState<DayWorkout[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWorkoutPlan = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate plan based on profile data
    const experienceLevel = profile?.workout_experience || 'Beginner';
    const preferredType = profile?.preferred_workout_type || 'Mixed';
    const activityLevel = profile?.activity_level || 'Moderate';
    
    let workoutPlan: DayWorkout[] = [];
    
    if (experienceLevel === 'Beginner') {
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Upper Body Strength',
          totalDuration: 30,
          exercises: [
            { name: 'Push-ups', type: 'strength', sets: 3, reps: 8, description: 'Start with wall push-ups if needed' },
            { name: 'Assisted Pull-ups', type: 'strength', sets: 3, reps: 5, description: 'Use resistance band for assistance' },
            { name: 'Shoulder Press', type: 'strength', sets: 3, reps: 10, description: 'Light weights or water bottles' },
            { name: 'Plank', type: 'strength', duration: 30, description: 'Hold for 30 seconds, 3 times' }
          ]
        },
        {
          day: 'Wednesday',
          focus: 'Lower Body & Cardio',
          totalDuration: 35,
          exercises: [
            { name: 'Bodyweight Squats', type: 'strength', sets: 3, reps: 12, description: 'Focus on proper form' },
            { name: 'Lunges', type: 'strength', sets: 3, reps: 8, description: 'Each leg, control the movement' },
            { name: 'Glute Bridges', type: 'strength', sets: 3, reps: 15, description: 'Squeeze glutes at the top' },
            { name: 'Walking', type: 'cardio', duration: 15, description: 'Brisk walk or light jog' }
          ]
        },
        {
          day: 'Friday',
          focus: 'Full Body & Flexibility',
          totalDuration: 25,
          exercises: [
            { name: 'Modified Burpees', type: 'cardio', sets: 3, reps: 5, description: 'Step back instead of jumping' },
            { name: 'Mountain Climbers', type: 'cardio', duration: 30, description: '30 seconds, 3 rounds' },
            { name: 'Cat-Cow Stretch', type: 'flexibility', duration: 5, description: 'Gentle spinal movement' },
            { name: 'Child\'s Pose', type: 'flexibility', duration: 5, description: 'Relaxing stretch' }
          ]
        }
      ];
    } else if (experienceLevel === 'Intermediate') {
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Push Day (Chest, Shoulders, Triceps)',
          totalDuration: 45,
          exercises: [
            { name: 'Push-ups', type: 'strength', sets: 4, reps: 12, description: 'Regular or diamond variations' },
            { name: 'Pike Push-ups', type: 'strength', sets: 3, reps: 8, description: 'Targets shoulders' },
            { name: 'Tricep Dips', type: 'strength', sets: 3, reps: 10, description: 'Use chair or bench' },
            { name: 'Plank to T', type: 'strength', sets: 3, reps: 6, description: 'Each side for core and stability' }
          ]
        },
        {
          day: 'Tuesday',
          focus: 'Cardio & Core',
          totalDuration: 30,
          exercises: [
            { name: 'HIIT Circuit', type: 'cardio', duration: 20, description: '30 sec work, 30 sec rest' },
            { name: 'Russian Twists', type: 'strength', sets: 3, reps: 20, description: 'Each side' },
            { name: 'Dead Bug', type: 'strength', sets: 3, reps: 10, description: 'Each side for core stability' },
            { name: 'Bicycle Crunches', type: 'strength', sets: 3, reps: 15, description: 'Each side' }
          ]
        },
        {
          day: 'Thursday',
          focus: 'Pull Day (Back, Biceps)',
          totalDuration: 40,
          exercises: [
            { name: 'Pull-ups/Chin-ups', type: 'strength', sets: 4, reps: 8, description: 'Use assistance if needed' },
            { name: 'Inverted Rows', type: 'strength', sets: 3, reps: 10, description: 'Under a table or with straps' },
            { name: 'Superman', type: 'strength', sets: 3, reps: 12, description: 'Strengthens lower back' },
            { name: 'Reverse Fly', type: 'strength', sets: 3, reps: 12, description: 'With light weights or bands' }
          ]
        },
        {
          day: 'Saturday',
          focus: 'Legs & Flexibility',
          totalDuration: 50,
          exercises: [
            { name: 'Jump Squats', type: 'strength', sets: 4, reps: 10, description: 'Explosive movement' },
            { name: 'Single-leg Deadlifts', type: 'strength', sets: 3, reps: 8, description: 'Each leg, balance challenge' },
            { name: 'Step-ups', type: 'strength', sets: 3, reps: 12, description: 'Each leg, use sturdy platform' },
            { name: 'Yoga Flow', type: 'flexibility', duration: 15, description: 'Full body stretching sequence' }
          ]
        }
      ];
    } else {
      // Advanced
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Upper Body Power',
          totalDuration: 60,
          exercises: [
            { name: 'Weighted Push-ups', type: 'strength', sets: 5, reps: 8, description: 'Add weight or elevate feet' },
            { name: 'Handstand Push-ups', type: 'strength', sets: 3, reps: 5, description: 'Against wall progression' },
            { name: 'Muscle-ups', type: 'strength', sets: 3, reps: 3, description: 'Advanced pulling movement' },
            { name: 'Archer Push-ups', type: 'strength', sets: 3, reps: 6, description: 'Each side' }
          ]
        },
        {
          day: 'Tuesday',
          focus: 'HIIT & Plyometrics',
          totalDuration: 45,
          exercises: [
            { name: 'Burpee Box Jumps', type: 'cardio', sets: 4, reps: 8, description: 'Explosive full body movement' },
            { name: 'Plyometric Push-ups', type: 'strength', sets: 4, reps: 6, description: 'Clap or explosive' },
            { name: 'Jump Lunges', type: 'cardio', sets: 4, reps: 10, description: 'Each leg' },
            { name: 'Turkish Get-ups', type: 'strength', sets: 3, reps: 5, description: 'Each side with weight' }
          ]
        },
        {
          day: 'Wednesday',
          focus: 'Lower Body Strength',
          totalDuration: 55,
          exercises: [
            { name: 'Pistol Squats', type: 'strength', sets: 4, reps: 5, description: 'Each leg, advanced balance' },
            { name: 'Bulgarian Split Squats', type: 'strength', sets: 4, reps: 12, description: 'Each leg with weight' },
            { name: 'Single-leg Hip Thrusts', type: 'strength', sets: 3, reps: 10, description: 'Each leg' },
            { name: 'Calf Raises', type: 'strength', sets: 4, reps: 20, description: 'Single leg with weight' }
          ]
        },
        {
          day: 'Friday',
          focus: 'Full Body Circuit',
          totalDuration: 50,
          exercises: [
            { name: 'Complex Burpees', type: 'cardio', sets: 5, reps: 6, description: 'Add tuck jump and push-up' },
            { name: 'Bear Crawl', type: 'strength', duration: 60, description: 'Forward and backward' },
            { name: 'L-sit', type: 'strength', duration: 30, description: 'Hold for time, 4 sets' },
            { name: 'Advanced Flow', type: 'flexibility', duration: 10, description: 'Dynamic stretching routine' }
          ]
        }
      ];
    }
    
    setGeneratedPlan(workoutPlan);
    setIsGenerating(false);
  };

  const getPlanStats = () => {
    if (!generatedPlan) return null;
    
    const totalWorkouts = generatedPlan.length;
    const totalDuration = generatedPlan.reduce((sum, day) => sum + day.totalDuration, 0);
    const avgDuration = Math.round(totalDuration / totalWorkouts);
    
    return { totalWorkouts, totalDuration, avgDuration };
  };

  const stats = getPlanStats();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-800">Workout Plan Generator</h1>
        <p className="text-green-600">AI-powered workout plans tailored to your fitness level and goals</p>
      </div>

      {/* Profile Summary */}
      {profile && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-green-600">Experience Level</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {profile.workout_experience || 'Beginner'}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600">Preferred Type</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {profile.preferred_workout_type || 'Mixed'}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600">Activity Level</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {profile.activity_level || 'Moderate'}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600">Age</p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {profile.age || 'N/A'} years
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={generateWorkoutPlan}
          disabled={isGenerating}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <>
              <TrendingUp className="w-5 h-5 mr-2 animate-spin" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Dumbbell className="w-5 h-5 mr-2" />
              Generate Workout Plan
            </>
          )}
        </Button>
      </div>

      {/* Generated Plan */}
      {generatedPlan && stats && (
        <div className="space-y-6">
          {/* Plan Overview */}
          <Card className="bg-white border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Your Personalized Workout Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{stats.totalWorkouts}</div>
                  <p className="text-sm text-green-600">Workout Days</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{stats.avgDuration} min</div>
                  <p className="text-sm text-green-600">Average Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{Math.round(stats.totalDuration / 60)}h</div>
                  <p className="text-sm text-green-600">Total Weekly Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workout Days */}
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
              {generatedPlan.map((day, index) => (
                <TabsTrigger 
                  key={index} 
                  value={index.toString()}
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
                >
                  {day.day}
                </TabsTrigger>
              ))}
            </TabsList>

            {generatedPlan.map((day, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card className="bg-white border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center justify-between">
                      <span>{day.day} - {day.focus}</span>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        <Clock className="w-4 h-4 mr-1" />
                        {day.totalDuration} min
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="border border-green-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-green-800">{exercise.name}</h4>
                            <Badge 
                              variant="secondary" 
                              className={
                                exercise.type === 'cardio' ? 'bg-red-100 text-red-800' :
                                exercise.type === 'strength' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }
                            >
                              {exercise.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-green-600 mb-2">
                            {exercise.sets && (
                              <span>Sets: {exercise.sets}</span>
                            )}
                            {exercise.reps && (
                              <span>Reps: {exercise.reps}</span>
                            )}
                            {exercise.duration && (
                              <span>Duration: {exercise.duration} sec</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{exercise.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Progress Tracking */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Weekly Progress Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-700">Workouts Completed</span>
                    <span className="text-green-700">0 / {stats.totalWorkouts}</span>
                  </div>
                  <Progress value={0} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-700">Total Time Exercised</span>
                    <span className="text-green-700">0 / {stats.totalDuration} min</span>
                  </div>
                  <Progress value={0} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
