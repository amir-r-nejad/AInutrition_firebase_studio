
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BaseProfileData } from '@/lib/schemas';
import { Dumbbell, Clock, Target, TrendingUp, Activity, ChevronDown, ExternalLink, Play, Users, Calendar } from 'lucide-react';

interface Exercise {
  name: string;
  type: 'cardio' | 'strength' | 'flexibility';
  sets?: number;
  reps?: number;
  duration?: number;
  description: string;
  targetMuscles?: string[];
  youtubeSearchTerm?: string;
  alternatives?: Array<{
    name: string;
    instructions: string;
    youtubeSearchTerm?: string;
  }>;
}

interface DayWorkout {
  day: string;
  exercises: Exercise[];
  totalDuration: number;
  focus: string;
  warmup?: {
    exercises: Array<{
      name: string;
      duration: number;
      instructions: string;
    }>;
  };
  cooldown?: {
    exercises: Array<{
      name: string;
      duration: number;
      instructions: string;
    }>;
  };
}

interface WorkoutPlanGeneratorProps {
  profile: BaseProfileData | null;
}

export default function WorkoutPlanGenerator({ profile }: WorkoutPlanGeneratorProps) {
  const [generatedPlan, setGeneratedPlan] = useState<DayWorkout[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<{ [key: string]: boolean }>({});

  const toggleExerciseExpansion = (exerciseKey: string) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseKey]: !prev[exerciseKey]
    }));
  };

  const generateWorkoutPlan = async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate plan based on profile data
    const experienceLevel = profile?.workout_experience || 'Beginner';
    const preferredType = profile?.preferred_workout_type || 'Mixed';
    const activityLevel = profile?.activity_level || 'Moderate';
    
    let workoutPlan: DayWorkout[] = [];
    
    // Generate a full week plan based on experience level
    if (experienceLevel === 'Beginner') {
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Upper Body Foundation',
          totalDuration: 30,
          warmup: {
            exercises: [
              { name: 'Arm Circles', duration: 2, instructions: 'Stand with arms extended. Make small circles forward then backward' },
              { name: 'Shoulder Rolls', duration: 2, instructions: 'Roll shoulders forward and backward slowly' }
            ]
          },
          exercises: [
            { 
              name: 'Wall Push-ups', 
              type: 'strength', 
              sets: 3, 
              reps: 8, 
              description: 'Stand arm\'s length from wall, push body away and return',
              targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
              youtubeSearchTerm: 'wall push ups beginner tutorial',
              alternatives: [
                { name: 'Incline Push-ups', instructions: 'Use a chair or bench for easier angle', youtubeSearchTerm: 'incline push ups tutorial' },
                { name: 'Knee Push-ups', instructions: 'Start on knees instead of toes', youtubeSearchTerm: 'knee push ups proper form' }
              ]
            },
            { 
              name: 'Seated Shoulder Press', 
              type: 'strength', 
              sets: 3, 
              reps: 10, 
              description: 'Sit and press light weights or water bottles overhead',
              targetMuscles: ['Shoulders', 'Triceps'],
              youtubeSearchTerm: 'seated shoulder press form',
              alternatives: [
                { name: 'Standing Shoulder Press', instructions: 'Stand with feet hip-width apart', youtubeSearchTerm: 'standing shoulder press' },
                { name: 'Lateral Raises', instructions: 'Lift arms out to sides', youtubeSearchTerm: 'lateral raises tutorial' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Chest Stretch', duration: 3, instructions: 'Stand in doorway, stretch chest and shoulders' }
            ]
          }
        },
        {
          day: 'Tuesday',
          focus: 'Active Recovery',
          totalDuration: 20,
          warmup: {
            exercises: [
              { name: 'Gentle Movement', duration: 3, instructions: 'Light walking or marching in place' }
            ]
          },
          exercises: [
            { 
              name: 'Walking', 
              type: 'cardio', 
              duration: 15, 
              description: 'Gentle walk at comfortable pace',
              youtubeSearchTerm: 'walking for fitness beginners',
              alternatives: [
                { name: 'Stationary Bike', instructions: 'Light cycling at easy pace', youtubeSearchTerm: 'stationary bike workout' },
                { name: 'Stretching', instructions: 'Full body gentle stretching', youtubeSearchTerm: 'beginner stretching routine' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Full Body Stretch', duration: 2, instructions: 'Gentle stretching for all major muscle groups' }
            ]
          }
        },
        {
          day: 'Wednesday',
          focus: 'Lower Body Foundation',
          totalDuration: 30,
          warmup: {
            exercises: [
              { name: 'Leg Swings', duration: 2, instructions: 'Hold chair for balance, swing each leg forward and back' },
              { name: 'Hip Circles', duration: 2, instructions: 'Hands on hips, make small circles' }
            ]
          },
          exercises: [
            { 
              name: 'Chair Squats', 
              type: 'strength', 
              sets: 3, 
              reps: 12, 
              description: 'Stand in front of chair, sit down and stand up',
              targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
              youtubeSearchTerm: 'chair squats for beginners',
              alternatives: [
                { name: 'Wall Squats', instructions: 'Back against wall, slide up and down', youtubeSearchTerm: 'wall squats tutorial' },
                { name: 'Supported Squats', instructions: 'Hold onto sturdy surface for balance', youtubeSearchTerm: 'supported squats' }
              ]
            },
            { 
              name: 'Calf Raises', 
              type: 'strength', 
              sets: 3, 
              reps: 15, 
              description: 'Rise up on toes, lower slowly',
              targetMuscles: ['Calves'],
              youtubeSearchTerm: 'calf raises proper form',
              alternatives: [
                { name: 'Seated Calf Raises', instructions: 'Perform while sitting in chair', youtubeSearchTerm: 'seated calf raises' },
                { name: 'Single Leg Calf Raises', instructions: 'One leg at a time for more challenge', youtubeSearchTerm: 'single leg calf raises' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Leg Stretches', duration: 3, instructions: 'Stretch hamstrings, quads, and calves' }
            ]
          }
        },
        {
          day: 'Thursday',
          focus: 'Rest Day',
          totalDuration: 10,
          exercises: [
            { 
              name: 'Gentle Stretching', 
              type: 'flexibility', 
              duration: 10, 
              description: 'Light stretching and breathing exercises',
              youtubeSearchTerm: 'gentle stretching routine',
              alternatives: [
                { name: 'Meditation', instructions: 'Sit quietly and focus on breathing', youtubeSearchTerm: 'beginner meditation' },
                { name: 'Deep Breathing', instructions: 'Practice deep breathing exercises', youtubeSearchTerm: 'deep breathing exercises' }
              ]
            }
          ]
        },
        {
          day: 'Friday',
          focus: 'Full Body Circuit',
          totalDuration: 35,
          warmup: {
            exercises: [
              { name: 'Full Body Warm-up', duration: 5, instructions: 'Light movement for all joints' }
            ]
          },
          exercises: [
            { 
              name: 'Modified Burpees', 
              type: 'cardio', 
              sets: 3, 
              reps: 5, 
              description: 'Step back instead of jumping, easier version',
              targetMuscles: ['Full Body'],
              youtubeSearchTerm: 'modified burpees beginners',
              alternatives: [
                { name: 'Step-ups', instructions: 'Step up and down on sturdy platform', youtubeSearchTerm: 'step ups exercise' },
                { name: 'Marching in Place', instructions: 'High knees marching motion', youtubeSearchTerm: 'marching in place exercise' }
              ]
            },
            { 
              name: 'Plank Hold', 
              type: 'strength', 
              duration: 20, 
              description: 'Hold plank position for 20 seconds, 3 times',
              targetMuscles: ['Core', 'Shoulders'],
              youtubeSearchTerm: 'plank hold beginners',
              alternatives: [
                { name: 'Wall Plank', instructions: 'Stand arm\'s length from wall, lean into wall', youtubeSearchTerm: 'wall plank exercise' },
                { name: 'Knee Plank', instructions: 'Plank position but on knees', youtubeSearchTerm: 'knee plank tutorial' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Full Body Cool-down', duration: 5, instructions: 'Comprehensive stretching routine' }
            ]
          }
        },
        {
          day: 'Saturday',
          focus: 'Light Activity',
          totalDuration: 25,
          exercises: [
            { 
              name: 'Leisurely Walk', 
              type: 'cardio', 
              duration: 20, 
              description: 'Comfortable pace walking outdoors or indoors',
              youtubeSearchTerm: 'walking workout beginners',
              alternatives: [
                { name: 'Dancing', instructions: 'Put on music and move to the beat', youtubeSearchTerm: 'easy dance workout' },
                { name: 'Yard Work', instructions: 'Light gardening or household activities', youtubeSearchTerm: 'active lifestyle tips' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Relaxation', duration: 5, instructions: 'Gentle stretching and relaxation' }
            ]
          }
        },
        {
          day: 'Sunday',
          focus: 'Complete Rest',
          totalDuration: 0,
          exercises: [
            { 
              name: 'Rest and Recovery', 
              type: 'flexibility', 
              duration: 0, 
              description: 'Complete rest day for muscle recovery',
              alternatives: [
                { name: 'Light Reading', instructions: 'Relax with a good book', youtubeSearchTerm: 'benefits of rest days' },
                { name: 'Gentle Breathing', instructions: 'Practice relaxation techniques', youtubeSearchTerm: 'relaxation breathing' }
              ]
            }
          ]
        }
      ];
    } else if (experienceLevel === 'Intermediate') {
      // Similar structure for intermediate level with more days and intensity
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Push Day (Chest, Shoulders, Triceps)',
          totalDuration: 45,
          warmup: {
            exercises: [
              { name: 'Dynamic Warm-up', duration: 5, instructions: 'Arm swings, shoulder rolls, light cardio' }
            ]
          },
          exercises: [
            { 
              name: 'Push-ups', 
              type: 'strength', 
              sets: 4, 
              reps: 12, 
              description: 'Standard push-ups with proper form',
              targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
              youtubeSearchTerm: 'push ups proper form intermediate',
              alternatives: [
                { name: 'Diamond Push-ups', instructions: 'Hands in diamond shape for tricep focus', youtubeSearchTerm: 'diamond push ups tutorial' },
                { name: 'Wide Grip Push-ups', instructions: 'Hands wider than shoulders', youtubeSearchTerm: 'wide grip push ups' },
                { name: 'Decline Push-ups', instructions: 'Feet elevated on bench or chair', youtubeSearchTerm: 'decline push ups form' }
              ]
            },
            { 
              name: 'Pike Push-ups', 
              type: 'strength', 
              sets: 3, 
              reps: 8, 
              description: 'Downward dog position, press up and down',
              targetMuscles: ['Shoulders', 'Triceps'],
              youtubeSearchTerm: 'pike push ups shoulder workout',
              alternatives: [
                { name: 'Handstand Progression', instructions: 'Wall-supported handstand practice', youtubeSearchTerm: 'handstand progression' },
                { name: 'Overhead Press', instructions: 'Using dumbbells or resistance bands', youtubeSearchTerm: 'overhead press form' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Upper Body Stretch', duration: 5, instructions: 'Stretch chest, shoulders, and triceps' }
            ]
          }
        },
        // Add 6 more days for intermediate...
        {
          day: 'Tuesday',
          focus: 'Pull Day (Back, Biceps)',
          totalDuration: 40,
          warmup: {
            exercises: [
              { name: 'Back Activation', duration: 5, instructions: 'Band pull-aparts and arm circles' }
            ]
          },
          exercises: [
            { 
              name: 'Pull-ups/Assisted Pull-ups', 
              type: 'strength', 
              sets: 4, 
              reps: 8, 
              description: 'Pull-ups or use assistance band',
              targetMuscles: ['Back', 'Biceps'],
              youtubeSearchTerm: 'pull ups progression intermediate',
              alternatives: [
                { name: 'Inverted Rows', instructions: 'Under table or with TRX straps', youtubeSearchTerm: 'inverted rows tutorial' },
                { name: 'Resistance Band Rows', instructions: 'Anchor band and pull towards chest', youtubeSearchTerm: 'resistance band rows' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Back and Arm Stretch', duration: 5, instructions: 'Stretch lats, biceps, and shoulders' }
            ]
          }
        },
        {
          day: 'Wednesday',
          focus: 'Legs and Core',
          totalDuration: 45,
          exercises: [
            { 
              name: 'Jump Squats', 
              type: 'strength', 
              sets: 4, 
              reps: 10, 
              description: 'Explosive squat with jump',
              targetMuscles: ['Quads', 'Glutes', 'Calves'],
              youtubeSearchTerm: 'jump squats proper form',
              alternatives: [
                { name: 'Goblet Squats', instructions: 'Hold weight at chest level', youtubeSearchTerm: 'goblet squats form' },
                { name: 'Bulgarian Split Squats', instructions: 'Rear foot elevated single leg squats', youtubeSearchTerm: 'bulgarian split squats' }
              ]
            }
          ]
        },
        {
          day: 'Thursday',
          focus: 'HIIT Cardio',
          totalDuration: 30,
          exercises: [
            { 
              name: 'HIIT Circuit', 
              type: 'cardio', 
              duration: 20, 
              description: '30 seconds work, 30 seconds rest intervals',
              youtubeSearchTerm: 'HIIT workout intermediate',
              alternatives: [
                { name: 'Tabata Training', instructions: '20 seconds work, 10 seconds rest', youtubeSearchTerm: 'tabata training' },
                { name: 'Circuit Training', instructions: 'Multiple exercises in sequence', youtubeSearchTerm: 'circuit training workout' }
              ]
            }
          ]
        },
        {
          day: 'Friday',
          focus: 'Upper Body Power',
          totalDuration: 40,
          exercises: [
            { 
              name: 'Plyometric Push-ups', 
              type: 'strength', 
              sets: 3, 
              reps: 6, 
              description: 'Explosive push-ups with clap or lift-off',
              targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
              youtubeSearchTerm: 'plyometric push ups tutorial',
              alternatives: [
                { name: 'Medicine Ball Slams', instructions: 'Slam ball overhead to ground', youtubeSearchTerm: 'medicine ball slams' },
                { name: 'Burpees', instructions: 'Full burpee with jump', youtubeSearchTerm: 'burpees proper form' }
              ]
            }
          ]
        },
        {
          day: 'Saturday',
          focus: 'Active Recovery',
          totalDuration: 30,
          exercises: [
            { 
              name: 'Yoga Flow', 
              type: 'flexibility', 
              duration: 25, 
              description: 'Dynamic yoga sequence for recovery',
              youtubeSearchTerm: 'yoga flow intermediate',
              alternatives: [
                { name: 'Foam Rolling', instructions: 'Self-massage with foam roller', youtubeSearchTerm: 'foam rolling routine' },
                { name: 'Swimming', instructions: 'Low-impact full body exercise', youtubeSearchTerm: 'swimming workout' }
              ]
            }
          ]
        },
        {
          day: 'Sunday',
          focus: 'Rest or Light Activity',
          totalDuration: 20,
          exercises: [
            { 
              name: 'Walk or Bike Ride', 
              type: 'cardio', 
              duration: 20, 
              description: 'Easy pace outdoor activity',
              youtubeSearchTerm: 'active recovery workout',
              alternatives: [
                { name: 'Stretching Session', instructions: 'Full body flexibility routine', youtubeSearchTerm: 'full body stretching' },
                { name: 'Meditation', instructions: 'Mindfulness and breathing practice', youtubeSearchTerm: 'meditation for athletes' }
              ]
            }
          ]
        }
      ];
    } else {
      // Advanced level with all 7 days
      workoutPlan = [
        {
          day: 'Monday',
          focus: 'Upper Body Power & Strength',
          totalDuration: 60,
          warmup: {
            exercises: [
              { name: 'Dynamic Upper Body Warm-up', duration: 8, instructions: 'Complex movement patterns and activation' }
            ]
          },
          exercises: [
            { 
              name: 'Weighted Push-ups', 
              type: 'strength', 
              sets: 5, 
              reps: 8, 
              description: 'Push-ups with weight vest or plate on back',
              targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
              youtubeSearchTerm: 'weighted push ups advanced',
              alternatives: [
                { name: 'Handstand Push-ups', instructions: 'Vertical push-ups against wall', youtubeSearchTerm: 'handstand push ups progression' },
                { name: 'One-Arm Push-ups', instructions: 'Single arm push-up progression', youtubeSearchTerm: 'one arm push up tutorial' },
                { name: 'Archer Push-ups', instructions: 'Shift weight to one side during push-up', youtubeSearchTerm: 'archer push ups form' }
              ]
            },
            { 
              name: 'Muscle-ups', 
              type: 'strength', 
              sets: 3, 
              reps: 5, 
              description: 'Pull-up transition to dip in one movement',
              targetMuscles: ['Back', 'Chest', 'Shoulders', 'Arms'],
              youtubeSearchTerm: 'muscle up progression advanced',
              alternatives: [
                { name: 'Weighted Pull-ups', instructions: 'Pull-ups with additional weight', youtubeSearchTerm: 'weighted pull ups' },
                { name: 'Typewriter Pull-ups', instructions: 'Horizontal movement at top of pull-up', youtubeSearchTerm: 'typewriter pull ups' }
              ]
            }
          ],
          cooldown: {
            exercises: [
              { name: 'Advanced Upper Body Stretch', duration: 7, instructions: 'Deep tissue stretching and mobility work' }
            ]
          }
        },
        // Continue for all 7 days at advanced level...
        {
          day: 'Tuesday',
          focus: 'Lower Body Power & Plyometrics',
          totalDuration: 55,
          exercises: [
            { 
              name: 'Pistol Squats', 
              type: 'strength', 
              sets: 4, 
              reps: 6, 
              description: 'Single leg squat to full depth',
              targetMuscles: ['Quads', 'Glutes', 'Core'],
              youtubeSearchTerm: 'pistol squat progression',
              alternatives: [
                { name: 'Shrimp Squats', instructions: 'Single leg squat with rear leg extended', youtubeSearchTerm: 'shrimp squat tutorial' },
                { name: 'Jump Lunges', instructions: 'Alternating explosive lunges', youtubeSearchTerm: 'jump lunges form' }
              ]
            }
          ]
        },
        {
          day: 'Wednesday',
          focus: 'Core & Stability',
          totalDuration: 45,
          exercises: [
            { 
              name: 'Human Flag Progression', 
              type: 'strength', 
              sets: 3, 
              reps: 5, 
              description: 'Side lever hold on vertical pole',
              targetMuscles: ['Core', 'Shoulders', 'Back'],
              youtubeSearchTerm: 'human flag progression',
              alternatives: [
                { name: 'Dragon Flag', instructions: 'Horizontal body lever', youtubeSearchTerm: 'dragon flag tutorial' },
                { name: 'L-sit to V-sit', instructions: 'Seated leg lifts progression', youtubeSearchTerm: 'l sit v sit progression' }
              ]
            }
          ]
        },
        {
          day: 'Thursday',
          focus: 'High-Intensity Conditioning',
          totalDuration: 40,
          exercises: [
            { 
              name: 'Complex Burpees', 
              type: 'cardio', 
              sets: 5, 
              reps: 8, 
              description: 'Burpee with tuck jump and push-up variations',
              youtubeSearchTerm: 'advanced burpee variations',
              alternatives: [
                { name: 'Man Makers', instructions: 'Burpee with dumbbell rows and press', youtubeSearchTerm: 'man makers exercise' },
                { name: 'Turkish Get-ups', instructions: 'Complex full-body movement with weight', youtubeSearchTerm: 'turkish get up form' }
              ]
            }
          ]
        },
        {
          day: 'Friday',
          focus: 'Pull Power & Grip Strength',
          totalDuration: 50,
          exercises: [
            { 
              name: 'Weighted Muscle-ups', 
              type: 'strength', 
              sets: 3, 
              reps: 3, 
              description: 'Muscle-ups with additional weight',
              targetMuscles: ['Back', 'Biceps', 'Chest'],
              youtubeSearchTerm: 'weighted muscle ups',
              alternatives: [
                { name: 'Rope Climbing', instructions: 'Climb rope using arms and legs', youtubeSearchTerm: 'rope climbing technique' },
                { name: 'Heavy Bag Work', instructions: 'Boxing or martial arts training', youtubeSearchTerm: 'heavy bag workout' }
              ]
            }
          ]
        },
        {
          day: 'Saturday',
          focus: 'Movement & Flow',
          totalDuration: 45,
          exercises: [
            { 
              name: 'Animal Flow', 
              type: 'flexibility', 
              duration: 30, 
              description: 'Ground-based movement patterns',
              youtubeSearchTerm: 'animal flow workout',
              alternatives: [
                { name: 'Parkour Training', instructions: 'Obstacle navigation and movement', youtubeSearchTerm: 'parkour beginner training' },
                { name: 'Martial Arts Forms', instructions: 'Kata or shadow boxing', youtubeSearchTerm: 'martial arts forms' }
              ]
            }
          ]
        },
        {
          day: 'Sunday',
          focus: 'Active Recovery & Mobility',
          totalDuration: 35,
          exercises: [
            { 
              name: 'Advanced Yoga', 
              type: 'flexibility', 
              duration: 30, 
              description: 'Power yoga or advanced asana practice',
              youtubeSearchTerm: 'advanced yoga flow',
              alternatives: [
                { name: 'Rock Climbing', instructions: 'Indoor or outdoor climbing', youtubeSearchTerm: 'rock climbing workout' },
                { name: 'Martial Arts Sparring', instructions: 'Controlled combat practice', youtubeSearchTerm: 'martial arts sparring' }
              ]
            }
          ]
        }
      ];
    }
    
    setGeneratedPlan(workoutPlan);
    setIsGenerating(false);
  };

  const getPlanStats = () => {
    if (!generatedPlan) return null;
    
    const totalWorkouts = generatedPlan.filter(day => day.totalDuration > 0).length;
    const totalDuration = generatedPlan.reduce((sum, day) => sum + day.totalDuration, 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    return { totalWorkouts, totalDuration, avgDuration };
  };

  const stats = getPlanStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              AI Workout Plan Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create personalized weekly workout plans powered by artificial intelligence, tailored to your fitness level and goals
          </p>
        </div>

        {/* Profile Summary - Enhanced Design */}
        {profile && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-3 text-xl">
                <Target className="w-6 h-6" />
                Your Fitness Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm font-medium text-green-700">Experience Level</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                    {profile.workout_experience || 'Beginner'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-sm font-medium text-blue-700">Preferred Type</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                    {profile.preferred_workout_type || 'Mixed'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-purple-600 mr-2" />
                    <p className="text-sm font-medium text-purple-700">Activity Level</p>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 px-3 py-1">
                    {profile.activity_level || 'Moderate'}
                  </Badge>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                    <p className="text-sm font-medium text-orange-700">Age</p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-3 py-1">
                    {profile.age || 'N/A'} years
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button - Enhanced */}
        <div className="text-center">
          <Button
            onClick={generateWorkoutPlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {isGenerating ? (
              <>
                <TrendingUp className="w-6 h-6 mr-3 animate-spin" />
                Generating Your Weekly Plan...
              </>
            ) : (
              <>
                <Dumbbell className="w-6 h-6 mr-3" />
                Generate 7-Day Workout Plan
              </>
            )}
          </Button>
        </div>

        {/* Generated Plan - Enhanced Design */}
        {generatedPlan && stats && (
          <div className="space-y-8">
            {/* Plan Overview - Enhanced */}
            <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  Your Personalized 7-Day Workout Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
                    <div className="text-3xl font-bold text-green-800 mb-2">{stats.totalWorkouts}</div>
                    <p className="text-sm text-green-700 font-medium">Active Workout Days</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl">
                    <div className="text-3xl font-bold text-blue-800 mb-2">{stats.avgDuration} min</div>
                    <p className="text-sm text-blue-700 font-medium">Average Session Duration</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
                    <div className="text-3xl font-bold text-purple-800 mb-2">{Math.round(stats.totalDuration / 60)}h</div>
                    <p className="text-sm text-purple-700 font-medium">Total Weekly Training</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Plan Tabs - Enhanced */}
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid w-full grid-cols-7 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-2">
                {generatedPlan.map((day, index) => (
                  <TabsTrigger 
                    key={index} 
                    value={index.toString()}
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
                  >
                    {day.day.substring(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {generatedPlan.map((day, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-6">
                  <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                      <CardTitle className="text-green-800 flex items-center justify-between text-xl">
                        <span className="flex items-center gap-3">
                          <Calendar className="w-5 h-5" />
                          {day.day} - {day.focus}
                        </span>
                        <Badge variant="outline" className="border-green-300 text-green-700 px-3 py-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {day.totalDuration} min
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {day.totalDuration === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-green-600" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">Rest Day</h3>
                          <p className="text-gray-600">Complete rest for optimal recovery and muscle growth</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Warm-up */}
                          {day.warmup && (
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                              <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Warm-up Routine
                              </h4>
                              <div className="space-y-2">
                                {day.warmup.exercises.map((exercise, exerciseIndex) => (
                                  <div key={exerciseIndex} className="bg-white/80 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-orange-800">{exercise.name}</h5>
                                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                        {exercise.duration} min
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{exercise.instructions}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Main Exercises */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-green-700 text-lg flex items-center gap-2">
                              <Dumbbell className="w-5 h-5" />
                              Main Workout
                            </h4>
                            {day.exercises.map((exercise, exerciseIndex) => {
                              const exerciseKey = `${index}-${exerciseIndex}`;
                              const isExpanded = expandedExercises[exerciseKey];
                              
                              return (
                                <div key={exerciseIndex} className="border border-green-100 rounded-xl p-6 bg-gradient-to-r from-white to-green-50/30 shadow-md">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-bold text-green-800 text-lg">{exercise.name}</h5>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="secondary" 
                                        className={
                                          exercise.type === 'cardio' ? 'bg-red-100 text-red-800' :
                                          exercise.type === 'strength' ? 'bg-blue-100 text-blue-800' :
                                          'bg-purple-100 text-purple-800'
                                        }
                                      >
                                        {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Exercise Details */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {exercise.sets && (
                                      <div className="text-center p-3 bg-white/80 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">{exercise.sets}</div>
                                        <div className="text-xs text-blue-500">Sets</div>
                                      </div>
                                    )}
                                    {exercise.reps && (
                                      <div className="text-center p-3 bg-white/80 rounded-lg">
                                        <div className="text-lg font-bold text-green-600">{exercise.reps}</div>
                                        <div className="text-xs text-green-500">Reps</div>
                                      </div>
                                    )}
                                    {exercise.duration && (
                                      <div className="text-center p-3 bg-white/80 rounded-lg">
                                        <div className="text-lg font-bold text-purple-600">{exercise.duration} sec</div>
                                        <div className="text-xs text-purple-500">Duration</div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Target Muscles */}
                                  {exercise.targetMuscles && (
                                    <div className="mb-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Target Muscles:</p>
                                      <div className="flex flex-wrap gap-2">
                                        {exercise.targetMuscles.map((muscle, idx) => (
                                          <Badge key={idx} variant="outline" className="border-gray-300">
                                            {muscle}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <p className="text-gray-700 mb-4 leading-relaxed">{exercise.description}</p>

                                  {/* YouTube Tutorial Link */}
                                  {exercise.youtubeSearchTerm && (
                                    <div className="mb-4">
                                      <a 
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearchTerm)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium hover:underline transition-colors"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Watch Tutorial: {exercise.youtubeSearchTerm}
                                      </a>
                                    </div>
                                  )}

                                  {/* Alternative Exercises - Expandable */}
                                  {exercise.alternatives && exercise.alternatives.length > 0 && (
                                    <div className="border-t border-green-200 pt-4">
                                      <Button
                                        variant="ghost"
                                        onClick={() => toggleExerciseExpansion(exerciseKey)}
                                        className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                      >
                                        <span className="font-medium text-green-800">
                                          Alternative Exercises ({exercise.alternatives.length})
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      </Button>
                                      
                                      {isExpanded && (
                                        <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                          {exercise.alternatives.map((alt, altIdx) => (
                                            <div key={altIdx} className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                                              <h6 className="font-semibold text-green-800 mb-2">{alt.name}</h6>
                                              <p className="text-sm text-gray-600 mb-3">{alt.instructions}</p>
                                              {alt.youtubeSearchTerm && (
                                                <a 
                                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(alt.youtubeSearchTerm)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium hover:underline transition-colors"
                                                >
                                                  <ExternalLink className="w-3 h-3" />
                                                  {alt.youtubeSearchTerm}
                                                </a>
                                              )}
                                            </div>
                                          ))}
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
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Cool-down Routine
                              </h4>
                              <div className="space-y-2">
                                {day.cooldown.exercises.map((exercise, exerciseIndex) => (
                                  <div key={exerciseIndex} className="bg-white/80 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-blue-800">{exercise.name}</h5>
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                        {exercise.duration} min
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{exercise.instructions}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Progress Tracking - Enhanced */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-3 text-xl">
                  <TrendingUp className="w-6 h-6" />
                  Weekly Progress Tracker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-green-700 font-medium">Workouts Completed This Week</span>
                      <span className="text-green-700 font-bold">0 / {stats.totalWorkouts}</span>
                    </div>
                    <Progress value={0} className="h-4 bg-green-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-blue-700 font-medium">Total Exercise Time</span>
                      <span className="text-blue-700 font-bold">0 / {stats.totalDuration} min</span>
                    </div>
                    <Progress value={0} className="h-4 bg-blue-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-white/60 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0%</div>
                      <div className="text-sm text-green-600">Weekly Goal</div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-blue-600">Streak Days</div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-600">Calories Burned</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
