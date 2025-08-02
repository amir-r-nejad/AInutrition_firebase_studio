'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useQueryParams } from '@/hooks/useQueryParams';
import { Meal } from '@/lib/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { MealProgressEntry } from '../types';
import { mealEntryFormSchema, MealEntryFormValues } from '../types/schema';
import {
  saveUserMealProgress,
  updateUserMealProgress,
} from '../lib/meal-progress-service';
import SubmitButton from '@/components/ui/SubmitButton';
import { toast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

interface TrackMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: Meal;
  progressMeal?: MealProgressEntry;
}

export function TrackMealModal({
  isOpen,
  onClose,
  meal,
  progressMeal,
}: TrackMealModalProps) {
  const params = useParams<{ clientId?: string }>();
  const isCoachView = !!params?.clientId;

  const { getQueryParams } = useQueryParams();
  const selectedDate =
    getQueryParams('selected_day') || new Date().toISOString();

  const form = useForm<MealEntryFormValues>({
    resolver: zodResolver(mealEntryFormSchema),
    defaultValues: progressMeal || {
      note: '',
      date: selectedDate,
      followed_plan: true,
      meal_type: meal.name,
      consumed_calories: meal.total_calories || 0,
      consumed_carbs: meal.total_carbs || 0,
      consumed_fat: meal.total_fat || 0,
      consumed_protein: meal.total_protein || 0,
      custom_ingredients: meal.ingredients,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'custom_ingredients',
  });

  const followedPlan = form.watch('followed_plan');

  function addIngredient() {
    append({ name: '', quantity: 0, unit: '' });
  }

  function removeIngredient(index: number) {
    if (fields.length > 1) remove(index);
  }

  function handleClose() {
    form.reset();
    onClose();
  }

  async function onSubmit(data: MealEntryFormValues) {
    const progressData: Omit<MealProgressEntry, 'id' | 'user_id'> = {
      date: selectedDate,
      meal_type: meal.name!,
      followed_plan: data.followed_plan,

      consumed_calories: data.followed_plan
        ? meal.total_calories || 0
        : data.consumed_calories,
      consumed_protein: data.followed_plan
        ? meal.total_protein || 0
        : data.consumed_protein || 0,
      consumed_carbs: data.followed_plan
        ? meal.total_carbs || 0
        : data.consumed_carbs || 0,
      consumed_fat: data.followed_plan
        ? meal.total_fat || 0
        : data.consumed_fat || 0,

      custom_ingredients: data.custom_ingredients?.map((ing) => ({
        name: ing.name || '',
        quantity: ing.quantity || 0,
        unit: ing.unit || '',
      })),

      note: data.followed_plan ? '' : data.note,
    };

    try {
      if (progressMeal)
        await updateUserMealProgress(progressData, params?.clientId);
      else await saveUserMealProgress(progressData, params?.clientId);
      handleClose();
      toast({
        title: isCoachView ? 'Client Meal Updated' : 'Meal Logged',
        description: isCoachView
          ? "Your client's meal progress has been updated successfully!"
          : 'Your meal progress has been saved successfully!',
      });
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description:
          error instanceof Error
            ? error.message
            : isCoachView
            ? "Couldn't update client meal. Please try again later."
            : "Couldn't save your meal. Please try again later.",
        variant: 'destructive',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto border-border/50 shadow-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-primary'>
            {isCoachView
              ? `Update Client's ${meal.name}`
              : `Track ${meal.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCoachView
              ? `Update what your client ate for ${meal.name} on ${format(
                  new Date(selectedDate),
                  'EEEE, MMM dd'
                )}`
              : `Record what you ate for ${meal.name} on ${format(
                  new Date(selectedDate),
                  'EEEE, MMM dd'
                )}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Did they follow the plan? */}
            <div className='space-y-4'>
              <Label className='text-sm font-semibold text-foreground'>
                {isCoachView
                  ? 'Did your client follow their meal plan?'
                  : 'Did you follow your meal plan?'}
              </Label>
              <RadioGroup
                value={followedPlan ? 'yes' : 'no'}
                onValueChange={(value) => {
                  const followed = value === 'yes';
                  form.setValue('followed_plan', followed);
                }}
                className='flex gap-8'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='yes' id='yes' />
                  <Label htmlFor='yes' className='text-sm font-medium'>
                    {isCoachView
                      ? 'Yes, client followed the plan'
                      : 'Yes, I followed the plan'}
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='no' id='no' />
                  <Label htmlFor='no' className='text-sm font-medium'>
                    {isCoachView
                      ? 'No, client ate something else'
                      : 'No, I ate something else'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Custom ingredients (only if didn't follow plan) */}
            {!followedPlan && (
              <div className='space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-semibold text-foreground'>
                    {isCoachView
                      ? 'What did your client eat?'
                      : 'What did you eat?'}
                  </Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addIngredient}
                    className='border-border/50 hover:border-border'
                  >
                    <PlusCircle className='h-4 w-4 mr-1' />
                    Add Ingredient
                  </Button>
                </div>

                <div className='space-y-3 max-h-40 overflow-y-auto'>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className='flex gap-3 items-start p-3 bg-background rounded-md border border-border/30'
                    >
                      <FormField
                        control={form.control}
                        name={`custom_ingredients.${index}.name`}
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormControl>
                              <Input
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                placeholder='Ingredient name'
                                className='text-sm border-border/50'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`custom_ingredients.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className='w-12'>
                            <FormControl>
                              <Input
                                type='number'
                                value={Number(field.value || 0)}
                                onChange={field.onChange}
                                placeholder='Qty'
                                className='text-sm border-border/50'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`custom_ingredients.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className='w-20'>
                            <FormControl>
                              <Input
                                value={field.value ?? ''}
                                onChange={field.onChange}
                                placeholder='Unit'
                                className='text-sm border-border/50'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeIngredient(index)}
                          className='mt-0 p-2 hover:bg-destructive/10 hover:text-destructive'
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition values */}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='consumed_calories'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold'>
                      Calories
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        readOnly={followedPlan}
                        disabled={followedPlan}
                        className='text-sm border-border/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='consumed_protein'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold'>
                      Protein (g)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        readOnly={followedPlan}
                        disabled={followedPlan}
                        className='text-sm border-border/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='consumed_carbs'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold'>
                      Carbs (g)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        readOnly={followedPlan}
                        disabled={followedPlan}
                        className='text-sm border-border/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='consumed_fat'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold'>
                      Fat (g)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='0'
                        {...field}
                        readOnly={followedPlan}
                        disabled={followedPlan}
                        className='text-sm border-border/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes (only if didn't follow plan) */}
            {!followedPlan && (
              <FormField
                control={form.control}
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold'>
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          isCoachView
                            ? "Why didn't your client follow the plan? Any observations..."
                            : "Why didn't you follow the plan? Any observations..."
                        }
                        rows={3}
                        {...field}
                        className='text-sm border-border/50 resize-none'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className='gap-3 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                className='border-border/50 hover:border-border bg-transparent'
              >
                Cancel
              </Button>

              <SubmitButton
                className='w-max'
                isLoading={form.formState.isSubmitting}
                icon={<Save />}
                label={isCoachView ? 'Update Client Data' : 'Save Tracking'}
                loadingLabel={isCoachView ? 'Updating...' : 'Saving...'}
              />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
