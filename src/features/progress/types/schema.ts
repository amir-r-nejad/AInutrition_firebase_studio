import { z } from 'zod';

export const entryFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight_kg: z.coerce
    .number()
    .min(20, 'Weight must be at least 20kg')
    .max(500, 'Weight must be less than 500kg'),
  bf_percentage: z.coerce
    .number()
    .min(0, 'Body fat percentage must be at least 0%')
    .max(100, 'Body fat percentage must be less than 100%'),
  waist_cm: z.coerce
    .number()
    .min(30, 'Waist measurement must be at least 30cm')
    .max(200, 'Waist measurement must be less than 200cm'),
  notes: z.string().optional(),
});

export type EntryFormValues = z.infer<typeof entryFormSchema>;
