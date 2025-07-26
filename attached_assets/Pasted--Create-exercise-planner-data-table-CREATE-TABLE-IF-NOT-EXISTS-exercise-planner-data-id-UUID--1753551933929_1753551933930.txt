
-- Create exercise_planner_data table
CREATE TABLE IF NOT EXISTS exercise_planner_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  fitness_level TEXT CHECK (fitness_level IN ('Beginner', 'Intermediate', 'Advanced')),
  exercise_experience TEXT[],
  exercise_experience_other TEXT,
  
  -- Health & Medical
  existing_medical_conditions TEXT[],
  existing_medical_conditions_other TEXT,
  injuries_or_limitations TEXT,
  current_medications TEXT[],
  current_medications_other TEXT,
  doctor_clearance BOOLEAN DEFAULT FALSE,
  
  -- Goals
  primary_goal TEXT CHECK (primary_goal IN ('Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness')),
  secondary_goal TEXT CHECK (secondary_goal IN ('Lose fat', 'Build muscle', 'Increase endurance', 'Flexibility', 'General fitness')),
  goal_timeline_weeks INTEGER CHECK (goal_timeline_weeks >= 1 AND goal_timeline_weeks <= 52),
  target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg >= 30 AND target_weight_kg <= 300),
  muscle_groups_focus TEXT[],
  
  -- Lifestyle & Schedule
  exercise_days_per_week INTEGER CHECK (exercise_days_per_week >= 1 AND exercise_days_per_week <= 7),
  available_time_per_session INTEGER CHECK (available_time_per_session >= 15 AND available_time_per_session <= 180),
  preferred_time_of_day TEXT CHECK (preferred_time_of_day IN ('Morning', 'Afternoon', 'Evening')),
  exercise_location TEXT CHECK (exercise_location IN ('Home', 'Gym', 'Outdoor')),
  daily_step_count_avg INTEGER CHECK (daily_step_count_avg >= 0 AND daily_step_count_avg <= 30000),
  job_type TEXT CHECK (job_type IN ('Desk job', 'Active job', 'Standing job')),
  
  -- Equipment Access
  available_equipment TEXT[],
  available_equipment_other TEXT,
  machines_access BOOLEAN DEFAULT FALSE,
  space_availability TEXT CHECK (space_availability IN ('Small room', 'Open area', 'Gym space')),
  
  -- Tracking Preferences
  want_to_track_progress BOOLEAN DEFAULT TRUE,
  weekly_checkins_enabled BOOLEAN DEFAULT TRUE,
  
  -- Behavioral & Motivation
  accountability_support BOOLEAN DEFAULT TRUE,
  preferred_difficulty_level TEXT CHECK (preferred_difficulty_level IN ('Low', 'Medium', 'High')),
  sleep_quality TEXT CHECK (sleep_quality IN ('Poor', 'Average', 'Good')),
  
  -- Generated Plans
  generated_plan JSONB,
  gemini_prompt TEXT,
  gemini_response TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_planner_data_user_id ON exercise_planner_data(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_exercise_planner_data_created_at ON exercise_planner_data(created_at);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercise_planner_data_updated_at 
    BEFORE UPDATE ON exercise_planner_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE exercise_planner_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own exercise planner data" ON exercise_planner_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise planner data" ON exercise_planner_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise planner data" ON exercise_planner_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise planner data" ON exercise_planner_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create exercise_plans table for storing generated plans
CREATE TABLE IF NOT EXISTS exercise_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planner_data_id UUID REFERENCES exercise_planner_data(id) ON DELETE CASCADE,
  
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  
  -- Plan Structure
  weekly_plan JSONB NOT NULL, -- Store the complete weekly exercise plan
  total_duration_minutes INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  
  -- AI Generation Info
  generated_by TEXT DEFAULT 'gemini', -- AI model used
  generation_prompt TEXT,
  generation_response TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for exercise_plans
CREATE INDEX IF NOT EXISTS idx_exercise_plans_user_id ON exercise_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_plans_planner_data_id ON exercise_plans(planner_data_id);
CREATE INDEX IF NOT EXISTS idx_exercise_plans_is_active ON exercise_plans(is_active);

-- Create trigger for exercise_plans updated_at
CREATE TRIGGER update_exercise_plans_updated_at 
    BEFORE UPDATE ON exercise_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for exercise_plans
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise_plans
CREATE POLICY "Users can view their own exercise plans" ON exercise_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise plans" ON exercise_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise plans" ON exercise_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise plans" ON exercise_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Create exercise_progress table for tracking user progress
CREATE TABLE IF NOT EXISTS exercise_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_plan_id UUID REFERENCES exercise_plans(id) ON DELETE CASCADE,
  
  -- Progress Data
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  exercises_completed JSONB, -- Array of completed exercises with reps, sets, weights
  total_duration_minutes INTEGER,
  calories_burned INTEGER,
  
  -- User Notes
  notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for exercise_progress
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_plan_id ON exercise_progress(exercise_plan_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_date ON exercise_progress(date_recorded);

-- Create trigger for exercise_progress updated_at
CREATE TRIGGER update_exercise_progress_updated_at 
    BEFORE UPDATE ON exercise_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for exercise_progress
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise_progress
CREATE POLICY "Users can view their own exercise progress" ON exercise_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise progress" ON exercise_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise progress" ON exercise_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise progress" ON exercise_progress
    FOR DELETE USING (auth.uid() = user_id);
