import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import AIMealSuggestionGenerator from './AIMealSuggestionGenerator';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function AIMealSuggestionSection() {
  try {
    const profile = await getUserProfile();
    const plan = await getUserPlan();

    return <AIMealSuggestionGenerator plan={plan} profile={profile} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='AI Suggestions Unavailable'
        message={
          error?.message ||
          "We couldn't load your profile data for AI meal suggestions. Please check your settings and try again."
        }
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }
}

export default AIMealSuggestionSection;
