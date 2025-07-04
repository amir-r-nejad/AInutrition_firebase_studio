import { ONBOARDED_KEY } from './config';

export function getStoredOnboardingStatus(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read onboarding status from localStorage:', error);
    return false;
  }
}

export function setStoredOnboardingStatus(status: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDED_KEY, status.toString());
  } catch (error) {
    console.warn('Failed to store onboarding status:', error);
  }
}

export class RouteChecker {
  private pathname: string;

  constructor(pathname: string) {
    this.pathname = pathname;
  }

  isAuthPage(): boolean {
    return [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
    ].includes(this.pathname);
  }

  isOnboardingPage(): boolean {
    return this.pathname === '/onboarding';
  }

  isDashboardPage(): boolean {
    return ['/dashboard'].includes(this.pathname);
  }
}
