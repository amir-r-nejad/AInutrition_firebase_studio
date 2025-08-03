import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_KEY || "");

export async function POST(request: NextRequest) {
  try {
    console.log("Gemini API Key exists:", !!process.env.NEXT_PUBLIC_GEMINI_KEY);

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
    if (!process.env.NEXT_PUBLIC_GEMINI_KEY) {
      console.error("Gemini API key not found");
      return NextResponse.json(
        {
          error: "Gemini API key not configured",
          details: "Please set NEXT_PUBLIC_GEMINI_KEY environment variable",
        },
        { status: 500 },
      );
    }

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get user profile data
    const { data: profileData } = await supabase
      .from("profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Optimized Prompt
    const prompt = `You are a professional fitness trainer tasked with creating a personalized weekly exercise plan in JSON format.

        CRITICAL INSTRUCTIONS:
        - Return ONLY valid JSON without comments, explanations, or additional text.
        - Ensure JSON is properly formatted with no trailing commas or syntax errors.
        - Generate a complete 7-day weekly plan, with workouts distributed across ${preferences.exercise_days_per_week} days, including rest days.
        - Distribute workout days evenly (e.g., 3 days: Monday, Wednesday, Friday; 4 days: Monday, Tuesday, Thursday, Friday; 5 days: Monday to Friday).
        - Each workout day must include:
          - 6-8 main exercises tailored to user preferences, equipment, and limitations.
          - Warm-up (10-15% of session duration, 5-8 minutes total).
          - Cool-down (10-15% of session duration, 3-5 minutes total).
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
        - Provide detailed instructions and YouTube search terms for each exercise and its alternatives.

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
                      3,
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
          }
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

        Ensure the plan is complete, balanced, and tailored to the user's needs.`;

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
      console.log("Successfully parsed JSON from Gemini");
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini:", parseError);
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
            alternatives: [
              {
                name: "Incline Push-ups",
                instructions:
                  "Place hands on an elevated surface like a bench or step. Perform push-up motion with easier angle.",
                youtubeSearchTerm: "incline push ups tutorial",
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
            ],
          },
        ],
      };

      const fallbackWeeklyPlan: { [key: string]: any } = {};
      for (let i = 1; i <= 7; i++) {
        if (i <= preferences.exercise_days_per_week) {
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
              youtubeSearchTerm: `${
                preferences.primary_goal?.toLowerCase() || "general"
              } ${
                preferences.fitness_level?.toLowerCase() || "beginner"
              } workout ${
                preferences.available_equipment?.join(" ").toLowerCase() ||
                "bodyweight"
              }`,
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
                    5,
                    Math.floor(preferences.available_time_per_session * 0.12),
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
                    3,
                    Math.floor(preferences.available_time_per_session * 0.08),
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

    // Update planner data
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
