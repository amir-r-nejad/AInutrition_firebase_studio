
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTable() {
  try {
    console.log('Creating exercise_planner_data table...');
    
    // First check if table exists
    const { data: tableCheck, error: checkError } = await supabase
      .from('exercise_planner_data')
      .select('count')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Table already exists!');
      return;
    }
    
    if (checkError.code !== '42P01') {
      console.error('Unexpected error:', checkError);
      return;
    }
    
    console.log('Table does not exist. Creating now...');
    
    // Create the table using raw SQL
    const createTableSQL = `
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
    `;
    
    // Execute via HTTP request to Supabase REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (response.ok) {
      console.log('✅ Table created successfully!');
      
      // Create indexes
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ 
          sql: 'CREATE INDEX IF NOT EXISTS idx_exercise_planner_data_user_id ON exercise_planner_data(user_id);' 
        })
      });
      
      console.log('✅ Indexes created!');
      
    } else {
      const errorText = await response.text();
      console.error('Failed to create table:', errorText);
    }
    
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

createTable();
