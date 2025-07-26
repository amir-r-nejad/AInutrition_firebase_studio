
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'exercise_planner.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          // Try alternative method if rpc doesn't work
          const { error: directError } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(1);
            
          if (directError && directError.code === '42P01') {
            // Use direct SQL execution
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              },
              body: JSON.stringify({ sql: statement + ';' })
            });
            
            if (!response.ok) {
              console.error(`Failed to execute statement: ${statement.substring(0, 100)}...`);
              console.error('Response:', await response.text());
            }
          } else {
            console.error('Error executing statement:', error);
          }
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify table creation
    const { data, error } = await supabase
      .from('exercise_planner_data')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Verification failed:', error);
    } else {
      console.log('✅ Table verification successful!');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
