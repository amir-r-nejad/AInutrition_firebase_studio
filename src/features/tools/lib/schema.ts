import { preprocessOptionalNumber } from '@/lib/schemas';
import { z } from 'zod';

export const customizePlanFormSchema = z.object({
  custom_total_calories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Custom calories must be a whole number if provided.')
      .min(1400, 'Calories must be between 1,400 and 3,400 kcal/day.')
      .max(3400, 'Calories must be between 1,400 and 3,400 kcal/day.')
      .nullable()
  ),
  custom_protein_per_kg: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .min(0.7, 'Protein per kg must be between 0.7 and 2.5 g/kg/day.')
      .max(2.5, 'Protein per kg must be between 0.7 and 2.5 g/kg/day.')
      .nullable()
  ),
  remaining_calories_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb percentage must be a whole number.')
      .min(75, 'Remaining calories from Carbs must be between 75% and 90%.')
      .max(90, 'Remaining calories from Carbs must be between 75% and 90%.')
      .default(75)
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
