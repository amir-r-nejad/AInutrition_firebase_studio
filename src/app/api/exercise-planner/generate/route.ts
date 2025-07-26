
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, preferences } = await request.json();

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedPlan = response.text();

    // Save the generated plan to database
    const { data: planData, error: planError } = await supabase
      .from('exercise_plans')
      .insert({
        user_id: user.id,
        plan_name: `برنامه ورزشی ${new Date().toLocaleDateString('fa-IR')}`,
        plan_description: `برنامه ورزشی ایجاد شده برای هدف: ${preferences.primary_goal}`,
        weekly_plan: {
          generated_content: generatedPlan,
          preferences: preferences
        },
        total_duration_minutes: preferences.available_time_per_session * preferences.exercise_days_per_week,
        difficulty_level: preferences.fitness_level,
        generated_by: 'gemini',
        generation_prompt: prompt,
        generation_response: generatedPlan,
        is_active: true
      })
      .select()
      .single();

    if (planError) {
      console.error('Database error saving plan:', planError);
      return NextResponse.json({ error: 'Failed to save exercise plan' }, { status: 500 });
    }

    // Also update the planner data with the generated plan
    const { error: updateError } = await supabase
      .from('exercise_planner_data')
      .update({
        generated_plan: {
          content: generatedPlan,
          generated_at: new Date().toISOString()
        },
        gemini_prompt: prompt,
        gemini_response: generatedPlan
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating planner data:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      plan: planData,
      generated_content: generatedPlan,
      message: 'Exercise plan generated successfully' 
    });

  } catch (error) {
    console.error('Generate exercise plan error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate exercise plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
