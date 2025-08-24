import { MealOptimizationRequest, MealOptimizationResponse } from '@/types/meal-optimization';
import { MEAL_OPTIMIZATION_CONFIG } from '@/lib/config/meal-optimization';
import { MealOptimizationFallbackService } from './meal-optimization-fallback';

export class MealOptimizationService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEAL_OPTIMIZATION_CONFIG.TIMEOUT);

    try {
      // Use our local Next.js API route to avoid CORS issues
      const response = await fetch('/api/meal-optimization', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          data: options.body ? JSON.parse(options.body as string) : undefined
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      
      console.error('Meal optimization API error:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  private static async makeGetRequest<T>(
    endpoint: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEAL_OPTIMIZATION_CONFIG.TIMEOUT);

    try {
      // Use our local Next.js API route to avoid CORS issues
      const response = await fetch(`/api/meal-optimization?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw error;
      }
      
      console.error('Meal optimization API error:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  static async optimizeMealPlan(
    request: MealOptimizationRequest,
    useFallback: boolean = false
  ): Promise<MealOptimizationResponse> {
    try {
      // First try the external API
      return await this.makeRequest<MealOptimizationResponse>(MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.warn('External API failed:', error);
      
      if (!useFallback) {
        // If fallback is disabled, re-throw the error
        throw new Error(`External API unavailable: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later or enable fallback service.`);
      }
      
      // If fallback is enabled, use fallback service
      const fallbackResult = MealOptimizationFallbackService.generateMockOptimization(request);
      
      // Add a flag to indicate this is a fallback result
      (fallbackResult as any).isFallback = true;
      (fallbackResult as any).fallbackReason = error instanceof Error ? error.message : 'External API unavailable';
      
      return fallbackResult;
    }
  }

  static async testConnection(): Promise<{ message: string; status: string }> {
    try {
      return await this.makeRequest<{ message: string; status: string }>(MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.TEST_CONNECTION, {
        method: 'POST',
      });
    } catch (error) {
      return {
        message: 'External API unavailable',
        status: 'error'
      };
    }
  }

  static async getHealth(): Promise<{ status: string; message: string }> {
    try {
      return await this.makeGetRequest<{ status: string; message: string }>(MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH);
    } catch (error) {
      return {
        status: 'error',
        message: 'External API health check failed'
      };
    }
  }

  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxAttempts: number = MEAL_OPTIMIZATION_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}
