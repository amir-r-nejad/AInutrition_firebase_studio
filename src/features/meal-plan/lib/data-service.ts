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
  aiPlanData: { ai_plan: any },
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // First try to update existing record
  const { data: existingPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingPlan) {
    // Update existing record
    const { error } = await supabase
      .from("meal_plans")
      .update(aiPlanData)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating AI meal plan:", error);
      throw new Error(`Failed to update AI meal plan: ${error.message}`);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: userId,
        ...aiPlanData
      });

    if (error) {
      console.error("Error inserting AI meal plan:", error);
      throw new Error(`Failed to insert AI meal plan: ${error.message}`);
    }
  }
}

export async function loadMealPlan(userId: string): Promise<MealPlan | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No data found
      return null;
    }
    console.error("Error loading meal plan:", error);
    throw new Error(`Failed to load meal plan: ${error.message}`);
  }

  return data;
}