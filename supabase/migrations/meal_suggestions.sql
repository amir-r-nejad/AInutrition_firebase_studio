-- Create meal_suggestions table to store AI-generated meal suggestions
CREATE TABLE IF NOT EXISTS meal_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL, -- e.g., "Breakfast", "Lunch", "Dinner"
  target_calories DECIMAL(10,2) NOT NULL,
  target_protein DECIMAL(10,2) NOT NULL,
  target_carbs DECIMAL(10,2) NOT NULL,
  target_fat DECIMAL(10,2) NOT NULL,
  suggestions JSONB NOT NULL, -- Store the full AI response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_suggestions_user_meal ON meal_suggestions(user_id, meal_name);
CREATE INDEX IF NOT EXISTS idx_meal_suggestions_created_at ON meal_suggestions(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE meal_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own meal suggestions" ON meal_suggestions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own meal suggestions" ON meal_suggestions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own meal suggestions" ON meal_suggestions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own meal suggestions" ON meal_suggestions
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meal_suggestions_updated_at
  BEFORE UPDATE ON meal_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_meal_suggestions_updated_at();
