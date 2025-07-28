import ErrorMessage from '@/components/ui/ErrorMessage';
import {
  getMealPlan,
  getUserPlan,
  getUserProfile,
} from '@/lib/supabase/data-service';
import EditMealDialog from './EditMealDialog';
import WeeklyMealPlanTabs from './WeeklyMealPlanTabs';

async function PlanSection({
  searchParams,
  clientId,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  clientId?: string;
}) {
  try {
    const profile = await getUserProfile(clientId);
    const plan = await getUserPlan(clientId);
    const mealPlan = await getMealPlan(clientId);

    const params = await searchParams;
    const isEditing = params.is_edit;

    return (
      <>
        <WeeklyMealPlanTabs
          profile={profile}
          plan={plan}
          mealPlan={mealPlan}
          userId={clientId}
        />
        {isEditing && <EditMealDialog mealPlan={mealPlan} userId={clientId} />}
      </>
    );
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Unable to Load Meal Plan'
        message={
          error?.message ||
          "We couldn't load your meal plan. Please check your connection and try again."
        }
      />
    );
  }
}

export default PlanSection;
