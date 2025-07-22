import {
  getMealPlan,
  getUserPlan,
  getUserProfile,
} from '@/lib/supabase/data-service';
import PDFView from './PDFView';

async function PDFSection() {
  const profile = await getUserProfile();
  const plan = await getUserPlan();
  const mealPlan = await getMealPlan();

  return <PDFView profile={profile} plan={plan} mealPlan={mealPlan} />;
}

export default PDFSection;
