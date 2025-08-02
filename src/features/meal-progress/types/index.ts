import { MealNameType } from '@/lib/schemas';

export interface MealProgressEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealNameType;
  followed_plan: boolean;
  consumed_calories: number;
  consumed_protein: number;
  consumed_carbs: number;
  consumed_fat: number;
  custom_ingredients?: Array<{
    name: string | null;
    quantity: number | null;
    unit: string | null;
  }>;
  note?: string;
  updated_at?: string;
  created_at?: string;
}

export interface MonthOption {
  value: string;
  label: string;
  year: number;
  month: number;
}

export interface DayStatus {
  date: string;
  status: 'success' | 'failure' | 'undereaten' | 'no-data';
  consumed_calories: number;
  target_calories: number;
}

export interface ChartData {
  meal_type: string;
  consumed_calories: number;
  target_calories: number;
}
