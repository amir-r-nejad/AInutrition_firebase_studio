"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MealPlanOverviewProps {
  mealPlan: any;
}

export default function MealPlanOverview({ mealPlan }: MealPlanOverviewProps) {
  if (!mealPlan?.ai_plan?.days) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No AI meal plan generated yet.</p>
        </CardContent>
      </Card>
    );
  }

  const { days, weekly_summary } = mealPlan.ai_plan;

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
                {weekly_summary.total_calories.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {weekly_summary.total_protein.toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {weekly_summary.total_carbs.toFixed(1)}g
              </p>
              <p className="text-sm text-muted-foreground">Total Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {weekly_summary.total_fat.toFixed(1)}g
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
          <Tabs defaultValue={days[0]?.day_of_week || "Monday"} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {days.map((day: any) => (
                <TabsTrigger key={day.day_of_week} value={day.day_of_week}>
                  {day.day_of_week.slice(0, 3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {days.map((day: any) => (
              <TabsContent key={day.day_of_week} value={day.day_of_week} className="space-y-4">
                {/* Daily totals */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{day.daily_totals.calories}</p>
                    <p className="text-xs text-muted-foreground">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">{day.daily_totals.protein}g</p>
                    <p className="text-xs text-muted-foreground">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-600">{day.daily_totals.carbs}g</p>
                    <p className="text-xs text-muted-foreground">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-orange-600">{day.daily_totals.fat}g</p>
                    <p className="text-xs text-muted-foreground">Fat</p>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-4">
                  {day.meals.map((meal: any, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{meal.meal_name}</CardTitle>
                          <Badge variant="outline">{meal.custom_name}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ingredient</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Unit</TableHead>
                                <TableHead className="text-right">Calories</TableHead>
                                <TableHead className="text-right">Protein</TableHead>
                                <TableHead className="text-right">Carbs</TableHead>
                                <TableHead className="text-right">Fat</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {meal.ingredients.map((ingredient: any, ingIndex: number) => (
                                <TableRow key={ingIndex}>
                                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                                  <TableCell className="text-right">{ingredient.amount}</TableCell>
                                  <TableCell className="text-right">{ingredient.unit}</TableCell>
                                  <TableCell className="text-right">{ingredient.calories.toFixed(1)}</TableCell>
                                  <TableCell className="text-right">{ingredient.protein.toFixed(1)}g</TableCell>
                                  <TableCell className="text-right">{ingredient.carbs.toFixed(1)}g</TableCell>
                                  <TableCell className="text-right">{ingredient.fat.toFixed(1)}g</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>

                        {/* Meal totals */}
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="font-semibold">{meal.total_calories}</p>
                              <p className="text-xs text-muted-foreground">Cal</p>
                            </div>
                            <div>
                              <p className="font-semibold text-green-600">{meal.total_protein}g</p>
                              <p className="text-xs text-muted-foreground">Protein</p>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-600">{meal.total_carbs}g</p>
                              <p className="text-xs text-muted-foreground">Carbs</p>
                            </div>
                            <div>
                              <p className="font-semibold text-orange-600">{meal.total_fat}g</p>
                              <p className="text-xs text-muted-foreground">Fat</p>
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