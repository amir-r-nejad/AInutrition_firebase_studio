import { preprocessOptionalNumber } from '@/lib/schemas';
import { z } from 'zod';

export const customizePlanFormSchema = z.object({
  custom_total_calories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Custom calories must be a whole number if provided.')
      .positive('Custom calories must be positive if provided.')
      .nullable()
  ),
  custom_protein_per_kg: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .min(0, 'Protein per kg must be non-negative if provided.')
      .nullable()
  ),
  remaining_calories_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb percentage must be a whole number.')
      .min(0, 'Carb percentage must be between 0 and 100.')
      .max(100, 'Carb percentage must be between 0 and 100.')
      .default(50)
      .nullable()
  ),

  custom_carbs_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_fat_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_fat_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_protein_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_protein_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
  custom_total_calories_final: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional().nullable()
  ),
});
