'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import SubmitButton from '@/components/ui/SubmitButton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { saveCoachProfile } from '../../actions/coachProfile';
import {
  CoachProfileFormSchema,
  CoachProfileFormValues,
} from '../../schemas/coachSchemas';

interface CoachData {
  full_name: string;
  age: number;
  description: string;
  certification: string[];
  years_experience: number;
}

export function CoachProfileForm({ coach }: { coach: CoachData }) {
  const { toast } = useToast();

  const [firstName, lastName] = coach.full_name.split(' ');
  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(CoachProfileFormSchema),
    defaultValues: {
      first_name: firstName,
      last_name: lastName,
      age: coach.age,
      description: coach.description,
      certification: coach.certification,
      years_experience: coach.years_experience,
    },
  });

  const handleSubmit: SubmitHandler<CoachProfileFormValues> = async (data) => {
    try {
      await saveCoachProfile(data);

      toast({
        title: 'Profile Updated',
        description: 'Your coach profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description:
          error?.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = async () => {
    form.reset({
      first_name: '',
      last_name: '',
      age: 20,
      description: '',
      certification: [],
      years_experience: 2,
    });

    toast({
      title: 'Form Reset',
      description: 'Form has been reset to original values.',
    });
  };

  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter your first name' {...field} />
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
                      <Input placeholder='Enter your last name' {...field} />
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
                      placeholder='Enter your age'
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

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Describe your experience and approach to coaching...'
                      rows={4}
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
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(e.currentTarget.value.trim().split(','))
                      }
                      placeholder='Enter your professional certification'
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
                      placeholder='Years of experience'
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

            <div className='flex justify-end gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                className='bg-transparent'
                onClick={handleReset}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <SubmitButton
                isLoading={form.formState.isSubmitting}
                loadingLabel='Saving...'
                label='Save Changes'
                icon={<Save className='h-4 w-4' />}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
