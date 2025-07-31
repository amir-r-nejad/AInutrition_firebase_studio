'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { updateUserProgress } from '../lib/progress-service';
import { BodyProgressEntry } from '../types';
import { entryFormSchema, EntryFormValues } from '../types/schema';

type EditProgressModalProps = {
  onClose: () => void;
  isOpen: boolean;
  progress: BodyProgressEntry;
};

function EditProgressModal({
  progress,
  onClose,
  isOpen,
}: EditProgressModalProps) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: progress,
  });

  function handleClose() {
    form.reset();
    onClose();
  }

  async function onSubmit(data: EntryFormValues) {
    try {
      await updateUserProgress(data);
      toast({
        title: 'Progress Updated',
        description: 'Your progress has been successfully saved.',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Unexpected Error',
        description:
          error?.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Send Coaching Request
          </DialogTitle>
          <DialogDescription>
            Send a personalized coaching request to a potential client via
            email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        disabled
                        value={field.value}
                        type='date'
                        className='cursor-pointer'
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
                      Body Fat (%)
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
                      Waist (cm)
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
              icon={<Plus className='h-4 w-4 mr-2' />}
              label='Add Progress Entry'
              className='w-full md:w-auto'
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditProgressModal;
