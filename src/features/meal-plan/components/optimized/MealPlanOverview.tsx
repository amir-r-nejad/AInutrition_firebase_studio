'use client';

import { GeneratePersonalizedMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { chartConfig } from '@/features/meal-plan/lib/config';
import { daysOfWeek } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { BarChart3, ChefHat } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';

type MealPlanOverviewProps = {
  mealPlan: GeneratePersonalizedMealPlanOutput | null;
};

function MealPlanOverview({ mealPlan }: MealPlanOverviewProps) {
  if (!mealPlan) return null;

  return (
    <div className='space-y-8 mt-6'>
      {mealPlan.weeklySummary && (
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl flex items-center'>
              <BarChart3 className='mr-2 h-6 w-6 text-primary' />
              Weekly Nutritional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Calories</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weeklySummary.totalCalories, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  kcal
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Protein</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weeklySummary.totalProtein, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Carbs</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weeklySummary.totalCarbs, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Fat</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weeklySummary.totalFat, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g
                </p>
              </div>
            </div>
            <ChartContainer config={chartConfig} className='w-full h-[250px]'>
              <BarChart
                accessibilityLayer
                data={[
                  {
                    name: 'Protein',
                    value: mealPlan.weeklySummary.totalProtein,
                    fill: 'var(--color-protein)',
                  },
                  {
                    name: 'Carbs',
                    value: mealPlan.weeklySummary.totalCarbs,
                    fill: 'var(--color-carbs)',
                  },
                  {
                    name: 'Fat',
                    value: mealPlan.weeklySummary.totalFat,
                    fill: 'var(--color-fat)',
                  },
                ]}
                margin={{ top: 20, right: 0, left: -20, bottom: 5 }}
              >
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis
                  dataKey='name'
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey='value' radius={5}>
                  <LabelList
                    position='top'
                    offset={8}
                    className='fill-foreground text-xs'
                    formatter={(value: number) =>
                      `${formatNumber(value, { maximumFractionDigits: 0 })}g`
                    }
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Tabs
        defaultValue={mealPlan.weeklyMealPlan[0]?.day || daysOfWeek[0]}
        className='w-full'
      >
        <ScrollArea className='w-full whitespace-nowrap rounded-md border'>
          <TabsList className='inline-flex h-auto bg-muted p-1'>
            {mealPlan.weeklyMealPlan.map((dayPlan) => (
              <TabsTrigger
                key={dayPlan.day}
                value={dayPlan.day}
                className='px-4 py-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm'
              >
                {dayPlan.day}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>

        {mealPlan.weeklyMealPlan.map((dayPlan) => (
          <TabsContent key={dayPlan.day} value={dayPlan.day} className='mt-6'>
            <div className='space-y-6'>
              {dayPlan.meals.map((meal, mealIndex) => (
                <Card key={mealIndex} className='shadow-md'>
                  <CardHeader>
                    <CardTitle className='text-xl font-semibold flex items-center'>
                      <ChefHat className='mr-2 h-5 w-5 text-accent' />
                      {meal.meal_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h4 className='font-medium text-md mb-2 text-primary'>
                      Ingredients:
                    </h4>
                    <ScrollArea className='w-full mb-4'>
                      <Table className='min-w-[500px]'>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-[40%]'>
                              Ingredient
                            </TableHead>
                            <TableHead className='text-right w-[15%]'>
                              Qty (g)
                            </TableHead>
                            <TableHead className='text-right w-[15%]'>
                              Calories
                            </TableHead>
                            <TableHead className='text-right w-[15%]'>
                              Protein (g)
                            </TableHead>
                            <TableHead className='text-right w-[15%]'>
                              Fat (g)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {meal.ingredients.map((ing, ingIndex) => {
                            return (
                              <TableRow key={ingIndex}>
                                <TableCell className='font-medium py-1.5'>
                                  {ing.ingredient_name}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {formatNumber(ing.quantity_g, {
                                    maximumFractionDigits: 0,
                                  })}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.macros_per_100g.calories
                                    ? formatNumber(
                                        (ing.macros_per_100g.calories *
                                          ing.quantity_g) /
                                          100,
                                        { maximumFractionDigits: 0 }
                                      )
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.macros_per_100g.protein_g
                                    ? formatNumber(
                                        (ing.macros_per_100g.protein_g *
                                          ing.quantity_g) /
                                          100,
                                        { maximumFractionDigits: 1 }
                                      )
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.macros_per_100g.fat_g
                                    ? formatNumber(
                                        (ing.macros_per_100g.fat_g *
                                          ing.quantity_g) /
                                          100,
                                        { maximumFractionDigits: 1 }
                                      )
                                    : 'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation='horizontal' />
                    </ScrollArea>
                    <div className='text-sm font-semibold p-2 border-t border-muted-foreground/20 bg-muted/40 rounded-b-md'>
                      Total:{' '}
                      {formatNumber(meal.total_calories, {
                        maximumFractionDigits: 0,
                      })}{' '}
                      kcal | Protein:{' '}
                      {formatNumber(meal.total_protein_g, {
                        maximumFractionDigits: 1,
                      })}
                      g | Fat:{' '}
                      {formatNumber(meal.total_fat_g, {
                        maximumFractionDigits: 1,
                      })}
                      g
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default MealPlanOverview;
