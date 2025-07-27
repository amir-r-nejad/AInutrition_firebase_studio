
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest exercise plan preferences
    const { data: latestPlan, error } = await supabase
      .from("exercise_planner_data")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch exercise plan" }, { status: 500 });
    }

    return NextResponse.json(latestPlan || null);
  } catch (error) {
    console.error("Get latest exercise plan error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise plan" },
      { status: 500 }
    );
  }
}
