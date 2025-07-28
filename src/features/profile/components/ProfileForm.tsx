
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
import { Button } from '@/components/ui/button';
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
  const isCoachView = Boolean(clientId);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      ...profile,
      full_name: user.user_metadata.full_name,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    const { full_name, ...newProfile } = data;

    try {
      await editProfile(newProfile, { data: { full_name } }, clientId);

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
                  name='full_name'
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
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter your age"
                      {...field}
                      value={field.value ?? ''}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
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
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      value={field.value ?? ''}
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
                      value={field.value ?? ''}
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
                      value={field.value ?? ''}
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
                      value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="medical_conditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Conditions</FormLabel>
                            <FormControl>
                    <Input 
                                placeholder="List any medical conditions or medications..."
                                {...field}
                      value={field.value ?? ''}
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
                    <Input 
                                placeholder="List any food allergies or dietary restrictions..."
                                {...field}
                      value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    <FormField
                      control={form.control}
                      name="dietary_preferences"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dietary Preferences</FormLabel>
                          <FormControl>
                    <Input 
                              placeholder="Describe your dietary preferences (e.g., vegetarian, vegan, keto, paleo, etc.)..."
                              {...field}
                      value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
          </ProfileAccordionItem>
          </Accordion>

          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg"
            >
            Save Profile
            </Button>
          </div>
        </form>
      </Form>
  );
}

export default ProfileForm;
