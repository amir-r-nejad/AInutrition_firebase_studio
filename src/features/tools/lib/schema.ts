import { preprocessOptionalNumber } from '@/lib/schemas';
import { z } from 'zod';

export const customizePlanFormSchema = z.object({
  custom_total_calories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Custom calories must be a whole number if provided.')
      .positive('Custom calories must be positive if provided.')
      .optional()
  ),
  custom_protein_per_kg: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .min(0, 'Protein per kg must be non-negative if provided.')
      .optional()
  ),
  remaining_calories_carb_pct: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb percentage must be a whole number.')
      .min(0, 'Carb percentage must be between 0 and 100.')
      .max(100, 'Carb percentage must be between 0 and 100.')
      .optional()
      .default(50)
  ),

  carbCalories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  carbGrams: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  carbTargetPct: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  fatCalories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  fatGrams: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  fatTargetPct: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  proteinCalories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  proteinGrams: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
  proteinTargetPct: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().int().optional()
  ),
});
