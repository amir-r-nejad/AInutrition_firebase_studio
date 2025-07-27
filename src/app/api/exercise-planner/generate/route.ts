import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Correct import

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    console.log("Gemini API Key exists:", !!process.env.GEMINI_API_KEY);

    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt: userPrompt, preferences } = await request.json();

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API key not found");
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: "Please set GEMINI_API_KEY environment variable",
        },
        { status: 500 },
      );
    }

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get user profile data
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Generate AI exercise plan using Gemini
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const focusAreas = [
      "Upper Body Strength",
      "Lower Body Strength",
      "Core & Cardio",
      "Full Body Circuit",
      "Flexibility & Recovery",
      "Strength Training",
      "Active Recovery",
    ] as const; // TypeScript const assertion for literal types

    const prompt = `You are a professional fitness trainer creating a personalized exercise plan.

        CRITICAL INSTRUCTIONS:
        1. Generate a COMPLETE 7-day workout plan for ALL 7 days
        2. Each day must have 6-8 exercises in the main workout section
        3. Calculate realistic durations: warm-up = 10-15% of total time, cool-down = 10-15% of total time
        4. DO NOT use comments or incomplete sections - provide COMPLETE exercises for every day
        5. Return ONLY valid JSON without any comments or additional text

        User preferences:
        - Fitness level: ${preferences.fitness_level}
        - Primary goal: ${preferences.primary_goal}
        - Available time per session: ${preferences.available_time_per_session} minutes
        - Exercise days per week: ${preferences.exercise_days_per_week}
        - Medical conditions: ${preferences.existing_medical_conditions?.join(", ") || "None"}
        - Injuries/limitations: ${preferences.injuries_or_limitations || "None"}
        - Available equipment: ${preferences.available_equipment?.join(", ") || "Bodyweight only"}
        - Space availability: ${preferences.space_availability || "Any space"}
        - Machines access: ${preferences.machines_access ? "Yes" : "No"}

        Create a comprehensive weekly workout plan in JSON format with the following structure:

        {
          "weeklyPlan": {
            "Day1": {
              "dayName": "Monday",
              "focus": "Upper Body Strength",
              "duration": ${preferences.available_time_per_session},
              "warmup": {
                "exercises": [
                  {
                    "name": "Dynamic Arm Circles",
                    "duration": ${Math.max(2, Math.floor(preferences.available_time_per_session * 0.1))},
                    "instructions": "Stand with feet shoulder-width apart. Extend arms to sides and make small circles forward for 30 seconds, then backward for 30 seconds."
                  },
                  {
                    "name": "Dynamic Stretches",
                    "duration": ${Math.max(3, Math.floor(preferences.available_time_per_session * 0.15))},
                    "instructions": "Perform leg swings, torso twists, and shoulder rolls to prepare your body for exercise."
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
                  "instructions": "Start in a plank position with hands slightly wider than shoulders. Lower your body until your chest nearly touches the floor, then push back up. Keep your body in a straight line throughout the movement.",
                  "youtubeSearchTerm": "push ups proper form tutorial beginner",
                  "alternatives": [
                    {
                      "name": "Incline Push-ups",
                      "instructions": "Place your hands on an elevated surface like a bench, step, or wall. The higher the surface, the easier the exercise.",
                      "youtubeSearchTerm": "incline push ups tutorial proper form"
                    },
                    {
                      "name": "Wall Push-ups",
                      "instructions": "Stand arm's length from a wall and perform push-ups against the wall.",
                      "youtubeSearchTerm": "wall push ups beginner tutorial"
                    },
                    {
                      "name": "Knee Push-ups",
                      "instructions": "Start in a plank position but drop your knees to the ground for easier variation.",
                      "youtubeSearchTerm": "knee push ups proper form tutorial"
                    }
                  ]
                },
                {
                  "exerciseName": "Squats",
                  "targetMuscles": ["Quadriceps", "Glutes", "Hamstrings"],
                  "sets": 3,
                  "reps": "10-15",
                  "restSeconds": 60,
                  "instructions": "Stand with feet shoulder-width apart. Lower your hips back and down as if sitting in a chair, keeping your chest up and knees behind your toes. Push through your heels to return to standing.",
                  "youtubeSearchTerm": "bodyweight squats proper form",
                  "alternatives": [
                    {
                      "name": "Chair Squats",
                      "instructions": "Use a chair for support. Sit down and stand up from the chair repeatedly.",
                      "youtubeSearchTerm": "chair squats beginner"
                    },
                    {
                      "name": "Wall Squats",
                      "instructions": "Stand with your back against a wall. Slide down until thighs are parallel to floor.",
                      "youtubeSearchTerm": "wall squats proper form"
                    }
                  ]
                },
                {
                  "exerciseName": "Dumbbell Rows",
                  "targetMuscles": ["Back", "Biceps"],
                  "sets": 3,
                  "reps": "8-12 each arm",
                  "restSeconds": 60,
                  "instructions": "Hold dumbbell in one hand, support yourself with the other. Pull weight toward your hip, squeezing shoulder blade.",
                  "youtubeSearchTerm": "dumbbell rows proper form",
                  "alternatives": [
                    {
                      "name": "Resistance Band Rows",
                      "instructions": "Use resistance band for similar pulling motion.",
                      "youtubeSearchTerm": "resistance band rows"
                    }
                  ]
                },
                {
                  "exerciseName": "Shoulder Press",
                  "targetMuscles": ["Shoulders", "Triceps"],
                  "sets": 3,
                  "reps": "8-12",
                  "restSeconds": 60,
                  "instructions": "Hold dumbbells at shoulder height, press overhead until arms are fully extended.",
                  "youtubeSearchTerm": "dumbbell shoulder press form",
                  "alternatives": [
                    {
                      "name": "Pike Push-ups",
                      "instructions": "Start in downward dog position and perform push-up motion.",
                      "youtubeSearchTerm": "pike push ups shoulders"
                    }
                  ]
                },
                {
                  "exerciseName": "Plank",
                  "targetMuscles": ["Core", "Shoulders", "Back"],
                  "sets": 3,
                  "reps": "30-60 seconds",
                  "restSeconds": 60,
                  "instructions": "Hold your body in a straight line from head to heels, engaging your core muscles.",
                  "youtubeSearchTerm": "plank exercise proper form",
                  "alternatives": [
                    {
                      "name": "Knee Plank",
                      "instructions": "Perform plank with knees on the ground for easier variation.",
                      "youtubeSearchTerm": "modified plank knees"
                    }
                  ]
                },
                {
                  "exerciseName": "Lunges",
                  "targetMuscles": ["Quadriceps", "Glutes", "Hamstrings"],
                  "sets": 3,
                  "reps": "8-12 each leg",
                  "restSeconds": 60,
                  "instructions": "Step forward with one leg, lower your hips until both knees are bent at 90 degrees.",
                  "youtubeSearchTerm": "lunges proper form tutorial",
                  "alternatives": [
                    {
                      "name": "Reverse Lunges",
                      "instructions": "Step backward instead of forward, easier on the knees.",
                      "youtubeSearchTerm": "reverse lunges proper form"
                    }
                  ]
                },
                {
                  "exerciseName": "Bicep Curls",
                  "targetMuscles": ["Biceps"],
                  "sets": 3,
                  "reps": "10-15",
                  "restSeconds": 60,
                  "instructions": "Hold dumbbells at your sides, curl up toward shoulders keeping elbows stationary.",
                  "youtubeSearchTerm": "dumbbell bicep curls form",
                  "alternatives": [
                    {
                      "name": "Resistance Band Curls",
                      "instructions": "Use resistance band for similar curling motion.",
                      "youtubeSearchTerm": "resistance band bicep curls"
                    }
                  ]
                },
                {
                  "exerciseName": "Tricep Dips",
                  "targetMuscles": ["Triceps", "Shoulders"],
                  "sets": 3,
                  "reps": "8-12",
                  "restSeconds": 60,
                  "instructions": "Use a chair or bench, lower your body by bending elbows, then push back up.",
                  "youtubeSearchTerm": "tricep dips proper form",
                  "alternatives": [
                    {
                      "name": "Wall Tricep Push-ups",
                      "instructions": "Stand close to wall, hands close together, perform push-up motion.",
                      "youtubeSearchTerm": "wall tricep pushups"
                    }
                  ]
                }
              ],
              "cooldown": {
                "exercises": [
                  {
                    "name": "Upper Body Stretches",
                    "duration": ${Math.max(3, Math.floor(preferences.available_time_per_session * 0.1))},
                    "instructions": "Stretch chest, shoulders, and arms. Hold each stretch for 20-30 seconds."
                  },
                  {
                    "name": "Lower Body Stretches",
                    "duration": ${Math.max(2, Math.floor(preferences.available_time_per_session * 0.1))},
                    "instructions": "Stretch quadriceps, hamstrings, and calves. Hold each stretch for 20-30 seconds."
                  }
                ]
              }
            }
          }
        }

        IMPORTANT: Generate complete workout plans for ALL 7 days. Each day should have:
        - Appropriate focus area (Upper Body, Lower Body, Cardio, Full Body, etc.)
        - 6-8 main exercises minimum
        - Realistic warm-up (5-8 minutes total)
        - Realistic cool-down (3-5 minutes total)
        - Consider user's limitations: ${preferences.injuries_or_limitations || "None"}  
        - Available equipment: ${preferences.available_equipment?.join(", ") || "Bodyweight only"}
        - Space availability: ${preferences.space_availability || "Any space"}
        - Machines access: ${preferences.machines_access ? "Yes" : "No"}
        - Exercise location: ${preferences.exercise_location || "Any location"}
        - Medical conditions: ${preferences.existing_medical_conditions?.join(", ") || "None"}
        - Current medications: ${preferences.current_medications?.join(", ") || "None"}
        - Preferred time of day: ${preferences.preferred_time_of_day || "Any time"}
        - Job type/activity level: ${preferences.job_type || "Moderate activity"}

        Return ONLY the JSON object with NO additional text, comments, or explanations.`;

    console.log("Sending request to Gemini API...");

    let generatedPlan = "";
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedPlan = response.text();

        if (generatedPlan && generatedPlan.length > 100) {
          break; // Got a reasonable response
        }

        if (retryCount < maxRetries) {
          console.log(
            `Retry ${retryCount + 1}: Response too short, retrying...`,
          );
          retryCount++;
          continue;
        }
      } catch (apiError) {
        console.error("Gemini API error:", apiError);
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}: API error, retrying...`);
          retryCount++;
          continue;
        }
        throw new Error(
          "Failed to get response from AI service after multiple attempts",
        );
      }
    }

    console.log("Received response from Gemini API");
    console.log("Generated plan length:", generatedPlan.length);

    // Clean up the response to extract JSON
    generatedPlan = generatedPlan
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Try to parse the JSON to validate it
    let parsedPlan;
    try {
      // Additional cleanup for common JSON issues
      let cleanedPlan = generatedPlan;

      // Remove any trailing incomplete content
      if (!cleanedPlan.endsWith("}")) {
        const lastCompleteObject = cleanedPlan.lastIndexOf("}");
        if (lastCompleteObject > -1) {
          cleanedPlan = cleanedPlan.substring(0, lastCompleteObject + 1);
        }
      }

      // Fix common JSON issues
      cleanedPlan = cleanedPlan
        .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
        .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
        .replace(/\n/g, " ") // Replace newlines with spaces
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      parsedPlan = JSON.parse(cleanedPlan);
      console.log("Successfully parsed JSON from Gemini");
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini:", parseError);
      console.log("Raw response length:", generatedPlan.length);
      console.log("Raw response preview:", generatedPlan.substring(0, 500));
      console.log(
        "Raw response ending:",
        generatedPlan.substring(Math.max(0, generatedPlan.length - 500)),
      );

      // Define the type for exercisesByFocus
      type Exercise = {
        exerciseName: string;
        targetMuscles: string[];
        sets: number;
        reps: string;
        restSeconds: number;
        instructions: string;
        youtubeSearchTerm: string;
        alternatives: {
          name: string;
          instructions: string;
          youtubeSearchTerm: string;
        }[];
      };

      type FocusExercises = {
        [key: string]: Exercise[];
      };

      const exercisesByFocus: FocusExercises = {
        "Upper Body Strength": [
          {
            exerciseName: "Push-ups",
            targetMuscles: ["Chest", "Shoulders", "Triceps"],
            sets: 3,
            reps: "8-12",
            restSeconds: 60,
            instructions:
              "Start in a high plank position with hands slightly wider than shoulder-width apart. Lower your body until your chest nearly touches the ground, keeping your body in a straight line. Push back up to the starting position, fully extending your arms.",
            youtubeSearchTerm: "push ups proper form tutorial",
            alternatives: [
              {
                name: "Incline Push-ups",
                instructions:
                  "Place hands on an elevated surface like a bench or step. Perform push-up motion with easier angle.",
                youtubeSearchTerm: "incline push ups tutorial",
              },
              {
                name: "Wall Push-ups",
                instructions:
                  "Stand arm's length from wall, place palms flat against wall, and perform push-up motion.",
                youtubeSearchTerm: "wall push ups beginner",
              },
            ],
          },
        ],
        "Lower Body Strength": [
          {
            exerciseName: "Bodyweight Squats",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
            sets: 3,
            reps: "10-15",
            restSeconds: 60,
            instructions:
              "Stand with feet shoulder-width apart, lower your body by bending your knees and pushing your hips back as if sitting in a chair. Keep your chest up and knees behind your toes. Return to standing position.",
            youtubeSearchTerm: "bodyweight squats proper form",
            alternatives: [
              {
                name: "Chair-Assisted Squats",
                instructions:
                  "Use a chair behind you for support and guidance. Sit back until you lightly touch the chair, then stand up.",
                youtubeSearchTerm: "chair assisted squats",
              },
              {
                name: "Wall Squats",
                instructions:
                  "Lean your back against a wall and slide down into squat position, holding for 15-30 seconds.",
                youtubeSearchTerm: "wall squats exercise",
              },
            ],
          },
        ],
      };

      // Create fallback plan
      const fallbackWeeklyPlan: { [key: string]: any } = {};
      for (let i = 1; i <= preferences.exercise_days_per_week; i++) {
        const focusArea = focusAreas[(i - 1) % focusAreas.length];
        const dayExercises = exercisesByFocus[focusArea] || [
          {
            exerciseName: "Full Body Movement",
            targetMuscles: ["Full Body"],
            sets: 3,
            reps: "8-12",
            restSeconds: 60,
            instructions:
              "Perform movements appropriate for your fitness level and available equipment. Focus on proper form over speed or intensity.",
            youtubeSearchTerm: `${preferences.primary_goal?.toLowerCase() || 'general'} ${preferences.fitness_level?.toLowerCase() || 'beginner'} workout ${preferences.available_equipment?.join(' ').toLowerCase() || 'bodyweight'}`,
            alternatives: [
              {
                name: "Beginner Modification",
                instructions:
                  "Reduce intensity and take longer rest periods as needed.",
                youtubeSearchTerm: "beginner workout modifications",
              },
              {
                name: "Equipment-Free Version",
                instructions:
                  "Use bodyweight exercises that target similar muscle groups.",
                youtubeSearchTerm: "bodyweight exercises no equipment",
              },
            ],
          },
        ];

        fallbackWeeklyPlan[`Day${i}`] = {
          dayName: dayNames[i - 1],
          focus: `${focusArea} - ${preferences.primary_goal}`,
          duration: preferences.available_time_per_session,
          warmup: {
            exercises: [
              {
                name: "Dynamic Warm-up",
                duration: Math.max(
                  5,
                  Math.floor(preferences.available_time_per_session * 0.12),
                ),
                instructions:
                  "Perform light movements like arm circles, leg swings, and gentle stretches to prepare your body for exercise. Start slowly and gradually increase range of motion.",
              },
            ],
          },
          mainWorkout: dayExercises,
          cooldown: {
            exercises: [
              {
                name: "Cool-down Stretches",
                duration: Math.max(
                  3,
                  Math.floor(preferences.available_time_per_session * 0.08),
                ),
                instructions:
                  "Perform gentle static stretches holding each position for 15-30 seconds. Focus on the muscle groups worked during the session and breathe deeply.",
              },
            ],
          },
        };
      }

      parsedPlan = {
        weeklyPlan: fallbackWeeklyPlan,
        progressionTips: [
          "Start slowly and gradually increase intensity",
          "Listen to your body",
          "Stay consistent with your routine",
        ],
        safetyNotes: [
          "Warm up before exercising",
          "Stop if you feel pain",
          "Stay hydrated",
        ],
        nutritionTips: [
          "Eat a balanced diet",
          "Stay hydrated",
          "Get adequate rest",
        ],
      };
    }

    // Save the generated plan to database
    const { data: planData, error: planError } = await supabase
      .from("exercise_plans")
      .insert({
        user_id: user.id,
        plan_name: `Exercise Plan ${new Date().toLocaleDateString("en-US")}`,
        plan_description: `Personalized workout plan created for goal: ${preferences.primary_goal}`,
        weekly_plan: {
          generated_content: generatedPlan,
          preferences: preferences,
          parsed_plan: parsedPlan,
        },
        total_duration_minutes:
          preferences.available_time_per_session *
          preferences.exercise_days_per_week,
        difficulty_level: preferences.fitness_level,
        generated_by: "gemini",
        generation_prompt: prompt,
        generation_response: generatedPlan,
        is_active: true,
      })
      .select()
      .single();

    if (planError) {
      console.error("Database error saving plan:", planError);
      return NextResponse.json(
        { error: "Failed to save exercise plan" },
        { status: 500 },
      );
    }

    // Also update the planner data with the generated plan
    const { error: updateError } = await supabase
      .from("exercise_planner_data")
      .update({
        generated_plan: {
          content: generatedPlan,
          parsed_plan: parsedPlan,
          generated_at: new Date().toISOString(),
        },
        gemini_prompt: prompt,
        gemini_response: generatedPlan,
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating planner data:", updateError);
    }

    return NextResponse.json({
      success: true,
      plan: planData,
      generated_content: generatedPlan,
      parsed_plan: parsedPlan,
      message: "Exercise plan generated successfully",
    });
  } catch (error) {
    console.error("Generate exercise plan error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate exercise plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
