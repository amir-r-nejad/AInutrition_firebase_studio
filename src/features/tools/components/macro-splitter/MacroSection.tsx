import ErrorMessage from '@/components/ui/ErrorMessage';
import { getUserPlan, getUserProfile } from '@/lib/supabase/data-service';
import MacroForm from './MacroForm';

async function MacroSection() {
  try {
    const plan = await getUserPlan();
    const profile = await getUserProfile();

    return <MacroForm plan={plan} profile={profile} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Macro Data Unavailable'
        message={
          error?.message ||
          "We couldn't load your macro targets. Please ensure your profile is complete."
        }
        showHomeLink={false}
      />
    );
  }
}

export default MacroSection;
