import { useState, useEffect } from "react";

export const useLastOptimizationResult = (
  key: string,
  type: "single-meal" | "meal-plan" | "meal-suggestion" = "single-meal",
) => {
  const [lastResult, setLastResult] = useState<any>(null);

  // خواندن آخرین نتیجه از localStorage
  useEffect(() => {
    try {
      const storageKey = `lastOptimizationResult_${type}_${key}`;
      const savedResult = localStorage.getItem(storageKey);
      if (savedResult) {
        setLastResult(JSON.parse(savedResult));
      }
    } catch (error) {
      console.error("Error loading last result from localStorage:", error);
    }
  }, [key, type]);

  // ذخیره نتیجه جدید
  const saveResult = (result: any) => {
    setLastResult(result);
    try {
      const storageKey = `lastOptimizationResult_${type}_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(result));
    } catch (error) {
      console.error("Error saving result to localStorage:", error);
    }
  };

  // پاک کردن نتیجه
  const clearResult = () => {
    setLastResult(null);
    try {
      const storageKey = `lastOptimizationResult_${type}_${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error removing result from localStorage:", error);
    }
  };

  return {
    lastResult,
    saveResult,
    clearResult,
  };
};
