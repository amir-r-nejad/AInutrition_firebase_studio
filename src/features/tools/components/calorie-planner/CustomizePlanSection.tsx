import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import CustomizePlanForm from './CustomizePlanForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function CustomizePlanSection() {
  try {
    const profile = await getUserProfile();
    const plan = await getUserPlan();

    return <CustomizePlanForm plan={plan} profile={profile} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Unable to Load Plan Data'
        message={
          error?.message ||
          "We couldn't load your nutrition plan data. Please check your profile settings and try again."
        }
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

export default CustomizePlanSection;
