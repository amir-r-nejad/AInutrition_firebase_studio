"use server";

import { UserProfile, UserPlan } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

export async function getUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  console.log("getUser result:", {
    userId: user?.id,
    isUuid: user?.id
      ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          user.id,
        )
      : false,
    error,
  });
  if (error) throw error;
  if (!user) throw new Error("User not authenticated");
  return user;
}

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const user = await getUser();

  const { data } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("User profile not found");

  return data as UserProfile;
}

export async function getUserPlan(): Promise<UserPlan> {
  const supabase = await createClient();
  const user = await getUser();

  const { data } = await supabase
    .from("smart_plan")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("User plan not found");

  return data as UserPlan;
}
