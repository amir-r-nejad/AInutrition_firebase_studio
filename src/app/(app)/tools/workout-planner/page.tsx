'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dumbbell, Heart, Target, Clock, MapPin, Utensils, TrendingUp, Activity } from 'lucide-react';

const exercisePlannerSchema = z.object({
  // Basic Info (from profile)
  fitness_level: z.enum(['Beginner', 'Intermediate', 'Advanced', '']).refine(val => val !== '', { message: "Please select a fitness level" }),
  exercise_experience: z.array(z.string()).optional(),
  exercise_experience_other: z.string().optional(),

  // Health & Medical
  existing_medical_conditions: z.array(z.string()).optional(),
  existing_medical_conditions_other: z.string().optional(),
  injuries_or_limitations: z.string().optional(),
  current_medications: z.array(z.string()).optional(),
  current_medications_other: z.string().optional(),
  doctor_clearance: z.boolean(),

  // Goals
  primary_goal: z.enum(['Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness', '']).refine(val => val !== '', { message: "Please select a primary goal" }),
  secondary_goal: z.enum(['Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness', '']).optional(),
  goal_timeline_weeks: z.number().min(1, { message: "Timeline must be at least 1 week" }).max(52),
  target_weight_kg: z.number().min(30).max(300).or(z.literal(0)).optional(),
  muscle_groups_focus: z.array(z.string()).optional(),

  // Lifestyle & Schedule
  exercise_days_per_week: z.number().min(1, { message: "Must exercise at least 1 day per week" }).max(7),
  available_time_per_session: z.number().min(15, { message: "Session must be at least 15 minutes" }).max(180),
  preferred_time_of_day: z.enum(['Morning', 'Afternoon', 'Evening', '']).refine(val => val !== '', { message: "Please select preferred time" }),
  exercise_location: z.enum(['Home', 'Gym', 'Outdoor', '']).refine(val => val !== '', { message: "Please select exercise location" }),
  daily_step_count_avg: z.number().min(0).max(30000).or(z.literal(0)).optional(),
  job_type: z.enum(['Desk job', 'Active job', 'Standing job', '']).refine(val => val !== '', { message: "Please select job type" }),

  // Equipment Access
  available_equipment: z.array(z.string()).optional(),
  available_equipment_other: z.string().optional(),
  machines_access: z.boolean().optional(),
  space_availability: z.enum(['Small room', 'Open area', 'Gym space', '']).refine(val => val !== '', { message: "Please select space availability" }),

  // Tracking Preferences
  want_to_track_progress: z.boolean(),
  weekly_checkins_enabled: z.boolean(),

  // Behavioral & Motivation
  accountability_support: z.boolean(),
  preferred_difficulty_level: z.enum(['Low', 'Medium', 'High', '']).refine(val => val !== '', { message: "Please select difficulty level" }),
  sleep_quality: z.enum(['Poor', 'Average', 'Good', '']).refine(val => val !== '', { message: "Please select sleep quality" }),
});

type ExercisePlannerFormData = z.infer<typeof exercisePlannerSchema>;

const medicalConditions = [
  'Asthma', 'Hypertension', 'Joint Issues', 'Heart Disease', 'Diabetes', 'Arthritis', 'Back Problems', 'None', 'Other'
];

const exerciseExperiences = [
  'Weightlifting', 'Cardio', 'HIIT', 'Yoga', 'Pilates', 'Running', 'Swimming', 'Cycling', 'None', 'Other'
];

const commonMedications = [
  'Blood Pressure Medications', 'Diabetes Medications', 'Heart Medications', 'Asthma Inhalers', 'Pain Relievers', 'Anti-inflammatories', 'Antidepressants', 'Thyroid Medications', 'None', 'Other'
];

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Glutes', 'Full Body'
];

const equipmentOptions = [
  'Dumbbells', 'Resistance Bands', 'Barbell', 'Yoga Mat', 'Pull-up Bar', 'Kettlebells', 'Treadmill', 'None', 'Other'
];

export default function ExercisePlannerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const form = useForm<ExercisePlannerFormData>({
    resolver: zodResolver(exercisePlannerSchema),
    defaultValues: {
      fitness_level: '',
      exercise_experience: [],
      exercise_experience_other: '',
      existing_medical_conditions: [],
      existing_medical_conditions_other: '',
      injuries_or_limitations: '',
      current_medications: [],
      current_medications_other: '',
      doctor_clearance: false,
      primary_goal: '',
      secondary_goal: '',
      goal_timeline_weeks: 1,
      target_weight_kg: 0,
      muscle_groups_focus: [],
      exercise_days_per_week: 1,
      available_time_per_session: 15,
      preferred_time_of_day: '',
      exercise_location: '',
      daily_step_count_avg: 0,
      job_type: '',
      available_equipment: [],
      available_equipment_other: '',
      machines_access: false,
      space_availability: '',
      want_to_track_progress: true,
      weekly_checkins_enabled: true,
      accountability_support: true,
      preferred_difficulty_level: '',
      sleep_quality: '',
    },
    mode: 'onChange'
  });

  // Load saved preferences on component mount
  const loadSavedPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/exercise-planner/get-preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const savedData = result.data;

          // Update form with saved preferences
          form.reset({
            fitness_level: savedData.fitness_level || '',
            exercise_experience: savedData.exercise_experience || [],
            exercise_experience_other: savedData.exercise_experience_other || '',
            existing_medical_conditions: savedData.existing_medical_conditions || [],
            existing_medical_conditions_other: savedData.existing_medical_conditions_other || '',
            injuries_or_limitations: savedData.injuries_or_limitations || '',
            current_medications: savedData.current_medications || [],
            current_medications_other: savedData.current_medications_other || '',
            doctor_clearance: savedData.doctor_clearance || false,
            primary_goal: savedData.primary_goal || '',
            secondary_goal: savedData.secondary_goal || '',
            goal_timeline_weeks: savedData.goal_timeline_weeks || 1,
            target_weight_kg: savedData.target_weight_kg || 0,
            muscle_groups_focus: savedData.muscle_groups_focus || [],
            exercise_days_per_week: savedData.exercise_days_per_week || 1,
            available_time_per_session: savedData.available_time_per_session || 15,
            preferred_time_of_day: savedData.preferred_time_of_day || '',
            exercise_location: savedData.exercise_location || '',
            daily_step_count_avg: savedData.daily_step_count_avg || 0,
            job_type: savedData.job_type || '',
            available_equipment: savedData.available_equipment || [],
            available_equipment_other: savedData.available_equipment_other || '',
            machines_access: savedData.machines_access || false,
            space_availability: savedData.space_availability || '',
            want_to_track_progress: savedData.want_to_track_progress ?? true,
            weekly_checkins_enabled: savedData.weekly_checkins_enabled ?? true,
            accountability_support: savedData.accountability_support ?? true,
            preferred_difficulty_level: savedData.preferred_difficulty_level || '',
            sleep_quality: savedData.sleep_quality || '',
          });

          console.log('Loaded saved preferences:', savedData);
        }
      }
    } catch (error) {
      console.error('Error loading saved preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load preferences when component mounts
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const selectedExerciseExperience = form.watch('exercise_experience') || [];
  const selectedMedicalConditions = form.watch('existing_medical_conditions') || [];
  const selectedEquipment = form.watch('available_equipment') || [];
  const selectedMedications = form.watch('current_medications') || [];

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const data = form.getValues();

      // Clean up the data before sending
      const cleanedData = {
        ...data,
        target_weight_kg: data.target_weight_kg || null,
        daily_step_count_avg: data.daily_step_count_avg || null,
        secondary_goal: data.secondary_goal || null,
        exercise_experience_other: data.exercise_experience_other || null,
        existing_medical_conditions_other: data.existing_medical_conditions_other || null,
        injuries_or_limitations: data.injuries_or_limitations || null,
        current_medications_other: data.current_medications_other || null,
        available_equipment_other: data.available_equipment_other || null,
      };

      console.log('Saving preferences:', cleanedData);

      // Save to Supabase
      const response = await fetch('/api/exercise-planner/save-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      const result = await response.json();
      console.log('Response status:', response.status, 'Response data:', result);

      if (!response.ok) {
        console.error('Server error response:', result);
        const errorMessage = result.details || result.error || 'Failed to save preferences';
        throw new Error(errorMessage);
      }

      console.log('Preferences saved successfully:', result);

      // Show success message
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(`Error saving preferences: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: ExercisePlannerFormData) => {
    setIsGenerating(true);
    try {
      // Save preferences first
      await savePreferences();

      // Generate AI exercise plan using Gemini
      const prompt = `Generate a personalized exercise plan based on these details:

      Fitness Level: ${data.fitness_level}
      Exercise Experience: ${data.exercise_experience?.join(', ') || 'None'}
      Primary Goal: ${data.primary_goal}
      Exercise Days per Week: ${data.exercise_days_per_week}
      Available Time per Session: ${data.available_time_per_session} minutes
      Exercise Location: ${data.exercise_location}
      Available Equipment: ${data.available_equipment?.join(', ') || 'None'}
      Medical Conditions: ${data.existing_medical_conditions?.join(', ') || 'None'}
      Injuries/Limitations: ${data.injuries_or_limitations || 'None'}
      Job Type: ${data.job_type}
      Preferred Difficulty: ${data.preferred_difficulty_level}

      Please create a detailed weekly exercise plan with specific exercises, sets, reps, and rest periods. Format the response as a structured JSON with days, exercises, sets, reps, and descriptions.`;

      console.log('Generating exercise plan with prompt:', prompt);

      // Send to Gemini API
      const response = await fetch('/api/exercise-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          preferences: data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate exercise plan');
      }

      const result = await response.json();
      console.log('Exercise plan generated:', result);

      if (result.parsed_plan) {
        setGeneratedPlan(result.parsed_plan);
      } else if (result.generated_content) {
        try {
          const parsed = JSON.parse(result.generated_content);
          setGeneratedPlan(parsed);
        } catch (e) {
          console.error('Failed to parse generated content:', e);
          setGeneratedPlan({ error: 'Failed to parse generated plan' });
        }
      }

      alert('Exercise plan generated successfully!');

    } catch (error) {
      console.error('Error generating exercise plan:', error);
      alert('Error generating exercise plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-green-800">AI Exercise Planner</h1>
            <p className="text-green-600">Loading your saved preferences...</p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-green-800">AI Exercise Planner</h1>
          <p className="text-green-600">Create personalized exercise plans powered by AI</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Accordion type="multiple" defaultValue={['basic']} className="space-y-4">

              {/* Basic Information */}
              <AccordionItem value="basic">
                <AccordionTrigger className="text-lg font-semibold text-green-800">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Basic Fitness Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name="exercise_experience"
                        render={() => (
                          <FormItem>
                            <FormLabel>Exercise Experience (Select all that apply)</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {exerciseExperiences.map((experience) => (
                                <FormField
                                  key={experience}
                                  control={form.control}
                                  name="exercise_experience"
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

                      {selectedExerciseExperience.includes('Other') && (
                        <FormField
                          control={form.control}
                          name="exercise_experience_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Exercise Experience</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Please specify your other exercise experience..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
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

                      {selectedMedicalConditions.includes('Other') && (
                        <FormField
                          control={form.control}
                          name="existing_medical_conditions_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Medical Conditions</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Please specify your other medical conditions..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                        render={() => (
                          <FormItem>
                            <FormLabel>Current Medications (Optional)</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {commonMedications.map((medication) => (
                                <FormField
                                  key={medication}
                                  control={form.control}
                                  name="current_medications"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={medication}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(medication)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), medication])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== medication
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal">
                                          {medication}
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

                      {selectedMedications.includes('Other') && (
                        <FormField
                          control={form.control}
                          name="current_medications_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Current Medications</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Please specify your other medications..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                                  value={field.value || ''}
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
                                  value={field.value || ''}
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
                          name="exercise_days_per_week"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercise Days per Week *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="7"
                                  placeholder="e.g., 3"
                                  value={field.value || ''}
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
                                  value={field.value || ''}
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
                          name="exercise_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exercise Location *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select exercise location" />
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
                                  value={field.value || ''}
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
                                  <SelectItem value="Desk job" title="Office work, computer work, administrative roles">Desk Job</SelectItem>
                                  <SelectItem value="Active job" title="Teaching, nursing, retail, walking/moving throughout the day">Active Job</SelectItem>
                                  <SelectItem value="Standing job" title="Cashier, security guard, factory work, standing most of the day">Standing Job</SelectItem>
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

                      {selectedEquipment.includes('Other') && (
                        <FormField
                          control={form.control}
                          name="available_equipment_other"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Available Equipment</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Please specify your other available equipment..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

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
                          name="preferred_difficulty_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Difficulty Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty level" />
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                type="button"
                onClick={savePreferences}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-blue-400"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Preferences
                  </div>
                )}
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-12 py-3 text-lg rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-green-400"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Exercise Plan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate AI Exercise Plan
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Generated Plan Display */}
        {generatedPlan && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center text-green-600">
                <Activity className="mr-2 h-6 w-6" />
                Your Personalized Exercise Plan
              </CardTitle>
              <CardDescription>
                AI-generated workout plan based on your preferences and goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedPlan.error ? (
                <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                  {generatedPlan.error}
                </div>
              ) : generatedPlan.weeklyPlan ? (
                <div className="space-y-6">
                  {/* Weekly Plan */}
                  {Object.entries(generatedPlan.weeklyPlan).map(([dayKey, dayPlan]: [string, any]) => (
                    <div key={dayKey} className="border rounded-lg p-4">
                      <h3 className="text-xl font-semibold mb-2 text-blue-600">
                        {dayPlan.dayName} - {dayPlan.focus}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">Duration: {dayPlan.duration} minutes</p>

                      {/* Warm-up */}
                      {dayPlan.warmup && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-orange-600 mb-2">Warm-up</h4>
                          {dayPlan.warmup.exercises.map((exercise: any, idx: number) => (
                            <div key={idx} className="ml-4 mb-2">
                              <p><strong>{exercise.name}</strong> - {exercise.duration} min</p>
                              <p className="text-sm text-gray-600">{exercise.instructions}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Workout */}
                      {dayPlan.mainWorkout && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-red-600 mb-2">Main Workout</h4>
                          {dayPlan.mainWorkout.map((exercise: any, idx: number) => (
                            <div key={idx} className="ml-4 mb-4 p-3 bg-gray-50 rounded">
                              <h5 className="font-semibold">{exercise.exerciseName}</h5>
                              <p className="text-sm"><strong>Target:</strong> {exercise.targetMuscles?.join(', ')}</p>
                              <p className="text-sm"><strong>Sets:</strong> {exercise.sets} | <strong>Reps:</strong> {exercise.reps} | <strong>Rest:</strong> {exercise.restSeconds}s</p>
                              <p className="text-sm mt-2">{exercise.instructions}</p>

                              {exercise.youtubeSearchTerm && (
                                <a 
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearchTerm)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:underline text-sm"
                                >
                                  🎥 Watch Tutorial: {exercise.youtubeSearchTerm}
                                </a>
                              )}

                              {/* Alternatives */}
                              {exercise.alternatives && exercise.alternatives.length > 0 && (
                                <div className="mt-3">
                                  <p className="font-medium text-sm">Alternative Exercises:</p>
                                  {exercise.alternatives.map((alt: any, altIdx: number) => (
                                    <div key={altIdx} className="ml-4 mt-2">
                                      <p className="text-sm"><strong>{alt.name}</strong></p>
                                      <p className="text-xs text-gray-600">{alt.instructions}</p>
                                      {alt.youtubeSearchTerm && (
                                        <a 
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(alt.youtubeSearchTerm)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-red-600 hover:underline text-xs"
                                        >
                                          🎥 {alt.youtubeSearchTerm}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cool-down */}
                      {dayPlan.cooldown && (
                        <div>
                          <h4 className="font-semibold text-green-600 mb-2">Cool-down</h4>
                          {dayPlan.cooldown.exercises.map((exercise: any, idx: number) => (
                            <div key={idx} className="ml-4 mb-2">
                              <p><strong>{exercise.name}</strong> - {exercise.duration} min</p>
                              <p className="text-sm text-gray-600">{exercise.instructions}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tips Sections */}
                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    {generatedPlan.progressionTips && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-600 mb-2">Progression Tips</h4>
                        <ul className="text-sm space-y-1">
                          {generatedPlan.progressionTips.map((tip: string, idx: number) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedPlan.safetyNotes && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-semibold text-red-600 mb-2">Safety Notes</h4>
                        <ul className="text-sm space-y-1">
                          {generatedPlan.safetyNotes.map((note: string, idx: number) => (
                            <li key={idx}>• {note}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {generatedPlan.nutritionTips && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-600 mb-2">Nutrition Tips</h4>
                        <ul className="text-sm space-y-1">
                          {generatedPlan.nutritionTips.map((tip: string, idx: number) => (
                            <li key={idx}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-600">No workout plan available to display.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
}