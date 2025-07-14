'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  type FullProfileType,
  type ProfileFormValues,
  ProfileFormSchema,
  preprocessDataForFirestore,
} from '@/lib/schemas';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState } from 'react';
import {
  subscriptionStatuses,
  exerciseFrequencies,
  exerciseIntensities,
} from '@/lib/constants';
import { AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, DocumentSnapshot, DocumentData } from '@firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      name: undefined,
      goalWeight: 0,
      subscriptionStatus: undefined,
      painMobilityIssues: undefined,
      injuries: [],
      surgeries: [],
      exerciseGoals: [],
      exercisePreferences: [],
      exerciseFrequency: undefined,
      exerciseIntensity: undefined,
      equipmentAccess: [],
    },
  });

  useEffect(() => {
    if (user?.uid) {
      setIsLoading(true);
      // Client-side fetch
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef)
        .then((docSnap: DocumentSnapshot<DocumentData>) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as FullProfileType;
            // Map the full profile to the form values
            const profileDataSubset = {
              name: profileData.name ?? undefined,
              subscriptionStatus: profileData.subscriptionStatus ?? undefined,
              goalWeight: profileData.goalWeight ?? undefined,
              painMobilityIssues: profileData.painMobilityIssues ?? undefined,
              injuries: profileData.injuries || [],
              surgeries: profileData.surgeries || [],
              exerciseGoals: profileData.exerciseGoals || [],
              exercisePreferences: profileData.exercisePreferences || [],
              exerciseFrequency: profileData.exerciseFrequency ?? undefined,
              exerciseIntensity: profileData.exerciseIntensity ?? undefined,
              equipmentAccess: profileData.equipmentAccess || [],
            };
            form.reset(profileDataSubset);
          }
        })
        .catch((error: unknown) => {
          console.error('Error loading profile data:', error);
          const typedError = error as Error;
          toast({
            title: 'Error',
            description: typedError.message || 'Could not load profile data.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [user, form, toast]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not found.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Client-side Firestore write
      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(userProfileRef, preprocessDataForFirestore(data), { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not update profile. Please try again.';
      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }

  function onError(error: any) {
    console.error("Form validation error:", error);
    toast({
      title: 'Validation Error',
      description: 'Please check the form for invalid fields.',
      variant: 'destructive',
    });
  }

  const renderCommaSeparatedInput = (
    fieldName: keyof ProfileFormValues,
    label: string,
    placeholder: string
  ) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => {
        // Ensure value is always a string for the textarea
        const displayValue = Array.isArray(field.value)
          ? field.value.join(',')
          : field.value || '';
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div>
                <Textarea
                  placeholder={placeholder}
                  value={displayValue}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className='h-10 resize-none'
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );

  const handleResetOnboarding = async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not found.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const userProfileRef = doc(db, 'users', user.uid);
      await setDoc(
        userProfileRef,
        { onboardingComplete: false },
        { merge: true }
      );
      toast({
        title: 'Onboarding Reset',
        description:
          'Your onboarding status has been reset. The app will now reload.',
      });
      // Force a reload to trigger AuthContext to re-evaluate onboarding status
      window.location.reload();
    } catch (error: unknown) {
      console.error('Error resetting onboarding status:', error);
      const typedError = error as Error;
      toast({
        title: 'Reset Failed',
        description: typedError.message || 'Could not reset onboarding status.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-full'>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  return (
    <Card className='max-w-xl mx-auto shadow-lg'>
      <CardHeader>
        <CardTitle className='text-3xl font-bold'>Your Account</CardTitle>
        <CardDescription>
          Manage your account and related preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className='space-y-8'
          >
            <Accordion
              type='multiple'
              defaultValue={['account-info']}
              className='w-full'
            >
              <AccordionItem value='account-info'>
                <AccordionTrigger className='text-xl font-semibold'>
                  Account Information
                </AccordionTrigger>
                <AccordionContent className='space-y-6 pt-4 px-1'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <div>
                            <Input
                              placeholder='Your full name'
                              {...field}
                              value={field.value ?? ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input
                      value={user?.email ?? 'N/A'}
                      readOnly
                      disabled
                      className='bg-muted/50'
                    />
                    <FormDescription>
                      Your email address cannot be changed here.
                    </FormDescription>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name='subscriptionStatus'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <div>
                              <SelectTrigger>
                                <SelectValue placeholder='Select your subscription status' />
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent>
                            {subscriptionStatuses.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='goalWeight'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Weight</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='Enter your goal weight in kg'
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value='medical-physical'>
                <AccordionTrigger className='text-xl font-semibold'>
                  Medical Info & Physical Limitations
                </AccordionTrigger>
                <AccordionContent className='space-y-6 pt-4 px-1'>
                  <FormField
                    control={form.control}
                    name='painMobilityIssues'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pain/Mobility Issues (Optional)</FormLabel>
                        <FormControl>
                          <div>
                            <Textarea
                              placeholder='Describe any pain or mobility issues, e.g., knee pain, limited shoulder range'
                              {...field}
                              value={field.value ?? ''}
                              className='h-20'
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {renderCommaSeparatedInput(
                    'injuries',
                    'Injuries (comma-separated, Optional)',
                    'e.g., ACL tear, Rotator cuff'
                  )}
                  {renderCommaSeparatedInput(
                    'surgeries',
                    'Surgeries (comma-separated, Optional)',
                    'e.g., Knee replacement, Appendix removal'
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value='exercise-preferences'>
                <AccordionTrigger className='text-xl font-semibold'>
                  Exercise Preferences
                </AccordionTrigger>
                <AccordionContent className='space-y-6 pt-4 px-1'>
                  {renderCommaSeparatedInput(
                    'exerciseGoals',
                    'Exercise Goals (comma-separated, Optional)',
                    'e.g., Weight loss, Muscle gain, Improve endurance'
                  )}
                  {renderCommaSeparatedInput(
                    'exercisePreferences',
                    'Preferred Types of Exercise (comma-separated, Optional)',
                    'e.g., Running, Weightlifting, Yoga'
                  )}
                  <FormField
                    control={form.control}
                    name='exerciseFrequency'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise Frequency (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <div>
                              <SelectTrigger>
                                <SelectValue placeholder='Select how often you exercise' />
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent>
                            {exerciseFrequencies.map((ef) => (
                              <SelectItem key={ef.value} value={ef.value}>
                                {ef.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='exerciseIntensity'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Typical Exercise Intensity (Optional)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? undefined}
                        >
                          <FormControl>
                            <div>
                              <SelectTrigger>
                                <SelectValue placeholder='Select intensity' />
                              </SelectTrigger>
                            </div>
                          </FormControl>
                          <SelectContent>
                            {exerciseIntensities.map((ei) => (
                              <SelectItem key={ei.value} value={ei.value}>
                                {ei.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderCommaSeparatedInput(
                    'equipmentAccess',
                    'Equipment Access (comma-separated, Optional)',
                    'e.g., Dumbbells, Resistance bands, Full gym'
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button
              type='submit'
              className='w-full text-lg py-6'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </Form>

        <Card className='mt-12 border-destructive/50'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center text-destructive'>
              <AlertTriangle className='mr-2 h-5 w-5' /> Developer Tools
            </CardTitle>
            <CardDescription>
              Use these tools for testing purposes only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant='destructive'
              onClick={handleResetOnboarding}
              className='w-full'
            >
              <RefreshCcw className='mr-2 h-4 w-4' /> Reset Onboarding Status
            </Button>
            <p className='text-xs text-muted-foreground mt-2'>
              This will set your onboarding status to incomplete, allowing you
              to go through the onboarding flow again. The page will reload.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}