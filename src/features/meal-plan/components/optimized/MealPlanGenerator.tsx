
"use client";

import { generatePersonalizedMealPlanFlow } from "@/ai/flows/generate-meal-plan";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import MealPlanOverview from "@/features/meal-plan/components/optimized/MealPlanOverview";
import { editAiPlan } from "@/features/meal-plan/lib/data-service";
import { useToast } from "@/hooks/use-toast";
import {
  BaseProfileData,
  GeneratePersonalizedMealPlanOutput,
  MealPlans,
  UserPlanType,
} from "@/lib/schemas";
import { Loader2, Wand2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { mapProfileToMealPlanInput } from "../../lib/utils";

type MealPlanGeneratorProps = {
  profile: BaseProfileData;
  mealPlan: MealPlans;
  userPlan: UserPlanType;
};

function MealPlanGenerator({
  mealPlan,
  profile,
  userPlan,
}: MealPlanGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, startTransition] = useTransition();
  const [meal, setMeal] = useState<GeneratePersonalizedMealPlanOutput | null>(
    null,
  );

  async function handleGeneratePlan() {
    startTransition(async () => {
      // Check if profile is complete
      if (Object.keys(profile).length === 0) {
        toast({
          title: "Profile Incomplete",
          description:
            "Please complete your onboarding profile before generating an AI meal plan.",
          variant: "destructive",
        });
        return;
      }

      // Check if macro splitter data exists
      if (!profile.meal_distributions || profile.meal_distributions.length !== 6) {
        toast({
          title: "Macro Distribution Missing",
          description:
            "Please configure your meal distributions in the Macro Splitter tool first.",
          variant: "destructive",
        });
        return;
      }

      // Validate that meal distributions sum to 100%
      const totalPercentage = profile.meal_distributions.reduce(
        (sum, dist) => sum + (dist.calories_pct || 0),
        0
      );

      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast({
          title: "Invalid Macro Distribution",
          description: 
            `Meal distribution percentages must sum to 100%. Current total: ${totalPercentage.toFixed(1)}%`,
          variant: "destructive",
        });
        return;
      }

      try {
        // Prepare comprehensive input data for meal plan generation
        const input = mapProfileToMealPlanInput({
          ...profile,
          meal_data: mealPlan.meal_data || { days: [] },
          target_daily_calories: userPlan.custom_total_calories ?? userPlan.target_daily_calories,
          target_protein_g: userPlan.custom_protein_g ?? userPlan.target_protein_g,
          target_carbs_g: userPlan.custom_carbs_g ?? userPlan.target_carbs_g,
          target_fat_g: userPlan.custom_fat_g ?? userPlan.target_fat_g,
          meal_distributions: profile.meal_distributions,
          ...userPlan,
        });

        console.log("🚀 Generating meal plan with input:", input);

        const result = await generatePersonalizedMealPlanFlow(input);
        if (!result) {
          throw new Error("No result returned from AI");
        }

        setMeal(result);
        await editAiPlan({ ai_plan: result });

        toast({
          title: "Meal Plan Generated!",
          description: "Your AI-optimized weekly meal plan is ready with precise macro distributions.",
        });
      } catch (err: any) {
        console.error("Meal plan generation error:", err);
        
        let errorMessage = "An unknown error occurred while generating your meal plan.";
        
        if (err.message?.includes("multiply")) {
          errorMessage = "Template processing error. Please try again.";
        } else if (err.message?.includes("403")) {
          errorMessage = "API access denied. Please check your Gemini API configuration.";
        } else if (err.message?.includes("400")) {
          errorMessage = "Invalid request format. Please check your profile data.";
        } else if (err.message?.includes("Schema validation")) {
          errorMessage = "Invalid meal plan data. Please review your preferences and try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    });
  }

  useEffect(() => {
    setMeal(mealPlan.ai_plan);
  }, [mealPlan.ai_plan]);

  return (
    <>
      <div className="flex flex-col gap-4 mx-6 lg:my-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">AI Meal Plan Generator</h3>
            <p className="text-sm text-muted-foreground">
              Generate a personalized 7-day meal plan using your macro splitter distributions
            </p>
          </div>
          <Button
            onClick={handleGeneratePlan}
            disabled={isLoading}
            size="lg"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Generating..." : "Generate New Plan"}
          </Button>
        </div>
        
        {/* Show macro distribution summary */}
        {profile.meal_distributions && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Current Macro Distribution:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {profile.meal_distributions.map((dist, index) => (
                <div key={index} className="flex justify-between">
                  <span>{dist.mealName}:</span>
                  <span className="font-medium">{dist.calories_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CardContent className="col-span-full">
        <MealPlanOverview mealPlan={meal} />
      </CardContent>
    </>
  );
}

export default MealPlanGenerator;
