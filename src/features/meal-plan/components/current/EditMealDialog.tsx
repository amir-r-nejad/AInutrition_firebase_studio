"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editMealPlan } from "@/features/meal-plan/lib/data-service-current";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import type { Ingredient, Meal, UserMealPlan } from "@/lib/schemas";
import { PlusCircle, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adjustMealIngredientsDirect } from "@/ai/flows/adjust-meal-ingredients-direct";

function EditMealDialog({
  mealPlan,
  userId,
}: {
  mealPlan: UserMealPlan;
  userId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { getQueryParams, removeQueryParams } = useQueryParams();
  const [meal, setMeal] = useState<Meal | null>(null);

  // استفاده از useMemo برای جلوگیری از تغییر مرجع calculateTotals
  const calculateTotals = useMemo(() => {
    return (ingredients: Ingredient[]) => {
      return ingredients.reduce(
        (acc, ing) => ({
          total_calories: acc.total_calories + (Number(ing.calories) || 0),
          total_protein: acc.total_protein + (Number(ing.protein) || 0),
          total_carbs: acc.total_carbs + (Number(ing.carbs) || 0),
          total_fat: acc.total_fat + (Number(ing.fat) || 0),
        }),
        {
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0,
        },
      );
    };
  }, []);

  // مقادیر query params را در متغیرهای جداگانه ذخیره می‌کنیم
  const selectedDay = getQueryParams("selected_day");
  const selectedMealName = getQueryParams("selected_meal");

  // Fetch user plan and profile data to get macro targets and meal distributions
  const [userPlan, setUserPlan] = useState<UserMealPlan | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  useEffect(() => {
    // Set the meal plan data
    setUserPlan(mealPlan);
    
    // Fetch user profile data that contains meal distributions
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [mealPlan]);

  function handleIngredientChange(
    index: number,
    field: keyof Ingredient,
    value: string | number,
  ) {
    if (!meal) return;

    setMeal((prevMeal) => {
      if (!prevMeal) return null;

      const newIngredients = [...prevMeal.ingredients];
      const targetIngredient = { ...newIngredients[index] };

      if (
        field === "quantity" ||
        field === "calories" ||
        field === "protein" ||
        field === "carbs" ||
        field === "fat"
      ) {
        const numValue = Number(value);
        (targetIngredient as any)[field] =
          value === "" || value === undefined || Number.isNaN(numValue)
            ? null
            : numValue;
      } else {
        (targetIngredient as any)[field] = value;
      }

      newIngredients[index] = targetIngredient;
      const totals = calculateTotals(newIngredients);

      return {
        ...prevMeal,
        ingredients: newIngredients,
        ...totals,
      };
    });
  }

  function addIngredient() {
    setMeal((prev) => {
      if (!prev) return null;

      const newIngredients = [
        ...(prev.ingredients ?? []),
        {
          name: "",
          quantity: null,
          unit: "g",
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
        },
      ];

      const totals = calculateTotals(newIngredients);

      return {
        ...prev,
        ingredients: newIngredients,
        ...totals,
      };
    });
  }

  function removeIngredient(index: number) {
    setMeal((prev) => {
      if (!prev) return null;

      const newIngredients = prev.ingredients.filter((_, i) => i !== index);
      const totals = calculateTotals(newIngredients);

      return {
        ...prev,
        ingredients: newIngredients,
        ...totals,
      };
    });
  }

  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    if (!meal || isSaving) return;

    setIsSaving(true);

    const { meal_data } = mealPlan;

    if (!selectedDay || !selectedMealName) {
      toast({
        title: "Error",
        description: "No meal selected for editing.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const dayIndex = meal_data?.days?.findIndex(
      (plan) => plan.dayOfWeek === selectedDay,
    );

    const mealIndex = meal_data?.days?.[dayIndex!]?.meals?.findIndex(
      (meal) => meal.name === decodeURIComponent(selectedMealName),
    );

    if (
      !meal_data ||
      dayIndex === undefined ||
      dayIndex < 0 ||
      mealIndex === undefined ||
      mealIndex < 0
    ) {
      toast({
        title: "Error",
        description: "Could not find the meal to update.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const newWeeklyPlan = JSON.parse(JSON.stringify(meal_data));
    newWeeklyPlan.days[dayIndex].meals[mealIndex] = meal;

    try {
      // Calculate actual target macros for this specific meal based on macro splitter data
      if (!userPlan) {
        throw new Error("User plan data not loaded. Please try again.");
      }

      if (!userProfile) {
        throw new Error("User profile data not loaded. Please try again.");
      }

      // Get daily macro targets from user plan
      const dailyTargets = {
        calories:
          userPlan.custom_total_calories ??
          userPlan.target_daily_calories ??
          2000,
        protein: userPlan.custom_protein_g ?? userPlan.target_protein_g ?? 150,
        carbs: userPlan.custom_carbs_g ?? userPlan.target_carbs_g ?? 200,
        fat: userPlan.custom_fat_g ?? userPlan.target_fat_g ?? 67,
      };

      // Get meal distribution for this specific meal from user profile
      const mealDistributions = userProfile.meal_distributions;
      const mealDistribution = mealDistributions?.find(
        (dist: any) => dist.mealName === meal.name,
      );

      let caloriePercentage;
      if (!mealDistribution) {
        // Use default distribution if none found
        const defaultDistribution = {
          calories_pct: 16.67, // Default equal distribution across 6 meals
        };
        console.warn(`No meal distribution found for ${meal.name}, using default 16.67%`);
        caloriePercentage = defaultDistribution.calories_pct / 100;
      } else {
        caloriePercentage = (mealDistribution.calories_pct || 0) / 100;
      }

      const targetMacros = {
        calories: Math.round(dailyTargets.calories * caloriePercentage),
        protein: Math.round(dailyTargets.protein * caloriePercentage * 10) / 10,
        carbs: Math.round(dailyTargets.carbs * caloriePercentage * 10) / 10,
        fat: Math.round(dailyTargets.fat * caloriePercentage * 10) / 10,
      };

      console.log("🎯 Target Macro Calculation Debug:", {
        mealName: meal.name,
        dailyTargets,
        mealDistribution,
        caloriePercentage,
        calculatedTargets: targetMacros,
      });

      const result = await adjustMealIngredientsDirect({
        originalMeal: {
          name: meal.name,
          custom_name: meal.custom_name || "",
          ingredients: meal.ingredients.map((ing) => ({
            name: ing.name,
            quantity: Number(ing.quantity) || 0,
            unit: ing.unit || "g",
            calories: Number(ing.calories) || 0,
            protein: Number(ing.protein) || 0,
            carbs: Number(ing.carbs) || 0,
            fat: Number(ing.fat) || 0,
          })),
          total_calories: meal.total_calories || 0,
          total_protein: meal.total_protein || 0,
          total_carbs: meal.total_carbs || 0,
          total_fat: meal.total_fat || 0,
        },
        targetMacros,
        userProfile: {
          age: 30, // This should ideally come from the user's profile
          allergies: [], // This should ideally come from the user's profile
          dispreferrred_ingredients: [], // This should ideally come from the user's profile
          preferred_ingredients: [], // This should ideally come from the user's profile
        },
      });

      // Assuming result.adjustedMeal contains the updated meal data
      if (result.adjustedMeal) {
        // Update the current meal state with the adjusted meal
        setMeal({
          ...result.adjustedMeal,
          custom_name: result.adjustedMeal.custom_name || "",
        });

        // Update the mealPlan object with the adjusted meal
        newWeeklyPlan.days[dayIndex].meals[mealIndex] = {
          ...result.adjustedMeal,
          custom_name: result.adjustedMeal.custom_name || "",
        };
      }

      const saveResult = await editMealPlan(
        { meal_data: newWeeklyPlan },
        userId,
      );

      toast({
        title: "Meal Saved",
        description: `${meal.custom_name || meal.name} has been updated.`,
      });

      // Close the dialog and refresh the page
      removeQueryParams(["selected_meal", "is_edit"]);

      // Refresh the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Save error details:", error);
      toast({
        title: "Save Error",
        description: error?.message || "Could not save meal plan.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRecalculateManually() {
    if (!meal) return;
    const totals = calculateTotals(meal.ingredients);
    setMeal((prev) => (prev ? { ...prev, ...totals } : null));
  }

  // اصلاح useEffect - فقط یک بار اجرا شود و dependency های ثابت داشته باشد
  useEffect(() => {
    if (!selectedDay || !selectedMealName || !mealPlan.meal_data?.days) {
      setMeal(null);
      return;
    }

    const selectedDayPlan = mealPlan.meal_data.days.find(
      (plan) => plan.dayOfWeek === selectedDay,
    );

    const selectedMeal = selectedDayPlan?.meals?.find(
      (meal) => meal.name === decodeURIComponent(selectedMealName),
    );

    if (!selectedMeal) {
      setMeal(null);
      return;
    }

    // فقط اگر meal واقعاً تغییر کرده باشد
    const mealWithIngredients = {
      ...selectedMeal,
      ingredients: selectedMeal.ingredients || [],
    };

    const totals = calculateTotals(mealWithIngredients.ingredients);

    const finalMeal = {
      ...mealWithIngredients,
      ...totals,
    };

    setMeal(finalMeal);
  }, [selectedDay, selectedMealName, mealPlan.meal_data, calculateTotals]);

  if (!meal) return null;

  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) =>
        !isOpen && removeQueryParams(["selected_meal", "is_edit"])
      }
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit {meal.name}
            {meal.custom_name ? ` - ${meal.custom_name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="customMealName">
              Meal Name (e.g., Chicken Salad)
            </Label>
            <Input
              id="customMealName"
              value={meal.custom_name || ""}
              onChange={(e) =>
                setMeal((prev) =>
                  prev ? { ...prev, custom_name: e.target.value } : null,
                )
              }
              placeholder="Optional: e.g., Greek Yogurt with Berries"
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>
          <Label>Ingredients</Label>
          {meal.ingredients.map((ing, index) => (
            <Card key={index} className="p-3 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <Input
                  placeholder="Ingredient Name"
                  value={ing.name}
                  onChange={(e) =>
                    handleIngredientChange(index, "name", e.target.value)
                  }
                  className="flex-grow"
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={ing.quantity ?? ""}
                  onChange={(e) =>
                    handleIngredientChange(index, "quantity", +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  placeholder="Unit (g, ml, item)"
                  value={ing.unit}
                  onChange={(e) =>
                    handleIngredientChange(index, "unit", e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <div className="col-span-2 md:col-span-1 text-xs text-muted-foreground pt-2">
                  (Total for this quantity)
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input
                  type="number"
                  placeholder="Cals"
                  value={ing.calories ?? ""}
                  onChange={(e) =>
                    handleIngredientChange(index, "calories", +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type="number"
                  placeholder="Protein (g)"
                  value={ing.protein ?? ""}
                  onChange={(e) =>
                    handleIngredientChange(index, "protein", +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type="number"
                  placeholder="Carbs (g)"
                  value={ing.carbs ?? ""}
                  onChange={(e) =>
                    handleIngredientChange(index, "carbs", +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type="number"
                  placeholder="Fat (g)"
                  value={ing.fat ?? ""}
                  onChange={(e) =>
                    handleIngredientChange(index, "fat", +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={addIngredient} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Ingredient
          </Button>
          <div className="mt-4 p-3 border rounded-md bg-muted/50">
            <h4 className="font-semibold mb-1">Calculated Totals:</h4>
            <p className="text-sm">
              Calories: {meal.total_calories?.toFixed(0) ?? "0"}
            </p>
            <p className="text-sm">
              Protein: {meal.total_protein?.toFixed(1) ?? "0.0"}g
            </p>
            <p className="text-sm">
              Carbs: {meal.total_carbs?.toFixed(1) ?? "0.0"}g
            </p>
            <p className="text-sm">
              Fat: {meal.total_fat?.toFixed(1) ?? "0.0"}g
            </p>
            <Button
              onClick={handleRecalculateManually}
              size="sm"
              variant="ghost"
              className="mt-1 text-xs"
            >
              Recalculate Manually
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => removeQueryParams(["selected_meal", "is_edit"])}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditMealDialog;
