import LoadingScreen from '@/components/ui/LoadingScreen';
import { Suspense } from 'react';
import PDFSection from '../../features/tools/components/pdf-preview/PDFSection';

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
