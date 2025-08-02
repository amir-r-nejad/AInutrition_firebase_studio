//import { editMealPlan } from "@/features/meal-plan/lib/data-service";
import { getUserProfile, getUserPlan } from "@/lib/supabase/data-service";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MealPlanGenerator from "@/features/meal-plan/components/optimized/MealPlanGenerator";
import MealPlanOverview from "@/features/meal-plan/components/optimized/MealPlanOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default async function OptimizedMealPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const [profile, userPlan, mealPlan] = await Promise.all([
    getUserProfile(),
    getUserPlan(),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  if (!userPlan) {
    redirect("/tools/smart-calorie-planner");
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">AI Meal Plan</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Generate a personalized 7-day meal plan with precise macro
          distributions based on your profile and macro splitter settings.
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {userPlan.custom_total_calories ??
                  userPlan.target_daily_calories}
              </p>
              <p className="text-sm text-muted-foreground">Daily Calories</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {userPlan.custom_protein_g ?? userPlan.target_protein_g}g
              </p>
              <p className="text-sm text-muted-foreground">Protein</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {userPlan.custom_carbs_g ?? userPlan.target_carbs_g}g
              </p>
              <p className="text-sm text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {userPlan.custom_fat_g ?? userPlan.target_fat_g}g
              </p>
              <p className="text-sm text-muted-foreground">Fat</p>
            </div>
          </div>

          {profile.meal_distributions && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Meal Distribution:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {profile.meal_distributions.map((dist: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between p-2 bg-muted/30 rounded"
                  >
                    <span>{dist.mealName}:</span>
                    <span>{dist.calories_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meal Plan Generator */}
      <MealPlanGenerator
        profile={profile}
        userPlan={userPlan}
        mealPlan={mealPlan}
      />

      {/* Generated Meal Plan Overview */}
      {mealPlan?.ai_plan && <MealPlanOverview mealPlan={mealPlan} />}
    </div>
  );
}
