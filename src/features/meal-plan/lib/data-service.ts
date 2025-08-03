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
  const supabase = createClient();
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
  const supabase = createClient();
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
    const { data: existingData, error: selectError } = await supabase
      .from("meal_plans")
      .select("user_id, ai_plan")
      .eq("user_id", targetUserId)
      .single();

    if (selectError) {
      console.error(
        "Error checking existing meal plan:",
        JSON.stringify(selectError, null, 2),
      );
      if (selectError.code !== "PGRST116") {
        throw new Error(
          `Failed to check existing meal plan: ${selectError.message}`,
        );
      }
    }

    const { data, error } = await supabase
      .from("meal_plans")
      .upsert(
        { user_id: targetUserId, ai_plan: aiPlan.ai_plan },
        { onConflict: "user_id" },
      )
      .select("ai_plan")
      .single();

    if (error) {
      console.error(
        "Error updating/inserting ai_plan:",
        JSON.stringify(error, null, 2),
      );
      if (error.code === "PGRST116")
        throw new Error("No meal plan found to update for this user");
      if (error.code === "23505")
        throw new Error("AI plan update conflict - please try again");
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
  const supabase = createClient();
  const targetUserId = userId || (await getUser()).id;

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

  let parsedPlan: GeneratePersonalizedMealPlanOutput;
  try {
    parsedPlan =
      typeof data.ai_plan === "string"
        ? JSON.parse(data.ai_plan)
        : data.ai_plan;
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
