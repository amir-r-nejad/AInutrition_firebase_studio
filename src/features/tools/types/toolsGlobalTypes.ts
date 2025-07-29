import { BaseProfileData } from '@/lib/schemas';
import { z } from 'zod';
import { customizePlanFormSchema } from '../lib/schema';

export type MealInputTypes = {
  preferredDiet?: string | undefined;
  allergies?: string[] | undefined;
  medicalConditions?: string[] | undefined;
  medications?: string[] | undefined;
};

export type TotalMacros = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  source?: string;
};

export type CalculatedMealMacros = {
  mealName: string;
  Calories: number;
  'Protein (g)': number;
  'Carbs (g)': number;
  'Fat (g)': number;
};

export type AiMealInputTypes = {
  targetMacros: {
    mealName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  profile: Partial<BaseProfileData>;
};

export type CustomizePlanFormValues = z.infer<typeof customizePlanFormSchema>;
