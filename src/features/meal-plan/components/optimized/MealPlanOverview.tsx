"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MealPlanOverviewProps {
  mealPlan: any;
}

export default function MealPlanOverview({ mealPlan }: MealPlanOverviewProps) {
  console.log(
    "MealPlanOverview received mealPlan:",
    JSON.stringify(mealPlan, null, 2),
  );

  if (
    !mealPlan?.ai_plan?.weeklyMealPlan ||
    !Array.isArray(mealPlan.ai_plan.weeklyMealPlan)
  ) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No AI meal plan generated yet or invalid meal plan data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { weeklyMealPlan: days, weeklySummary } = mealPlan.ai_plan;

  const safeWeeklySummary = weeklySummary || {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {safeWeeklySummary.totalCalories.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {safeWeeklySummary.totalProtein.toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {safeWeeklySummary.totalCarbs.toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {safeWeeklySummary.totalFat.toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Meal Plans */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Meal Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={days[0]?.day || "Monday"} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {days.map((day: any) => (
                <TabsTrigger key={day.day} value={day.day}>
                  {day.day.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day: any) => (
              <TabsContent key={day.day} value={day.day} className="space-y-4">
                {/* Daily totals */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {day.daily_totals?.calories || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {day.daily_totals?.protein || 0}g
                    </p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">
                      {day.daily_totals?.carbs || 0}g
                    </p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-600">
                      {day.daily_totals?.fat || 0}g
                    </p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-4">
                  {(day.meals || []).map((meal: any, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">
                            {meal.meal_name || "Unnamed Meal"}
                          </CardTitle>
                          <Badge variant="outline">
                            {meal.meal_title || meal.custom_name || "No Title"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ingredient</TableHead>
                                <TableHead className="text-right">
                                  Amount
                                </TableHead>
                                <TableHead className="text-right">
                                  Unit
                                </TableHead>
                                <TableHead className="text-right">
                                  Calories
                                </TableHead>
                                <TableHead className="text-right">
                                  Protein
                                </TableHead>
                                <TableHead className="text-right">
                                  Carbs
                                </TableHead>
                                <TableHead className="text-right">
                                  Fat
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(meal.ingredients || []).map(
                                (ingredient: any, ingIndex: number) => (
                                  <TableRow key={ingIndex}>
                                    <TableCell className="font-medium">
                                      {ingredient.name || "Unknown"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {ingredient.quantity ||
                                        ingredient.amount ||
                                        0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {ingredient.unit || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(ingredient.calories || 0).toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(ingredient.protein || 0).toFixed(1)}g
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(ingredient.carbs || 0).toFixed(1)}g
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(ingredient.fat || 0).toFixed(1)}g
                                    </TableCell>
                                  </TableRow>
                                ),
                              )}
                            </TableBody>
                          </Table>
                        </ScrollArea>

                        {/* Meal totals */}
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="font-semibold">
                                {meal.total_calories || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Cal
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-green-600">
                                {meal.total_protein || 0}g
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Protein
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-600">
                                {meal.total_carbs || 0}g
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Carbs
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-orange-600">
                                {meal.total_fat || 0}g
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Fat
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
