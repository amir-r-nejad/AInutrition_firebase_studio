import { getUserProfile, getUserPlan } from "@/lib/supabase/data-service";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MealPlanGenerator from "@/features/meal-plan/components/optimized/MealPlanGenerator";
import MealPlanOverview from "@/features/meal-plan/components/optimized/MealPlanOverview";

export default async function OptimizedMealPlanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const [profile, userPlan] = await Promise.all([
    getUserProfile(),
    getUserPlan(),
  ]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Meal Plan Generator</h1>
        <p className="text-muted-foreground">
          Generate personalized meal plans based on your profile and macro targets
        </p>
      </div>

      <MealPlanGenerator profile={profile} userPlan={userPlan} />

      <MealPlanOverview />
    </div>
  );
}