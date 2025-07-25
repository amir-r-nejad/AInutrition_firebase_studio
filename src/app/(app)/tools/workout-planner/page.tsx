
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dumbbell, User, Heart, Target, Clock, MapPin, Utensils, TrendingUp } from 'lucide-react';

const workoutPlannerSchema = z.object({
  // User Profile
  full_name: z.string().min(1, 'Full name is required'),
  age: z.number().min(10).max(120),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  body_fat_percentage: z.number().min(5).max(50).optional(),
  fitness_level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  workout_experience: z.array(z.string()).optional(),

  // Health & Medical
  existing_medical_conditions: z.array(z.string()).optional(),
  injuries_or_limitations: z.string().optional(),
  current_medications: z.string().optional(),
  doctor_clearance: z.boolean(),

  // Goals
  primary_goal: z.enum(['Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness']),
  secondary_goal: z.enum(['Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness']).optional(),
  goal_timeline_weeks: z.number().min(1).max(52),
  target_weight_kg: z.number().min(30).max(300).optional(),
  muscle_groups_focus: z.array(z.string()).optional(),

  // Lifestyle & Schedule
  workout_days_per_week: z.number().min(1).max(7),
  available_time_per_session: z.number().min(15).max(180),
  preferred_time_of_day: z.enum(['Morning', 'Afternoon', 'Evening']),
  workout_location: z.enum(['Home', 'Gym', 'Outdoor']),
  daily_step_count_avg: z.number().min(0).max(30000).optional(),
  job_type: z.enum(['Desk job', 'Active job', 'Standing job', 'Physical job']),

  // Equipment Access
  available_equipment: z.array(z.string()).optional(),
  machines_access: z.boolean().optional(),
  space_availability: z.enum(['Small room', 'Open area', 'Gym space']),

  // Diet & Energy
  current_diet_type: z.enum(['Omnivore', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Other']).optional(),
  caloric_intake_estimate: z.number().min(1000).max(4000).optional(),
  fasting: z.boolean().optional(),

  // Tracking Preferences
  want_to_track_progress: z.boolean(),
  preferred_tracking_method: z.enum(['Weight', 'Photos', 'Strength levels', 'Performance metrics']).optional(),
  weekly_checkins_enabled: z.boolean(),

  // Behavioral & Motivation
  motivational_style: z.enum(['Strict plan', 'Flexible plan', 'Habit-building', 'Challenge-based']),
  accountability_support: z.boolean(),
  stress_level: z.enum(['Low', 'Medium', 'High']),
  sleep_quality: z.enum(['Poor', 'Average', 'Good']),
});

type WorkoutPlannerFormData = z.infer<typeof workoutPlannerSchema>;

const medicalConditions = [
  'Asthma', 'Hypertension', 'Joint Issues', 'Heart Disease', 'Diabetes', 'Arthritis', 'Back Problems', 'None'
];

const workoutExperiences = [
  'Weightlifting', 'Cardio', 'HIIT', 'Yoga', 'Pilates', 'Running', 'Swimming', 'Cycling', 'None'
];

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Full Body'
];

const equipmentOptions = [
  'Dumbbells', 'Resistance Bands', 'Barbell', 'Yoga Mat', 'Pull-up Bar', 'Kettlebells', 'Treadmill', 'None'
];

export default function WorkoutPlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<WorkoutPlannerFormData>({
    resolver: zodResolver(workoutPlannerSchema),
    defaultValues: {
      doctor_clearance: false,
      want_to_track_progress: true,
      weekly_checkins_enabled: true,
      accountability_support: true,
      fasting: false,
      machines_access: false,
    },
  });

  const onSubmit = async (data: WorkoutPlannerFormData) => {
    setIsGenerating(true);
    try {
      // TODO: Implement AI workout plan generation
      console.log('Generating workout plan with data:', data);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    } catch (error) {
      console.error('Error generating workout plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-green-800">AI Workout Planner</h1>
          <p className="text-green-600">Create personalized workout plans powered by AI</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={['profile']} className="space-y-4">
              
              {/* User Profile */}
              <AccordionItem value="profile">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Profile
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter your age"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="height_cm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height (cm) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter height in cm"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weight_kg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (kg) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="Enter weight in kg"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="body_fat_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Fat % (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="Enter body fat percentage"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fitness_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fitness Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select fitness level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Beginner">Beginner</SelectItem>
                                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                                  <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="workout_experience"
                        render={() => (
                          <FormItem>
                            <FormLabel>Workout Experience (Select all that apply)</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {workoutExperiences.map((experience) => (
                                <FormField
                                  key={experience}
                                  control={form.control}
                                  name="workout_experience"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={experience}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(experience)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), experience])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== experience
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {experience}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Health & Medical */}
              <AccordionItem value="health">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Health & Medical Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="existing_medical_conditions"
                        render={() => (
                          <FormItem>
                            <FormLabel>Existing Medical Conditions</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {medicalConditions.map((condition) => (
                                <FormField
                                  key={condition}
                                  control={form.control}
                                  name="existing_medical_conditions"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={condition}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(condition)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), condition])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== condition
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {condition}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="injuries_or_limitations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Injuries or Physical Limitations</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe any injuries, limitations, or areas to avoid during exercise..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="current_medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Medications (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any medications that might affect exercise..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doctor_clearance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I have medical clearance to exercise *
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Goals */}
              <AccordionItem value="goals">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Fitness Goals
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="primary_goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Goal *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select primary goal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lose fat">Lose Fat</SelectItem>
                                  <SelectItem value="Build muscle">Build Muscle</SelectItem>
                                  <SelectItem value="Increase endurance">Increase Endurance</SelectItem>
                                  <SelectItem value="Flexibility">Improve Flexibility</SelectItem>
                                  <SelectItem value="General fitness">General Fitness</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="secondary_goal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Goal (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select secondary goal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Lose fat">Lose Fat</SelectItem>
                                  <SelectItem value="Build muscle">Build Muscle</SelectItem>
                                  <SelectItem value="Increase endurance">Increase Endurance</SelectItem>
                                  <SelectItem value="Flexibility">Improve Flexibility</SelectItem>
                                  <SelectItem value="General fitness">General Fitness</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="goal_timeline_weeks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal Timeline (weeks) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 12"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="target_weight_kg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Weight (kg) - Optional</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="Enter target weight"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="muscle_groups_focus"
                        render={() => (
                          <FormItem>
                            <FormLabel>Muscle Groups to Focus On</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {muscleGroups.map((group) => (
                                <FormField
                                  key={group}
                                  control={form.control}
                                  name="muscle_groups_focus"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={group}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(group)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), group])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== group
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {group}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Lifestyle & Schedule */}
              <AccordionItem value="lifestyle">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Lifestyle & Schedule
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="workout_days_per_week"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Workout Days per Week *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="7"
                                  placeholder="e.g., 3"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="available_time_per_session"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time per Session (minutes) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 60"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="preferred_time_of_day"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Time of Day *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select preferred time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Morning">Morning</SelectItem>
                                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                                  <SelectItem value="Evening">Evening</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="workout_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Workout Location *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select workout location" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Home">Home</SelectItem>
                                  <SelectItem value="Gym">Gym</SelectItem>
                                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="daily_step_count_avg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Daily Step Count (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="e.g., 8000"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="job_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select job type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Desk job">Desk Job</SelectItem>
                                  <SelectItem value="Active job">Active Job</SelectItem>
                                  <SelectItem value="Standing job">Standing Job</SelectItem>
                                  <SelectItem value="Physical job">Physical Job</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Equipment Access */}
              <AccordionItem value="equipment">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Equipment & Space
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="available_equipment"
                        render={() => (
                          <FormItem>
                            <FormLabel>Available Equipment</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {equipmentOptions.map((equipment) => (
                                <FormField
                                  key={equipment}
                                  control={form.control}
                                  name="available_equipment"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={equipment}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(equipment)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), equipment])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== equipment
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {equipment}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="machines_access"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I have access to gym machines
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="space_availability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Space Availability *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select space type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Small room">Small Room</SelectItem>
                                  <SelectItem value="Open area">Open Area</SelectItem>
                                  <SelectItem value="Gym space">Gym Space</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Additional Preferences */}
              <AccordionItem value="preferences">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Preferences & Tracking
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="motivational_style"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Motivational Style *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Strict plan">Strict Plan</SelectItem>
                                  <SelectItem value="Flexible plan">Flexible Plan</SelectItem>
                                  <SelectItem value="Habit-building">Habit-building</SelectItem>
                                  <SelectItem value="Challenge-based">Challenge-based</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stress_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Stress Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select stress level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sleep_quality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sleep Quality *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sleep quality" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Poor">Poor</SelectItem>
                                  <SelectItem value="Average">Average</SelectItem>
                                  <SelectItem value="Good">Good</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="preferred_tracking_method"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Tracking Method</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select tracking method" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Weight">Weight</SelectItem>
                                  <SelectItem value="Photos">Photos</SelectItem>
                                  <SelectItem value="Strength levels">Strength Levels</SelectItem>
                                  <SelectItem value="Performance metrics">Performance Metrics</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="want_to_track_progress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I want to track my progress
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="weekly_checkins_enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Enable weekly check-ins
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountability_support"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I want accountability support and reminders
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg"
              >
                {isGenerating ? 'Generating Workout Plan...' : 'Generate AI Workout Plan'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
