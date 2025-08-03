
-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_data JSONB,
  ai_plan JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own meal plans
CREATE POLICY "Users can view their own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own meal plans
CREATE POLICY "Users can insert their own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own meal plans
CREATE POLICY "Users can update their own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own meal plans
CREATE POLICY "Users can delete their own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_plans_updated_at 
  BEFORE UPDATE ON meal_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
