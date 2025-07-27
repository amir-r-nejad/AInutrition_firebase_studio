"use server"

import { createClient } from "@/lib/supabase/server"
import type { BaseProfileData } from "@/lib/schemas"
import type { User } from "@supabase/supabase-js"

export async function getUser(): Promise<User> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(`Authentication error: ${error.message}`)
  }

  if (!user) {
    throw new Error("User not authenticated")
  }

  return user
}

export async function getUserProfile(userId: string): Promise<BaseProfileData> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("User profile not found")
    }
    throw new Error(`Failed to fetch user profile: ${error.message}`)
  }

  return data as BaseProfileData
}

export async function updateUserProfile(userId: string, profileData: Partial<BaseProfileData>): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").update(profileData).eq("id", userId)

  if (error) {
    if (error.code === "23505") {
      throw new Error("Profile data conflicts with existing records")
    }
    throw new Error(`Failed to update user profile: ${error.message}`)
  }
}

export async function createUserProfile(userId: string, profileData: Partial<BaseProfileData>): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    ...profileData,
  })

  if (error) {
    if (error.code === "23505") {
      throw new Error("User profile already exists")
    }
    throw new Error(`Failed to create user profile: ${error.message}`)
  }
}

export async function resetUserProfile(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("profiles")
    .update({
      is_onboarding_complete: false,
      age: null,
      biological_sex: null,
      height_cm: null,
      current_weight_kg: null,
      target_weight_1month_kg: null,
      long_term_goal_weight_kg: null,
      physical_activity_level: null,
      primary_diet_goal: null,
      preferred_diet: null,
      allergies: null,
      preferred_cuisines: null,
      dispreferrred_cuisines: null,
      preferred_ingredients: null,
      dispreferrred_ingredients: null,
      preferred_micronutrients: null,
      medical_conditions: null,
      medications: null,
      pain_mobility_issues: null,
      injuries: null,
      surgeries: null,
      exercise_goals: null,
      preferred_exercise_types: null,
      exercise_frequency: null,
      typical_exercise_intensity: null,
      equipment_access: null,
      bf_current: null,
      bf_target: null,
      bf_ideal: null,
      mm_current: null,
      mm_target: null,
      mm_ideal: null,
      waist_current: null,
      hips_current: null,
      right_arm_current: null,
      left_arm_current: null,
      right_leg_current: null,
      left_leg_current: null,
    })
    .eq("id", userId)

  if (error) {
    throw new Error(`Failed to reset user profile: ${error.message}`)
  }
}
