"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedMealPlan } from "@/ai/flows/generate-meal-plan";
import {
  editAiPlan,
  editMealPlan,
  loadMealPlan,
} from "@/features/meal-plan/lib/data-service";
import { Loader2, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import MealPlanOverview from "./MealPlanOverview";
import {
  GeneratePersonalizedMealPlanOutput,
  DailyMealPlan,
  WeeklyMealPlan,
} from "@/lib/schemas";

interface MealPlanGeneratorProps {
  profile: any;
  userPlan: any;
  initialMealPlan?: { ai_plan?: GeneratePersonalizedMealPlanOutput } | null;
}

export default function MealPlanGenerator({
  profile,
  userPlan,
  initialMealPlan,
}: MealPlanGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();
  const [generatedPlan, setGeneratedPlan] =
    useState<GeneratePersonalizedMealPlanOutput | null>(
      initialMealPlan?.ai_plan || null,
    );
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // لود اولیه داده‌ها
  useEffect(() => {
    async function fetchInitialPlan() {
      try {
        setLoadingPlan(true);
        setError(null);
        const plan = await loadMealPlan(); // لود داده‌ها از Supabase
        setGeneratedPlan(plan);
        console.log("Successfully loaded initial plan:", plan);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error loading meal plan";
        // Don't set error if no meal plan exists - this is expected for new users
        if (!errorMessage.includes("No meal plan found")) {
          setError(errorMessage);
        }
        console.log("No existing meal plan found or error:", errorMessage);
      } finally {
        setLoadingPlan(false);
      }
    }

    // Only fetch if we don't have an initial plan and we're not currently loading
    if (!initialMealPlan?.ai_plan && !generatedPlan && !isLoading && loadingPlan) {
      fetchInitialPlan();
    } else if (initialMealPlan?.ai_plan && !generatedPlan) {
      setGeneratedPlan(initialMealPlan.ai_plan);
      setLoadingPlan(false);
    }
  }, [initialMealPlan, generatedPlan, isLoading, loadingPlan]);

  async function handleGeneratePlan() {
    startTransition(async () => {
      try {
        console.log(
          "Starting handleGeneratePlan with profile:",
          JSON.stringify(profile, null, 2),
        );
        console.log(
          "Starting handleGeneratePlan with userPlan:",
          JSON.stringify(userPlan, null, 2),
        );

        // Validate profile
        if (!profile || Object.keys(profile).length === 0) {
          throw new Error("Profile is incomplete");
        }

        // Validate meal distributions
        if (
          !profile.meal_distributions ||
          !Array.isArray(profile.meal_distributions) ||
          profile.meal_distributions.length !== 6
        ) {
          throw new Error("Meal distributions must be configured for 6 meals");
        }

        // Validate percentages
        const totalPercentage = profile.meal_distributions.reduce(
          (sum: number, dist: any) => sum + (dist.calories_pct || 0),
          0,
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new Error(
            `Meal percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`,
          );
        }

        // Validate meal distributions
        for (const dist of profile.meal_distributions) {
          if (
            !dist.mealName ||
            typeof dist.calories_pct !== "number" ||
            dist.calories_pct <= 0
          ) {
            throw new Error(
              `Invalid meal distribution for ${dist.mealName || "a meal"}: mealName and calories_pct must be valid (calories_pct > 0)`,
            );
          }
        }

        // Validate user plan
        if (!userPlan) {
          throw new Error("User plan is missing");
        }
        const macroTargets = {
          target_dailyCalories:
            userPlan.custom_total_calories ??
            userPlan.target_daily_calories ??
            0,
          target_protein_g:
            userPlan.custom_protein_g ?? userPlan.target_protein_g ?? 0,
          target_carbs_g:
            userPlan.custom_carbs_g ?? userPlan.target_carbs_g ?? 0,
          target_fat_g: userPlan.custom_fat_g ?? userPlan.target_fat_g ?? 0,
        };

        // Validate macro targets
        if (
          !Number.isFinite(macroTargets.target_dailyCalories) ||
          macroTargets.target_dailyCalories <= 0 ||
          !Number.isFinite(macroTargets.target_protein_g) ||
          macroTargets.target_protein_g < 0 ||
          !Number.isFinite(macroTargets.target_carbs_g) ||
          macroTargets.target_carbs_g < 0 ||
          !Number.isFinite(macroTargets.target_fat_g) ||
          macroTargets.target_fat_g < 0
        ) {
          throw new Error(
            "Invalid macro targets: Calories, protein, carbs, and fat must be valid positive numbers",
          );
        }

        console.log(
          "🚀 Generating AI meal plan with macroTargets:",
          JSON.stringify(macroTargets, null, 2),
        );
        console.log(
          "Meal distributions:",
          JSON.stringify(profile.meal_distributions, null, 2),
        );

        // Generate meal targets
        const mealTargets = profile.meal_distributions.map((dist: any) => {
          const calories =
            (macroTargets.target_dailyCalories * dist.calories_pct) / 100;
          const protein =
            (macroTargets.target_protein_g * dist.calories_pct) / 100;
          const carbs = (macroTargets.target_carbs_g * dist.calories_pct) / 100;
          const fat = (macroTargets.target_fat_g * dist.calories_pct) / 100;

          if (
            !Number.isFinite(calories) ||
            calories <= 0 ||
            !Number.isFinite(protein) ||
            !Number.isFinite(carbs) ||
            !Number.isFinite(fat)
          ) {
            throw new Error(
              `Invalid calculated macros for meal ${dist.mealName}: Calories, protein, carbs, and fat must be valid positive numbers`,
            );
          }

          return {
            mealName: dist.mealName,
            calories,
            protein,
            carbs,
            fat,
          };
        });

        console.log(
          "Prepared mealTargets:",
          JSON.stringify(mealTargets, null, 2),
        );

        const result = await generatePersonalizedMealPlan({
          mealTargets,
          age: profile.age,
          biological_sex: profile.biological_sex,
          height_cm: profile.height_cm,
          current_weight: profile.current_weight_kg,
          target_weight: profile.target_weight_1month_kg,
          physical_activity_level: profile.physical_activity_level,
          primary_diet_goal: profile.primary_diet_goal,
          preferred_diet: profile.preferred_diet,
          allergies: profile.allergies || [],
          dispreferrred_ingredients: profile.dispreferred_ingredients || [],
          preferred_ingredients: profile.preferred_ingredients || [],
          preferredCuisines: profile.preferred_cuisines || [],
          dispreferredCuisines: profile.dispreferred_cuisines || [],
          medical_conditions: profile.medical_conditions || [],
          medications: profile.medications || [],
        });

        console.log(
          "Generated meal plan from generatePersonalizedMealPlan:",
          JSON.stringify(result, null, 2),
        );

        if (!result || !result.weeklyMealPlan || !result.weeklySummary) {
          throw new Error("Invalid meal plan data returned from API");
        }

        // Save to database
        console.log(
          "Calling editAiPlan with:",
          JSON.stringify({ ai_plan: result }, null, 2),
        );
        const savedPlan = await editAiPlan({
          ai_plan: {
            weeklyMealPlan: result.weeklyMealPlan,
            weeklySummary: result.weeklySummary,
          },
        });

        console.log(
          "Saved plan from editAiPlan:",
          JSON.stringify(savedPlan, null, 2),
        );

        // لود داده‌های به‌روز
        const updatedPlan = await loadMealPlan(); // به جای editMealPlan
        console.log(
          "Loaded updated meal plan:",
          JSON.stringify(updatedPlan, null, 2),
        );
        setGeneratedPlan(updatedPlan);

        toast({
          title: "Success!",
          description:
            "Your AI meal plan has been generated with precise macro distributions.",
        });
      } catch (error: any) {
        console.error("❌ Meal plan generation error:", error);
        let errorMessage = "Failed to generate meal plan.";
        if (error instanceof TypeError && error.message.includes("fetch")) {
          errorMessage =
            "Network error: Failed to connect to AI service or database.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  // Check if requirements are met
  const hasProfile = profile && Object.keys(profile).length > 0;
  const hasMacroDistributions = profile?.meal_distributions?.length === 6;
  const hasValidPercentages =
    hasMacroDistributions &&
    Math.abs(
      profile.meal_distributions.reduce(
        (sum: number, dist: any) => sum + (dist.calories_pct || 0),
        0,
      ) - 100,
    ) < 0.01;

  const canGenerate =
    hasProfile && hasMacroDistributions && hasValidPercentages;

  const totalPercentage = profile?.meal_distributions?.reduce(
    (sum: number, dist: any) => sum + (dist.calories_pct || 0),
    0,
  );

  return (
    <div className="w-full max-w-none">
      <div className="space-y-6">
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Generation Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Generator Controls */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Meal Plan Generator
              </CardTitle>
              <CardDescription>
                Generate a personalized meal plan based on your profile, goals,
                and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status checks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      profile ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">Profile completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      userPlan && hasMacroDistributions
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    Macro distributions configured (6 meals)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      totalPercentage === 100 ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-sm">Percentages sum to {totalPercentage?.toFixed(1) || 0}%</span>
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGeneratePlan}
                disabled={
                  isLoading ||
                  !profile ||
                  !userPlan ||
                  profile?.meal_distributions?.length !== 6 ||
                  totalPercentage !== 100
                }
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating AI meal plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Meal Plan
                  </>
                )}
              </Button>
              <Button
                onClick={async () => {
                  startTransition(async () => {
                    try {
                      console.log("Refreshing meal plan...");
                      const newMealPlan = await loadMealPlan();
                      console.log(
                        "Refreshed meal plan:",
                        JSON.stringify(newMealPlan, null, 2),
                      );
                      setGeneratedPlan(newMealPlan);
                    } catch (e) {
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Unknown error refreshing meal plan",
                      );
                      console.error("Failed to refresh meal plan:", e);
                      toast({
                        title: "Refresh Failed",
                        description: error || "Unable to refresh meal plan",
                        variant: "destructive",
                      });
                    }
                  });
                }}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Meal Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Meal Plan Display */}
        <div>
          {(generatedPlan || loadingPlan) && (
            <MealPlanOverview mealPlan={{ ai_plan: generatedPlan }} />
          )}
        </div>
      </div>
    </div>
  );
}