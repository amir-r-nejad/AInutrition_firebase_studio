import { z } from 'zod';
import { genders, activityLevels, smartPlannerDietGoals, preferredDiets } from './constants';

// Helper function for preprocessing optional numbers
export const preprocessOptionalNumber = (val: any) => {
  if (val === '' || val === null || val === undefined) return null;
  return val;
};

// User Profile Schema
export const BaseProfileSchema = z.object({
  user_id: z.string(),
  full_name: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  height_cm: z.number().nullable(),
  current_weight: z.number().nullable(),
  target_weight: z.number().nullable(),
  body_fat_percentage: z.number().nullable(),
  target_body_fat: z.number().nullable(),
  activity_level: z.enum(['Sedentary', 'Moderate', 'Active', 'Very Active']).nullable(),
  dietary_preferences: z.string().nullable(),
  allergies: z.string().nullable(),
  medical_conditions: z.string().nullable(),
  // New fitness-related fields
  fitness_history: z.string().nullable(),
  injuries_limitations: z.string().nullable(),
  fitness_goals: z.string().nullable(),
  preferred_workout_type: z.enum(['Cardio', 'Strength', 'Mixed', 'Flexibility']).nullable(),
  workout_experience: z.enum(['Beginner', 'Intermediate', 'Advanced']).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type BaseProfileData = z.infer<typeof BaseProfileSchema>;

// Profile Form Schema for editing
export const ProfileFormSchema = z.object({
  full_name: z.string().nullable(),
  age: z.number().nullable(),
  gender: z.enum(['Male', 'Female', 'Other']).nullable(),
  height_cm: z.number().nullable(),
  current_weight: z.number().nullable(),
  target_weight: z.number().nullable(),
  body_fat_percentage: z.number().nullable(),
  target_body_fat: z.number().nullable(),
  activity_level: z.enum(['Sedentary', 'Moderate', 'Active', 'Very Active']).nullable(),
  dietary_preferences: z.string().nullable(),
  allergies: z.string().nullable(),
  medical_conditions: z.string().nullable(),
  fitness_history: z.string().nullable(),
  injuries_limitations: z.string().nullable(),
  fitness_goals: z.string().nullable(),
  preferred_workout_type: z.enum(['Cardio', 'Strength', 'Mixed', 'Flexibility']).nullable(),
  workout_experience: z.enum(['Beginner', 'Intermediate', 'Advanced']).nullable(),
});
export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

// User Plan Schema
export const UserPlanSchema = z.object({
  user_id: z.string(),
  daily_calories: z.number().nullable(),
  protein_grams: z.number().nullable(),
  carbs_grams: z.number().nullable(),
  fat_grams: z.number().nullable(),
  bmr: z.number().nullable(),
  tdee: z.number().nullable(),
  goal_type: z.enum(['weight_loss', 'weight_gain', 'maintenance']).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type UserPlanType = z.infer<typeof UserPlanSchema>;

// Global Calculated Targets Type
export interface GlobalCalculatedTargets {
  bmr_kcal?: number | null;
  maintenance_calories_tdee?: number | null;
  target_daily_calories?: number | null;
  target_protein_g?: number | null;
  protein_calories?: number | null;
  target_protein_percentage?: number | null;
  target_carbs_g?: number | null;
  carb_calories?: number | null;
  target_carbs_percentage?: number | null;
  target_fat_g?: number | null;
  fat_calories?: number | null;
  target_fat_percentage?: number | null;
  current_weight_for_custom_calc?: number | null;
  estimated_weekly_weight_change_kg?: number | null;
  custom_total_calories_final?: number | null;
  custom_protein_g?: number | null;
  custom_protein_percentage?: number | null;
  custom_carbs_g?: number | null;
  custom_carbs_percentage?: number | null;
  custom_fat_g?: number | null;
  custom_fat_percentage?: number | null;
  custom_total_calories?: number | null;
  custom_protein_per_kg?: number | null;
  remaining_calories_carbs_percentage?: number | null;
  proteinCalories?: number | null;
  carbCalories?: number | null;
  fatCalories?: number | null;
}

// Base fields for onboarding/profile data used by tools
export interface ExtendedProfileData {
  name: string;
  user_role: 'client' | 'coach';
  age?: number;
  biological_sex?: string;
  height_cm?: number;
  current_weight_kg?: number;
  target_weight_1month_kg?: number;
  long_term_goal_weight_kg?: number;
  physical_activity_level?: string;
  primary_diet_goal?: string;

  // Body Composition
  bf_current?: number;
  bf_target?: number;
  bf_ideal?: number;
  mm_current?: number;
  mm_target?: number;
  mm_ideal?: number;
  bw_current?: number;
  bw_target?: number;
  bw_ideal?: number;

  // Measurements
  waist_current?: number;
  waist_goal_1m?: number;
  waist_ideal?: number;
  hips_current?: number;
  hips_goal_1m?: number;
  hips_ideal?: number;
  right_leg_current?: number;
  right_leg_goal_1m?: number;
  right_leg_ideal?: number;
  left_leg_current?: number;
  left_leg_goal_1m?: number;
  left_leg_ideal?: number;
  right_arm_current?: number;
  right_arm_goal_1m?: number;
  right_arm_ideal?: number;
  left_arm_current?: number;
  left_arm_goal_1m?: number;
  left_arm_ideal?: number;

  is_onboarding_complete?: boolean;
  subscription_status?: string;

  // Exercise related
  pain_mobility_issues?: string[];
  injuries?: string[];
  surgeries?: string[];
  exercise_goals?: string[];
  preferred_exercise_types?: string[];
  exercise_frequency?: string;
  typical_exercise_intensity?: string;
  equipment_access?: string[];

  // Diet preferences
  preferred_diet?: string;
  allergies?: string[];
  preferred_cuisines?: string[];
  dispreferrred_cuisines?: string[];
  preferred_ingredients?: string[];
  dispreferrred_ingredients?: string[];
  preferred_micronutrients?: string[];
  medical_conditions?: string[];
  medications?: string[];

  meal_distributions?: MealMacroDistribution[] | null;
}

export const MealMacroDistributionSchema = z.object({
  mealName: z.string(),
  calories_pct: z.coerce
    .number()
    .min(0, '% must be >= 0')
    .max(100, '% must be <= 100')
    .default(0),
});
export type MealMacroDistribution = z.infer<typeof MealMacroDistributionSchema>;

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

export const SmartCaloriePlannerFormSchema = z.object({
  user_role: z
    .enum(['client', 'coach'], {
      required_error: 'User role is required.',
    })
    .nullable(),
  age: z.coerce
    .number()
    .int('Age must be a whole number (e.g., 30, not 30.5).')
    .positive('Age must be a positive number.')
    .nullable(),
  biological_sex: z
    .enum(genders.map((g) => g.value) as [string, ...string[]], {
      required_error: 'Gender is required.',
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
    .positive('1-Month Goal Weight must be a positive number.')
    .nullable(),
  long_term_goal_weight_kg: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .positive('Long-term Goal Weight must be positive if provided.')
        .optional()
    )
    .nullable(),
  physical_activity_level: z
    .enum(activityLevels.map((al) => al.value) as [string, ...string[]], {
      required_error: 'Activity level is required.',
    })
    .nullable(),
  primary_diet_goal: z
    .enum(smartPlannerDietGoals.map((g) => g.value) as [string, ...string[]], {
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
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  mm_current: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  mm_target: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  mm_ideal: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  bw_current: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  bw_target: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
    )
    .nullable(),
  bw_ideal: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce.number().min(0).max(100).optional()
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

  custom_total_calories: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .int('Custom calories must be a whole number if provided.')
        .positive('Custom calories must be positive if provided.')
        .optional()
    )
    .nullable(),
  custom_protein_per_kg: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .min(0, 'Protein per kg must be non-negative if provided.')
        .optional()
    )
    .nullable(), // Protein per kg can be decimal
  remaining_calories_carb_pct: z
    .preprocess(
      preprocessOptionalNumber,
      z.coerce
        .number()
        .int('Carb percentage must be a whole number.')
        .min(0, 'Carb percentage must be between 0 and 100.')
        .max(100, 'Carb percentage must be between 0 and 100.')
        .optional()
        .default(50)
    )
    .nullable(),

  carbCalories: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  carbGrams: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  carbTargetPct: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),

  fatCalories: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  fatGrams: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  fatTargetPct: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),

  proteinCalories: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  proteinGrams: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
  proteinTargetPct: z
    .preprocess(preprocessOptionalNumber, z.coerce.number().int().optional())
    .nullable(),
});
export type SmartCaloriePlannerFormValues = z.infer<
  typeof SmartCaloriePlannerFormSchema
>;

export const MealSuggestionPreferencesSchema = z.object({
  preferred_diet: z
    .enum(preferredDiets.map((pd) => pd.value) as [string, ...string[]])
    .nullable(),
  preferred_cuisines: z.array(z.string()).nullable(),
  dispreferrred_cuisines: z.array(z.string()).nullable(),
  preferred_ingredients: z.array(z.string()).nullable(),
  dispreferrred_ingredients: z.array(z.string()).nullable(),
  allergies: z.array(z.string()).nullable(),
  preferred_micronutrients: z.array(z.string()).nullable(),
  medical_conditions: z.array(z.string()).nullable(),
  medications: z.array(z.string()).nullable(),
});
export type MealSuggestionPreferencesValues = z.infer<
  typeof MealSuggestionPreferencesSchema
>;

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

const CalculatedTargetsSchema = z.object({
  bmr: z.number().optional(),
  tdee: z.number().optional(),
  targetCalories: z.number().optional(),
  targetProtein: z.number().optional(),
  targetCarbs: z.number().optional(),
  targetFat: z.number().optional(),
  current_weight_for_calc: z.number().optional(),
});

const CustomCalculatedTargetsSchema = z.object({
  totalCalories: z.number().optional(),
  proteinGrams: z.number().optional(),
  proteinCalories: z.number().optional(),
  proteinPct: z.number().optional(),
  carbGrams: z.number().optional(),
  carbCalories: z.number().optional(),
  carbPct: z.number().optional(),
  fatGrams: z.number().optional(),
  fatCalories: z.number().optional(),
  fatPct: z.number().optional(),
});
type CustomCalculatedTargets = z.infer<typeof CustomCalculatedTargetsSchema>;

// Onboarding Schema
export const OnboardingFormSchema = z.object({
  user_role: z.enum(['client', 'coach'], {
    required_error: 'User role is required.',
  }),
  age: z.coerce
    .number()
    .int('Age must be a whole number.')
    .min(1, 'Age is required')
    .max(120),
  biological_sex: z.enum(genders.map((g) => g.value) as [string, ...string[]], {
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
  long_term_goal_weight_kg: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  physical_activity_level: z.enum(
    activityLevels.map((al) => al.value) as [string, ...string[]],
    { required_error: 'Activity level is required.' }
  ),
  primary_diet_goal: z.enum(
    smartPlannerDietGoals.map((g) => g.value) as [string, ...string[]],
    { required_error: 'Diet goal is required.' }
  ),

  bf_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bf_target: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bf_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  mm_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  mm_target: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  mm_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bw_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bw_target: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),
  bw_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).max(100).optional()
  ),

  waist_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  waist_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  waist_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  hips_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  hips_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  hips_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_leg_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_leg_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_leg_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_leg_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_leg_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_leg_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_arm_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_arm_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  right_arm_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_arm_current: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_arm_goal_1m: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),
  left_arm_ideal: z.preprocess(
    preprocessOptionalNumber,
    z.coerce.number().min(0).optional()
  ),

  preferred_diet: z.string().optional(),
  allergies: z.string().or(z.array(z.string())).optional(),
  preferred_cuisines: z.string().or(z.array(z.string())).optional(),
  dispreferrred_cuisines: z.string().or(z.array(z.string())).optional(),
  preferred_ingredients: z.string().or(z.array(z.string())).optional(),
  dispreferrred_ingredients: z.string().or(z.array(z.string())).optional(),
  mealsPerDay: z.coerce.number().min(2).max(7).default(3),
  preferred_micronutrients: z.string().or(z.array(z.string())).optional(),

  medical_conditions: z.string().or(z.array(z.string())).optional(),
  medications: z.string().or(z.array(z.string())).optional(),

  systemCalculatedTargets: CalculatedTargetsSchema,
  userCustomizedTargets: CustomCalculatedTargetsSchema,

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
  remaining_calories_carbs_percentage: z.preprocess(
    preprocessOptionalNumber,
    z.coerce
      .number()
      .int('Carb % must be a whole number.')
      .min(0)
      .max(100)
      .optional()
      .default(50)
  ),

  mealDistributions: z.array(MealMacroDistributionSchema).optional(),

  typicalMealsDescription: z.string().optional(),
});

export type OnboardingFormValues = z.infer<typeof OnboardingFormSchema>;
export type { CustomCalculatedTargets };

// Coach-Client Relationship Types
export interface CoachClientRelationship {
  id: number;
  coach_id: string;
  client_id: string;
  status: 'pending' | 'accepted' | 'declined';
  status_message?: string | null;
  requested_at: string;
  responded_at?: string | null;
  created_at: string;
}

export interface CoachClientRequest {
  id: number;
  coach_id: string;
  client_email: string;
  request_message?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  approval_token?: string | null;
  requested_at: string;
  responded_at?: string | null;
  response_message?: string | null;
  created_at: string;
}

export interface CoachProfile {
  id: number;
  user_id: string;
  description?: string | null;
  certification: string[];
  years_experience: number;
  total_clients: number;
  joined_date: string;
  status: 'pending_approval' | 'approved' | 'suspended';
  created_at: string;
  updated_at: string;
}

// Workout Plan Schema (new)
export const WorkoutPlanSchema = z.object({
  user_id: z.string(),
  current_fitness_level: z.enum(['Beginner', 'Intermediate', 'Advanced']).nullable(),
  target_fitness_level: z.enum(['Beginner', 'Intermediate', 'Advanced']).nullable(),
  daily_activity_minutes: z.number().nullable(),
  daily_activity_goal: z.number().nullable(),
  workout_days_per_week: z.number().nullable(),
  workout_days_goal: z.number().nullable(),
  strength_level: z.number().nullable(),
  strength_target: z.number().nullable(),
  endurance_level: z.number().nullable(),
  endurance_target: z.number().nullable(),
  fitness_goal_progress: z.number().nullable(),
  weekly_cardio_target: z.number().nullable(),
  weekly_strength_target: z.number().nullable(),
  weekly_flexibility_target: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type WorkoutPlanType = z.infer<typeof WorkoutPlanSchema>;

// Meal Schema (move this up before WeeklyMealPlanSchema and MealPlansSchema)
export const MealSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string(),
  ingredients: z.array(z.string()),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type MealType = z.infer<typeof MealSchema>;

// Weekly Meal Plan Schema
export const WeeklyMealPlanSchema = z.object({
  monday: z.array(MealSchema),
  tuesday: z.array(MealSchema),
  wednesday: z.array(MealSchema),
  thursday: z.array(MealSchema),
  friday: z.array(MealSchema),
  saturday: z.array(MealSchema),
  sunday: z.array(MealSchema),
});
export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;

// Meal Plans Schema
export const MealPlansSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  plan_name: z.string(),
  weekly_plan: WeeklyMealPlanSchema,
  total_calories: z.number(),
  total_protein: z.number(),
  total_carbs: z.number(),
  total_fat: z.number(),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type MealPlans = z.infer<typeof MealPlansSchema>;

// Exercise Schema (new)
export const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['cardio', 'strength', 'flexibility']),
  muscle_groups: z.array(z.string()),
  equipment_needed: z.array(z.string()),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.string(),
  duration_minutes: z.number().nullable(),
  sets: z.number().nullable(),
  reps: z.number().nullable(),
  calories_burned_per_minute: z.number().nullable(),
});

export type ExerciseType = z.infer<typeof ExerciseSchema>;

// Daily Workout Schema (new)
export const DailyWorkoutSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  exercises: z.array(z.object({
    exercise_id: z.string(),
    sets: z.number(),
    reps: z.number().nullable(),
    duration_minutes: z.number().nullable(),
    weight_kg: z.number().nullable(),
    rest_seconds: z.number().nullable(),
  })),
  total_duration_minutes: z.number(),
  estimated_calories_burned: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type DailyWorkoutType = z.infer<typeof DailyWorkoutSchema>;

// Weekly Workout Plan Schema (new)
export const WeeklyWorkoutPlanSchema = z.object({
  monday: z.array(DailyWorkoutSchema).optional(),
  tuesday: z.array(DailyWorkoutSchema).optional(),
  wednesday: z.array(DailyWorkoutSchema).optional(),
  thursday: z.array(DailyWorkoutSchema).optional(),
  friday: z.array(DailyWorkoutSchema).optional(),
  saturday: z.array(DailyWorkoutSchema).optional(),
  sunday: z.array(DailyWorkoutSchema).optional(),
});

export type WeeklyWorkoutPlan = z.infer<typeof WeeklyWorkoutPlanSchema>;

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Nutrition Calculator Types
export type NutritionGoal = 'weight_loss' | 'weight_gain' | 'maintenance';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female';

export interface NutritionCalculatorInput {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
}

export interface NutritionCalculatorResult {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Meal Suggestion Types
export interface MealSuggestionInput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryPreferences?: string[];
  allergies?: string[];
}

export interface MealSuggestion {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number;
  servings: number;
}

// SuggestMealsForMacros Schemas
export const SuggestMealsForMacrosInputSchema = z.object({
  protein: z.number().min(0, 'Protein must be non-negative'),
  carbs: z.number().min(0, 'Carbs must be non-negative'),
  fat: z.number().min(0, 'Fat must be non-negative'),
  calories: z.number().min(0, 'Calories must be non-negative'),
  preferences: z.string().optional(),
});

export const SuggestMealsForMacrosOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
      calories: z.number(),
      description: z.string().optional(),
    })
  ),
});

// AdjustMealIngredients Schemas
export const AdjustMealIngredientsInputSchema = z.object({
  userProfile: z.object({
    age: z.number().nullable(),
    primary_diet_goal: z.string().nullable(),
    preferred_diet: z.string().nullable().optional(),
    allergies: z.array(z.string()).nullable().optional(),
    dispreferrred_ingredients: z.array(z.string()).nullable().optional(),
    preferred_ingredients: z.array(z.string()).nullable().optional(),
  }),
  originalMeal: z.object({
    name: z.string(),
    custom_name: z.string().optional(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
      })
    ),
  }),
  targetMacros: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

export const AdjustMealIngredientsOutputSchema = z.object({
  adjustedMeal: z.object({
    name: z.string(),
    custom_name: z.string().optional(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      })
    ),
    total_calories: z.number(),
    total_protein: z.number(),
    total_carbs: z.number(),
    total_fat: z.number(),
  }),
  explanation: z.string(),
});

export type AdjustMealIngredientsInput = z.infer<typeof AdjustMealIngredientsInputSchema>;
export type AdjustMealIngredientsOutput = z.infer<typeof AdjustMealIngredientsOutputSchema>;

// GeneratePersonalizedMealPlan Schemas
export const GeneratePersonalizedMealPlanInputSchema = z.object({
  age: z.number().nullable(),
  biological_sex: z.string().nullable(),
  height_cm: z.number().nullable(),
  current_weight_kg: z.number().nullable(),
  primary_diet_goal: z.string().nullable(),
  physical_activity_level: z.string().nullable(),
  preferred_diet: z.string().nullable().optional(),
  allergies: z.array(z.string()).nullable().optional(),
  preferred_cuisines: z.array(z.string()).nullable().optional(),
  dispreferrred_cuisines: z.array(z.string()).nullable().optional(),
  preferred_ingredients: z.array(z.string()).nullable().optional(),
  dispreferrred_ingredients: z.array(z.string()).nullable().optional(),
  medical_conditions: z.array(z.string()).nullable().optional(),
  preferred_micronutrients: z.array(z.string()).nullable().optional(),
  meal_data: z.union([
    z.object({
      target_daily_calories: z.number().nullable(),
      target_protein_g: z.number().nullable(),
      target_carbs_g: z.number().nullable(),
      target_fat_g: z.number().nullable(),
    }),
    z.object({
      days: z.array(
        z.object({
          day_of_week: z.string(),
          meals: z.array(
            z.object({
              name: z.string(),
              custom_name: z.string().optional(),
              ingredients: z.array(z.any()),
              total_fat: z.number().nullable(),
              total_carbs: z.number().nullable(),
              total_protein: z.number().nullable(),
              total_calories: z.number().nullable(),
            })
          ),
        })
      ),
    })
  ]).nullable(),
});

export const GeneratePersonalizedMealPlanOutputSchema = z.object({
  week: z.array(
    z.object({
      day: z.string(),
      meals: z.array(
        z.object({
          meal_type: z.string(),
          name: z.string(),
          ingredients: z.array(
            z.object({
              name: z.string(),
              quantity: z.number(),
              unit: z.string(),
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            })
          ),
          total_calories: z.number(),
          total_protein: z.number(),
          total_carbs: z.number(),
          total_fat: z.number(),
        })
      ),
      daily_totals: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }),
    })
  ),
  weekly_summary: z.object({
    total_calories: z.number(),
    total_protein: z.number(),
    total_carbs: z.number(),
    total_fat: z.number(),
  }),
});

export type GeneratePersonalizedMealPlanInput = z.infer<typeof GeneratePersonalizedMealPlanInputSchema>;
export type GeneratePersonalizedMealPlanOutput = z.infer<typeof GeneratePersonalizedMealPlanOutputSchema>;

// SuggestIngredientSwap Schemas
export const SuggestIngredientSwapInputSchema = z.object({
  mealName: z.string(),
  ingredients: z.array(z.string()).optional(),
  dietaryPreferences: z.string().optional(),
  dislikedIngredients: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  nutrientTargets: z.object({
    calories: z.number(),
    protein: z.number(),
    carbohydrates: z.number(),
    fat: z.number(),
  }),
});

export const SuggestIngredientSwapOutputSchema = z.array(
  z.object({
    ingredientName: z.string(),
    reason: z.string(),
  })
);

export type SuggestIngredientSwapInput = z.infer<typeof SuggestIngredientSwapInputSchema>;
export type SuggestIngredientSwapOutput = z.infer<typeof SuggestIngredientSwapOutputSchema>;

// Support Chatbot Schemas
export const SupportChatbotInputSchema = z.object({
  userQuery: z.string().min(1, 'User query is required'),
});

export const SupportChatbotOutputSchema = z.object({
  botResponse: z.string().min(1, 'Bot response is required'),
});

export type SupportChatbotInput = z.infer<typeof SupportChatbotInputSchema>;
export type SupportChatbotOutput = z.infer<typeof SupportChatbotOutputSchema>;