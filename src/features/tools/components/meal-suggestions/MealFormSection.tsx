import { getUserProfile } from '@/lib/supabase/data-service';
import MealForm from './MealForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function MealFormSection() {
  try {
    const profile = await getUserProfile();

    return <MealForm profile={profile} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Profile Data Required'
        message={
          error?.message ||
          "We couldn't load your profile data. Please ensure you're logged in and your profile is set up."
        }
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

export default MealFormSection;
