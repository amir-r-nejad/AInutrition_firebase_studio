export type AnalyticsProps = {
  trackClick?: boolean;
  buttonName?: string;
  buttonCategory?: string;
  buttonLocation?: string;
  analyticsData?: Record<string, string | number | boolean>;
};
