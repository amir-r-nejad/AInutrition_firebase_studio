// Meal Optimization API Configuration
// ✅ UPDATED: Now using the actual external optimization service URL

export const MEAL_OPTIMIZATION_CONFIG = {
  // 🔗 External optimization service URL (ACTIVE)
  API_BASE_URL: "https://optimization-system-for-ai-nutrition.onrender.com",

  TIMEOUT: 300000, // 5 minutes timeout

  ENDPOINTS: {
    OPTIMIZE_SINGLE_MEAL: "/optimize-meal", // Main meal optimization endpoint (NEW)
    OPTIMIZE_SINGLE_MEAL_ADVANCED: "/optimize-meal", // Use new endpoint for advanced
    OPTIMIZE_SINGLE_MEAL_SIMPLE: "/optimize-meal", // Use new endpoint for simple
    OPTIMIZE_SINGLE_MEAL_BASIC: "/optimize-meal", // Basic optimization endpoint (NEW)
    HEALTH: "/health", // Health check endpoint
    INGREDIENTS: "/api/ingredients", // Ingredients endpoint
    RAG_INGREDIENTS: "/api/rag-ingredients", // RAG ingredients endpoint
    TEST_CONNECTION: "/health", // Use health for connection testing
  },
};

// 📋 Configuration Status:
// ✅ Service URL: https://optimization-system-for-ai-nutrition.onrender.com
// ✅ Endpoints configured for RAG optimization
// ✅ Ready for production use
// 🔍 Testing different endpoint paths for compatibility

export const DEFAULT_USER_PREFERENCES = {
  dietary_restrictions: [],
  allergies: [],
  preferred_cuisines: ["persian"],
  calorie_preference: "moderate" as const,
  protein_preference: "high" as const,
  carb_preference: "moderate" as const,
  fat_preference: "moderate" as const,
};
