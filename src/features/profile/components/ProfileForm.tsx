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
import CommaSeparatedInput from '@/features/profile/components/CommaSeparatedInput';
import ProfileAccordionItem from '@/features/profile/components/ProfileAccordionItem';
import { useToast } from '@/hooks/use-toast';
import {
  exerciseFrequencies,
  exerciseIntensities,
  subscriptionStatuses,
} from '@/lib/constants';
import {
  BaseProfileData,
  ProfileFormSchema,
  type ProfileFormValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserMetadata } from '@supabase/supabase-js';
import { useForm } from 'react-hook-form';
import { editProfile } from '../actions/apiUserProfile';

type ProfileFormProps = {
  user: UserMetadata;
  profile: BaseProfileData;
  clientId?: string;
};

function ProfileForm({ user, profile, clientId }: ProfileFormProps) {
  const { user_role, ...formData } = profile;
  console.log(user_role);

  const isCoachView = Boolean(clientId);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      ...formData,
      name: user.user_metadata.full_name,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    const { name, ...newProfile } = data;

    try {
      await editProfile(newProfile, { data: { full_name: name } }, clientId);

      return toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      return toast({
        title: 'Update Failed',
        description: error,
        variant: 'destructive',
      });
    }
  }

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
            {!isCoachView && (
              <>
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
              </>
            )}

            <FormField
              control={form.control}
              name='subscription_status'
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Subscription Status</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(value) => value && field.onChange(value)}
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
                );
              }}
            />

            <FormField
              control={form.control}
              name='current_weight_kg'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Goal Weight</FormLabel>
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
            <CommaSeparatedInput
              fieldName='pain_mobility_issues'
              label='Pain/Mobility Issues (comma-separated, Optional)'
              placeholder='e.g., Knee pain, Limited shoulder range'
              control={form.control}
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
              fieldName='exercise_goals'
              label='Exercise Goals (comma-separated, Optional)'
              placeholder='e.g., Weight loss, Muscle gain, Improve endurance'
              control={form.control}
            />

            <CommaSeparatedInput
              fieldName='preferred_exercise_types'
              label='Preferred Types of Exercise (comma-separated, Optional)'
              placeholder='e.g., Running, Weightlifting, Yoga'
              control={form.control}
            />

            <FormField
              control={form.control}
              name='exercise_frequency'
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
              name='typical_exercise_intensity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Typical Exercise Intensity (Optional)</FormLabel>
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(value) => value && field.onChange(value)}
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
              fieldName='equipment_access'
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

export default ProfileForm;
