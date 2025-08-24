import { SingleMealOptimizationRequest, SingleMealOptimizationResponse } from '@/types/meal-optimization';
import { MEAL_OPTIMIZATION_CONFIG } from '@/lib/config/meal-optimization';

export class SingleMealOptimizationService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEAL_OPTIMIZATION_CONFIG.TIMEOUT);

    try {
      // First check if the local API route is available
      const healthCheck = await fetch('/api/meal-optimization/single-meal', {
        method: 'OPTIONS',
        signal: controller.signal,
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        throw new Error('Local API route not available - using mock responses');
      }

      // Use our local Next.js API route for single meal optimization
      const response = await fetch('/api/meal-optimization/single-meal', {
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
        if (error.message.includes('Local API route not available')) {
          throw new Error('Local API route not available - using mock responses');
        }
        throw error;
      }
      
      console.error('Single meal optimization API error:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  static async optimizeSingleMeal(
    request: SingleMealOptimizationRequest
  ): Promise<SingleMealOptimizationResponse> {
    try {
      // For now, always use mock responses since the external optimization endpoint doesn't exist yet
      console.warn('External optimization endpoint not implemented yet, using mock response for testing');
      return this.generateMockOptimization(request);
      
      // Uncomment this when the external API is implemented:
      // return await this.makeRequest<SingleMealOptimizationResponse>(
      //   MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL, 
      //   {
      //     method: 'POST',
      //     body: JSON.stringify(request),
      //   }
      // );
    } catch (error) {
      console.error('Single meal optimization failed:', error);
      
      // If the external API is not available, return a mock response for testing
      if (error instanceof Error && (
        error.message.includes('External API endpoint not available') ||
        error.message.includes('API request failed: 404') ||
        error.message.includes('API request failed: 500') ||
        error.message.includes('Local API route not available')
      )) {
        console.warn('External API not available, returning mock response for testing');
        return this.generateMockOptimization(request);
      }
      
      throw error;
    }
  }

  // Generate a mock optimization response for testing when external API is not available
  private static generateMockOptimization(
    request: SingleMealOptimizationRequest
  ): SingleMealOptimizationResponse {
    const mealType = request.meal_type || 'lunch';
    const targetMacros = request.target_macros;
    
    // Create realistic mock ingredients with proper nutritional values
    const mockIngredients = [
      {
        ingredient: {
          id: 'shrimp_001',
          name: 'Shrimp',
          category: 'seafood',
          calories_per_100g: 99,
          protein_per_100g: 20.9,
          carbs_per_100g: 0.2,
          fat_per_100g: 1.7,
        },
        quantity_grams: 119.6,
      },
      {
        ingredient: {
          id: 'rice_001',
          name: 'Rice',
          category: 'grains',
          calories_per_100g: 130,
          protein_per_100g: 2.7,
          carbs_per_100g: 28,
          fat_per_100g: 0.3,
        },
        quantity_grams: 39.3,
      },
      {
        ingredient: {
          id: 'olive_oil_001',
          name: 'Olive Oil',
          category: 'fats',
          calories_per_100g: 884,
          protein_per_100g: 0,
          carbs_per_100g: 0,
          fat_per_100g: 100,
        },
        quantity_grams: 9.9,
      },
      {
        ingredient: {
          id: 'spinach_001',
          name: 'Spinach',
          category: 'vegetables',
          calories_per_100g: 23,
          protein_per_100g: 2.9,
          carbs_per_100g: 3.6,
          fat_per_100g: 0.4,
        },
        quantity_grams: 66.7,
      },
    ];

    // Calculate totals based on ingredients and quantities
    const totalCalories = mockIngredients.reduce((sum, item) => 
      sum + (item.ingredient.calories_per_100g * item.quantity_grams) / 100, 0
    );
    const totalProtein = mockIngredients.reduce((sum, item) => 
      sum + (item.ingredient.protein_per_100g * item.quantity_grams) / 100, 0
    );
    const totalCarbs = mockIngredients.reduce((sum, item) => 
      sum + (item.ingredient.carbs_per_100g * item.quantity_grams) / 100, 0
    );
    const totalFat = mockIngredients.reduce((sum, item) => 
      sum + (item.ingredient.fat_per_100g * item.quantity_grams) / 100, 0
    );

    return {
      optimization_result: {
        success: true,
        target_achieved: false, // Mock data might not meet targets exactly
        optimization_method: 'Mock Optimization (External API Not Available)',
        objective_value: 0.85,
        constraints_violated: [],
        computation_time: 0.1,
      },
      meal: {
        meal_time: mealType,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        items: mockIngredients,
      },
      target_achievement: {
        calories_achieved: Math.abs(totalCalories - targetMacros.calories) < 50,
        protein_achieved: Math.abs(totalProtein - targetMacros.protein) < 5,
        carbs_achieved: Math.abs(totalCarbs - targetMacros.carbohydrates) < 10,
        fat_achieved: Math.abs(totalFat - targetMacros.fat) < 5,
        notes: 'Mock optimization - targets may not be perfectly met',
      },
      recommendations: [
        'This is a mock response for testing purposes',
        'Implement the external API endpoint for real optimization',
        'Consider adding more vegetables for micronutrients',
      ],
      cost_estimate: 15.75,
      shopping_list: [
        { name: 'Shrimp', quantity: 1, unit: 'pack', category: 'seafood' },
        { name: 'Rice', quantity: 1, unit: 'pack', category: 'grains' },
        { name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'fats' },
        { name: 'Spinach', quantity: 1, unit: 'pack', category: 'vegetables' },
      ],
      rag_enhancement: {
        original_macros: {
          calories: 778,
          protein: 47.2,
          carbs: 84.0,
          fat: 31.3,
        },
        added_ingredients: [
          {
            name: 'Shrimp',
            amount: 119.6,
            unit: 'g',
            calories: 118.6,
            protein: 25.0,
            carbs: 0.2,
            fat: 2.0,
          },
          {
            name: 'Rice',
            amount: 39.3,
            unit: 'g',
            calories: 51.1,
            protein: 1.1,
            carbs: 11.0,
            fat: 0.1,
          },
          {
            name: 'Olive Oil',
            amount: 9.9,
            unit: 'g',
            calories: 87.5,
            protein: 0.0,
            carbs: 0.0,
            fat: 9.9,
          },
          {
            name: 'Spinach',
            amount: 66.7,
            unit: 'g',
            calories: 15.3,
            protein: 1.9,
            carbs: 2.4,
            fat: 0.3,
          },
        ],
        enhancement_notes: 'Mock enhancement - added realistic ingredients for testing',
      },
      user_id: request.user_id,
    };
  }

  static async testConnection(): Promise<{ message: string; status: string }> {
    try {
      // Check if the local API route is available
      const response = await fetch('/api/meal-optimization/single-meal', {
        method: 'OPTIONS',
      });
      
      if (response.ok) {
        return {
          message: 'Local API route is available - using mock responses for testing',
          status: 'success'
        };
      } else {
        return {
          message: 'Local API route not available - using mock responses',
          status: 'warning'
        };
      }
    } catch (error) {
      return {
        message: 'Local API route not available - using mock responses',
        status: 'warning'
      };
    }
  }

  static async getHealth(): Promise<{ status: string; message: string }> {
    try {
      // Check if the local API route is available
      const response = await fetch('/api/meal-optimization/single-meal', {
        method: 'GET',
      });
      
      if (response.ok) {
        return {
          status: 'success',
          message: 'Local API route is healthy - using mock responses for testing'
        };
      } else {
        return {
          status: 'warning',
          message: 'Local API route not responding - using mock responses'
        };
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'Local API route not available - using mock responses'
      };
    }
  }
}
