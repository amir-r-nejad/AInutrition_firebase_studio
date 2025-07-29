import * as z from 'zod';

export const preprocessOptionalNumber = (val: unknown) => {
  if (val === '' || val === null || val === undefined) {
    return undefined;
  }
  const num = Number(val);
  return isNaN(num) ? undefined : num;
};

export function preprocessDataForFirestore(
  data: Record<string, any> | null | undefined
): Record<string, any> | null | any[] {
  if (data === null || data === undefined) return null;

  if (typeof data !== 'object' || data instanceof Date) {
    return data === undefined ? null : data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => preprocessDataForFirestore(item));
  }

  const processedData: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      processedData[key] = preprocessDataForFirestore(value);
    }
  }
  return processedData;
}

// User Profile Schema and Types
export const UserProfileSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  is_onboarding_complete: z.boolean().default(false),
  user_role: z.enum(['client', 'coach']).nullable().optional(),
  age: z.number().int().min(1).max(120),
  biological_sex: z.enum(['male', 'female', 'other']),
  height_cm: z.number().min(50).max(300).nullable().optional(),
  current_weight_kg: z.number().min(20).max(500).nullable().optional(),
  target_weight_1month_kg: z.number().min(20).max(500).nullable().optional(),
  long_term_goal_weight_kg: z.number().min(20).max(500).nullable().optional(),
  physical_activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'extra_active'])
    .nullable()
    .optional(),
  primary_diet_goal: z
    .enum(['fat_loss', 'muscle_gain', 'recomp'])
    .nullable()
    .optional(),
  pain_mobility_issues: z.array(z.string()).nullable().optional(),
  injuries: z.array(z.string()).nullable().optional(),
  surgeries: z.array(z.string()).nullable().optional(),
  exercise_goals: z.array(z.string()).nullable().optional(),
  preferred_exercise_types: z.array(z.string()).nullable().optional(),
  exercise_frequency: z
    .enum(['1-2_days', '3-4_days', '5-6_days', 'daily'])
    .nullable()
    .optional(),
  typical_exercise_intensity: z
    .enum(['light', 'moderate', 'vigorous'])
    .nullable()
    .optional(),
  equipment_access: z.array(z.string()).nullable().optional(),
  subscription_status: z
    .enum(['free', 'premium', 'premium_annual', 'trial', 'trial_ended'])
    .nullable()
    .optional(),
  bf_current: z.number().min(0).max(100).nullable().optional(),
  bf_target: z.number().min(0).max(100).nullable().optional(),
  bf_ideal: z.number().min(0).max(100).nullable().optional(),
  mm_current: z.number().min(0).max(100).nullable().optional(),
  mm_target: z.number().min(0).max(100).nullable().optional(),
  mm_ideal: z.number().min(0).max(100).nullable().optional(),
  bw_current: z.number().min(0).max(100).nullable().optional(),
  bw_target: z.number().min(0).max(100).nullable().optional(),
  bw_ideal: z.number().min(0).max(100).nullable().optional(),
  waist_current: z.number().min(0).nullable().optional(),
  waist_goal_1m: z.number().min(0).nullable().optional(),
  waist_ideal: z.number().min(0).nullable().optional(),
  hips_current: z.number().min(0).nullable().optional(),
  hips_goal_1m: z.number().min(0).nullable().optional(),
  hips_ideal: z.number().min(0).nullable().optional(),
  right_leg_current: z.number().min(0).nullable().optional(),
  right_leg_goal_1m: z.number().min(0).nullable().optional(),
  right_leg_ideal: z.number().min(0).nullable().optional(),
  left_leg_current: z.number().min(0).nullable().optional(),
  left_leg_goal_1m: z.number().min(0).nullable().optional(),
  left_leg_ideal: z.number().min(0).nullable().optional(),
  right_arm_current: z.number().min(0).nullable().optional(),
  right_arm_goal_1m: z.number().min(0).nullable().optional(),
  right_arm_ideal: z.number().min(0).nullable().optional(),
  left_arm_current: z.number().min(0).nullable().optional(),
  left_arm_goal_1m: z.number().min(0).nullable().optional(),
  left_arm_ideal: z.number().min(0).nullable().optional(),
  meal_distributions: z
    .array(
      z.object({
        mealName: z.string(),
        calories_pct: z.number(),
      })
    )
    .nullable()
    .optional(),
  preferred_diet: z.string().nullable().optional(),
  preferred_cuisines: z.array(z.string()).nullable().optional(),
  dispreferrred_cuisines: z.array(z.string()).nullable().optional(),
  preferred_ingredients: z.array(z.string()).nullable().optional(),
  dispreferrred_ingredients: z.array(z.string()).nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  preferred_micronutrients: z.array(z.string()).nullable().optional(),
  medical_conditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// User Plan Schema and Types
export const UserPlanSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  bmr_kcal: z.number().nullable().optional(),
  maintenance_calories_tdee: z.number().nullable().optional(),
  target_daily_calories: z.number().nullable().optional(),
  target_protein_g: z.number().nullable().optional(),
  target_protein_percentage: z.number().nullable().optional(),
  target_carbs_g: z.number().nullable().optional(),
  target_carbs_percentage: z.number().nullable().optional(),
  target_fat_g: z.number().nullable().optional(),
  target_fat_percentage: z.number().nullable().optional(),
  custom_total_calories: z.number().nullable().optional(),
  custom_protein_per_kg: z.number().nullable().optional(),
  remaining_calories_carbs_percentage: z.number().nullable().optional(),
  custom_total_calories_final: z.number().nullable().optional(),
  custom_protein_g: z.number().nullable().optional(),
  custom_protein_percentage: z.number().nullable().optional(),
  custom_carbs_g: z.number().nullable().optional(),
  custom_carbs_percentage: z.number().nullable().optional(),
  custom_fat_g: z.number().nullable().optional(),
  custom_fat_percentage: z.number().nullable().optional(),
  remaining_calories_carb_pct: z.number().nullable().optional(),
  current_weight_for_custom_calc: z.number().nullable().optional(),
});

export type UserPlan = z.infer<typeof UserPlanSchema>;

// Ingredient Schema
export const IngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0, 'Quantity must be non-negative').nullable().default(null)
  ),
  unit: z.string().min(1, 'Unit is required (e.g., g, ml, piece)'),
  calories: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  protein: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  carbs: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  fat: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

// Meal Schema
export const MealSchema = z.object({
  name: z.string().min(1, 'Meal name is required'),
  custom_name: z.string().optional().default(''),
  ingredients: z.array(IngredientSchema).default([]),
  total_calories: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  total_protein: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  total_carbs: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
  total_fat: z.preprocess(
    preprocessOptionalNumber,
    z.number().min(0).nullable().default(null)
  ),
});

export type Meal = z.infer<typeof MealSchema>;

// Daily Meal Plan Schema
export const DailyMealPlanSchema = z.object({
  day_of_week: z.string(),
  meals: z.array(MealSchema),
});

export type DailyMealPlan = z.infer<typeof DailyMealPlanSchema>;

// Weekly Meal Plan Schema
export const WeeklyMealPlanSchema = z.object({
  days: z.array(DailyMealPlanSchema),
  weekly_summary: z
    .object({
      total_calories: z.number(),
      total_protein: z.number(),
      total_carbs: z.number(),
      total_fat: z.number(),
    })
    .optional(),
});

export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;

// User Meal Plan Schema and Types
export const UserMealPlanSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  meal_data: WeeklyMealPlanSchema.nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  ai_plan: z.any().nullable().optional(), // Will be typed more specifically for AI plans
});

export type UserMealPlan = z.infer<typeof UserMealPlanSchema>;

// Exercise Planner Data Schema and Types
export const ExercisePlannerDataSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  fitness_level: z.string().nullable().optional(),
  exercise_experience: z.string().nullable().optional(),
  existing_medical_conditions: z.array(z.string()).nullable().optional(),
  injuries_or_limitations: z.array(z.string()).nullable().optional(),
  current_medications: z.array(z.string()).nullable().optional(),
  primary_goal: z.string().nullable().optional(),
  exercise_days_per_week: z.number().min(1).max(7).nullable().optional(),
  available_time_per_session: z.number().min(5).max(300).nullable().optional(),
  preferred_time_of_day: z.string().nullable().optional(),
  exercise_location: z.string().nullable().optional(),
  available_equipment: z.array(z.string()).nullable().optional(),
  machines_access: z.boolean().nullable().optional(),
  space_availability: z.string().nullable().optional(),
  preferred_difficulty_level: z.string().nullable().optional(),
  sleep_quality: z.string().nullable().optional(),
  generated_plan: z.any().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ExercisePlannerData = z.infer<typeof ExercisePlannerDataSchema>;

// Exercise Progress Schema and Types
export const ExerciseProgressSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  exercise_plan_id: z.number().nullable().optional(),
  date_recorded: z.string(),
  exercises_completed: z.array(z.string()).nullable().optional(),
  total_duration_minutes: z.number().min(0).nullable().optional(),
  calories_burned: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  difficulty_rating: z.number().min(1).max(10).nullable().optional(),
  energy_level: z.number().min(1).max(10).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ExerciseProgress = z.infer<typeof ExerciseProgressSchema>;

// Exercise Plans Schema and Types
export const ExercisePlansSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  planner_data_id: z.number().nullable().optional(),
  plan_name: z.string(),
  plan_description: z.string().nullable().optional(),
  weekly_plan: z.any().nullable().optional(),
  total_duration_minutes: z.number().min(0).nullable().optional(),
  difficulty_level: z.string().nullable().optional(),
  generated_by: z.string().nullable().optional(),
  is_active: z.boolean().default(false),
  is_completed: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ExercisePlans = z.infer<typeof ExercisePlansSchema>;

// Coach Schema and Types
export const CoachSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  description: z.string().nullable().optional(),
  certification: z.array(z.string()).nullable().optional(),
  years_experience: z.number().min(0).nullable().optional(),
  joined_date: z.string().optional(),
  status: z
    .enum(['pending_approval', 'approved', 'suspended'])
    .default('pending_approval'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Coach = z.infer<typeof CoachSchema>;

// Coach Clients Schema and Types
export const CoachClientsSchema = z.object({
  id: z.number().optional(),
  coach_id: z.string(),
  client_id: z.string(),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  requested_at: z.string().optional(),
  responded_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type CoachClients = z.infer<typeof CoachClientsSchema>;

// Coach Client Requests Schema and Types
export const CoachClientRequestsSchema = z.object({
  id: z.number().optional(),
  coach_id: z.string(),
  client_email: z.string().email(),
  request_message: z.string().nullable().optional(),
  status: z.enum(['pending', 'accepted', 'declined']).default('pending'),
  requested_at: z.string().optional(),
  responded_at: z.string().nullable().optional(),
  response_message: z.string().nullable().optional(),
  request_type: z.string().nullable().optional(),
  approval_token: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type CoachClientRequests = z.infer<typeof CoachClientRequestsSchema>;

// Legacy type aliases for backward compatibility
export type BaseProfileData = UserProfile;
export type UserPlanType = UserPlan;
export type MealPlans = UserMealPlan;

// Form Schemas for UI components
export const ProfileFormSchema = z.object({
  full_name: z.string().min(1, 'Name is required.').optional(),
  user_role: z
    .enum(['client', 'coach'], {
      required_error: 'User role is required.',
    })
    .nullable()
    .optional(),
  subscription_status: z.string().nullable().optional(),
  age: z.coerce
    .number()
    .int('Age must be a whole number.')
    .min(1, 'Age is required')
    .max(120)
    .nullable()
    .optional(),
  biological_sex: z.enum(['male', 'female', 'other']).nullable().optional(),
  current_weight_kg: z.coerce
    .number()
    .min(20, 'Weight must be at least 20kg')
    .max(500)
    .nullable()
    .optional(),
  height_cm: z.coerce
    .number()
    .min(50, 'Height must be at least 50cm')
    .max(300)
    .nullable()
    .optional(),
  target_weight_1month_kg: z.coerce
    .number()
    .min(20, 'Target weight must be at least 20kg')
    .max(500)
    .nullable()
    .optional(),
  long_term_goal_weight_kg: z.coerce
    .number()
    .min(20, 'Long-term goal weight must be at least 20kg')
    .max(500)
    .nullable()
    .optional(),
  physical_activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'extra_active'])
    .nullable()
    .optional(),
  primary_diet_goal: z
    .enum(['fat_loss', 'muscle_gain', 'recomp'])
    .nullable()
    .optional(),
  // Medical Info & Physical Limitations
  pain_mobility_issues: z.array(z.string()).nullable().optional(),
  injuries: z.array(z.string()).nullable().optional(),
  surgeries: z.array(z.string()).nullable().optional(),
  // Exercise Preferences
  exercise_goals: z.array(z.string()).nullable().optional(),
  preferred_exercise_types: z.array(z.string()).nullable().optional(),
  exercise_frequency: z.string().nullable().optional(),
  typical_exercise_intensity: z.string().nullable().optional(),
  equipment_access: z.array(z.string()).nullable().optional(),
  // Diet and health
  preferred_diet: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  medical_conditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
  // Body composition
  bf_current: z.coerce
    .number()
    .min(0, 'Must be >= 0')
    .max(100, 'Body fat % must be between 0 and 100.')
    .nullable()
    .optional(),
  bf_target: z.coerce
    .number()
    .min(0, 'Must be >= 0')
    .max(100, 'Target body fat % must be between 0 and 100.')
    .nullable()
    .optional(),
  waist_current: z.coerce.number().min(0).nullable().optional(),
  waist_target: z.coerce.number().min(0).nullable().optional(),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

// Smart Calorie Planner Form Schema
export const SmartCaloriePlannerFormSchema = z.object({
  age: z.coerce
    .number()
    .int('Age must be a whole number (e.g., 30, not 30.5).')
    .positive('Age must be a positive number.')
    .nullable(),
  biological_sex: z
    .enum(['male', 'female', 'other'], {
      required_error: 'Biological sex is required.',
    })
    .nullable(),
  height_cm: z.coerce
    .number()
    .positive('Height must be a positive number.')
    .nullable(),
  current_weight_kg: z.coerce
    .number()
    .positive('Current weight must be a positive number.')
    .nullable(),
  target_weight_1month_kg: z.coerce
    .number()
    .positive('Target weight must be a positive number.')
    .nullable(),
  long_term_goal_weight_kg: z.coerce
    .number()
    .positive('Long-term goal weight must be a positive number.')
    .optional()
    .nullable(),
  physical_activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'extra_active'], {
      required_error: 'Activity level is required.',
    })
    .nullable(),
  primary_diet_goal: z
    .enum(['fat_loss', 'muscle_gain', 'recomp'], {
      required_error: 'Diet goal is required.',
    })
    .nullable(),
  bf_current: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Body fat % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  bf_target: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Target body fat % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  bf_ideal: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Ideal body fat % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  mm_current: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Muscle mass % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  mm_target: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Target muscle mass % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  mm_ideal: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Ideal muscle mass % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  bw_current: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Body water % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  bw_target: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Target body water % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  bw_ideal: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Must be >= 0')
        .max(100, 'Ideal body water % must be between 0 and 100.')
        .optional()
    )
    .nullable(),
  waist_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  waist_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  waist_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  hips_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  hips_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  hips_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_leg_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_leg_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_leg_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_leg_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_leg_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_leg_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_arm_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_arm_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  right_arm_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_arm_current: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_arm_goal_1m: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
  left_arm_ideal: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().min(0).optional())
    .nullable(),
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
  remaining_calories_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb percentage must be a whole number.')
      .min(0, 'Carb percentage must be between 0 and 100.')
      .max(100, 'Carb percentage must be between 0 and 100.')
      .default(50)
      .optional()
  ),
});

export type SmartCaloriePlannerFormValues = z.infer<
  typeof SmartCaloriePlannerFormSchema
>;

// Meal Suggestion Preferences Schema
export const MealSuggestionPreferencesSchema = z.object({
  preferred_diet: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  medical_conditions: z.array(z.string()).nullable().optional(),
  medications: z.array(z.string()).nullable().optional(),
});

export type MealSuggestionPreferencesValues = z.infer<
  typeof MealSuggestionPreferencesSchema
>;

// Macro Results Interface
export interface MacroResults {
  Protein_g: number;
  Carbs_g: number;
  Fat_g: number;
  Protein_cals: number;
  Carb_cals: number;
  Fat_cals: number;
  Total_cals: number;
  Protein_pct: number;
  Carb_pct: number;
  Fat_pct: number;
}

// Global Calculated Targets Interface
export interface GlobalCalculatedTargets {
  bmr_kcal?: number | null;
  maintenance_calories_tdee?: number | null;
  target_daily_calories?: number | null;
  target_protein_g?: number | null;
  target_carbs_g?: number | null;
  target_fat_g?: number | null;
  custom_total_calories?: number | null;
  custom_protein_per_kg?: number | null;
  custom_protein_g?: number | null;
  custom_carbs_g?: number | null;
  custom_fat_g?: number | null;

  // Additional calculated fields
  estimated_weekly_weight_change_kg?: number | null;
  protein_calories?: number | null;
  carb_calories?: number | null;
  fat_calories?: number | null;
  current_weight_for_custom_calc?: number | null;

  // Percentage fields
  target_protein_percentage?: number | null;
  target_carbs_percentage?: number | null;
  target_fat_percentage?: number | null;
  custom_protein_percentage?: number | null;
  custom_carbs_percentage?: number | null;
  custom_fat_percentage?: number | null;
  custom_total_calories_final?: number | null;
}

// Meal Macro Distribution Schema
export const MealMacroDistributionSchema = z.object({
  mealName: z.string(),
  calories_pct: z.coerce
    .number()
    .min(0, '% must be >= 0')
    .max(100, '% must be <= 100')
    .default(0),
});

export type MealMacroDistribution = z.infer<typeof MealMacroDistributionSchema>;

// Macro Splitter Form Schema
export const MacroSplitterFormSchema = z
  .object({
    meal_distributions: z
      .array(MealMacroDistributionSchema)
      .length(6, `Must have 6 meal entries.`),
  })
  .superRefine((data, ctx) => {
    const checkSum = (
      macroKey: keyof Omit<MealMacroDistribution, 'mealName'>,
      macroName: string
    ) => {
      const sum = data.meal_distributions.reduce(
        (acc, meal) => acc + (Number(meal[macroKey]) || 0),
        0
      );
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total ${macroName} percentages must sum to 100%. Current sum: ${sum.toFixed(
            0
          )}%`,
          path: ['mealDistributions'],
        });
      }
    };
    checkSum('calories_pct', 'Calorie');
  });

export type MacroSplitterFormValues = z.infer<typeof MacroSplitterFormSchema>;

// Onboarding Form Schema
export const OnboardingFormSchema = z.object({
  user_role: z.enum(['client', 'coach'], {
    required_error: 'User role is required.',
  }),
  age: z.coerce
    .number()
    .int('Age must be a whole number.')
    .min(1, 'Age is required')
    .max(120),
  biological_sex: z.enum(['male', 'female', 'other'], {
    required_error: 'Biological sex is required.',
  }),
  height_cm: z.coerce.number().min(50, 'Height must be at least 50cm').max(300),
  current_weight_kg: z.coerce
    .number()
    .min(20, 'Weight must be at least 20kg')
    .max(500),
  target_weight_1month_kg: z.coerce
    .number()
    .min(20, 'Target weight must be at least 20kg')
    .max(500),
  long_term_goal_weight_kg: z.coerce
    .number()
    .min(20, 'Long-term goal weight must be at least 20kg')
    .max(500)
    .optional()
    .nullable(),
  physical_activity_level: z.enum(
    ['sedentary', 'light', 'moderate', 'active', 'extra_active'],
    { required_error: 'Activity level is required.' }
  ),
  primary_diet_goal: z.enum(['fat_loss', 'muscle_gain', 'recomp'], {
    required_error: 'Diet goal is required.',
  }),
  bf_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bf_target: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  waist_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  waist_target: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  preferred_diet: z.string().optional(),
  allergies: z.string().or(z.array(z.string())).optional(),
  medical_conditions: z.string().or(z.array(z.string())).optional(),
  medications: z.string().or(z.array(z.string())).optional(),
  custom_total_calories: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
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
  custom_protein_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .min(0, 'Protein must be non-negative if provided.')
      .optional()
  ),
  custom_carbs_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .min(0, 'Carbs must be non-negative if provided.')
      .optional()
  ),
  custom_fat_g: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0, 'Fat must be non-negative if provided.').optional()
  ),
  remaining_calories_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb percentage must be a whole number.')
      .min(0, 'Carb percentage must be between 0 and 100.')
      .max(100, 'Carb percentage must be between 0 and 100.')
      .default(50)
      .optional()
  ),
  systemCalculatedTargets: z.any().optional(),
  userCustomizedTargets: z.any().optional(),
  mealDistributions: z.array(MealMacroDistributionSchema).optional(),
  typicalMealsDescription: z.string().optional(),
});

export type OnboardingFormValues = z.infer<typeof OnboardingFormSchema>;

// AI Meal Generation Schemas
export const IngredientDetailSchema = z.object({
  name: z.string(),
  amount: z.string(),
  unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  macrosString: z.string(),
});

export type IngredientDetail = z.infer<typeof IngredientDetailSchema>;

export const MealSuggestionSchema = z.object({
  mealTitle: z.string(),
  description: z.string(),
  ingredients: z.array(IngredientDetailSchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  instructions: z.string().optional(),
});

export type MealSuggestion = z.infer<typeof MealSuggestionSchema>;

export const SuggestMealsForMacrosOutputSchema = z.object({
  suggestions: z.array(MealSuggestionSchema),
});

export type SuggestMealsForMacrosOutput = z.infer<
  typeof SuggestMealsForMacrosOutputSchema
>;

export const SuggestMealsForMacrosInputSchema = z.object({
  meal_name: z.string(),
  target_calories: z.number(),
  target_protein_grams: z.number(),
  target_carbs_grams: z.number(),
  target_fat_grams: z.number(),
  age: z.number().optional(),
  gender: z.string().optional(),
  activity_level: z.string().optional(),
  diet_goal: z.string().optional(),
  preferred_diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

export type SuggestMealsForMacrosInput = z.infer<
  typeof SuggestMealsForMacrosInputSchema
>;

// AI Service Schemas
export const AIServiceIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export type AIServiceIngredient = z.infer<typeof AIServiceIngredientSchema>;

export const AIServiceMealSchema = z.object({
  name: z.string(),
  custom_name: z.string(),
  ingredients: z.array(AIServiceIngredientSchema),
  total_calories: z.number(),
  total_protein: z.number(),
  total_carbs: z.number(),
  total_fat: z.number(),
});

export type AIServiceMeal = z.infer<typeof AIServiceMealSchema>;

export const AdjustMealIngredientsInputSchema = z.object({
  originalMeal: AIServiceMealSchema,
  targetMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  userProfile: z.object({
    age: z.number().optional(),
    biological_sex: z.string().optional(),
    physical_activity_level: z.string().optional(),
    primary_diet_goal: z.string().optional(),
    preferred_diet: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    medical_conditions: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
  }),
});

export type AdjustMealIngredientsInput = z.infer<
  typeof AdjustMealIngredientsInputSchema
>;

export const AdjustMealIngredientsOutputSchema = z.object({
  adjustedMeal: AIServiceMealSchema,
  explanation: z.string(),
});

export type AdjustMealIngredientsOutput = z.infer<
  typeof AdjustMealIngredientsOutputSchema
>;

// AI Generated Meal Plan Schemas
export const AIGeneratedIngredientSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});

export type AIGeneratedIngredient = z.infer<typeof AIGeneratedIngredientSchema>;

export const AIGeneratedMealSchema = z.object({
  meal_name: z.string(),
  custom_name: z.string().optional(),
  ingredients: z.array(AIGeneratedIngredientSchema),
  total_calories: z.number().optional(),
  total_protein: z.number().optional(),
  total_carbs: z.number().optional(),
  total_fat: z.number().optional(),
});

export type AIGeneratedMeal = z.infer<typeof AIGeneratedMealSchema>;

export const DayPlanSchema = z.object({
  day_of_week: z.string(),
  meals: z.array(AIGeneratedMealSchema),
});

export type DayPlan = z.infer<typeof DayPlanSchema>;

export const GeneratePersonalizedMealPlanInputSchema = z.object({
  age: z.number().optional(),
  biological_sex: z.string().optional(),
  height_cm: z.number().optional(),
  current_weight_kg: z.number().optional(),
  target_weight_kg: z.number().optional(),
  physical_activity_level: z.string().optional(),
  primary_diet_goal: z.string().optional(),
  bf_current: z.number().optional(),
  bf_target: z.number().optional(),
  waist_current: z.number().optional(),
  waist_target: z.number().optional(),
  pain_mobility_issues: z.array(z.string()).optional(),
  exercise_goals: z.array(z.string()).optional(),
  preferred_exercise_types: z.array(z.string()).optional(),
  exercise_frequency: z.string().optional(),
  equipment_access: z.array(z.string()).optional(),
  preferred_diet: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medical_conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  meal_data: WeeklyMealPlanSchema,
});

export type GeneratePersonalizedMealPlanInput = z.infer<
  typeof GeneratePersonalizedMealPlanInputSchema
>;

export const GeneratePersonalizedMealPlanOutputSchema = z.object({
  days: z.array(DayPlanSchema),
  weekly_summary: z
    .object({
      total_calories: z.number(),
      total_protein: z.number(),
      total_carbs: z.number(),
      total_fat: z.number(),
    })
    .optional(),
});

export type GeneratePersonalizedMealPlanOutput = z.infer<
  typeof GeneratePersonalizedMealPlanOutputSchema
>;

// Support Chatbot Schemas
export const SupportChatbotInputSchema = z.object({
  userQuery: z.string(),
});

export type SupportChatbotInput = z.infer<typeof SupportChatbotInputSchema>;

export const SupportChatbotOutputSchema = z.object({
  botResponse: z.string(),
});

export type SupportChatbotOutput = z.infer<typeof SupportChatbotOutputSchema>;

// Ingredient Swap Schemas
export const SuggestIngredientSwapInputSchema = z.object({
  mealName: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      caloriesPer100g: z.number(),
      proteinPer100g: z.number(),
      fatPer100g: z.number(),
    })
  ),
  dietaryPreferences: z.string(),
  dislikedIngredients: z.array(z.string()),
  allergies: z.array(z.string()),
  nutrientTargets: z.object({
    calories: z.number(),
    protein: z.number(),
    carbohydrates: z.number(),
    fat: z.number(),
  }),
});

export type SuggestIngredientSwapInput = z.infer<
  typeof SuggestIngredientSwapInputSchema
>;

export const SuggestIngredientSwapOutputSchema = z.array(
  z.object({
    ingredientName: z.string(),
    reason: z.string(),
  })
);

export type SuggestIngredientSwapOutput = z.infer<
  typeof SuggestIngredientSwapOutputSchema
>;

// Full User Profile Type combining all user data
export type FullUserProfileType = UserProfile & UserPlan & UserMealPlan;
