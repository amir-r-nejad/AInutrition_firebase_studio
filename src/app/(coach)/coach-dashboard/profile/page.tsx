import { CoachProfileForm } from '@/features/coach/components/profile/CoachProfileForm';
import { CoachProfileHeader } from '@/features/coach/components/profile/CoachProfileHeader';

export default function CoachProfilePage() {
  return (
    <div className='space-y-8'>
      <CoachProfileHeader />

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2'>
          <CoachProfileForm />
        </div>
      </div>
    </div>
  );
}
