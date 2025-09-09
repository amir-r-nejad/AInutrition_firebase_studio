import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    console.log("OpenAI API Key exists:", !!process.env.OPENAI_API_KEY);

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY environment variable",
        },
        { status: 500 },
      );
    }

    // Get user profile data
    const { data: profileData } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Optimized Prompt
    const prompt = `You are a professional fitness trainer tasked with creating a personalized weekly exercise plan in JSON format, tailored to the user's available time per session and ensuring a professional, balanced, and progressive approach.

        CRITICAL INSTRUCTIONS:
        - Return ONLY valid JSON without comments, explanations, or additional text.
        - Ensure JSON is properly formatted with no trailing commas or syntax errors.
        - Generate a complete 7-day weekly plan, with workouts distributed across ${preferences.exercise_days_per_week} days, including rest days.
        - Distribute workout days evenly (e.g., 3 days: Monday, Wednesday, Friday; 4 days: Monday, Tuesday, Thursday, Friday; 5 days: Monday to Friday).
        - Each workout day must include:
          - Main exercises: Adjust number based on session duration:
            - 15-20 min: 3-4 exercises (prioritize compound movements like burpees or squat-to-press for efficiency).
            - 21-30 min: 4-5 exercises.
            - 31-45 min: 5-6 exercises.
            - 46-60 min: 6-8 exercises.
          - Warm-up: 10-15% of session duration (3-8 minutes total, 1-2 exercises).
          - Cool-down: 10-15% of session duration (3-5 minutes total, 1-2 exercises).
          - Total time for warm-up, main workout, and cool-down must not exceed ${preferences.available_time_per_session} minutes.
        - Each exercise (including sets, reps, and rest) should take 3-5 minutes, calculated as: (sets * (reps time + rest time)).
        - Avoid repeating the same exercises across different days within the week, unless necessary for the user's goal (e.g., progressive overload for strength).
        - Exercises must align with:
          - Fitness level: ${preferences.fitness_level}
          - Primary goal: ${preferences.primary_goal}
          - Secondary goal: ${preferences.secondary_goal || "None"}
          - Available equipment: ${
            preferences.available_equipment?.join(", ") || "Bodyweight only"
          }
          - Space availability: ${preferences.space_availability || "Any space"}
          - Machines access: ${preferences.machines_access ? "Yes" : "No"}
          - Medical conditions: ${
            preferences.existing_medical_conditions?.join(", ") || "None"
          }
          - Injuries/limitations: ${
            preferences.injuries_or_limitations || "None"
          }
        - Assign appropriate focus areas (e.g., Upper Body Strength, Lower Body Strength, Core & Cardio, Full Body Circuit, Flexibility & Recovery) for each workout day.
        - Ensure exercises are safe, considering medical conditions and injuries.
        - Provide detailed instructions and YouTube search terms for each exercise and at least one alternative.
        - Include a progression plan to increase intensity over weeks (e.g., increasing reps, sets, or weight).
        - Include nutrition and recovery tips tailored to the user's goal in the JSON structure.

        JSON STRUCTURE:
        {
          "weeklyPlan": {
            "Day1": {
              "dayName": "Monday",
              "focus": "Upper Body Strength",
              "isWorkoutDay": true,
              "duration": ${preferences.available_time_per_session},
              "warmup": {
                "exercises": [
                  {
                    "name": "Dynamic Arm Circles",
                    "duration": ${Math.max(
                      2,
                      Math.floor(preferences.available_time_per_session * 0.1),
                    )},
                    "instructions": "Stand with feet shoulder-width apart. Extend arms and perform small circles forward for 30 seconds, then backward for 30 seconds."
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
                  "instructions": "Start in a plank position with hands slightly wider than shoulders. Lower your body until your chest nearly touches the floor, then push back up.",
                  "youtubeSearchTerm": "push ups proper form tutorial beginner",
                  "estimatedDurationMinutes": 4,
                  "alternatives": [
                    {
                      "name": "Incline Push-ups",
                      "instructions": "Place hands on an elevated surface like a bench. Perform push-ups with proper form.",
                      "youtubeSearchTerm": "incline push ups tutorial"
                    }
                  ]
                }
              ],
              "cooldown": {
                "exercises": [
                  {
                    "name": "Upper Body Stretches",
                    "duration": ${Math.max(
                      2,
                      Math.floor(preferences.available_time_per_session * 0.1),
                    )},
                    "instructions": "Perform chest, shoulder, and arm stretches, holding each for 20-30 seconds."
                  }
                ]
              }
            },
            "Day2": {
              "dayName": "Tuesday",
              "focus": "Rest",
              "isWorkoutDay": false,
              "duration": 0,
              "warmup": { "exercises": [] },
              "mainWorkout": [],
              "cooldown": { "exercises": [] }
            }
            // Continue for all 7 days
          },
          "progressionTips": [
            "Week 2: Increase reps by 2-3 per set or add 5-10 seconds to holds.",
            "Week 3: Increase sets by 1 for 1-2 exercises per session.",
            "Week 4: Consider adding new exercises or increasing weights/difficulty.",
            "Track your performance weekly and adjust intensity based on your progress."
          ],
          "safetyNotes": [
            "Always warm up before exercising and cool down afterward.",
            "Stop immediately if you experience pain or discomfort.",
            "Maintain proper form over speed or heavy weights.",
            "Stay hydrated throughout your workout.",
            "Rest adequately between sets and training days."
          ],
          "nutritionTips": [
            "For ${preferences.primary_goal}: High-protein diet supports muscle growth and recovery.",
            "Stay hydrated with 2-3 liters of water daily.",
            "Eat a small meal/snack 1-2 hours before workouts."
          ],
          "recoveryTips": [
            "Aim for 7-8 hours of sleep nightly.",
            "Incorporate active recovery (e.g., walking) on rest days.",
            "Use foam rolling or stretching to reduce muscle soreness."
          ]
        }

        USER PREFERENCES:
        - Exercise days per week: ${preferences.exercise_days_per_week}
        - Session duration: ${preferences.available_time_per_session} minutes
        - Preferred time: ${preferences.preferred_time_of_day || "Any time"}
        - Target muscle groups: ${
          preferences.muscle_groups_focus?.join(", ") || "All muscle groups"
        }
        - Exercise location: ${preferences.exercise_location || "Any location"}
        - Job type/activity level: ${
          preferences.job_type || "Moderate activity"
        }
        - Current medications: ${
          preferences.current_medications?.join(", ") || "None"
        }

        Ensure the plan is complete, balanced, tailored to session duration, and promotes progressive improvement.`;

    console.log("Sending request to OpenAI API...");

    let generatedPlan = "";
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
          model: "gpt-5",
          messages: [
            {
              role: "system",
              content: "You are a professional fitness trainer tasked with creating personalized weekly exercise plans in JSON format. Your response must be valid JSON only, without any comments, explanations, or additional text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 16384
        });

        generatedPlan = response.choices[0]?.message?.content || "";

        if (generatedPlan && generatedPlan.length > 100) {
          break;
        }

        if (retryCount < maxRetries) {
          console.log(
            `Retry ${retryCount + 1}: Response too short, retrying...`,
          );
          retryCount++;
          continue;
        }
      } catch (apiError) {
        console.error("OpenAI API error:", apiError);
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

    console.log("Received response from OpenAI API");
    console.log("Generated plan length:", generatedPlan.length);

    // Clean up the response to extract JSON
    generatedPlan = generatedPlan
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Try to parse the JSON to validate it
    let parsedPlan;
    try {
      let cleanedPlan = generatedPlan
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanedPlan.endsWith("}")) {
        const lastCompleteObject = cleanedPlan.lastIndexOf("}");
        if (lastCompleteObject > -1) {
          cleanedPlan = cleanedPlan.substring(0, lastCompleteObject + 1);
        }
      }

      parsedPlan = JSON.parse(cleanedPlan);
      console.log("Successfully parsed JSON from OpenAI");
    } catch (parseError) {
      console.error("Failed to parse JSON from OpenAI:", parseError);
      console.log("Raw response length:", generatedPlan.length);
      console.log("Raw response preview:", generatedPlan.substring(0, 500));

      // Fallback plan
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
      ];

      // Adjust number of exercises based on session duration
      const exerciseCount = Math.min(
        Math.max(3, Math.floor(preferences.available_time_per_session / 5)),
        8,
      );

      const exercisesByFocus: { [key: string]: any[] } = {
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
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Incline Push-ups",
                instructions:
                  "Place hands on an elevated surface like a bench or step. Perform push-up motion with easier angle.",
                youtubeSearchTerm: "incline push ups tutorial",
              },
            ],
          },
          {
            exerciseName: "Tricep Dips",
            targetMuscles: ["Triceps", "Shoulders"],
            sets: 3,
            reps: "8-12",
            restSeconds: 60,
            instructions:
              "Use a chair or bench, lower your body by bending elbows, then push back up.",
            youtubeSearchTerm: "tricep dips proper form",
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Wall Tricep Push-ups",
                instructions:
                  "Stand close to wall, hands close together, perform push-up motion.",
                youtubeSearchTerm: "wall tricep pushups",
              },
            ],
          },
          {
            exerciseName: "Pike Push-ups",
            targetMuscles: ["Shoulders", "Triceps"],
            sets: 3,
            reps: "8-12",
            restSeconds: 60,
            instructions:
              "Start in a downward dog position and perform push-up motion, focusing on shoulder engagement.",
            youtubeSearchTerm: "pike push ups shoulders",
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Knee Pike Push-ups",
                instructions:
                  "Perform pike push-ups with knees on the ground for reduced intensity.",
                youtubeSearchTerm: "knee pike push ups",
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
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Chair-Assisted Squats",
                instructions:
                  "Use a chair behind you for support and guidance. Sit back until you lightly touch the chair, then stand up.",
                youtubeSearchTerm: "chair assisted squats",
              },
            ],
          },
          {
            exerciseName: "Lunges",
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
            sets: 3,
            reps: "8-12 each leg",
            restSeconds: 60,
            instructions:
              "Step forward with one leg, lower your hips until both knees are bent at 90 degrees.",
            youtubeSearchTerm: "lunges proper form tutorial",
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Reverse Lunges",
                instructions:
                  "Step backward instead of forward, easier on the knees.",
                youtubeSearchTerm: "reverse lunges proper form",
              },
            ],
          },
          {
            exerciseName: "Glute Bridges",
            targetMuscles: ["Glutes", "Hamstrings"],
            sets: 3,
            reps: "10-15",
            restSeconds: 60,
            instructions:
              "Lie on your back with knees bent and feet flat on the floor. Lift your hips until your body forms a straight line from shoulders to knees.",
            youtubeSearchTerm: "glute bridges proper form",
            estimatedDurationMinutes: 4,
            alternatives: [
              {
                name: "Single-Leg Glute Bridges",
                instructions:
                  "Perform glute bridges with one leg extended for added intensity.",
                youtubeSearchTerm: "single leg glute bridges",
              },
            ],
          },
        ],
        "Core & Cardio": [
          {
            exerciseName: "Mountain Climbers",
            targetMuscles: ["Core", "Cardio"],
            sets: 3,
            reps: "20-30 seconds",
            restSeconds: 60,
            instructions:
              "In a plank position, rapidly alternate bringing knees toward chest, keeping core engaged.",
            youtubeSearchTerm: "mountain climbers proper form",
            estimatedDurationMinutes: 3,
            alternatives: [
              {
                name: "Modified Mountain Climbers",
                instructions:
                  "Perform the movement slower with knees closer to the ground.",
                youtubeSearchTerm: "modified mountain climbers",
              },
            ],
          },
          {
            exerciseName: "Plank",
            targetMuscles: ["Core", "Shoulders"],
            sets: 3,
            reps: "20-30 seconds",
            restSeconds: 60,
            instructions:
              "Hold a plank position with a straight body line, engaging core and keeping elbows under shoulders.",
            youtubeSearchTerm: "plank exercise proper form",
            estimatedDurationMinutes: 3,
            alternatives: [
              {
                name: "Knee Plank",
                instructions:
                  "Perform plank with knees on the ground for reduced intensity.",
                youtubeSearchTerm: "knee plank beginner",
              },
            ],
          },
        ],
      };

      const fallbackWeeklyPlan: { [key: string]: any } = {};
      for (let i = 1; i <= 7; i++) {
        if (i <= preferences.exercise_days_per_week) {
          const focusArea = focusAreas[(i - 1) % focusAreas.length];
          const dayExercises = exercisesByFocus[focusArea]?.slice(
            0,
            exerciseCount,
          ) || [
            {
              exerciseName: "Full Body Movement",
              targetMuscles: ["Full Body"],
              sets: 3,
              reps: "8-12",
              restSeconds: 60,
              instructions:
                "Perform movements appropriate for your fitness level and available equipment. Focus on proper form over speed or intensity.",
              youtubeSearchTerm: `${
                preferences.primary_goal?.toLowerCase() || "general"
              } ${
                preferences.fitness_level?.toLowerCase() || "beginner"
              } workout ${
                preferences.available_equipment?.join(" ").toLowerCase() ||
                "bodyweight"
              }`,
              estimatedDurationMinutes: 4,
              alternatives: [
                {
                  name: "Beginner Modification",
                  instructions:
                    "Reduce intensity and take longer rest periods as needed.",
                  youtubeSearchTerm: "beginner workout modifications",
                },
              ],
            },
          ];

          fallbackWeeklyPlan[`Day${i}`] = {
            dayName: dayNames[i - 1],
            focus: `${focusArea} - ${preferences.primary_goal}`,
            isWorkoutDay: true,
            duration: preferences.available_time_per_session,
            warmup: {
              exercises: [
                {
                  name: "Dynamic Warm-up",
                  duration: Math.max(
                    3,
                    Math.floor(preferences.available_time_per_session * 0.1),
                  ),
                  instructions:
                    "Perform light movements like arm circles, leg swings, and gentle stretches to prepare your body for exercise.",
                },
              ],
            },
            mainWorkout: dayExercises,
            cooldown: {
              exercises: [
                {
                  name: "Cool-down Stretches",
                  duration: Math.max(
                    2,
                    Math.floor(preferences.available_time_per_session * 0.1),
                  ),
                  instructions:
                    "Perform gentle static stretches holding each position for 15-30 seconds.",
                },
              ],
            },
          };
        } else {
          fallbackWeeklyPlan[`Day${i}`] = {
            dayName: dayNames[i - 1],
            focus: "Rest",
            isWorkoutDay: false,
            duration: 0,
            warmup: { exercises: [] },
            mainWorkout: [],
            cooldown: { exercises: [] },
          };
        }
      }

      parsedPlan = {
        weeklyPlan: fallbackWeeklyPlan,
        progressionPlan: [
          "Week 2: Increase reps by 2-3 per set or add 5-10 seconds to holds.",
          "Week 3: Increase sets by 1 for 1-2 exercises per session.",
        ],
        nutritionTips: [
          `For ${preferences.primary_goal}: ${
            preferences.primary_goal === "Muscle Gain"
              ? "Focus on high-protein meals (e.g., chicken, eggs, legumes) to support muscle recovery."
              : preferences.primary_goal === "Weight Loss"
                ? "Maintain a calorie deficit with balanced meals rich in vegetables and lean proteins."
                : "Eat a balanced diet with adequate protein, carbs, and fats."
          }`,
          "Stay hydrated with 2-3 liters of water daily.",
          "Eat a small meal/snack 1-2 hours before workouts.",
        ],
        recoveryTips: [
          "Aim for 7-8 hours of sleep nightly.",
          "Incorporate active recovery (e.g., walking) on rest days.",
          "Use foam rolling or stretching to reduce muscle soreness.",
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
        generated_by: "openai",
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

    // Update planner data
    const { error: updateError } = await supabase
      .from("exercise_planner_data")
      .update({
        generated_plan: {
          content: generatedPlan,
          parsed_plan: parsedPlan,
          generated_at: new Date().toISOString(),
        },
        openai_prompt: prompt,
        openai_response: generatedPlan,
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
