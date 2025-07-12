'use client';

import { Accordion } from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SubmitButton from '@/components/ui/SubmitButton';
import { Textarea } from '@/components/ui/textarea';
import CommaSeparatedInput from '@/features/profile/components/CommaSeparatedInput';
import ProfileAccordionItem from '@/features/profile/components/ProfileAccordionItem';
import { saveProfileData } from '@/features/profile/lib/profile-service';
import { useToast } from '@/hooks/use-toast';
import {
  exerciseFrequencies,
  exerciseIntensities,
  subscriptionStatuses,
} from '@/lib/constants';
import { ProfileFormSchema, type ProfileFormValues } from '@/lib/schemas';
import { User } from '@/types/globalTypes';
import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileData } from '../hooks/useProfileData';
import { ProfileFormHandle } from '../types';

type FormProps = { user: User | null };

const ProfileForm = forwardRef<ProfileFormHandle, FormProps>(
  ({ user }, ref) => {
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

    const { toast } = useToast();
    const { isLoading, refreshProfile } = useProfileData(user?.uid, form);

    async function onSubmit(data: ProfileFormValues) {
      console.log('Submitting profile data:', data);
      if (!user?.uid) {
        toast({
          title: 'Error',
          description: 'User not found.',
          variant: 'destructive',
        });
        return;
      }
      try {
        await saveProfileData(user.uid, data);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } catch {
        toast({
          title: 'Update Failed',
          description: 'Could not update profile. Please try again.',
          variant: 'destructive',
        });
      }
    }

    useImperativeHandle(ref, () => ({
      form,
      isLoading,
      refreshProfile,
    }));

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
          <Accordion
            type='multiple'
            defaultValue={['account-info']}
            className='w-full'
          >
            <ProfileAccordionItem
              label='Account Information'
              value='account-info'
            >
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
                          <SelectItem key={status.value} value={status.value}>
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
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ProfileAccordionItem>

            <ProfileAccordionItem
              value='medical-physical'
              label='Medical Info & Physical Limitations'
            >
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
              <CommaSeparatedInput
                fieldName='injuries'
                label='Injuries (comma-separated, Optional)'
                placeholder='e.g., ACL tear, Rotator cuff'
                control={form.control}
              />

              <CommaSeparatedInput
                fieldName='surgeries'
                label='Surgeries (comma-separated, Optional)'
                placeholder='e.g., Knee replacement, Appendix removal'
                control={form.control}
              />
            </ProfileAccordionItem>

            <ProfileAccordionItem
              value='exercise-preferences'
              label='Exercise Preferences'
            >
              <CommaSeparatedInput
                fieldName='exerciseGoals'
                label='Exercise Goals (comma-separated, Optional)'
                placeholder='e.g., Weight loss, Muscle gain, Improve endurance'
                control={form.control}
              />

              <CommaSeparatedInput
                fieldName='exercisePreferences'
                label='Preferred Types of Exercise (comma-separated, Optional)'
                placeholder='e.g., Running, Weightlifting, Yoga'
                control={form.control}
              />

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
                    <FormLabel>Typical Exercise Intensity (Optional)</FormLabel>
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

              <CommaSeparatedInput
                fieldName='equipmentAccess'
                label='Equipment Access (comma-separated, Optional)'
                placeholder='e.g., Dumbbells, Resistance bands, Full gym'
                control={form.control}
              />
            </ProfileAccordionItem>
          </Accordion>

          <SubmitButton
            label='Save Profile'
            loadingLabel='Saving...'
            className='w-full text-lg py-6'
            isLoading={form.formState.isSubmitting}
          />
        </form>
      </Form>
    );
  }
);
ProfileForm.displayName = 'ProfileForm';

export default ProfileForm;
