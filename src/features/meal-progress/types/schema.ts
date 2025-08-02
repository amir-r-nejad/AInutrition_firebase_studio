import { MealNameEnum } from '@/lib/schemas';
import { z } from 'zod';

export const mealEntryFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  meal_type: MealNameEnum,
  followed_plan: z.boolean().default(false),
  consumed_calories: z.coerce
    .number()
    .min(0, 'Calories must be at least 0')
    .max(10000, 'Calories must be less than 10,000'),
  consumed_protein: z.coerce
    .number()
    .min(0, 'Protein must be at least 0g')
    .max(1000, 'Protein must be less than 1,000g')
    .optional(),
  consumed_carbs: z.coerce
    .number()
    .min(0, 'Carbs must be at least 0g')
    .max(1000, 'Carbs must be less than 1,000g')
    .optional(),
  consumed_fat: z.coerce
    .number()
    .min(0, 'Fat must be at least 0g')
    .max(1000, 'Fat must be less than 1,000g')
    .optional(),
  custom_ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required').nullable(),
        quantity: z.coerce.number().nullable(),
        unit: z.string().optional().nullable(),
      })
    )
    .optional(),
  note: z.string().optional(),
});

export type MealEntryFormValues = z.infer<typeof mealEntryFormSchema>;
