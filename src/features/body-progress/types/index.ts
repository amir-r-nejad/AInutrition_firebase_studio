export interface BodyProgressEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  bf_percentage: number;
  waist_cm: number;
  notes?: string;
  updated_at: string;
  created_at: string;
}

export type MockUserProgress = BodyProgressEntry[];

export interface MonthOption {
  value: string;
  label: string;
  year: number;
  month: number;
}
