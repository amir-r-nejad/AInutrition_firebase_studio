import { MealOptimizationRequest, MealOptimizationResponse, RAGIngredient } from '@/types/meal-optimization';

export class MealOptimizationFallbackService {
  static generateMockOptimization(request: MealOptimizationRequest): MealOptimizationResponse {
    const { target_macros, rag_response } = request;
    
    // Calculate original macros from RAG response
    const originalMacros = {
      calories: rag_response.suggestions.reduce((sum, s) => sum + (s.totalCalories || 0), 0),
      protein: rag_response.suggestions.reduce((sum, s) => sum + (s.totalProtein || 0), 0),
      carbs: rag_response.suggestions.reduce((sum, s) => sum + (s.totalCarbs || 0), 0),
      fat: rag_response.suggestions.reduce((sum, s) => sum + (s.totalFat || 0), 0),
    };

    // Generate mock meal plans based on target macros
    const mealPlans = [
      {
        meal_time: "Breakfast",
        total_calories: Math.round(target_macros.calories * 0.3),
        total_protein: Math.round(target_macros.protein * 0.3 * 10) / 10,
        total_carbs: Math.round(target_macros.carbohydrates * 0.3 * 10) / 10,
        total_fat: Math.round(target_macros.fat * 0.3 * 10) / 10,
        items: [
          {
            ingredient: {
              id: "mock-1",
              name: "Oatmeal",
              category: "Grains",
              calories_per_100g: 389,
              protein_per_100g: 16.9,
              carbs_per_100g: 66.3,
              fat_per_100g: 6.9,
            },
            quantity_grams: 80,
          },
          {
            ingredient: {
              id: "mock-2",
              name: "Greek Yogurt",
              category: "Dairy",
              calories_per_100g: 59,
              protein_per_100g: 10,
              carbs_per_100g: 3.6,
              fat_per_100g: 0.4,
            },
            quantity_grams: 150,
          },
        ],
      },
      {
        meal_time: "Lunch",
        total_calories: Math.round(target_macros.calories * 0.35),
        total_protein: Math.round(target_macros.protein * 0.35 * 10) / 10,
        total_carbs: Math.round(target_macros.carbohydrates * 0.35 * 10) / 10,
        total_fat: Math.round(target_macros.fat * 0.35 * 10) / 10,
        items: [
          {
            ingredient: {
              id: "mock-3",
              name: "Chicken Breast",
              category: "Protein",
              calories_per_100g: 165,
              protein_per_100g: 31,
              carbs_per_100g: 0,
              fat_per_100g: 3.6,
            },
            quantity_grams: 120,
          },
          {
            ingredient: {
              id: "mock-4",
              name: "Brown Rice",
              category: "Grains",
              calories_per_100g: 370,
              protein_per_100g: 7.9,
              carbs_per_100g: 77,
              fat_per_100g: 2.9,
            },
            quantity_grams: 100,
          },
        ],
      },
      {
        meal_time: "Dinner",
        total_calories: Math.round(target_macros.calories * 0.35),
        total_protein: Math.round(target_macros.protein * 0.35 * 10) / 10,
        total_carbs: Math.round(target_macros.carbohydrates * 0.35 * 10) / 10,
        total_fat: Math.round(target_macros.fat * 0.35 * 10) / 10,
        items: [
          {
            ingredient: {
              id: "mock-5",
              name: "Salmon",
              category: "Protein",
              calories_per_100g: 208,
              protein_per_100g: 25,
              carbs_per_100g: 0,
              fat_per_100g: 12,
            },
            quantity_grams: 100,
          },
          {
            ingredient: {
              id: "mock-6",
              name: "Sweet Potato",
              category: "Vegetables",
              calories_per_100g: 86,
              protein_per_100g: 1.6,
              carbs_per_100g: 20.1,
              fat_per_100g: 0.1,
            },
            quantity_grams: 150,
          },
        ],
      },
    ];

    // Calculate daily totals
    const dailyTotals = {
      calories: mealPlans.reduce((sum, meal) => sum + meal.total_calories, 0),
      protein: mealPlans.reduce((sum, meal) => sum + meal.total_protein, 0),
      carbohydrates: mealPlans.reduce((sum, meal) => sum + meal.total_carbs, 0),
      fat: mealPlans.reduce((sum, meal) => sum + meal.total_fat, 0),
    };

    // Generate mock shopping list
    const shoppingList = [
      { name: "Oatmeal", quantity: 1, unit: "bag", category: "Grains" },
      { name: "Greek Yogurt", quantity: 2, unit: "containers", category: "Dairy" },
      { name: "Chicken Breast", quantity: 1, unit: "package", category: "Protein" },
      { name: "Brown Rice", quantity: 1, unit: "bag", category: "Grains" },
      { name: "Salmon", quantity: 1, unit: "filet", category: "Protein" },
      { name: "Sweet Potato", quantity: 3, unit: "pieces", category: "Vegetables" },
    ];

    // Generate mock recommendations
    const recommendations = [
      "Consider meal prepping on Sundays for easier weekday meals",
      "Add leafy greens to increase micronutrient intake",
      "Drink plenty of water throughout the day",
      "Consider adding healthy fats like avocado or nuts",
    ];

    return {
      optimization_result: {
        success: true,
        target_achieved: true,
        optimization_method: "Fallback Algorithm (External API Unavailable)",
        objective_value: 0.95,
        constraints_violated: [],
        computation_time: 0.1,
      },
      meal_plans: mealPlans,
      daily_totals: dailyTotals,
      recommendations,
      cost_estimate: 45.50,
      shopping_list: shoppingList,
      rag_enhancement: {
        original_macros: originalMacros,
        added_ingredients: [
          {
            name: "Greek Yogurt",
            amount: 150,
            unit: "g",
            calories: 88.5,
            protein: 15,
            carbs: 5.4,
            fat: 0.6,
          },
        ],
        enhancement_notes: "Added protein-rich ingredients to meet macro targets. Using fallback optimization due to external API unavailability.",
      },
      user_id: request.user_id,
    };
  }
}
