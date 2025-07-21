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
import { GeneratePersonalizedMealPlanOutput } from '@/lib/schemas';
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
      {mealPlan.weekly_summary && (
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
                  {formatNumber(mealPlan.weekly_summary.total_calories, {
                    maximumFractionDigits: 0,
                  })}{' '}
                  kcal
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Protein</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weekly_summary.total_protein, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Carbs</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weekly_summary.total_carbs, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  g
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Total Fat</p>
                <p className='text-xl font-bold'>
                  {formatNumber(mealPlan.weekly_summary.total_fat, {
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
                    value: mealPlan.weekly_summary.total_protein,
                    fill: 'var(--color-protein)',
                  },
                  {
                    name: 'Carbs',
                    value: mealPlan.weekly_summary.total_carbs,
                    fill: 'var(--color-carbs)',
                  },
                  {
                    name: 'Fat',
                    value: mealPlan.weekly_summary.total_fat,
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
        defaultValue={mealPlan.days[0]?.day_of_week || daysOfWeek[0]}
        className='w-full'
      >
        <ScrollArea className='w-full whitespace-nowrap rounded-md border'>
          <TabsList className='inline-flex h-auto bg-muted p-1'>
            {mealPlan.days.map((dayPlan) => (
              <TabsTrigger
                key={dayPlan.day_of_week}
                value={dayPlan.day_of_week}
                className='px-4 py-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm'
              >
                {dayPlan.day_of_week}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>

        {mealPlan.days.map((dayPlan) => (
          <TabsContent
            key={dayPlan.day_of_week}
            value={dayPlan.day_of_week}
            className='mt-6'
          >
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
                                  {ing.name}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.quantity
                                    ? formatNumber(ing.quantity, {
                                        maximumFractionDigits: 0,
                                      })
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.calories && ing.quantity
                                    ? formatNumber(
                                        (ing.calories * ing.quantity) / 100,
                                        {
                                          maximumFractionDigits: 0,
                                        }
                                      )
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.protein && ing.quantity
                                    ? formatNumber(
                                        (ing.protein * ing.quantity) / 100,
                                        {
                                          maximumFractionDigits: 1,
                                        }
                                      )
                                    : 'N/A'}
                                </TableCell>
                                <TableCell className='text-right py-1.5'>
                                  {ing.fat && ing.quantity
                                    ? formatNumber(
                                        (ing.fat * ing.quantity) / 100,
                                        {
                                          maximumFractionDigits: 1,
                                        }
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
                      {meal.total_calories
                        ? formatNumber(meal.total_calories, {
                            maximumFractionDigits: 0,
                          })
                        : 'N/A'}{' '}
                      kcal | Protein:{' '}
                      {meal.total_protein
                        ? formatNumber(meal.total_protein, {
                            maximumFractionDigits: 1,
                          })
                        : 'N/A'}
                      g | Fat:{' '}
                      {meal.total_fat
                        ? formatNumber(meal.total_fat, {
                            maximumFractionDigits: 1,
                          })
                        : 'N/A'}
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
