import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import CustomizePlanForm from './CustomizePlanForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function CustomizePlanSection({ clientId }: { clientId?: string }) {
  try {
    const profile = await getUserProfile(clientId);
    const plan = await getUserPlan(clientId);

    return (
      <CustomizePlanForm plan={plan} profile={profile} clientId={clientId} />
    );
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Unable to Load Plan Data'
        message={
          error?.message ||
          "We couldn't load your nutrition plan data. Please check your profile settings and try again."
        }
      />
    );
  }
}

export default CustomizePlanSection;
