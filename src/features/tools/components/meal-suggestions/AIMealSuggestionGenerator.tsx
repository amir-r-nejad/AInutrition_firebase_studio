"use client";

import { suggestMealsForMacros } from "@/ai/flows/suggest-meals-for-macros";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getMissingProfileFields } from "@/features/meal-plan/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { defaultMacroPercentages, mealNames } from "@/lib/constants";
import {
  UserProfile,
  UserPlan,
  SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import {
  AlertTriangle,
  Loader2,
  Sparkles,
  Target,
  ChefHat,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useMealUrlParams } from "../../hooks/useMealUrlParams";
import { getExampleTargetsForMeal, prepareAiMealInput } from "../../lib/utils";
import { getUserProfile } from "@/lib/supabase/data-service";
import { MealOptimizationForm } from "@/components/MealOptimizationForm";
import { MealOptimizationResults } from "@/components/MealOptimizationResults";
import { SingleMealOptimizationForm } from "@/components/SingleMealOptimizationForm";
import SingleMealOptimizationResults from "@/components/SingleMealOptimizationResults";
import {
  MealOptimizationResponse,
  RAGResponse,
  SingleMealOptimizationResponse,
} from "@/types/meal-optimization";
import { Badge } from "@/components/ui/badge";

function AIMealSuggestionGenerator({
  profile,
  plan,
}: {
  plan: UserPlan;
  profile: UserProfile;
}) {
  const { updateUrlWithMeal, getQueryParams, getCurrentMealParams } =
    useMealUrlParams();

  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [error, setError] = useState<string | null>(null);
  const [isLoadingAiSuggestions, startLoadingAiSuggestions] = useTransition();
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false);

  const [suggestions, setSuggestions] = useState<
    SuggestMealsForMacrosOutput["suggestions"]
  >([]);

  const [optimizationResult, setOptimizationResult] =
    useState<MealOptimizationResponse | null>(null);
  const [singleMealOptimizationResult, setSingleMealOptimizationResult] =
    useState<SingleMealOptimizationResponse | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);

  // Derive values from URL query parameters
  const selectedMealName = useMemo(() => {
    const mealNameParam = getQueryParams("mealName");
    return mealNameParam && mealNames.includes(mealNameParam)
      ? mealNameParam
      : null;
  }, [getQueryParams]);

  const targetMacros = useMemo(() => {
    return getCurrentMealParams(selectedMealName);
  }, [getCurrentMealParams, selectedMealName]);

  // Function to update URL with all target macros
  const updateUrlWithTargets = useCallback(
    (targets: typeof targetMacros) => {
      if (!targets) return;

      const urlSearchParams = new URLSearchParams(searchParams);
      urlSearchParams.set("mealName", targets.mealName);
      urlSearchParams.set("calories", targets.calories.toFixed(2).toString());
      urlSearchParams.set("protein", targets.protein.toFixed(2).toString());
      urlSearchParams.set("carbs", targets.carbs.toFixed(2).toString());
      urlSearchParams.set("fat", targets.fat.toFixed(2).toString());

      router.push(`${pathname}?${urlSearchParams.toString()}`, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const calculateTargetsForSelectedMeal = useCallback(() => {
    if (!selectedMealName) return;

    setSuggestions([]);
    setError(null);
    setOptimizationResult(null);
    setSingleMealOptimizationResult(null);
    setShowOptimization(false);

    const missingFields = getMissingProfileFields(profile);

    if (missingFields.length === 0) {
      const dailyTotals = {
        targetCalories:
          plan?.custom_total_calories ?? plan?.target_daily_calories,
        targetProtein: plan?.custom_protein_g ?? plan?.target_protein_g,
        targetCarbs: plan?.custom_carbs_g ?? plan?.target_carbs_g,
        targetFat: plan?.custom_fat_g ?? plan?.target_fat_g,
      };

      let mealDistribution;
      const userMealDistributions = profile.meal_distributions;
      if (!userMealDistributions) {
        mealDistribution = defaultMacroPercentages[selectedMealName];
      } else {
        mealDistribution = userMealDistributions.filter(
          (meal: any) => meal.mealName === selectedMealName,
        )[0];
      }

      if (
        dailyTotals.targetCalories &&
        dailyTotals.targetProtein &&
        dailyTotals.targetCarbs &&
        dailyTotals.targetFat &&
        mealDistribution &&
        mealDistribution.calories_pct
      ) {
        const newTargets = {
          mealName: selectedMealName,
          calories:
            dailyTotals.targetCalories * (mealDistribution.calories_pct / 100),
          protein:
            dailyTotals.targetProtein * ((mealDistribution.protein_pct ?? mealDistribution.calories_pct) / 100),
          carbs: dailyTotals.targetCarbs * ((mealDistribution.carbs_pct ?? mealDistribution.calories_pct) / 100),
          fat: dailyTotals.targetFat * ((mealDistribution.fat_pct ?? mealDistribution.calories_pct) / 100),
        };

        // Update URL with calculated targets
        updateUrlWithTargets(newTargets);
      } else {
        // Set demo mode and use example targets
        const exampleTargets = getExampleTargetsForMeal(selectedMealName);
        updateUrlWithTargets(exampleTargets);
        toast({
          title: "Using Example Targets",
          description: `Could not calculate specific targets for ${selectedMealName} from profile. Ensure profile basics (age, weight, height, gender, activity, goal) are complete.`,
          duration: 6000,
          variant: "default",
        });
      }
    } else {
      // Set demo mode and use example targets
      const exampleTargets = getExampleTargetsForMeal(selectedMealName);
      updateUrlWithTargets(exampleTargets);
      toast({
        title: "Profile Incomplete or Demo",
        description: `Showing example targets for ${selectedMealName}. Please complete your profile via Onboarding or Smart Calorie Planner for personalized calculations.`,
        duration: 7000,
        variant: "default",
      });
    }
  }, [plan, profile, selectedMealName, toast, updateUrlWithTargets]);

  useEffect(() => {
    if (selectedMealName) calculateTargetsForSelectedMeal();
  }, [selectedMealName]);

  function handleMealSelectionChange(mealValue: string) {
    setSuggestions([]);
    setError(null);
    setOptimizationResult(null);
    setSingleMealOptimizationResult(null);
    setShowOptimization(false);

    updateUrlWithMeal(mealValue);
  }

  async function handleGetSuggestions() {
    startLoadingAiSuggestions(async () => {
      if (!targetMacros) {
        toast({
          title: "Error",
          description: "Target macros not loaded. Select a meal first.",
          variant: "destructive",
        });
        return;
      }

      setError(null);
      setSuggestions([]);
      setOptimizationResult(null);
      setSingleMealOptimizationResult(null);
      setShowOptimization(false);

      try {
        const profile = await getUserProfile();
        const aiInput = prepareAiMealInput({ targetMacros, profile });
        const data = await suggestMealsForMacros(aiInput);

        if (data && data.suggestions) {
          setSuggestions(data.suggestions);
          setShowOptimization(true);
        } else {
          setError("No suggestions received from AI");
          toast({
            title: "AI Response Error",
            description: "No suggestions received from AI",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch profile or suggestions.");
        toast({
          title: "Error",
          description:
            err?.message || "Failed to fetch profile or suggestions.",
          variant: "destructive",
        });
      }
    });
  }

  const handleOptimizationComplete = (result: MealOptimizationResponse) => {
    setOptimizationResult(result);
    toast({
      title: "Optimization Complete!",
      description: "Your meal plan has been optimized successfully!",
      variant: "default",
    });
  };

  const handleSingleMealOptimizationComplete = (
    result: SingleMealOptimizationResponse,
  ) => {
    setSingleMealOptimizationResult(result);
    toast({
      title: "Single Meal Optimization Complete!",
      description: `Your meal has been optimized successfully!`,
      variant: "default",
    });
  };

  const handleReset = () => {
    setSuggestions([]);
    setOptimizationResult(null);
    setSingleMealOptimizationResult(null);
    setShowOptimization(false);
    setError(null);
  };

  const showContentBelowSelection = selectedMealName && targetMacros;

  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="meal-select"
          className="text-lg font-semibold text-primary"
        >
          2. Choose a Meal:
        </Label>
        <Select
          onValueChange={handleMealSelectionChange}
          value={selectedMealName || ""}
        >
          <SelectTrigger id="meal-select" className="w-full md:w-1/2 lg:w-1/3">
            <SelectValue placeholder="Select a meal..." />
          </SelectTrigger>
          <SelectContent>
            {mealNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMealName && !targetMacros && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2">
            Loading profile and calculating targets for {selectedMealName}
            ...
          </p>
        </div>
      )}

      {showContentBelowSelection && (
        <>
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-semibold mb-2 text-primary">
              Target Macros for {targetMacros.mealName}:
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <p>
                <span className="font-medium">Calories:</span>{" "}
                {targetMacros.calories.toFixed(1)} kcal
              </p>
              <p>
                <span className="font-medium">Protein:</span>{" "}
                {targetMacros.protein.toFixed(1)} g
              </p>
              <p>
                <span className="font-medium">Carbs:</span>{" "}
                {targetMacros.carbs.toFixed(1)} g
              </p>
              <p>
                <span className="font-medium">Fat:</span>{" "}
                {targetMacros.fat.toFixed(1)} g
              </p>
            </div>
          </div>

          <Button
            onClick={() => handleGetSuggestions()}
            disabled={targetMacros.calories <= 0 || isLoadingAiSuggestions}
            size="lg"
            className="w-full md:w-auto"
          >
            {isLoadingAiSuggestions ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoadingAiSuggestions
              ? "Getting Suggestions..."
              : targetMacros.calories > 0
                ? "Get AI Meal Suggestions"
                : "Meals must contains a certain amount of calories"}
          </Button>

          {error && (
            <p className="text-destructive mt-4">
              <AlertTriangle className="inline mr-1 h-4 w-4" />
              {error}
            </p>
          )}
        </>
      )}

      {!selectedMealName && (
        <div className="text-center py-6 text-muted-foreground">
          <p>Please select a meal type above to get started.</p>
        </div>
      )}

      {isLoadingAiSuggestions && (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            Fetching creative meal ideas for your{" "}
            {targetMacros?.mealName || "meal"}...
          </p>
        </div>
      )}

      {/* AI Suggestions Display */}
      {suggestions && suggestions.length > 0 && !isLoadingAiSuggestions && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-primary mt-8 mb-4">
            AI Meal Suggestions for your {targetMacros?.mealName || "meal"}:
          </h2>

          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  {suggestion.mealTitle || `Meal ${index + 1}`}
                </CardTitle>
                <CardDescription className="text-sm">
                  {suggestion.description || "AI-generated meal suggestion"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-medium text-md mb-2 text-primary">
                    Macros:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Calories: {suggestion.totalCalories?.toFixed(1) || 0} kcal
                    </Badge>
                    <Badge variant="outline">
                      Protein: {suggestion.totalProtein?.toFixed(1) || 0}g
                    </Badge>
                    <Badge variant="outline">
                      Carbs: {suggestion.totalCarbs?.toFixed(1) || 0}g
                    </Badge>
                    <Badge variant="outline">
                      Fat: {suggestion.totalFat?.toFixed(1) || 0}g
                    </Badge>
                  </div>
                </div>

                {suggestion.ingredients &&
                  suggestion.ingredients.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-md mb-2 text-primary">
                        Ingredients:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestion.ingredients.map((ingredient, ingIndex) => (
                          <div
                            key={ingIndex}
                            className="flex justify-between items-center p-2 border rounded"
                          >
                            <span className="font-medium">
                              {ingredient.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {ingredient.amount} {ingredient.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {suggestion.instructions && (
                  <div className="mb-4">
                    <h4 className="font-medium text-md mb-2 text-primary">
                      Instructions:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meal Optimization Section */}
      {showOptimization &&
        suggestions &&
        suggestions.length > 0 &&
        !isLoadingAiSuggestions &&
        targetMacros && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-primary mb-2">
                Optimize Your {targetMacros.mealName || "Meal"}
              </h2>
              <p className="text-muted-foreground">
                Use our advanced Single Meal Optimization API to perfect your
                macros and get personalized recommendations
              </p>
            </div>

            {!singleMealOptimizationResult ? (
              <SingleMealOptimizationForm
                ragResponse={{
                  suggestions: suggestions.map((suggestion) => ({
                    ingredients: suggestion.ingredients.map((ingredient) => {
                      // Extract quantity from amount field, handle different formats
                      let originalQuantity = 100; // Default fallback

                      if (ingredient.amount) {
                        if (typeof ingredient.amount === "string") {
                          // Handle "300g", "150g", etc.
                          const match =
                            ingredient.amount.match(/(\d+(?:\.\d+)?)/);
                          if (match) {
                            originalQuantity = parseFloat(match[1]);
                          }
                        } else if (typeof ingredient.amount === "number") {
                          originalQuantity = ingredient.amount;
                        }
                      }

                      // 🔍 DEBUG: Log the original ingredient data
                      console.log(
                        `🔍 Original ingredient ${ingredient.name}:`,
                        {
                          amount: ingredient.amount,
                          original_quantity: originalQuantity,
                          total_calories: ingredient.calories,
                          total_protein: ingredient.protein,
                          total_carbs: ingredient.carbs,
                          total_fat: ingredient.fat,
                        },
                      );

                      // Convert total values to per 100g values
                      const conversionFactor = 100 / originalQuantity;

                      const per100gValues = {
                        name: ingredient.name,
                        protein_per_100g:
                          Math.round(
                            (ingredient.protein || 0) * conversionFactor * 100,
                          ) / 100,
                        carbs_per_100g:
                          Math.round(
                            (ingredient.carbs || 0) * conversionFactor * 100,
                          ) / 100,
                        fat_per_100g:
                          Math.round(
                            (ingredient.fat || 0) * conversionFactor * 100,
                          ) / 100,
                        calories_per_100g:
                          Math.round(
                            (ingredient.calories || 0) * conversionFactor * 100,
                          ) / 100,
                        quantity_needed: 100, // Standard per 100g basis for optimization
                      };

                      // 🔍 DEBUG: Log the converted values
                      console.log(
                        `🔍 Converted ${ingredient.name} to per 100g:`,
                        per100gValues,
                      );

                      return per100gValues;
                    }),
                  })),
                  success: true,
                  message: "AI-generated meal suggestions",
                }}
                onOptimizationComplete={handleSingleMealOptimizationComplete}
                targetMacros={{
                  calories: targetMacros.calories,
                  protein: targetMacros.protein,
                  carbs: targetMacros.carbs,
                  fat: targetMacros.fat,
                }}
                mealType={targetMacros.mealName || "meal"}
              />
            ) : (
              <SingleMealOptimizationResults
                result={singleMealOptimizationResult}
                onReset={handleReset}
              />
            )}
          </div>
        )}
    </>
  );
}

export default AIMealSuggestionGenerator;
