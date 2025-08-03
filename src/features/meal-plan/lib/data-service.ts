"use server";

import { getUser } from "@/features/profile/lib/data-services";
import {
  GeneratePersonalizedMealPlanOutput,
  DailyMealPlan,
  WeeklyMealPlan,
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { revalidatePath, revalidateTag } from "next/cache";

export async function editMealPlan(
  mealPlan: { meal_data: WeeklyMealPlan },
  userId?: string,
): Promise<DailyMealPlan> {
  const supabase = await createClient();
  const targetUserId = userId || (await getUser()).id;

  if (!targetUserId) throw new Error("User not authenticated");

  console.log(
    "Updating meal_plan for user:",
    targetUserId,
    JSON.stringify(mealPlan, null, 2),
  );

  const { data, error } = await supabase
    .from("meal_plans")
    .update(mealPlan)
    .eq("user_id", targetUserId)
    .select()
    .single();

  if (error) {
    console.error("Error updating meal_plan:", JSON.stringify(error, null, 2));
    if (error.code === "PGRST116")
      throw new Error("No meal plan found to update for this user");
    if (error.code === "23505")
      throw new Error("Meal plan update conflict - please try again");
    throw new Error(`Failed to update meal plan: ${error.message}`);
  }

  console.log("Updated meal_plan:", JSON.stringify(data, null, 2));
  revalidatePath("/meal-plan/current");
  return data as DailyMealPlan;
}

export async function editAiPlan(
  aiPlan: {
    ai_plan: GeneratePersonalizedMealPlanOutput;
  },
  userId?: string,
): Promise<GeneratePersonalizedMealPlanOutput> {
  const supabase = await createClient();
  const user = await getUser();
  const targetUserId = userId || user.id;

  if (!targetUserId) {
    console.error("Authentication error: No user ID found");
    throw new Error("User not authenticated");
  }

  console.log(
    "Updating ai_plan for user:",
    targetUserId,
    JSON.stringify(aiPlan, null, 2),
  );

  try {
    // Create the upsert data with proper structure
    const upsertData = {
      user_id: targetUserId,
      ai_plan: aiPlan.ai_plan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("meal_plans")
      .upsert(upsertData, { 
        onConflict: "user_id",
        ignoreDuplicates: false 
      })
      .select("ai_plan")
      .single();

    if (error) {
      console.error(
        "Error updating/inserting ai_plan:",
        JSON.stringify(error, null, 2),
      );

      // Try insert if upsert failed
      if (error.code === "PGRST116" || error.code === "42P01") {
        console.log("Attempting direct insert...");
        const { data: insertData, error: insertError } = await supabase
          .from("meal_plans")
          .insert(upsertData)
          .select("ai_plan")
          .single();

        if (insertError) {
          console.error("Insert error:", JSON.stringify(insertError, null, 2));
          throw new Error(`Failed to create AI-generated plan: ${insertError.message}`);
        }

        console.log("Successfully inserted ai_plan:", JSON.stringify(insertData.ai_plan, null, 2));
        revalidatePath("/meal-plan/current");
        revalidateTag("meal_plan");
        return insertData.ai_plan as GeneratePersonalizedMealPlanOutput;
      }

      throw new Error(`Failed to update AI-generated plan: ${error.message}`);
    }

    console.log(
      "Successfully updated ai_plan:",
      JSON.stringify(data.ai_plan, null, 2),
    );
    revalidatePath("/meal-plan/current");
    revalidateTag("meal_plan");
    return data.ai_plan as GeneratePersonalizedMealPlanOutput;
  } catch (e) {
    console.error("Unexpected error in editAiPlan:", e);
    throw e;
  }
}

export async function loadMealPlan(
  userId?: string,
): Promise<GeneratePersonalizedMealPlanOutput> {
  const supabase = await createClient();
  const targetUserId = userId || (await getUser()).id;

  if (!targetUserId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .select("ai_plan")
    .eq("user_id", targetUserId)
    .single();

  if (error) {
    console.error("Error loading meal plan:", JSON.stringify(error, null, 2));
    if (error.code === "PGRST116")
      throw new Error("No meal plan found for this user");
    throw new Error(`Failed to load meal plan: ${error.message}`);
  }

  if (!data || !data.ai_plan) {
    throw new Error("No AI plan data found");
  }

  let parsedPlan: GeneratePersonalizedMealPlanOutput;
  try {
    // Handle both string and object formats
    if (typeof data.ai_plan === "string") {
      parsedPlan = JSON.parse(data.ai_plan);
    } else if (typeof data.ai_plan === "object" && data.ai_plan !== null) {
      parsedPlan = data.ai_plan;
    } else {
      throw new Error("Invalid ai_plan data type");
    }

    // Validate the structure
    if (!parsedPlan.weeklyMealPlan || !parsedPlan.weeklySummary) {
      throw new Error("Invalid meal plan structure - missing required fields");
    }

  } catch (parseError) {
    console.error(
      "Error parsing ai_plan:",
      parseError,
      "Raw data:",
      data.ai_plan,
    );
    throw new Error("Invalid meal plan data format");
  }

  console.log(
    "Loaded and parsed meal plan:",
    JSON.stringify(parsedPlan, null, 2),
  );
  return parsedPlan as GeneratePersonalizedMealPlanOutput;
}