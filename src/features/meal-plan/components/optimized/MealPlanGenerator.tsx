
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedMealPlan } from "@/ai/flows/generate-meal-plan";
import { editAiPlan } from "@/features/meal-plan/lib/data-service";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { useState, useTransition } from "react";

interface MealPlanGeneratorProps {
  profile: any;
  userPlan: any;
  mealPlan: any;
}

export default function MealPlanGenerator({
  profile,
  userPlan,
  mealPlan,
}: MealPlanGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();
  const [generatedPlan, setGeneratedPlan] = useState(null);

  async function handleGeneratePlan() {
    startTransition(async () => {
      try {
        // Validate profile completeness
        if (!profile || Object.keys(profile).length === 0) {
          toast({
            title: "Profile Required",
            description: "Please complete your profile in the onboarding section first.",
            variant: "destructive",
          });
          return;
        }

        // Validate macro splitter data
        if (!profile.meal_distributions || profile.meal_distributions.length !== 6) {
          toast({
            title: "Macro Distribution Required",
            description: "Please configure your meal distributions in the Macro Splitter tool first.",
            variant: "destructive",
          });
          return;
        }

        // Validate percentages sum to 100%
        const totalPercentage = profile.meal_distributions.reduce(
          (sum: number, dist: any) => sum + (dist.calories_pct || 0),
          0
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          toast({
            title: "Invalid Distribution",
            description: `Meal percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`,
            variant: "destructive",
          });
          return;
        }

        // Prepare macro targets
        const macroTargets = {
          target_daily_calories: userPlan.custom_total_calories ?? userPlan.target_daily_calories,
          target_protein_g: userPlan.custom_protein_g ?? userPlan.target_protein_g,
          target_carbs_g: userPlan.custom_carbs_g ?? userPlan.target_carbs_g,
          target_fat_g: userPlan.custom_fat_g ?? userPlan.target_fat_g,
        };

        console.log("🚀 Generating AI meal plan...");
        
        // Generate meal plan using new AI system
        const result = await generatePersonalizedMealPlan({
          profile,
          macro_targets: macroTargets,
          meal_distributions: profile.meal_distributions,
        });

        if (!result) {
          throw new Error("No meal plan generated");
        }

        // Transform result to match expected format
        const transformedResult = {
          days: result.weekly_plan.map((day: any) => ({
            day_of_week: day.day,
            meals: day.meals.map((meal: any) => ({
              meal_name: meal.meal_name,
              custom_name: meal.dish_name,
              ingredients: meal.ingredients,
              total_calories: meal.totals.calories,
              total_protein: meal.totals.protein,
              total_carbs: meal.totals.carbs,
              total_fat: meal.totals.fat,
            })),
            daily_totals: day.daily_totals,
          })),
          weekly_summary: result.weekly_plan.reduce(
            (summary: any, day: any) => ({
              total_calories: summary.total_calories + day.daily_totals.calories,
              total_protein: summary.total_protein + day.daily_totals.protein,
              total_carbs: summary.total_carbs + day.daily_totals.carbs,
              total_fat: summary.total_fat + day.daily_totals.fat,
            }),
            { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
          ),
        };

        setGeneratedPlan(transformedResult);
        
        // Save to database
        await editAiPlan({ ai_plan: transformedResult });

        toast({
          title: "Success!",
          description: "Your AI meal plan has been generated with precise macro distributions.",
        });

      } catch (error: any) {
        console.error("❌ Meal plan generation error:", error);
        
        let errorMessage = "Failed to generate meal plan.";
        
        if (error.message?.includes("API")) {
          errorMessage = "AI service error. Please check your configuration.";
        } else if (error.message?.includes("profile")) {
          errorMessage = "Please complete your profile and macro distributions first.";
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
  const hasValidPercentages = hasMacroDistributions && 
    Math.abs(profile.meal_distributions.reduce((sum: number, dist: any) => sum + (dist.calories_pct || 0), 0) - 100) < 0.01;

  const canGenerate = hasProfile && hasMacroDistributions && hasValidPercentages;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Meal Plan Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Requirements checklist */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {hasProfile ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className={hasProfile ? "text-green-700" : "text-red-700"}>
              Profile completed
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasMacroDistributions ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className={hasMacroDistributions ? "text-green-700" : "text-red-700"}>
              Macro distributions configured (6 meals)
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasValidPercentages ? (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            )}
            <span className={hasValidPercentages ? "text-green-700" : "text-red-700"}>
              Percentages sum to 100%
            </span>
          </div>
        </div>

        {!canGenerate && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Requirements not met:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {!hasProfile && <li>• Complete your profile in onboarding</li>}
                  {!hasMacroDistributions && <li>• Configure meal distributions in Macro Splitter</li>}
                  {!hasValidPercentages && <li>• Ensure meal percentages sum to 100%</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleGeneratePlan}
          disabled={!canGenerate || isLoading}
          className="w-full"
          size="lg"
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

        {generatedPlan && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Meal plan generated successfully!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Your 7-day meal plan with precise macro distributions is ready.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
