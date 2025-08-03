import ErrorMessage from "@/components/ui/ErrorMessage";
import {
  getMealPlan,
  getUserPlan,
  getUserProfile,
} from "@/lib/supabase/data-service";
import MealPlanGenerator from "./MealPlanGenerator";

async function AiPlanSection({ clientId }: { clientId?: string }) {
  try {
    const mealPlan = await getMealPlan(clientId);
    const profile = await getUserProfile(clientId);
    const userPlan = await getUserPlan(clientId);

    console.log("AiPlanSection mealPlan:", JSON.stringify(mealPlan, null, 2));
    console.log("AiPlanSection profile:", JSON.stringify(profile, null, 2));
    console.log("AiPlanSection userPlan:", JSON.stringify(userPlan, null, 2));

    return (
      <MealPlanGenerator
        mealPlan={mealPlan}
        profile={profile}
        userPlan={userPlan}
      />
    );
  } catch (error: any) {
    console.error("Error in AiPlanSection:", error);
    return (
      <ErrorMessage
        title="Unable to Load Data"
        message={
          error?.message ||
          "We couldn't load your data. Please check your connection and try again."
        }
      />
    );
  }
}

export default AiPlanSection;
