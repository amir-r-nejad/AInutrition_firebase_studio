import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import PlannerForm from './PlannerForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function PlannerSection({ clientId }: { clientId?: string }) {
  try {
    const profile = await getUserProfile(clientId);
    const plan = await getUserPlan(clientId);

    return <PlannerForm profile={profile} plan={plan} clientId={clientId} />;
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
