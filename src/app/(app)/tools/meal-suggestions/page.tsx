import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import LoadingScreen from "@/components/ui/LoadingScreen";
import AIMealSuggestionSection from "@/features/tools/components/meal-suggestions/AIMealSuggestionSection";
import MealFormSection from "@/features/tools/components/meal-suggestions/MealFormSection";

import { ChefHat } from "lucide-react";
import { Suspense } from "react";

export default function MealSuggestionsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <ChefHat className="mr-3 h-8 w-8 text-primary" />
            AI Meal Suggestions & Optimization
          </CardTitle>
          <CardDescription>
            Get AI-powered meal suggestions and optimize them using our advanced
            AI genetic algorithm to perfectly match your macronutrient
            targets with personalized recommendations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="preferences"
          >
            <AccordionItem value="preferences">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">
                    1. Adjust Preferences for this Suggestion (Optional)
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent>
                <Suspense
                  key="form-key"
                  fallback={
                    <LoadingScreen loadingLabel="loading your preferences..." />
                  }
                >
                  <MealFormSection />
                </Suspense>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Suspense key="suggesstion-key" fallback={<p>Loading...</p>}>
            <AIMealSuggestionSection />
          </Suspense>
        </CardContent>
      </Card>


    </div>
  );
}
