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

    // Calculate appropriate number of exercises based on session duration
    const calculateExerciseCount = (duration: number): number => {
      if (duration <= 20) return 3;
      if (duration <= 30) return 4;
      if (duration <= 45) return 6;
      if (duration <= 60) return 8;
      return 10;
    };
    
    const exerciseCount = calculateExerciseCount(preferences.available_time_per_session);

    // Comprehensive prompt using all user preferences
    const prompt = `Create a personalized ${preferences.exercise_days_per_week}-day workout plan based on these user preferences:

BASIC FITNESS INFORMATION:
- Fitness Level: ${preferences.fitness_level || "Beginner"}
- Exercise Experience: ${preferences.exercise_experience?.join(", ") || "None"}
- Exercise Experience Other: ${preferences.exercise_experience_other || "None"}

HEALTH & MEDICAL INFORMATION:
- Medical Conditions: ${preferences.existing_medical_conditions?.join(", ") || "None"}
- Medical Conditions Other: ${preferences.existing_medical_conditions_other || "None"}
- Injuries/Limitations: ${preferences.injuries_or_limitations || "None"}
- Current Medications: ${preferences.current_medications?.join(", ") || "None"}
- Medications Other: ${preferences.current_medications_other || "None"}

FITNESS GOALS:
- Primary Goal: ${preferences.primary_goal || "General fitness"}
- Secondary Goal: ${preferences.secondary_goal || "None"}
- Goal Timeline: ${preferences.goal_timeline_weeks || 12} weeks
- Target Weight: ${preferences.target_weight_kg || "Not specified"} kg
- Muscle Groups Focus: ${preferences.muscle_groups_focus?.join(", ") || "Full body"}

LIFESTYLE & SCHEDULE:
- Workout Days Per Week: ${preferences.exercise_days_per_week || 3}
- Time Per Session: ${preferences.available_time_per_session || 30} minutes
- Preferred Time: ${preferences.preferred_time_of_day || "Flexible"}
- Exercise Location: ${preferences.exercise_location || "Home"}
- Daily Steps: ${preferences.daily_step_count_avg || 5000}
- Job Type: ${preferences.job_type || "Desk job"}

EQUIPMENT & SPACE:
- Available Equipment: ${preferences.available_equipment?.join(", ") || "None"}
- Equipment Other: ${preferences.available_equipment_other || "None"}
- Gym Machines Access: ${preferences.machines_access ? "Yes" : "No"}
- Space Availability: ${preferences.space_availability || "Small room"}

PREFERENCES & TRACKING:
- Difficulty Level: ${preferences.preferred_difficulty_level || "Medium"}
- Sleep Quality: ${preferences.sleep_quality || "Good"}
- Track Progress: ${preferences.want_to_track_progress ? "Yes" : "No"}
- Weekly Check-ins: ${preferences.weekly_checkins_enabled ? "Yes" : "No"}
- Accountability Support: ${preferences.accountability_support ? "Yes" : "No"}

CRITICAL REQUIREMENTS:
- Create EXACTLY ${preferences.exercise_days_per_week} workout days with isWorkoutDay: true
- The remaining ${7 - preferences.exercise_days_per_week} days should have isWorkoutDay: false (rest days)
- Use ONLY the available equipment: ${preferences.available_equipment?.join(", ") || "Bodyweight"}
- IMPORTANT: You MUST use ALL available equipment types in EACH workout day - combine them all!
- Mix different equipment types within the same workout session for maximum variety
- Respect space limitations: ${preferences.space_availability}
- Each workout should be ${preferences.available_time_per_session} minutes
- Calculate appropriate number of exercises based on session duration:
  * 15-30 minutes: 3-4 exercises
  * 30-60 minutes: 5-7 exercises  
  * 60+ minutes: 8-12 exercises
- For this ${preferences.available_time_per_session}-minute session, include approximately ${exerciseCount} exercises
- Consider fitness level: ${preferences.fitness_level}
- Focus on goal: ${preferences.primary_goal}
- Account for medical conditions: ${preferences.existing_medical_conditions?.join(", ") || "None"}
- Adjust exercise intensity based on difficulty level: ${preferences.preferred_difficulty_level}

WORKOUT DIVERSITY REQUIREMENTS:
- Each workout day MUST have a DIFFERENT focus to ensure balanced training
- For 3-day plans: Use "Upper Body Strength", "Lower Body Strength", "Cardio & Core"
- For 4-day plans: Use "Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT"
- For 5+ day plans: Use "Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT", "Flexibility & Recovery"
- Vary the focus field to reflect the specific muscle groups being targeted each day
- Ensure exercises match the daily focus (e.g., Upper Body day should focus on chest, back, shoulders, arms)

EQUIPMENT USAGE REQUIREMENTS:
- You have access to: ${preferences.available_equipment?.join(", ") || "Bodyweight"}
- MUST use ALL available equipment types in EACH workout day to maximize variety
- Combine different equipment types within the same workout session
- Example: If user has "Dumbbells, Resistance Bands, Yoga Mat":
  * Each workout day should include exercises using dumbbells, resistance bands, AND yoga mat
  * Mix equipment types throughout the workout (e.g., dumbbell squats, resistance band rows, yoga mat stretches)
- Create exercises that specifically utilize each piece of available equipment in every workout
- Don't limit yourself to one equipment type per day - use them all!

Return JSON format with weeklyPlan containing 7 days, where each day has:
- dayName (must be "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"), focus, isWorkoutDay, duration (MUST be a NUMBER in minutes, e.g., 60)
- warmup: {exercises: [{name, duration, instructions}]}
- mainWorkout: [{exerciseName, targetMuscles (ARRAY), sets (NUMBER), reps (STRING), restSeconds (NUMBER), instructions, youtubeSearchTerm, alternatives (ARRAY of objects with name, instructions, youtubeSearchTerm)}]
- cooldown: {exercises: [{name, duration, instructions}]}

IMPORTANT: 
- dayName must be the actual day name (Monday, Tuesday, etc.) NOT "Day1", "Day2"
- duration must be a NUMBER in minutes (e.g., 60) NOT a string like "60 minutes"
- focus must be DIFFERENT for each workout day (e.g., "Upper Body Strength", "Lower Body Strength", "Cardio & Core")
- targetMuscles must be an ARRAY of strings (e.g., ["Chest", "Shoulders"])
- sets must be a NUMBER (e.g., 3)
- reps must be a STRING (e.g., "8-12")
- restSeconds must be a NUMBER (e.g., 60)
- alternatives must be an ARRAY of objects with: {name: "Alternative Name", instructions: "How to do it", youtubeSearchTerm: "search term"}
- ALWAYS include 2-3 alternative exercises for each main exercise
- Alternatives should be easier or harder versions of the main exercise
- VARY the exercises between days - don't repeat the same exercises on different days
- Match exercises to the daily focus (Upper Body day = chest/back/shoulders, Lower Body day = legs/glutes, etc.)

Also include progressionTips and safetyNotes arrays.`;

    console.log("Sending request to OpenAI API...");

    let generatedPlan = "";
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a professional fitness trainer. Create personalized exercise plans in JSON format only. Use ONLY the equipment specified by the user and make sure to use ALL available equipment types in EACH workout day. Combine different equipment types within the same workout session for maximum variety. Respect their space limitations, fitness level, medical conditions, and time constraints. Focus on their specific goals. No explanations, just the JSON response."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 1,
          max_tokens: 16000
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
    let parsedPlan: any;
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

      // Ensure all exercises have proper format
      if (parsedPlan?.weeklyPlan) {
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        
        Object.entries(parsedPlan.weeklyPlan).forEach(([dayKey, day]: [string, any]) => {
          // Set dayName from the key if it's missing
          if (!day.dayName) {
            day.dayName = dayKey;
          }
          
          // Ensure duration is always a number
          if (day.duration) {
            // Extract number from string like "60 minutes" or "60"
            const durationMatch = day.duration.toString().match(/(\d+)/);
            day.duration = durationMatch ? parseInt(durationMatch[1], 10) : 0;
          } else {
            day.duration = 0;
          }
          
          if (day.mainWorkout && Array.isArray(day.mainWorkout)) {
            day.mainWorkout.forEach((exercise: any) => {
              // Ensure reps is always a string for display
              if (exercise.reps && typeof exercise.reps === 'string') {
                exercise.reps = exercise.reps.toString();
              } else if (!exercise.reps) {
                exercise.reps = "8-12";
              }
              
              // Ensure targetMuscles is always an array
              if (!exercise.targetMuscles) {
                exercise.targetMuscles = ["Full Body"];
              } else if (!Array.isArray(exercise.targetMuscles)) {
                exercise.targetMuscles = [exercise.targetMuscles.toString()];
              }
              
              // Ensure sets is a number
              if (!exercise.sets || isNaN(exercise.sets)) {
                exercise.sets = 3;
              }
              
              // Ensure restSeconds is a number
              if (!exercise.restSeconds || isNaN(exercise.restSeconds)) {
                exercise.restSeconds = 60;
              }
              
              // Ensure instructions exist
              if (!exercise.instructions) {
                exercise.instructions = "Perform this exercise with proper form.";
              }
              
              // Ensure youtubeSearchTerm exists
              if (!exercise.youtubeSearchTerm) {
                exercise.youtubeSearchTerm = exercise.exerciseName?.toLowerCase().replace(/\s+/g, ' ') || "exercise tutorial";
              }
              
              // Ensure alternatives is an array of proper objects
              if (!exercise.alternatives || !Array.isArray(exercise.alternatives)) {
                exercise.alternatives = [];
              } else {
                // Validate each alternative has required properties
                exercise.alternatives = exercise.alternatives.map((alt: any) => ({
                  name: alt.name || "Alternative Exercise",
                  instructions: alt.instructions || "Perform this alternative exercise with proper form.",
                  youtubeSearchTerm: alt.youtubeSearchTerm || alt.name?.toLowerCase().replace(/\s+/g, ' ') || "alternative exercise"
                }));
              }
            });
          }
        });
      }

      // Validate workout day count and fix if incorrect
      if (parsedPlan?.weeklyPlan) {
        const workoutDays = Object.values(parsedPlan.weeklyPlan).filter((day: any) => day.isWorkoutDay);
        const expectedWorkoutDays = preferences.exercise_days_per_week;
        
        console.log(`Expected workout days: ${expectedWorkoutDays}, Got: ${workoutDays.length}`);
        
        if (workoutDays.length !== expectedWorkoutDays) {
          console.log("Workout day count mismatch, fixing...");
          
          // Reset all days to rest days first
          Object.keys(parsedPlan.weeklyPlan).forEach(dayKey => {
            parsedPlan.weeklyPlan[dayKey].isWorkoutDay = false;
            parsedPlan.weeklyPlan[dayKey].duration = 0;
            parsedPlan.weeklyPlan[dayKey].focus = "Rest";
            parsedPlan.weeklyPlan[dayKey].mainWorkout = [];
          });
          
          // Set the first N days as workout days
          const dayKeys = Object.keys(parsedPlan.weeklyPlan);
          for (let i = 0; i < expectedWorkoutDays && i < dayKeys.length; i++) {
            const dayKey = dayKeys[i];
            parsedPlan.weeklyPlan[dayKey].isWorkoutDay = true;
            parsedPlan.weeklyPlan[dayKey].duration = parseInt(preferences.available_time_per_session.toString(), 10);
            
            // If no mainWorkout exists, create a basic one
            if (!parsedPlan.weeklyPlan[dayKey].mainWorkout || parsedPlan.weeklyPlan[dayKey].mainWorkout.length === 0) {
              parsedPlan.weeklyPlan[dayKey].focus = parsedPlan.weeklyPlan[dayKey].focus !== "Rest" ? parsedPlan.weeklyPlan[dayKey].focus : "Full Body";
              parsedPlan.weeklyPlan[dayKey].mainWorkout = [{
                exerciseName: "Bodyweight Exercise",
                targetMuscles: ["Full Body"],
                sets: 3,
                reps: "8-12",
                restSeconds: 60,
                instructions: "Perform bodyweight exercises appropriate for your fitness level.",
                youtubeSearchTerm: "bodyweight workout",
                alternatives: [{ name: "Modified version", instructions: "Reduce intensity as needed" }]
              }];
            }
          }
        }
        
        // Ensure workout focuses are diverse
        const workoutDaysWithFocus = Object.values(parsedPlan.weeklyPlan).filter((day: any) => day.isWorkoutDay);
        const focuses = workoutDaysWithFocus.map((day: any) => day.focus);
        const uniqueFocuses = [...new Set(focuses)];
        
        if (uniqueFocuses.length < workoutDaysWithFocus.length) {
          console.log("Detected duplicate focuses, fixing diversity...");
          
          // Define focus templates based on number of workout days
          const focusTemplates = {
            3: ["Upper Body Strength", "Lower Body Strength", "Cardio & Core"],
            4: ["Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT"],
            5: ["Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT", "Flexibility & Recovery"],
            6: ["Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT", "Flexibility & Recovery", "Functional Training"],
            7: ["Upper Body Strength", "Lower Body Strength", "Cardio & Core", "Full Body HIIT", "Flexibility & Recovery", "Functional Training", "Active Recovery"]
          };
          
          const template = focusTemplates[expectedWorkoutDays as keyof typeof focusTemplates] || focusTemplates[3];
          const workoutDayKeys = Object.keys(parsedPlan.weeklyPlan).filter(key => parsedPlan.weeklyPlan[key].isWorkoutDay);
          
          workoutDayKeys.forEach((dayKey, index) => {
            if (template[index]) {
              parsedPlan.weeklyPlan[dayKey].focus = template[index];
            }
          });
        }
        
        // Validate equipment usage
        const availableEquipment = preferences.available_equipment || ["Bodyweight"];
        if (availableEquipment.length > 1) {
          console.log("Validating equipment usage across workout days...");
          
          // Check if all equipment types are being used
          const allExercises = workoutDaysWithFocus.flatMap((day: any) => 
            (day.mainWorkout || []).map((exercise: any) => exercise.exerciseName?.toLowerCase() || "")
          );
          
          const equipmentUsage = availableEquipment.map((equipment: string) => {
            const equipmentLower = equipment.toLowerCase();
            return {
              equipment,
              used: allExercises.some(exercise => 
                exercise.includes(equipmentLower) || 
                (equipmentLower === "dumbbells" && (exercise.includes("dumbbell") || exercise.includes("weight"))) ||
                (equipmentLower === "resistance bands" && (exercise.includes("band") || exercise.includes("resistance"))) ||
                (equipmentLower === "yoga mat" && (exercise.includes("yoga") || exercise.includes("mat"))) ||
                (equipmentLower === "kettlebell" && exercise.includes("kettlebell")) ||
                (equipmentLower === "barbell" && exercise.includes("barbell")) ||
                (equipmentLower === "pull-up bar" && (exercise.includes("pull") || exercise.includes("chin")))
              )
            };
          });
          
          const unusedEquipment = equipmentUsage.filter((eq: any) => !eq.used);
          if (unusedEquipment.length > 0) {
            console.log(`Warning: Some equipment not being used: ${unusedEquipment.map((eq: any) => eq.equipment).join(", ")}`);
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse JSON from OpenAI:", parseError);
      console.log("Raw response length:", generatedPlan.length);
      console.log("Raw response preview:", generatedPlan.substring(0, 500));
      console.log("Parse error details:", parseError);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      let cleanedResponse = generatedPlan;
      if (cleanedResponse.includes("```json")) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1];
        }
      }
      
      try {
        parsedPlan = JSON.parse(cleanedResponse);
        console.log("Successfully parsed JSON after cleaning");
      } catch (secondParseError) {
        console.error("Second parse attempt failed:", secondParseError);
        return NextResponse.json(
          {
            error: "Failed to generate exercise plan",
            details: "AI response could not be parsed. Please try again.",
          },
          { status: 500 },
        );
      }
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
