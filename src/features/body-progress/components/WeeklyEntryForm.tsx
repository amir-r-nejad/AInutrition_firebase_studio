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
import { Input } from '@/components/ui/input';
import SubmitButton from '@/components/ui/SubmitButton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, Calendar, FileText, Plus, Ruler, Scale } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import { useForm } from 'react-hook-form';
import { entryFormSchema, EntryFormValues } from '../types/schema';

import { BodyProgressEntry } from '../types';
import CustomDatePicker from '@/components/ui/CustomDatePicker';
import { saveUserBodyProgress } from '../lib/body-progress-service';

type WeeklyEntryFormProps = {
  entries: BodyProgressEntry[];
  clientId?: string;
};

export function WeeklyEntryForm({ entries, clientId }: WeeklyEntryFormProps) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight_kg: undefined,
      bf_percentage: undefined,
      waist_cm: undefined,
      notes: '',
    },
  });

  const disabledDates = entries.map((ent) => new Date(ent.date));

  async function onSubmit(data: EntryFormValues) {
    try {
      await saveUserBodyProgress(data, clientId);
      toast({
        title: 'Progress Entry Added!',
        description: `Weight: ${data.weight_kg}kg, Body Fat: ${data.bf_percentage}%, Waist: ${data.waist_cm}cm`,
      });

      form.reset({
        date: new Date().toISOString().split('T')[0],
        weight_kg: undefined,
        bf_percentage: undefined,
        waist_cm: undefined,
        notes: '',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save progress. Try again later.',
      });
    }
  }

  return (
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Plus className='h-5 w-5' />
            Add Weekly Progress Entry
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4' />
                      Date
                    </FormLabel>
                    <FormControl>
                      <CustomDatePicker
                        {...field}
                        maxDate={new Date()}
                        selected={new Date(field.value)}
                        excludeDates={disabledDates}
                        onChange={(date) => {
                          field.onChange(date?.toISOString().slice(0, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='weight_kg'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Scale className='h-4 w-4' />
                      Weight (kg)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='e.g., 75.2'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value)
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
                name='bf_percentage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Activity className='h-4 w-4' />
                      Body Fat (%) (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='e.g., 18.5'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value)
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
                name='waist_cm'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Ruler className='h-4 w-4' />
                      Waist (cm) (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.1'
                        placeholder='e.g., 85.0'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value)
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

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <FileText className='h-4 w-4' />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='How are you feeling? Any observations about your progress...'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitButton
              loadingLabel='Adding...'
              isLoading={form.formState.isSubmitting}
              icon={<Plus />}
              label='Add Progress Entry'
              className='w-full md:w-auto'
            />
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
