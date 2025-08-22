"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  editAiPlan,
  loadMealPlan,
} from "@/features/meal-plan/lib/data-service";
import { Loader2, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import MealPlanOverview from "./MealPlanOverview";
import { GeneratePersonalizedMealPlanOutput } from "@/lib/schemas";

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
        const errorMessage =
          e instanceof Error ? e.message : "Unknown error loading meal plan";
        // Don't set error if no meal plan exists or no AI plan generated - this is expected for new users
        if (
          !errorMessage.includes("No meal plan found") &&
          !errorMessage.includes("No AI plan generated yet")
        ) {
          setError(errorMessage);
        }
        console.log("No existing meal plan found or error:", errorMessage);
      } finally {
        setLoadingPlan(false);
      }
    }

    // Only fetch if we don't have an initial plan and we're not currently loading
    if (
      !initialMealPlan?.ai_plan &&
      !generatedPlan &&
      !isLoading &&
      loadingPlan
    ) {
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

        // Generate AI meal plan using OpenAI
        console.log("🤖 API: Calling OpenAI meal plan generation...");

        // Enhanced retry logic with exponential backoff
        const maxRetries = 3;
        let result: GeneratePersonalizedMealPlanOutput | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          let timeoutId: NodeJS.Timeout | undefined;
          try {
            console.log(
              `🌐 Making fetch request to /api/meal-plan/generate... (attempt ${attempt})`,
            );

            // Create AbortController for timeout per attempt
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes per attempt

            const response = await fetch("/api/meal-plan/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Retry-Attempt": attempt.toString(),
              },
              credentials: "include",
              body: JSON.stringify({
                profile: profile,
                mealTargets: mealTargets,
              }),
              signal: controller.signal,
            });

            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            console.log("✅ API Response Status:", response.status);

            if (!response.ok) {
              let errorData;
              try {
                errorData = await response.json();
              } catch {
                errorData = {
                  error: `HTTP ${response.status}: ${response.statusText}`,
                };
              }
              console.error(
                `❌ API Error Response (attempt ${attempt}):`,
                errorData,
              );

              // Handle specific status codes
              if (response.status === 408 || response.status === 429) {
                // Timeout or rate limit - retry with delay
                if (attempt < maxRetries) {
                  console.log(
                    `⏳ Retrying in ${2 * attempt} second... (${attempt}/${maxRetries})`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * attempt),
                  );
                  continue;
                }
              } else if (response.status >= 500) {
                // Server error - check if meal plan was generated
                console.log(
                  "🔄 Server error, checking if meal plan was generated...",
                );
                try {
                  await new Promise((resolve) => setTimeout(resolve, 3000));
                  const existingPlan = await loadMealPlan(); // Still use loadMealPlan to get the generated plan
                  if (existingPlan && existingPlan.weeklyMealPlan) {
                    console.log(
                      "✅ Found newly generated meal plan on server!",
                    );
                    result = existingPlan;
                    break;
                  }
                } catch (loadError) {
                  console.error("Failed to load existing plan:", loadError);
                }

                if (attempt < maxRetries) {
                  console.log(
                    `⏳ Retrying in ${2 * attempt} second... (${attempt}/${maxRetries})`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * attempt),
                  );
                  continue;
                }
              }

              throw new Error(
                errorData.error ||
                  `API request failed with status ${response.status}`,
              );
            } else {
              result = await response.json();
              console.log("✅ Received enhanced result from API");
              break; // Success, exit retry loop
            }
          } catch (fetchError: any) {
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId);
            }
            console.error(
              `❌ Fetch error details (attempt ${attempt}):`,
              fetchError,
            );

            if (fetchError.name === "AbortError") {
              if (attempt < maxRetries) {
                console.log(
                  `⏳ Request timed out, retrying... (${attempt}/${maxRetries})`,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * attempt),
                );
                continue;
              } else {
                throw new Error(
                  "Request timed out after multiple attempts. The meal plan may still be generating. Please try refreshing in a moment.",
                );
              }
            }

            // Check if this is a network error
            const isNetworkError =
              fetchError.message?.includes("Failed to fetch") ||
              fetchError.message?.includes("fetch") ||
              fetchError.name === "TypeError";

            if (isNetworkError) {
              console.log(
                `🔄 Network error, checking if meal plan was generated on server... (attempt ${attempt})`,
              );
              try {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                const existingPlan = await loadMealPlan();
                if (existingPlan && existingPlan.weeklyMealPlan) {
                  console.log("✅ Found newly generated meal plan on server!");
                  result = existingPlan;
                  break;
                }
              } catch (loadError) {
                console.error("Failed to check for existing plan:", loadError);
              }

              if (attempt < maxRetries) {
                console.log(
                  `⏳ Retrying network request... (${attempt}/${maxRetries})`,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * attempt),
                );
                continue;
              } else {
                throw new Error(
                  "Network connection error after multiple attempts. Please check your connection and try again, or click 'Refresh Meal Plan' to check if your plan was generated.",
                );
              }
            } else {
              if (attempt < maxRetries) {
                console.log(
                  `⏳ Retrying after error... (${attempt}/${maxRetries})`,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * attempt),
                );
                continue;
              } else {
                throw fetchError;
              }
            }
          }
        }

        if (!result || !result.weeklyMealPlan || !result.weeklySummary) {
          throw new Error("Invalid meal plan data returned from API");
        }

        // Save to database using editAiPlan
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

        // Load updated data
        const updatedPlan = await loadMealPlan(); // Still use loadMealPlan to get the latest saved plan
        console.log(
          "Loaded updated meal plan:",
          JSON.stringify(updatedPlan, null, 2),
        );
        setGeneratedPlan(updatedPlan);

        toast({
          title: "Success!",
          description:
            "Your AI meal plan has been generated with precise macro distributions (±5% accuracy).",
        });

        // Auto-refresh meal plan data and then refresh page after successful generation
        setTimeout(async () => {
          try {
            console.log("Auto-refreshing meal plan before page reload...");
            const refreshedPlan = await loadMealPlan();
            console.log(
              "Auto-refreshed meal plan:",
              JSON.stringify(refreshedPlan, null, 2),
            );
            setGeneratedPlan(refreshedPlan);

            // Give a moment for the state to update, then refresh page
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } catch (error) {
            console.error(
              "Auto-refresh failed, proceeding with page reload:",
              error,
            );
            window.location.reload();
          }
        }, 2000); // Refresh after 2 seconds to show the toast first
      } catch (error: any) {
        console.error("❌ Meal plan generation error:", error);
        let errorMessage = "Failed to generate meal plan.";
        let toastTitle = "Generation Failed";
        let toastVariant: "default" | "destructive" = "destructive";

        if (
          error.message?.includes(
            "successfully generated! Please click 'Refresh Meal Plan'",
          )
        ) {
          errorMessage = error.message;
          toastTitle = "Plan Generated Successfully!";
          toastVariant = "default";
        } else if (
          error.message?.includes("Network connection issue detected")
        ) {
          errorMessage = error.message;
          toastTitle = "Network Issue - Plan May Be Ready";
          toastVariant = "default";
        } else if (
          error instanceof TypeError &&
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error: Failed to connect to AI service. The meal plan may have been generated successfully. Please click 'Refresh Meal Plan' to check, or try generating again.";
          toastTitle = "Network Connection Issue";
          toastVariant = "default";
        } else if (error.message?.includes("Invalid input data")) {
          errorMessage = error.message;
          toastTitle = "Input Validation Error";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: toastTitle,
          description: errorMessage,
          variant: toastVariant,
        });
      }
    });
  }

  // Check if requirements are met
  const hasMacroDistributions = profile?.meal_distributions?.length === 6;

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
                  <span className="text-sm">
                    Percentages sum to {totalPercentage?.toFixed(1) || 0}%
                  </span>
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
                      const errorMessage =
                        e instanceof Error
                          ? e.message
                          : "Unknown error refreshing meal plan";
                      // Don't show error for missing AI plan - this is expected
                      if (!errorMessage.includes("No AI plan generated yet")) {
                        setError(errorMessage);
                        console.error("Failed to refresh meal plan:", e);
                        toast({
                          title: "Refresh Failed",
                          description: errorMessage,
                          variant: "destructive",
                        });
                      } else {
                        console.log(
                          "No AI plan to refresh - user needs to generate one first",
                        );
                        toast({
                          title: "No AI Plan Found",
                          description:
                            "Generate an AI meal plan first to refresh it",
                          variant: "default",
                        });
                      }
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
            <MealPlanOverview
              mealPlan={{ ai_plan: generatedPlan }}
              userTargets={
                userPlan
                  ? {
                      calories: userPlan.target_daily_calories || 0,
                      protein: userPlan.target_protein_g || 0,
                      carbs: userPlan.target_carbs_g || 0,
                      fat: userPlan.target_fat_g || 0,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
