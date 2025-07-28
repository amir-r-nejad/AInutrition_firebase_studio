import {
  getUser,
  getUserDataById,
  getUserProfile,
} from '@/lib/supabase/data-service';
import ProfileForm from './ProfileForm';
import ErrorMessage from '@/components/ui/ErrorMessage';

async function ProfileSection({ clientId }: { clientId?: string }) {
  try {
    let user;

    if (clientId) user = await getUserDataById(clientId);
    else user = await getUser();

    const profile = await getUserProfile(clientId);

    return <ProfileForm user={user} profile={profile} clientId={clientId} />;
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
