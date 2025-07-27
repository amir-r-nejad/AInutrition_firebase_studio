import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt: userPrompt, preferences } = await request.json();

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate AI exercise plan using Gemini
      const prompt = `Create a comprehensive weekly exercise plan in ENGLISH based on the following profile:

FITNESS PROFILE:
- Fitness Level: ${preferences.fitness_level}
- Exercise Experience: ${preferences.exercise_experience?.join(', ') || 'None'}
- Primary Goal: ${preferences.primary_goal}
- Secondary Goal: ${preferences.secondary_goal || 'None'}
- Exercise Days per Week: ${preferences.exercise_days_per_week}
- Session Duration: ${preferences.available_time_per_session} minutes
- Location: ${preferences.exercise_location}
- Equipment Available: ${preferences.available_equipment?.join(', ') || 'None'}
- Machines Access: ${preferences.machines_access ? 'Yes' : 'No'}
- Space: ${preferences.space_availability}
- Preferred Time: ${preferences.preferred_time_of_day}
- Job Type: ${preferences.job_type}
- Difficulty Level: ${preferences.preferred_difficulty_level}
- Sleep Quality: ${preferences.sleep_quality}

HEALTH CONSIDERATIONS:
- Medical Conditions: ${preferences.existing_medical_conditions?.join(', ') || 'None'}
- Injuries/Limitations: ${preferences.injuries_or_limitations || 'None'}
- Medications: ${preferences.current_medications?.join(', ') || 'None'}
- Doctor Clearance: ${preferences.doctor_clearance ? 'Yes' : 'No'}

GOALS & FOCUS:
- Target Muscle Groups: ${preferences.muscle_groups_focus?.join(', ') || 'Full Body'}
- Timeline: ${preferences.goal_timeline_weeks} weeks
- Target Weight: ${preferences.target_weight_kg || 'Not specified'} kg

STRICT REQUIREMENTS:
1. Response must be in ENGLISH only
2. Create a complete weekly workout plan for ${preferences.exercise_days_per_week} days
3. Each exercise must include: name, sets, reps, rest periods, detailed step-by-step instructions
4. Provide 2-3 alternative exercises for each main exercise with YouTube search terms
5. Include comprehensive warm-up and cool-down routines for each day
6. Consider all health conditions and physical limitations
7. Progressive difficulty based on fitness level
8. Equipment-specific modifications and adaptations
9. Include proper form instructions and safety tips
10. Add YouTube search terms for video tutorials

FORMAT: Return as valid JSON with this exact structure:
{
  "weeklyPlan": {
    "Day1": {
      "dayName": "Monday",
      "focus": "Upper Body Strength",
      "duration": ${preferences.available_time_per_session},
      "warmup": {
        "exercises": [
          {
            "name": "Arm Circles",
            "duration": 2,
            "instructions": "Stand with arms extended, make small circles forward then backward"
          }
        ]
      },
      "mainWorkout": [
        {
          "exerciseName": "Push-ups",
          "targetMuscles": ["Chest", "Shoulders", "Triceps"],
          "sets": 3,
          "reps": "8-12",
          "restSeconds": 60,
          "instructions": "Start in plank position with hands shoulder-width apart. Lower body until chest nearly touches ground. Push back up to starting position. Keep core tight throughout movement.",
          "youtubeSearchTerm": "push ups proper form tutorial beginner",
          "alternatives": [
            {
              "name": "Incline Push-ups",
              "instructions": "Place hands on elevated surface like bench or step. Perform push-up motion with easier angle.",
              "youtubeSearchTerm": "incline push ups tutorial proper form"
            },
            {
              "name": "Wall Push-ups",
              "instructions": "Stand arm's length from wall. Place hands flat against wall. Push body away from wall and return.",
              "youtubeSearchTerm": "wall push ups beginner tutorial"
            },
            {
              "name": "Knee Push-ups",
              "instructions": "Start in plank position but rest on knees instead of toes. Perform push-up motion.",
              "youtubeSearchTerm": "knee push ups proper form tutorial"
            }
          ]
        }
      ],
      "cooldown": {
        "exercises": [
          {
            "name": "Chest Stretch",
            "duration": 3,
            "instructions": "Stand in doorway with arm against frame. Step forward to stretch chest and shoulder"
          }
        ]
      }
    }
  },
  "progressionTips": [
    "Start with easier variations and progress to harder ones",
    "Increase reps or sets weekly as you get stronger",
    "Focus on proper form over speed or weight"
  ],
  "safetyNotes": [
    "Stop immediately if you feel pain or discomfort",
    "Warm up properly before each workout",
    "Stay hydrated throughout exercise",
    "Listen to your body and rest when needed"
  ],
  "nutritionTips": [
    "Eat protein within 30 minutes after workout",
    "Stay hydrated before, during, and after exercise",
    "Include complex carbs for energy"
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedPlan = response.text();

    // Save the generated plan to database
    const { data: planData, error: planError } = await supabase
      .from('exercise_plans')
      .insert({
        user_id: user.id,
        plan_name: `Exercise Plan ${new Date().toLocaleDateString('en-US')}`,
        plan_description: `Personalized workout plan created for goal: ${preferences.primary_goal}`,
        weekly_plan: {
          generated_content: generatedPlan,
          preferences: preferences,
          gemini_response: generatedPlan
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