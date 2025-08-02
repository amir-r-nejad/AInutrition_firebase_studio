import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Test database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('exercise_planner_data')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('Database connection test failed:', connectionError);
      if (connectionError.code === '42P01') {
        return NextResponse.json(
          {
            error: 'Database table does not exist',
            details:
              'The exercise_planner_data table has not been created. Please run the database migration.',
            code: 'TABLE_NOT_FOUND',
          },
          { status: 500 }
        );
      }
    }

    const preferences = await request.json();
    console.log('Received preferences:', preferences);

    // Clean and prepare data for database with proper validation
    const dbData = {
      user_id: user.id,
      fitness_level:
        preferences.fitness_level && preferences.fitness_level !== ''
          ? preferences.fitness_level
          : null,
      exercise_experience: Array.isArray(preferences.exercise_experience)
        ? preferences.exercise_experience
        : [],
      exercise_experience_other: preferences.exercise_experience_other || null,
      existing_medical_conditions: Array.isArray(
        preferences.existing_medical_conditions
      )
        ? preferences.existing_medical_conditions
        : [],
      existing_medical_conditions_other:
        preferences.existing_medical_conditions_other || null,
      injuries_or_limitations: preferences.injuries_or_limitations || null,
      current_medications: Array.isArray(preferences.current_medications)
        ? preferences.current_medications
        : [],
      current_medications_other: preferences.current_medications_other || null,
      doctor_clearance: Boolean(preferences.doctor_clearance),
      primary_goal:
        preferences.primary_goal && preferences.primary_goal !== ''
          ? preferences.primary_goal
          : null,
      secondary_goal:
        preferences.secondary_goal && preferences.secondary_goal !== ''
          ? preferences.secondary_goal
          : null,
      goal_timeline_weeks:
        preferences.goal_timeline_weeks && preferences.goal_timeline_weeks > 0
          ? preferences.goal_timeline_weeks
          : null,
      target_weight_kg:
        preferences.target_weight_kg && preferences.target_weight_kg > 0
          ? preferences.target_weight_kg
          : null,
      muscle_groups_focus: Array.isArray(preferences.muscle_groups_focus)
        ? preferences.muscle_groups_focus
        : [],
      exercise_days_per_week:
        preferences.exercise_days_per_week &&
        preferences.exercise_days_per_week > 0
          ? preferences.exercise_days_per_week
          : null,
      available_time_per_session:
        preferences.available_time_per_session &&
        preferences.available_time_per_session > 0
          ? preferences.available_time_per_session
          : null,
      preferred_time_of_day:
        preferences.preferred_time_of_day &&
        preferences.preferred_time_of_day !== ''
          ? preferences.preferred_time_of_day
          : null,
      exercise_location:
        preferences.exercise_location && preferences.exercise_location !== ''
          ? preferences.exercise_location
          : null,
      daily_step_count_avg:
        preferences.daily_step_count_avg && preferences.daily_step_count_avg > 0
          ? preferences.daily_step_count_avg
          : null,
      job_type:
        preferences.job_type && preferences.job_type !== ''
          ? preferences.job_type
          : null,
      available_equipment: Array.isArray(preferences.available_equipment)
        ? preferences.available_equipment
        : [],
      available_equipment_other: preferences.available_equipment_other || null,
      machines_access: Boolean(preferences.machines_access),
      space_availability:
        preferences.space_availability && preferences.space_availability !== ''
          ? preferences.space_availability
          : null,
      want_to_track_progress: Boolean(preferences.want_to_track_progress),
      weekly_checkins_enabled: Boolean(preferences.weekly_checkins_enabled),
      accountability_support: Boolean(preferences.accountability_support),
      preferred_difficulty_level:
        preferences.preferred_difficulty_level &&
        preferences.preferred_difficulty_level !== ''
          ? preferences.preferred_difficulty_level
          : null,
      sleep_quality:
        preferences.sleep_quality && preferences.sleep_quality !== ''
          ? preferences.sleep_quality
          : null,
      updated_at: new Date().toISOString(),
    };

    console.log('Prepared data for database:', dbData);

    // First try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('exercise_planner_data')
      .update(dbData)
      .eq('user_id', user.id)
      .select()
      .single();

    console.log('Update operation result:', { updateData, updateError });

    if (updateError) {
      console.error('Database update error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        fullError: JSON.stringify(updateError),
      });

      // Check if it's an empty error object (connection issue)
      if (
        !updateError.message &&
        !updateError.code &&
        Object.keys(updateError).length === 0
      ) {
        return NextResponse.json(
          {
            error: 'Database connection error',
            details:
              'Unable to connect to the database. Please check your connection.',
            code: 'CONNECTION_ERROR',
          },
          { status: 500 }
        );
      }

      if (updateError.code === 'PGRST116') {
        // No existing record found, insert new one
        console.log('No existing record found, attempting insert...');
        const { data: insertData, error: insertError } = await supabase
          .from('exercise_planner_data')
          .insert(dbData)
          .select()
          .single();

        console.log('Insert operation result:', { insertData, insertError });

        if (insertError) {
          console.error('Database insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          });
          return NextResponse.json(
            {
              error: 'Failed to save preferences',
              details: insertError.message,
              code: insertError.code,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: insertData,
          message: 'Preferences saved successfully',
        });
      } else {
        // Other update error
        return NextResponse.json(
          {
            error: 'Failed to update preferences',
            details: updateError.message,
            code: updateError.code,
          },
          { status: 500 }
        );
      }
    }

    if (!updateData) {
      console.error('Update succeeded but no data returned');
      return NextResponse.json(
        {
          error: 'Update operation completed but no data was returned',
          details: 'This might indicate a database constraint issue',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updateData,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
