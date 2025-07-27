import { z } from 'zod';
// TODO: Import or define genders, allActivityLevels, smartPlannerDietGoals, preferredDiets as needed

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

// Onboarding Schemas
export const OnboardingFormSchema = z.object({
  age: z.number().int().positive().nullable(),
  biological_sex: z.enum(['male', 'female']).nullable(),
  height_cm: z.number().positive().nullable(),
  current_weight_kg: z.number().positive().nullable(),
  target_weight_1month_kg: z.number().positive().nullable(),
  long_term_goal_weight_kg: z.number().positive().nullable(),
  physical_activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).nullable(),
  primary_diet_goal: z.enum(['fat_loss', 'muscle_gain', 'maintenance']).nullable(),
  custom_total_calories: z.number().int().positive().nullable(),
  custom_protein_per_kg: z.number().min(0).nullable(),
  remaining_calories_carbs_percentage: z.number().int().min(0).max(100).default(50).nullable(),
  allergies: z.union([z.string(), z.array(z.string())]).optional(),
  preferred_cuisines: z.union([z.string(), z.array(z.string())]).optional(),
  dispreferrred_cuisines: z.union([z.string(), z.array(z.string())]).optional(),
  preferred_ingredients: z.union([z.string(), z.array(z.string())]).optional(),
  dispreferrred_ingredients: z.union([z.string(), z.array(z.string())]).optional(),
  preferred_micronutrients: z.union([z.string(), z.array(z.string())]).optional(),
  medical_conditions: z.union([z.string(), z.array(z.string())]).optional(),
  medications: z.union([z.string(), z.array(z.string())]).optional(),
});

export type OnboardingFormValues = z.infer<typeof OnboardingFormSchema>;

// Global Calculated Targets Type
export interface GlobalCalculatedTargets {
  bmr_kcal?: number;
  maintenance_calories_tdee?: number;
  target_daily_calories?: number;
  target_protein_g?: number;
  protein_calories?: number;
  target_protein_percentage?: number;
  target_carbs_g?: number;
  carb_calories?: number;
  target_carbs_percentage?: number;
  target_fat_g?: number;
  fat_calories?: number;
  target_fat_percentage?: number;
  current_weight_for_custom_calc?: number;
  estimated_weekly_weight_change_kg?: number;
  custom_total_calories_final?: number | null;
  custom_protein_g?: number | null;
  custom_protein_percentage?: number | null;
  custom_carbs_g?: number | null;
  custom_carbs_percentage?: number | null;
  custom_fat_g?: number | null;
  custom_fat_percentage?: number | null;
  custom_total_calories?: number | null;
  custom_protein_per_kg?: number | null;
}

// Helper function for preprocessing optional numbers
export const preprocessOptionalNumber = (val: any) => {
  if (val === '' || val === null || val === undefined) return null;
  return val;
};

export const MealSuggestionPreferencesSchema = z.object({
  dietary_preferences: z.string().optional(),
  allergies: z.string().optional(),
  preferred_cooking_time: z.string().optional(),
  budget_preference: z.string().optional(),
  ingredient_preferences: z.string().optional(),
  cultural_cuisine_preferences: z.string().optional(),
});

export type MealSuggestionPreferencesValues = z.infer<typeof MealSuggestionPreferencesSchema>;

export const MacroSplitterFormSchema = z.object({
  total_calories: z.number().min(1000).max(5000),
  protein_percentage: z.number().min(10).max(50),
  fat_percentage: z.number().min(15).max(45),
  carb_percentage: z.number().min(20).max(70),
  meal_count: z.number().min(1).max(8),
  meal_names: z.array(z.string()).optional(),
});

export type MacroSplitterFormValues = z.infer<typeof MacroSplitterFormSchema>;

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

// SmartCaloriePlanner Schemas
export const SmartCaloriePlannerFormSchema = z.object({
  age: z.number().int().positive().nullable(),
  biological_sex: z.enum(['male', 'female']).nullable(),
  height_cm: z.number().positive().nullable(),
  current_weight_kg: z.number().positive().nullable(),
  target_weight_1month_kg: z.number().positive().nullable(),
  long_term_goal_weight_kg: z.number().positive().nullable(),
  physical_activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).nullable(),
  primary_diet_goal: z.enum(['fat_loss', 'muscle_gain', 'maintenance']).nullable(),
  bf_current: z.number().nullable(),
  bf_target: z.number().nullable(),
  bf_ideal: z.number().nullable(),
  mm_current: z.number().nullable(),
  mm_target: z.number().nullable(),
  mm_ideal: z.number().nullable(),
  bw_current: z.number().nullable(),
  bw_target: z.number().nullable(),
  bw_ideal: z.number().nullable(),
  waist_current: z.number().nullable(),
  waist_goal_1m: z.number().nullable(),
  waist_ideal: z.number().nullable(),
  hips_current: z.number().nullable(),
  hips_goal_1m: z.number().nullable(),
  hips_ideal: z.number().nullable(),
  right_leg_current: z.number().nullable(),
  right_leg_goal_1m: z.number().nullable(),
  right_leg_ideal: z.number().nullable(),
  left_leg_current: z.number().nullable(),
  left_leg_goal_1m: z.number().nullable(),
  left_leg_ideal: z.number().nullable(),
  right_arm_current: z.number().nullable(),
  right_arm_goal_1m: z.number().nullable(),
  right_arm_ideal: z.number().nullable(),
  left_arm_current: z.number().nullable(),
  left_arm_goal_1m: z.number().nullable(),
  left_arm_ideal: z.number().nullable(),
});
export type SmartCaloriePlannerFormValues = z.infer<typeof SmartCaloriePlannerFormSchema>;

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