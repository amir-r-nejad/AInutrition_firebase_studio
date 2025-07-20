import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    ...options,
  }).format(value);
}

export function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/';

  url = url.startsWith('http') ? url : `https://${url}`;
  url = url.endsWith('/') ? url : `${url}/`;

  return url;
}

export function getAIApiErrorMessage(error: any): string {
  const genericMessage =
    'An unexpected error occurred with the AI service. Please try again later.';
  if (!error || !error.message || typeof error.message !== 'string') {
    return genericMessage;
  }

  const message = error.message as string;

  if (message.includes('503') || message.includes('overloaded')) {
    return 'The AI model is currently busy or unavailable. Please try again in a few moments.';
  }

  if (
    message.includes('403 Forbidden') ||
    message.includes('API_KEY_SERVICE_BLOCKED')
  ) {
    return 'AI API Error: Access is forbidden. Please check if your Google AI API key is correct and that the "Generative Language API" is enabled in your Google Cloud project.';
  }

  if (message.includes('400 Bad Request')) {
    return 'AI API Error: The request was malformed, which might be due to a temporary issue or invalid input. Please check your inputs and try again.';
  }

  if (message.includes('500 Internal Server Error')) {
    return 'AI API Error: The AI service is currently experiencing issues. Please try again later.';
  }

  return `AI Error: ${message.substring(0, 150)}${
    message.length > 150 ? '...' : ''
  }`;
}
