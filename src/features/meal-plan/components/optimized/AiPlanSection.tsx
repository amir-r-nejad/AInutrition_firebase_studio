import ErrorMessage from '@/components/ui/ErrorMessage';
import {
  getMealPlan,
  getUserPlan,
  getUserProfile,
} from '@/lib/supabase/data-service';
import MealPlanGenerator from './MealPlanGenerator';

async function AiPlanSection({ clientId }: { clientId?: string }) {
  try {
    const mealPlan = await getMealPlan(clientId);
    const profile = await getUserProfile(clientId);
    const userPlan = await getUserPlan(clientId);

    return (
      <MealPlanGenerator
        mealPlan={mealPlan}
        profile={profile}
        userPlan={userPlan}
      />
    );
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Unable to Load data'
        message={
          error?.message ||
          "We couldn't load your data. Please check your connection and try again."
        }
      />
    );
  }
}

export default AiPlanSection;
