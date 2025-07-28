import {
  getMealPlan,
  getUser,
  getUserDataById,
  getUserPlan,
  getUserProfile,
} from '@/lib/supabase/data-service';
import PDFView from './PDFView';

async function PDFSection({ clientId }: { clientId?: string }) {
  const profile = await getUserProfile(clientId);
  const plan = await getUserPlan(clientId);
  const mealPlan = await getMealPlan(clientId);

  let user;
  if (clientId) user = await getUserDataById(clientId);
  else user = await getUser();

  return (
    <PDFView profile={profile} plan={plan} mealPlan={mealPlan} user={user} />
  );
}

export default PDFSection;
