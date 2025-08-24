// Meal Optimization API Configuration
export const MEAL_OPTIMIZATION_CONFIG = {
  API_BASE_URL: 'https://optimization-system-for-ai-nutrition.onrender.com',
  ENDPOINTS: {
    OPTIMIZE: '/optimize-rag-meal',
    OPTIMIZE_SINGLE_MEAL: '/optimize-single-meal',
    TEST_CONNECTION: '/test-rag-connection',
    HEALTH: '/health',
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

export const DEFAULT_USER_PREFERENCES = {
  dietary_restrictions: [],
  allergies: [],
  preferred_cuisines: ['persian'],
  calorie_preference: 'moderate' as const,
  protein_preference: 'high' as const,
  carb_preference: 'moderate' as const,
  fat_preference: 'moderate' as const,
};
