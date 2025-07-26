
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupTable() {
  try {
    console.log('Checking if exercise_planner_data table exists...');
    
    // Try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('exercise_planner_data')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Table does not exist. Creating table...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('create_exercise_planner_table');
      
      if (createError) {
        console.error('Error creating table:', createError);
        return;
      }
      
      console.log('Table created successfully!');
    } else if (error) {
      console.error('Error checking table:', error);
    } else {
      console.log('Table already exists!');
    }
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupTable();
