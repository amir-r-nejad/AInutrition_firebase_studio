'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import SubmitButton from '@/components/ui/SubmitButton';
import { editProfile } from '@/features/profile/actions/apiUserProfile';
import { useToast } from '@/hooks/use-toast';
import { preferredDiets } from '@/lib/constants';
import {
  BaseProfileData,
  MealSuggestionPreferencesSchema,
  type MealSuggestionPreferencesValues,
} from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import PreferenceTextarea from './PreferenceTextarea';

function MealForm({ profile }: { profile: BaseProfileData }) {
  const { toast } = useToast();

  const form = useForm<MealSuggestionPreferencesValues>({
    resolver: zodResolver(MealSuggestionPreferencesSchema),
    defaultValues: {
      preferred_diet: undefined,
      preferred_cuisines: [],
      dispreferrred_cuisines: [],
      preferred_ingredients: [],
      dispreferrred_ingredients: [],
      allergies: [],
      preferred_micronutrients: [],
      medical_conditions: [],
      medications: [],
    },
  });

  async function handleSavePreferences() {
    try {
      await editProfile(form.getValues());

      toast({
        title: 'Preferences Saved',
        description: 'Your preferences have been saved successfully.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Save Error',
        description: error,
        variant: 'destructive',
      });
    }
  }

  useEffect(
    function () {
      form.reset(profile);
    },
    [form, profile]
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSavePreferences)}
        className='space-y-6 pt-4'
      >
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>
              Dietary Preferences & Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className='grid md:grid-cols-2 gap-x-6 gap-y-4'>
            <FormField
              control={form.control}
              name='preferred_diet'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Diet</FormLabel>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => value && field.onChange(value)}
                  >
                    <FormControl>
                      <div>
                        <SelectTrigger>
                          <SelectValue placeholder='Select preferred diet' />
                        </SelectTrigger>
                      </div>
                    </FormControl>
                    <SelectContent>
                      {preferredDiets.map((pd) => (
                        <SelectItem key={pd.value} value={pd.value}>
                          {pd.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PreferenceTextarea
              fieldName='allergies'
              label='Allergies (comma-separated)'
              placeholder='e.g., Peanuts, Shellfish'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='preferred_cuisines'
              label='Preferred Cuisines'
              placeholder='e.g., Italian, Mexican'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='dispreferrred_cuisines'
              label='Dispreferred Cuisines'
              placeholder='e.g., Thai, French'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='preferred_ingredients'
              label='Preferred Ingredients'
              placeholder='e.g., Chicken, Broccoli'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='dispreferrred_ingredients'
              label='Dispreferred Ingredients'
              placeholder='e.g., Tofu, Mushrooms'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='preferred_micronutrients'
              label='Targeted Micronutrients (Optional)'
              placeholder='e.g., Vitamin D, Iron'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='medical_conditions'
              label='Medical Conditions (Optional)'
              placeholder='e.g., Diabetes, Hypertension'
              control={form.control}
            />

            <PreferenceTextarea
              fieldName='medications'
              label='Medications (Optional)'
              placeholder='e.g., Metformin, Lisinopril'
              control={form.control}
            />

            <div className='flex gap-2 self-end'>
              <SubmitButton
                size='lg'
                icon={<Save />}
                isLoading={form.formState.isSubmitting}
                label='Save'
                loadingLabel='Saving..'
              />

              {/* TODO: ADD THIS BUTTON IN THE FUTURE */}
              {/* <Button
                disabled={form.formState.isSubmitting}
                size='lg'
                className='flex-1'
                variant='destructive'
              >
                <RefreshCcw />
                Reset
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

export default MealForm;
