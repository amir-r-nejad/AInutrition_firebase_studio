import ErrorMessage from '@/components/ui/ErrorMessage';
import { getCoachProfile } from '../lib/data-service';
import { CoachProfileForm } from './profile/CoachProfileForm';
import { CoachProfileHeader } from './profile/CoachProfileHeader';
import { unstable_noStore as noStore } from 'next/cache';

export async function CoachProfileSection() {
  noStore();
  try {
    const coach = await getCoachProfile();

    return (
      <div className='space-y-8'>
        <CoachProfileHeader coach={coach} />

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2'>
            <CoachProfileForm coach={coach} />
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    return <ErrorMessage title='Profile error' message={error.message} />;
  }
}
