
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BaseProfileData } from '@/lib/schemas';
import { editProfile } from '../actions/apiUserProfile';
import { toast } from '@/hooks/use-toast';
import { User, Activity, Heart, Target, Info } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  age: z.number().min(10).max(120).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  height_cm: z.number().min(100).max(250).optional(),
  current_weight: z.number().min(30).max(300).optional(),
  target_weight: z.number().min(30).max(300).optional(),
  body_fat_percentage: z.number().min(5).max(50).optional(),
  target_body_fat: z.number().min(5).max(50).optional(),
  activity_level: z.enum(['Sedentary', 'Moderate', 'Active', 'Very Active']).optional(),
  fitness_history: z.string().optional(),
  injuries_limitations: z.string().optional(),
  dietary_preferences: z.string().optional(),
  allergies: z.string().optional(),
  medical_conditions: z.string().optional(),
  fitness_goals: z.string().optional(),
  preferred_workout_type: z.enum(['Cardio', 'Strength', 'Mixed', 'Flexibility']).optional(),
  workout_experience: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: BaseProfileData | null;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      age: profile?.age || undefined,
      gender: profile?.gender || undefined,
      height_cm: profile?.height_cm || undefined,
      current_weight: profile?.current_weight || undefined,
      target_weight: profile?.target_weight || undefined,
      body_fat_percentage: profile?.body_fat_percentage || undefined,
      target_body_fat: profile?.target_body_fat || undefined,
      activity_level: profile?.activity_level || undefined,
      fitness_history: profile?.fitness_history || '',
      injuries_limitations: profile?.injuries_limitations || '',
      dietary_preferences: profile?.dietary_preferences || '',
      allergies: profile?.allergies || '',
      medical_conditions: profile?.medical_conditions || '',
      fitness_goals: profile?.fitness_goals || '',
      preferred_workout_type: profile?.preferred_workout_type || undefined,
      workout_experience: profile?.workout_experience || undefined,
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        await editProfile(data);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-800">Profile Management</h1>
        <p className="text-green-600">Manage your personal details, health data, and fitness preferences</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={['basic', 'health', 'fitness']} className="space-y-4">
            
            {/* Basic Information */}
            <AccordionItem value="basic">
              <AccordionTrigger className="text-lg font-semibold text-green-800">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
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
                            <FormLabel>Age</FormLabel>
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
                            <FormLabel>Gender</FormLabel>
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
                            <FormLabel>Height (cm)</FormLabel>
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
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Health & Body Metrics */}
            <AccordionItem value="health">
              <AccordionTrigger className="text-lg font-semibold text-green-800">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Health & Body Metrics
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="current_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="Enter current weight"
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
                        name="target_weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Weight (kg)</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="body_fat_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Body Fat %</FormLabel>
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
                        name="target_body_fat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Body Fat %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1"
                                placeholder="Enter target body fat"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="medical_conditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Conditions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any medical conditions or medications..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergies</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any food allergies or dietary restrictions..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Fitness & Activity */}
            <AccordionItem value="fitness">
              <AccordionTrigger className="text-lg font-semibold text-green-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Fitness & Activity
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="activity_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Sedentary">Sedentary (little/no exercise)</SelectItem>
                                <SelectItem value="Moderate">Moderate (light exercise)</SelectItem>
                                <SelectItem value="Active">Active (moderate exercise)</SelectItem>
                                <SelectItem value="Very Active">Very Active (hard exercise)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="workout_experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Workout Experience</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Beginner">Beginner (0-1 years)</SelectItem>
                                <SelectItem value="Intermediate">Intermediate (1-3 years)</SelectItem>
                                <SelectItem value="Advanced">Advanced (3+ years)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferred_workout_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Workout Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select workout preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cardio">Cardio focused</SelectItem>
                                <SelectItem value="Strength">Strength training</SelectItem>
                                <SelectItem value="Mixed">Mixed training</SelectItem>
                                <SelectItem value="Flexibility">Flexibility/Yoga</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fitness_history"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fitness History</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your fitness background, years of experience, past activities..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="injuries_limitations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Injuries/Limitations</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any injuries, physical limitations, or conditions (e.g., back pain, knee issues)..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fitness_goals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fitness Goals</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your fitness goals (e.g., lose weight, build muscle, improve endurance)..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Nutrition Preferences */}
            <AccordionItem value="nutrition">
              <AccordionTrigger className="text-lg font-semibold text-green-800">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Nutrition Preferences
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="dietary_preferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dietary Preferences</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your dietary preferences (e.g., vegetarian, vegan, keto, paleo, etc.)..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg"
            >
              {isPending ? 'Saving Profile...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Profile Summary */}
      {profile && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Profile: {profile.age || 'N/A'}y, {profile.gender || 'N/A'}, {profile.height_cm || 'N/A'}cm, 
              {profile.workout_experience || 'Beginner'}, {profile.activity_level || 'N/A'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
