'use client';

import { useAnalytics } from '@/features/providers/useAnalytics ';
import { analytics } from '@/lib/firebase/firebase';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { trackPageView } = useAnalytics();

  useEffect(
    function () {
      function handleRouteChange() {
        const url =
          pathname + (searchParams ? `?${searchParams.toString()}` : '');

        trackPageView(document.title, url);
      }

      handleRouteChange();
    },
    [searchParams, pathname, trackPageView]
  );

  useEffect(function () {
    if (analytics) console.log('Analytics Provider Is Working ✅');
  }, []);

  return children;
}

export default AnalyticsProvider;
