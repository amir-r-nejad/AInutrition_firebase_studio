import ErrorMessage from '@/components/ui/ErrorMessage';
import PlanSection from '@/features/meal-plan/components/current/PlanSection';

export async function CoachClientMealPlan({
  searchParams,
  clientId,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  clientId: string;
}) {
  try {
    return <PlanSection searchParams={searchParams} clientId={clientId} />;
  } catch (error: any) {
    return (
      <ErrorMessage
        title='Meal Plan Unavailable'
        message={
          error?.message ||
          "We couldn't load this client's meal plan. The client may not have created one yet."
        }
      />
    );
  }
}
