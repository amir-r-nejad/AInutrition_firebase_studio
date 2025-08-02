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
      if (Object.keys(profile).length === 0) {
        toast({
          title: "Profile Incomplete",
          description:
            "Please complete your onboarding profile before generating an AI meal plan.",
          variant: "destructive",
        });
        return;
      }

      // Prepare comprehensive input data for meal plan generation
      const input = mapProfileToMealPlanInput({
        ...profile,
        meal_data: mealPlan.meal_data || { days: [] },
        target_daily_calories: userPlan.custom_total_calories ?? userPlan.target_daily_calories,
        target_protein_g: userPlan.custom_protein_g ?? userPlan.target_protein_g,
        target_carbs_g: userPlan.custom_carbs_g ?? userPlan.target_carbs_g,
        target_fat_g: userPlan.custom_fat_g ?? userPlan.target_fat_g,
        meal_distributions: profile.meal_distributions, // Include macro splitter data
        ...userPlan,
      });

      try {
        const result = await generatePersonalizedMealPlanFlow(input);
        if (!result) return;

        setMeal(result);
        await editAiPlan({ ai_plan: result });

        toast({
          title: "Meal Plan Generated!",
          description: "Your AI-optimized weekly meal plan is ready.",
        });
      } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred.";
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
      <Button
        onClick={handleGeneratePlan}
        disabled={isLoading}
        size="lg"
        className="justify-self-end mx-6 lg:my-6 self-start"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-5 w-5" />
        )}
        {isLoading ? "Generating..." : "Generate New Plan"}
      </Button>

      <CardContent className="col-span-full">
        <MealPlanOverview mealPlan={meal} />
      </CardContent>
    </>
  );
}

export default MealPlanGenerator;
