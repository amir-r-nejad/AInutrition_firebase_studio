import { getUser, getUserProfile } from '@/lib/supabase/data-service';
import ProfileForm from './ProfileForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function ProfileSection() {
  try {
    const user = await getUser();
    const profile = await getUserProfile();

    return <ProfileForm user={user} profile={profile} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Profile Data Unavailable'
        message={
          error?.message ||
          "We couldn't load your profile information. Please ensure you're logged in and try again."
        }
      />
    );
  }
}

export default ProfileSection;
