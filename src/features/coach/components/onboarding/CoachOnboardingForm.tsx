'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import SubmitButton from '@/components/ui/SubmitButton';
import { useToast } from '@/hooks/use-toast';
import {
  CoachOnboardingFormSchema,
  type CoachOnboardingFormValues,
} from '@/features/coach/schemas/coachSchemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Leaf, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { saveCoachOnboarding } from '../../actions/coachProfile';

const coachSteps = [
  {
    stepNumber: 1,
    title: 'Welcome to NutriPlan Coach!',
    description:
      "Let's set up your coaching profile to help you manage clients effectively.",
    fields: [],
  },
  {
    stepNumber: 2,
    title: 'Personal Information',
    description: 'Tell us about yourself so clients can get to know you.',
    fields: ['first_name', 'last_name', 'age'] as const,
  },
  {
    stepNumber: 3,
    title: 'Professional Background',
    description:
      'Share your expertise and qualifications with potential clients.',
    fields: ['description', 'certification', 'years_experience'] as const,
  },
  {
    stepNumber: 4,
    title: 'Complete Setup',
    description: 'Review your information and complete your coach profile.',
    fields: [],
  },
];

export function CoachOnboardingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CoachOnboardingFormValues>({
    resolver: zodResolver(CoachOnboardingFormSchema),
    mode: 'onChange',
    defaultValues: {
      user_role: 'coach',
      first_name: '',
      last_name: '',
      age: undefined,
      description: '',
      certification: [],
      years_experience: undefined,
    },
  });

  const activeStep = coachSteps.find((s) => s.stepNumber === currentStep);
  const progressValue = (currentStep / coachSteps.length) * 100;

  async function handleNext() {
    if (activeStep?.fields && activeStep.fields.length > 0) {
      const result = await form.trigger(activeStep.fields);

      if (!result) {
        const firstError = activeStep.fields.find(
          (field) => form.formState.errors[field]
        );

        if (firstError) {
          const errorMessage = form.formState.errors[firstError]?.message;
          toast({
            title: `Input Error: ${activeStep.title}`,
            description:
              typeof errorMessage === 'string'
                ? errorMessage
                : 'Please fill all required fields correctly.',
            variant: 'destructive',
          });
        }
        return;
      }
    }

    if (currentStep < coachSteps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handlePrevious() {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  const handleSubmit: SubmitHandler<CoachOnboardingFormValues> = async (
    data
  ) => {
    try {
      await saveCoachOnboarding(data);

      toast({
        title: 'Coach Profile Created!',
        description:
          'Welcome to NutriPlan! Your coaching profile is now set up.',
      });

      router.push('/coach-dashboard');
    } catch (error: any) {
      toast({
        title: 'Error Creating Profile',
        description:
          error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!activeStep) return null;

  return (
    <Card className='w-full max-w-2xl shadow-xl'>
      <CardHeader className='text-center'>
        <div className='flex justify-center items-center mb-4'>
          <div className='relative'>
            <Leaf className='h-10 w-10 text-primary' />
            <Users className='h-6 w-6 text-accent absolute -bottom-1 -right-1 bg-background rounded-full p-1' />
          </div>
        </div>
        <CardTitle className='text-2xl font-bold'>{activeStep.title}</CardTitle>
        <CardDescription>{activeStep.description}</CardDescription>
        <Progress value={progressValue} className='w-full mt-4' />
        <p className='text-sm text-muted-foreground mt-1'>
          Step {currentStep} of {coachSteps.length}
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            {currentStep === 1 && (
              <div className='text-center p-6 space-y-4'>
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold text-primary'>
                    Welcome to Your Coaching Journey!
                  </h3>
                  <p className='text-muted-foreground'>
                    As a nutrition coach, you&apos;ll be able to manage clients,
                    create personalized meal plans, and track their progress.
                    Let&apos;s set up your professional profile so clients can
                    learn about your expertise.
                  </p>
                  <div className='bg-muted/50 p-4 rounded-lg'>
                    <p className='text-sm text-muted-foreground'>
                      This setup will take about 2-3 minutes and will help you:
                    </p>
                    <ul className='text-sm text-muted-foreground mt-2 space-y-1 text-left'>
                      <li>
                        • Create a professional profile for potential clients
                      </li>
                      <li>• Set up your coaching credentials and experience</li>
                      <li>• Access powerful client management tools</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='first_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., Sarah' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='last_name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., Johnson' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='age'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='e.g., 32'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? undefined
                                : parseInt(e.target.value, 10)
                            )
                          }
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className='space-y-4'>
                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe your experience, approach to coaching, and what makes you unique as a nutrition coach...'
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='certification'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certification</FormLabel>
                      <FormControl>
                        <Input
                          defaultValue={field.value}
                          onChange={(e) => {
                            const data = e.currentTarget.value
                              .trim()
                              .split(',');
                            field.onChange(data);
                          }}
                          placeholder='e.g., Registered Dietitian Nutritionist (RDN)'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='years_experience'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='e.g., 8'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? undefined
                                : parseInt(e.target.value, 10)
                            )
                          }
                          onWheel={(e) =>
                            (e.currentTarget as HTMLInputElement).blur()
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className='text-center space-y-4'>
                <CheckCircle className='h-16 w-16 text-green-500 mx-auto' />
                <p className='text-lg'>Your coach profile is ready!</p>
                <p className='text-muted-foreground'>
                  Click &quot;Complete Setup&quot; to save your profile and
                  access your coaching dashboard.
                </p>
              </div>
            )}

            <div className='flex justify-between items-center pt-6'>
              <Button
                type='button'
                variant='outline'
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              <div className='space-x-2'>
                {currentStep < coachSteps.length ? (
                  <Button type='button' onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <SubmitButton
                    isLoading={form.formState.isSubmitting}
                    loadingLabel='Setting up...'
                    label='Complete Setup'
                  />
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
