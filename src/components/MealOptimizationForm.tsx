"use client";

import { useState } from "react";
import { useMealOptimization } from "@/hooks/useMealOptimization";
import {
  MealOptimizationRequest,
  RAGResponse,
} from "@/types/meal-optimization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Target,
  ChefHat,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLastOptimizationResult } from "@/hooks/useLastOptimizationResult";
import { LastOptimizationResult } from "@/components/LastOptimizationResult";

interface MealOptimizationFormProps {
  ragResponse: RAGResponse;
  onOptimizationComplete: (result: any) => void;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const MealOptimizationForm: React.FC<MealOptimizationFormProps> = ({
  ragResponse,
  onOptimizationComplete,
  targetMacros,
}) => {
  const { optimizeMeal, isLoading, error } = useMealOptimization();
  const { toast } = useToast();

  const [userPreferences, setUserPreferences] = useState({
    diet_type: "high_protein",
    allergies: [] as string[],
    preferences: ["low_sodium", "organic"],
  });

  const [dietaryRestrictionsInput, setDietaryRestrictionsInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showFallbackOption, setShowFallbackOption] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // استفاده از hook برای مدیریت آخرین نتیجه
  const { lastResult, saveResult, clearResult } = useLastOptimizationResult(
    "meal-plan",
    "meal-plan",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      console.log("Submitting optimization request:", {
        ragResponse,
        targetMacros,
        userPreferences,
        useFallback,
      });

      const request: MealOptimizationRequest = {
        rag_response: ragResponse,
        target_macros: {
          calories: targetMacros.calories,
          protein: targetMacros.protein,
          carbohydrates: targetMacros.carbs,
          fat: targetMacros.fat,
        },
        user_preferences: userPreferences,
        user_id: "user_123", // TODO: Get from authentication system
      };

      console.log("Sending request to API:", request);

      const result = await optimizeMeal(request, useFallback);
      console.log("Optimization result received:", result);

      // ذخیره آخرین نتیجه
      saveResult(result);

      onOptimizationComplete(result);

      toast({
        title: "Success!",
        description: useFallback
          ? "Meal plan has been optimized using fallback service."
          : "Meal plan has been optimized successfully!",
        variant: "default",
      });
    } catch (err) {
      console.error("Optimization failed:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setLocalError(errorMessage);

      // Show fallback option if external API fails
      if (errorMessage.includes("External API unavailable")) {
        setShowFallbackOption(true);
      }

      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRetryWithFallback = async () => {
    setUseFallback(true);
    setShowFallbackOption(false);
    setLocalError(null);

    // Retry the submission with fallback enabled
    const form = document.querySelector("form");
    if (form) {
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    }
  };

  const addPreference = () => {
    if (dietaryRestrictionsInput.trim()) {
      setUserPreferences((prev) => ({
        ...prev,
        preferences: [...prev.preferences, dietaryRestrictionsInput.trim()],
      }));
      setDietaryRestrictionsInput("");
    }
  };

  const removePreference = (index: number) => {
    setUserPreferences((prev) => ({
      ...prev,
      preferences: prev.preferences.filter((_, i) => i !== index),
    }));
  };

  const addAllergy = () => {
    if (allergiesInput.trim()) {
      setUserPreferences((prev) => ({
        ...prev,
        allergies: [...prev.allergies, allergiesInput.trim()],
      }));
      setAllergiesInput("");
    }
  };

  const removeAllergy = (index: number) => {
    setUserPreferences((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  // Show either the hook error or local error
  const displayError = error || localError;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          Meal Optimization Settings
        </CardTitle>
        <CardDescription>
          Customize your preferences for optimal meal planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Macros Display */}
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-medium mb-3 text-primary">
              Target Macros
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.calories} kcal
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Calories</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.protein}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Protein</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.carbs}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Carbs</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.fat}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Fat</p>
              </div>
            </div>
          </div>

          {/* User Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary">
              User Preferences
            </h3>

            {/* Diet Type */}
            <div>
              <Label htmlFor="diet-type">Diet Type</Label>
              <Select
                value={userPreferences.diet_type}
                onValueChange={(value) =>
                  setUserPreferences((prev) => ({ ...prev, diet_type: value }))
                }
              >
                <SelectTrigger id="diet-type" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_protein">High Protein</SelectItem>
                  <SelectItem value="low_carb">Low Carb</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preferences */}
            <div>
              <Label htmlFor="preferences">Preferences</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={dietaryRestrictionsInput}
                  onChange={(e) => setDietaryRestrictionsInput(e.target.value)}
                  placeholder="e.g., low_sodium, organic"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addPreference())
                  }
                />
                <Button type="button" onClick={addPreference} variant="outline">
                  Add
                </Button>
              </div>
              {userPreferences.preferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.preferences.map((preference, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => removePreference(index)}
                    >
                      {preference} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div>
              <Label>Allergies</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g., nuts, dairy"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addAllergy())
                  }
                />
                <Button type="button" onClick={addAllergy} variant="outline">
                  Add
                </Button>
              </div>
              {userPreferences.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.allergies.map((allergy, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => removeAllergy(index)}
                    >
                      {allergy} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Macro Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calorie-pref">Calorie Preference</Label>
                <Select
                  value={userPreferences.calorie_preference}
                  onValueChange={(value: "low" | "moderate" | "high") =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      calorie_preference: value,
                    }))
                  }
                >
                  <SelectTrigger id="calorie-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="protein-pref">Protein Preference</Label>
                <Select
                  value={userPreferences.protein_preference}
                  onValueChange={(value: "low" | "moderate" | "high") =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      protein_preference: value,
                    }))
                  }
                >
                  <SelectTrigger id="protein-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="carb-pref">Carb Preference</Label>
                <Select
                  value={userPreferences.carb_preference}
                  onValueChange={(value: "low" | "moderate" | "high") =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      carb_preference: value,
                    }))
                  }
                >
                  <SelectTrigger id="carb-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fat-pref">Fat Preference</Label>
                <Select
                  value={userPreferences.fat_preference}
                  onValueChange={(value: "low" | "moderate" | "high") =>
                    setUserPreferences((prev) => ({
                      ...prev,
                      fat_preference: value,
                    }))
                  }
                >
                  <SelectTrigger id="fat-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fallback Option */}
          {showFallbackOption && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800 mb-2">
                    External API Unavailable
                  </h4>
                  <p className="text-orange-700 text-sm mb-3">
                    The external Meal Optimization API is currently down. You
                    have two options:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleRetryWithFallback}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Use Fallback Service
                      </Button>
                      <span className="text-sm text-orange-700">
                        Get meal plans using our local optimization algorithms
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => setShowFallbackOption(false)}
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700"
                      >
                        Wait for External API
                      </Button>
                      <span className="text-sm text-orange-700">
                        Try again later when the external service is available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* نمایش آخرین نتیجه */}
          <LastOptimizationResult
            lastResult={lastResult}
            onClear={clearResult}
          />

          {displayError && !showFallbackOption && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Optimization Error</p>
              </div>
              <p className="text-red-700 mt-2">{displayError}</p>
              <p className="text-red-600 text-sm mt-2">
                This might be due to network issues or the external API being
                temporarily unavailable. Please try again later.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {useFallback
                  ? "Using Fallback Service..."
                  : "Optimizing Meal Plan..."}
              </>
            ) : (
              <>
                <Target className="mr-2 h-5 w-5" />
                {useFallback
                  ? "Optimize with Fallback Service"
                  : "Optimize Meal Plan"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
