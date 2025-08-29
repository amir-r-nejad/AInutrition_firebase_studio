import { useState, useCallback } from "react";
import { MealOptimizationService } from "@/services/meal-optimization";
import {
  MealOptimizationRequest,
  MealOptimizationResponse,
} from "@/types/meal-optimization";

export const useMealOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MealOptimizationResponse | null>(null);

  const optimizeMeal = useCallback(async (request: MealOptimizationRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await MealOptimizationService.retryRequest(() =>
        MealOptimizationService.optimizeMealPlan(request),
      );
      setResult(response);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    try {
      return await MealOptimizationService.retryRequest(() =>
        MealOptimizationService.testConnection(),
      );
    } catch (err) {
      console.error("Connection test failed:", err);
      throw err;
    }
  }, []);

  const getHealth = useCallback(async () => {
    try {
      return await MealOptimizationService.retryRequest(() =>
        MealOptimizationService.getHealth(),
      );
    } catch (err) {
      console.error("Health check failed:", err);
      throw err;
    }
  }, []);

  return {
    optimizeMeal,
    testConnection,
    getHealth,
    isLoading,
    error,
    result,
    reset: () => {
      setError(null);
      setResult(null);
    },
  };
};
