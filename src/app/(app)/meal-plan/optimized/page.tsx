import { Card } from "@/components/ui/card";
import LoadingScreen from "@/components/ui/LoadingScreen";
import SectionHeader from "@/components/ui/SectionHeader";
import AiPlanSection from "@/features/meal-plan/components/optimized/AiPlanSection";
import { Suspense } from "react";

export default function OptimizedMealPlanPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl">
          <div className="p-6">
            <SectionHeader
              className="text-3xl font-bold mb-8"
              title="AI-Optimized Weekly Meal Plan"
              description="Generate a personalized meal plan based on your profile, goals, and preferences."
            />

            <Suspense fallback={<LoadingScreen />}>
              <AiPlanSection />
            </Suspense>
          </div>
        </Card>
      </div>
    </div>
  );
}