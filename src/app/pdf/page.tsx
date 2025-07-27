import LoadingScreen from '@/components/ui/LoadingScreen';
import PDFSection from '@/features/tools/components/pdf-preview/PDFSection';
import { Suspense } from 'react';

async function PDFPage() {
  return (
    <div>
      <Suspense fallback={<LoadingScreen />}>
        <PDFSection />
      </Suspense>
    </div>
  );
}

export default PDFPage;
