
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await request.json();
    console.log('Received preferences:', preferences);

    // Clean and prepare data for database
    const dbData = {
      user_id: user.id,
      fitness_level: preferences.fitness_level || null,
      exercise_experience: preferences.exercise_experience || [],
      exercise_experience_other: preferences.exercise_experience_other || null,
      existing_medical_conditions: preferences.existing_medical_conditions || [],
      existing_medical_conditions_other: preferences.existing_medical_conditions_other || null,
      injuries_or_limitations: preferences.injuries_or_limitations || null,
      current_medications: preferences.current_medications || [],
      current_medications_other: preferences.current_medications_other || null,
      doctor_clearance: preferences.doctor_clearance || false,
      primary_goal: preferences.primary_goal || null,
      secondary_goal: preferences.secondary_goal || null,
      goal_timeline_weeks: preferences.goal_timeline_weeks || null,
      target_weight_kg: preferences.target_weight_kg || null,
      muscle_groups_focus: preferences.muscle_groups_focus || [],
      exercise_days_per_week: preferences.exercise_days_per_week || null,
      available_time_per_session: preferences.available_time_per_session || null,
      preferred_time_of_day: preferences.preferred_time_of_day || null,
      exercise_location: preferences.exercise_location || null,
      daily_step_count_avg: preferences.daily_step_count_avg || null,
      job_type: preferences.job_type || null,
      available_equipment: preferences.available_equipment || [],
      available_equipment_other: preferences.available_equipment_other || null,
      machines_access: preferences.machines_access || false,
      space_availability: preferences.space_availability || null,
      want_to_track_progress: preferences.want_to_track_progress !== undefined ? preferences.want_to_track_progress : true,
      weekly_checkins_enabled: preferences.weekly_checkins_enabled !== undefined ? preferences.weekly_checkins_enabled : true,
      accountability_support: preferences.accountability_support !== undefined ? preferences.accountability_support : true,
      preferred_difficulty_level: preferences.preferred_difficulty_level || null,
      sleep_quality: preferences.sleep_quality || null,
      updated_at: new Date().toISOString()
    };

    console.log('Prepared data for database:', dbData);

    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('exercise_planner_data')
      .update(dbData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No existing record, insert new one
      const { data: insertData, error: insertError } = await supabase
        .from('exercise_planner_data')
        .insert(dbData)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save preferences', 
          details: insertError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: insertData,
        message: 'Preferences saved successfully' 
      });
    } else if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update preferences', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updateData,
      message: 'Preferences updated successfully' 
    });

  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
