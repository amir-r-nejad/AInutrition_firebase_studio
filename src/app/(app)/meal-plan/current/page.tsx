import { Card, CardContent } from "@/components/ui/card";
import LoadingScreen from "@/components/ui/LoadingScreen";
import SectionHeader from "@/components/ui/SectionHeader";
import PlanSection from "@/features/meal-plan/components/current/PlanSection";
import { Suspense } from "react";
import { getMealPlan } from "@/features/meal-plan/lib/data-service-current";
import { adjustMealIngredientsDirect } from "@/ai/flows/adjust-meal-ingredients-direct";

export default async function CurrentMealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <SectionHeader
          className="text-3xl font-bold"
          title="Your Current Weekly Meal Plan"
          description="View and manage your meals for the week. Click on a meal to edit or
          optimize with AI."
        />
        <CardContent>
          <Suspense fallback={<LoadingScreen />}>
            <PlanSection searchParams={resolvedSearchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}