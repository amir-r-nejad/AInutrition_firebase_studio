
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Getting preferences for user:', user.id);

    // Get saved preferences from database
    const { data, error } = await supabase
      .from('exercise_planner_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return empty success response
        console.log('No saved preferences found for user');
        return NextResponse.json({ 
          success: true, 
          data: null,
          message: 'No saved preferences found' 
        });
      } else {
        console.error('Database error:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch preferences', 
          details: error.message 
        }, { status: 500 });
      }
    }

    console.log('Retrieved preferences:', data);

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'Preferences retrieved successfully' 
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
