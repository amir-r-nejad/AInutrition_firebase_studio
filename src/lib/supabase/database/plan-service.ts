"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserPlanType } from "@/lib/schemas"

export async function getUserPlan(userId: string): Promise<UserPlanType> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("smart_plan").select("*").eq("user_id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("User plan not found")
    }
    throw new Error(`Failed to fetch user plan: ${error.message}`)
  }

  return data as UserPlanType
}

export async function updateUserPlan(userId: string, planData: Partial<UserPlanType>): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("smart_plan").update(planData).eq("user_id", userId)

  if (error) {
    if (error.code === "23505") {
      throw new Error("Plan data conflicts with existing records")
    }
    throw new Error(`Failed to update user plan: ${error.message}`)
  }
}

export async function createUserPlan(userId: string, planData: Partial<UserPlanType>): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("smart_plan").insert({
    user_id: userId,
    ...planData,
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("User plan already exists")
    }
    throw new Error(`Failed to create user plan: ${error.message}`)
  }
}

export async function resetUserPlan(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("smart_plan")
    .update({
      bmr_kcal: null,
      maintenance_calories_tdee: null,
      target_daily_calories: null,
      target_protein_g: null,
      target_protein_percentage: null,
      target_carbs_g: null,
      target_carbs_percentage: null,
      target_fat_g: null,
      target_fat_percentage: null,
      custom_total_calories: null,
      custom_protein_per_kg: null,
      remaining_calories_carbs_percentage: null,
      custom_total_calories_final: null,
      custom_protein_g: null,
      custom_protein_percentage: null,
      custom_carbs_g: null,
      custom_carbs_percentage: null,
      custom_fat_g: null,
      custom_fat_percentage: null,
    })
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to reset user plan: ${error.message}`)
  }
}
