import { analytics } from '@/lib/firebase/firebase';
import { logEvent } from 'firebase/analytics';
import { useEffect } from 'react';

type EventParamsType = {
  [key: string]: string | number | boolean;
};

export function useAnalytics() {
  useEffect(function () {
    if (analytics) console.log('Analytics Provider Is Working ✅');
  }, []);

  function trackEvent(eventName: string, eventParams: EventParamsType = {}) {
    if (!analytics)
      return console.log('Analytics not available, page view not tracked');

    logEvent(analytics, eventName, eventParams);
  }

  function trackPageView(page_title: string, page_location: string) {
    if (!analytics)
      return console.log('Analytics not available, page view not tracked');

    logEvent(analytics, 'page_view', {
      page_location,
      page_title,
    });

    console.log('✅✅ Page view tracked ✅✅', { page_location, page_title });
  }

  function trackButtonClick(buttonName: string, eventParams = {}) {
    trackEvent('button_click', {
      button_name: buttonName,
      ...eventParams,
    });
  }

  function trackFormSubmit(formName: string, eventParams = {}) {
    trackEvent('form_submit', {
      form_name: formName,
      ...eventParams,
    });
  }

  return { trackEvent, trackPageView, trackButtonClick, trackFormSubmit };
}
