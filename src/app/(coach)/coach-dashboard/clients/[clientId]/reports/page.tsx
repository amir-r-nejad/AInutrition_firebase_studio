import PDFSection from '@/features/tools/components/pdf-preview/PDFSection';
import { ClientReportsSkeleton } from '@/features/coach/components/loading/ClientReportsSkeleton';
import { Suspense } from 'react';

async function CoachReportspage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className='container mx-auto py-8'>
      <Suspense fallback={<ClientReportsSkeleton />}>
        <PDFSection clientId={clientId} />
      </Suspense>
    </div>
  );
}

export default CoachReportspage;
