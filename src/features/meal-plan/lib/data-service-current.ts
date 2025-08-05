
"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/data-service-current";
import { WeeklyMealPlan } from "@/lib/schemas";

export async function editMealPlan(
  mealPlan: { meal_data: WeeklyMealPlan },
  userId?: string,
): Promise<any> {
  const supabase = await createClient();
  const user = await getUser();
  const targetUserId = userId || user.id;

  if (!targetUserId) {
    console.error("Authentication error: No user ID found");
    throw new Error("User not authenticated");
  }

  console.log(
    "Upserting meal_plans_current for user:",
    targetUserId,
    JSON.stringify(mealPlan, null, 2),
  );

  try {
    // Create the upsert data with proper structure
    const upsertData = {
      user_id: targetUserId,
      meal_data: mealPlan.meal_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("meal_plans_current")
      .upsert(upsertData, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Error upserting meal_plan:",
        JSON.stringify(error, null, 2),
      );

      // Try insert if upsert failed
      if (error.code === "PGRST116" || error.code === "42P01") {
        console.log("Attempting direct insert...");
        const { data: insertData, error: insertError } = await supabase
          .from("meal_plans_current")
          .insert(upsertData)
          .select("*")
          .single();

        if (insertError) {
          console.error(
            "Insert error:",
            JSON.stringify(insertError, null, 2),
          );
          throw new Error(`Failed to insert meal plan: ${insertError.message}`);
        }

        console.log("Inserted meal_plan:", JSON.stringify(insertData, null, 2));
        return insertData;
      }

      throw new Error(`Failed to upsert meal plan: ${error.message}`);
    }

    console.log("Upserted meal_plan:", JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    console.error("Unexpected error in editMealPlan:", error);
    throw new Error(
      error.message ||
        "Something went wrong while saving the meal plan. Please try again.",
    );
  }
}
