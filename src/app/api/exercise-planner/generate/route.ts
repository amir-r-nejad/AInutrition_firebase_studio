
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY);
    
    const supabase = await createClient();

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt: userPrompt, preferences } = await request.json();

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('Gemini API key not found');
      return NextResponse.json({ 
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY environment variable'
      }, { status: 500 });
    }

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Get user profile data
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Generate AI exercise plan using Gemini
    const prompt = `Create a comprehensive weekly exercise plan in ENGLISH based on the following profile:

PERSONAL INFORMATION:
- Age: ${profileData?.age || 'Not specified'} years
- Height: ${profileData?.height_cm || 'Not specified'} cm
- Weight: ${profileData?.weight_kg || 'Not specified'} kg
- Gender: ${profileData?.gender || 'Not specified'}
- Activity Level: ${profileData?.activity_level || 'Not specified'}

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
2. Create a complete weekly workout plan for ALL ${preferences.exercise_days_per_week} days (Day1 through Day${preferences.exercise_days_per_week})
3. Each day must have different focus areas and exercises
4. Each exercise must include: name, sets, reps, rest periods, VERY DETAILED step-by-step instructions (minimum 2-3 sentences)
5. Provide 2-3 alternative exercises for each main exercise with YouTube search terms
6. Include comprehensive warm-up and cool-down routines for each day
7. Consider all health conditions, physical limitations, age, weight, and height
8. Progressive difficulty based on fitness level and personal data
9. Equipment-specific modifications and adaptations
10. Include proper form instructions and safety tips
11. Add YouTube search terms for video tutorials
12. Make instructions very detailed and educational

FORMAT: Return as valid JSON with this exact structure for ALL ${preferences.exercise_days_per_week} days:
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
            "duration": 60,
            "instructions": "Stand with feet shoulder-width apart and arms extended to the sides at shoulder height. Make small, controlled circles forward for 15 seconds, gradually increasing the size. Then reverse direction and make circles backward for 15 seconds. Keep your core engaged and maintain good posture throughout."
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
          "instructions": "Start in a high plank position with hands placed slightly wider than shoulder-width apart, fingers spread for stability. Your body should form a straight line from head to heels. Engage your core and keep your glutes tight. Lower your body by bending your elbows, bringing your chest close to the ground while maintaining the straight line. Push through your palms to return to the starting position, fully extending your arms. Breathe in as you lower down and exhale as you push up.",
          "youtubeSearchTerm": "push ups proper form tutorial beginner",
          "alternatives": [
            {
              "name": "Incline Push-ups",
              "instructions": "Place your hands on an elevated surface like a bench, step, or wall. The higher the surface, the easier the exercise. Position hands shoulder-width apart and step back so your body forms a straight line. Perform the push-up motion with the same form as regular push-ups.",
              "youtubeSearchTerm": "incline push ups tutorial proper form"
            },
            {
              "name": "Wall Push-ups",
              "instructions": "Stand arm's length from a wall with feet hip-width apart. Place palms flat against the wall at shoulder height and shoulder-width apart. Lean in toward the wall by bending your elbows, keeping your body straight. Push back to starting position.",
              "youtubeSearchTerm": "wall push ups beginner tutorial"
            },
            {
              "name": "Knee Push-ups",
              "instructions": "Start in a plank position but drop your knees to the ground, creating a straight line from knees to head. Cross your ankles and keep your core engaged. Perform push-ups maintaining proper form from this modified position.",
              "youtubeSearchTerm": "knee push ups proper form tutorial"
            }
          ]
        }
      ],
      "cooldown": {
        "exercises": [
          {
            "name": "Chest Stretch",
            "duration": 30,
            "instructions": "Stand in a doorway and place your right forearm against the door frame with your elbow at shoulder height. Step forward with your right foot and lean gently forward until you feel a stretch across your chest and front shoulder. Hold for 30 seconds, then repeat on the left side."
          }
        ]
      }
    },
    "Day2": {
      "dayName": "Tuesday",
      "focus": "Lower Body & Core",
      "duration": ${preferences.available_time_per_session},
      "warmup": { "exercises": [...] },
      "mainWorkout": [...],
      "cooldown": { "exercises": [...] }
    },
    ... (continue for all ${preferences.exercise_days_per_week} days)
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

    console.log('Sending request to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedPlan = response.text();

    console.log('Received response from Gemini API');
    console.log('Generated plan length:', generatedPlan.length);

    // Clean up the response to extract JSON
    generatedPlan = generatedPlan.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Try to parse the JSON to validate it
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(generatedPlan);
      console.log('Successfully parsed JSON from Gemini');
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', parseError);
      console.log('Raw response:', generatedPlan.substring(0, 500));
      
      // Create a fallback plan if JSON parsing fails
      const fallbackWeeklyPlan: any = {};
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const focusAreas = ["Upper Body", "Lower Body", "Full Body", "Cardio & Core", "Strength", "Flexibility", "Active Recovery"];
      
      for (let i = 1; i <= preferences.exercise_days_per_week; i++) {
        fallbackWeeklyPlan[`Day${i}`] = {
          dayName: dayNames[i - 1],
          focus: `${focusAreas[(i - 1) % focusAreas.length]} - ${preferences.primary_goal}`,
          duration: preferences.available_time_per_session,
          warmup: {
            exercises: [
              {
                name: "Dynamic Warm-up",
                duration: 5,
                instructions: "Perform light movements like arm circles, leg swings, and gentle stretches to prepare your body for exercise. Start slowly and gradually increase range of motion."
              }
            ]
          },
          mainWorkout: [
            {
              exerciseName: "Customized Exercise Set",
              targetMuscles: ["Full Body"],
              sets: 3,
              reps: "8-12",
              restSeconds: 60,
              instructions: "Perform exercises appropriate for your fitness level and available equipment. Focus on proper form over speed or weight. Start with lighter resistance and progress gradually.",
              youtubeSearchTerm: `${preferences.primary_goal.toLowerCase()} ${preferences.fitness_level.toLowerCase()} workout day ${i}`,
              alternatives: [
                {
                  name: "Beginner Modification",
                  instructions: "Reduce intensity, use bodyweight or lighter weights, and take longer rest periods as needed.",
                  youtubeSearchTerm: "beginner workout modifications"
                },
                {
                  name: "Equipment-Free Alternative",
                  instructions: "Use bodyweight exercises that target the same muscle groups without requiring equipment.",
                  youtubeSearchTerm: "bodyweight exercises no equipment"
                }
              ]
            }
          ],
          cooldown: {
            exercises: [
              {
                name: "Cool-down Stretches",
                duration: 5,
                instructions: "Perform gentle static stretches holding each position for 15-30 seconds. Focus on the muscle groups worked during the session and breathe deeply."
              }
            ]
          }
        };
      }
      
      parsedPlan = {
        weeklyPlan: fallbackWeeklyPlan,
        progressionTips: [
          "Start slowly and gradually increase intensity",
          "Listen to your body",
          "Stay consistent with your routine"
        ],
        safetyNotes: [
          "Warm up before exercising",
          "Stop if you feel pain",
          "Stay hydrated"
        ],
        nutritionTips: [
          "Eat a balanced diet",
          "Stay hydrated",
          "Get adequate rest"
        ]
      };
    }

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
          parsed_plan: parsedPlan
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
          parsed_plan: parsedPlan,
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
      parsed_plan: parsedPlan,
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
