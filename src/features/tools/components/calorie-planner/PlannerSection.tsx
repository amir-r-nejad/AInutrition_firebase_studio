import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import PlannerForm from './PlannerForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function PlannerSection() {
  try {
    const profile = await getUserProfile();
    const plan = await getUserPlan();

    return <PlannerForm profile={profile} plan={plan} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Planner Data Error'
        message={
          error?.message ||
          "We couldn't load your planner data. Please ensure your profile is complete and try again."
        }
      />
    );
  }
}

export default PlannerSection;
