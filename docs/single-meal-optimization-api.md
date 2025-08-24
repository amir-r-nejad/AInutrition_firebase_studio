# Single Meal Optimization API

## Overview

This document describes the backend API endpoint that needs to be implemented to support single meal optimization functionality.

## Endpoint

```
POST /optimize-single-meal
```

## Request Format

```typescript
interface SingleMealOptimizationRequest {
  rag_response: {
    suggestions: Array<{
      mealTitle?: string;
      description?: string;
      ingredients: Array<{
        name: string;
        amount: string | number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        macrosString?: string;
      }>;
      totalCalories?: number;
      totalProtein?: number;
      totalCarbs?: number;
      totalFat?: number;
      instructions?: string;
    }>;
    success: boolean;
    message?: string;
  };
  target_macros: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  user_preferences: {
    dietary_restrictions: string[];
    allergies: string[];
    preferred_cuisines: string[];
    calorie_preference: 'low' | 'moderate' | 'high';
    protein_preference: 'low' | 'moderate' | 'high';
    carb_preference: 'low' | 'moderate' | 'high';
    fat_preference: 'low' | 'moderate' | 'high';
  };
  user_id: string;
  meal_type: string; // e.g., "lunch", "breakfast", "dinner"
}
```

## Response Format

```typescript
interface SingleMealOptimizationResponse {
  optimization_result: {
    success: boolean;
    target_achieved: boolean;
    optimization_method: string;
    objective_value: number;
    constraints_violated: string[];
    computation_time: number;
  };
  meal: {
    meal_time: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    items: Array<{
      ingredient: {
        id: string;
        name: string;
        category: string;
        calories_per_100g: number;
        protein_per_100g: number;
        carbs_per_100g: number;
        fat_per_100g: number;
      };
      quantity_grams: number;
    }>;
  };
  target_achievement: {
    calories_achieved: boolean;
    protein_achieved: boolean;
    carbs_achieved: boolean;
    fat_achieved: boolean;
    notes: string;
  };
  recommendations: string[];
  cost_estimate: number;
  shopping_list: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  rag_enhancement: {
    original_macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    added_ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>;
    enhancement_notes: string;
  };
  user_id: string;
}
```

## Expected Behavior

1. **Accept RAG suggestions**: The API should receive meal suggestions from the RAG system
2. **Optimize ingredients**: Adjust ingredient quantities to meet target macro requirements
3. **Add ingredients if needed**: If targets cannot be met with existing ingredients, suggest additional ingredients
4. **Return single meal**: Return only one meal (not a 7-day plan) with optimized ingredients

## Example Request

```json
{
  "rag_response": {
    "suggestions": [
      {
        "mealTitle": "Persian Lunch",
        "description": "Traditional Persian lunch with rice and meat",
        "ingredients": [
          {
            "name": "Basmati Rice",
            "amount": "100",
            "unit": "g",
            "calories": 130,
            "protein": 2.7,
            "carbs": 28,
            "fat": 0.3
          },
          {
            "name": "Chicken Breast",
            "amount": "150",
            "unit": "g",
            "calories": 165,
            "protein": 31,
            "carbs": 0,
            "fat": 3.6
          }
        ],
        "totalCalories": 295,
        "totalProtein": 33.7,
        "totalCarbs": 28,
        "totalFat": 3.9
      }
    ],
    "success": true,
    "message": "AI-generated meal suggestions"
  },
  "target_macros": {
    "calories": 800,
    "protein": 40,
    "carbohydrates": 80,
    "fat": 25
  },
  "user_preferences": {
    "dietary_restrictions": [],
    "allergies": [],
    "preferred_cuisines": ["persian"],
    "calorie_preference": "moderate",
    "protein_preference": "high",
    "carb_preference": "moderate",
    "fat_preference": "moderate"
  },
  "user_id": "user_123",
  "meal_type": "lunch"
}
```

## Example Response

```json
{
  "optimization_result": {
    "success": true,
    "target_achieved": true,
    "optimization_method": "Linear Programming Optimization",
    "objective_value": 0.95,
    "constraints_violated": [],
    "computation_time": 2.3
  },
  "meal": {
    "meal_time": "lunch",
    "total_calories": 795.2,
    "total_protein": 40.1,
    "total_carbs": 79.8,
    "total_fat": 24.7,
    "items": [
      {
        "ingredient": {
          "id": "rice_001",
          "name": "Basmati Rice",
          "category": "grains",
          "calories_per_100g": 130,
          "protein_per_100g": 2.7,
          "carbs_per_100g": 28,
          "fat_per_100g": 0.3
        },
        "quantity_grams": 245.6
      },
      {
        "ingredient": {
          "id": "chicken_001",
          "name": "Chicken Breast",
          "category": "protein",
          "calories_per_100g": 165,
          "protein_per_100g": 31,
          "carbs_per_100g": 0,
          "fat_per_100g": 3.6
        },
        "quantity_grams": 129.4
      },
      {
        "ingredient": {
          "id": "olive_oil_001",
          "name": "Olive Oil",
          "category": "fats",
          "calories_per_100g": 884,
          "protein_per_100g": 0,
          "carbs_per_100g": 0,
          "fat_per_100g": 100
        },
        "quantity_grams": 20.8
      }
    ]
  },
  "target_achievement": {
    "calories_achieved": true,
    "protein_achieved": true,
    "carbs_achieved": true,
    "fat_achieved": true,
    "notes": "All macro targets achieved with optimized ingredient quantities"
  },
  "recommendations": [
    "Consider adding vegetables for micronutrients",
    "The olive oil helps meet fat requirements while maintaining Persian cuisine authenticity"
  ],
  "cost_estimate": 12.50,
  "shopping_list": [
    {
      "name": "Basmati Rice",
      "quantity": 1,
      "unit": "pack",
      "category": "grains"
    },
    {
      "name": "Chicken Breast",
      "quantity": 1,
      "unit": "pack",
      "category": "protein"
    },
    {
      "name": "Olive Oil",
      "quantity": 1,
      "unit": "bottle",
      "category": "fats"
    }
  ],
  "rag_enhancement": {
    "original_macros": {
      "calories": 295,
      "protein": 33.7,
      "carbs": 28,
      "fat": 3.9
    },
    "added_ingredients": [
      {
        "name": "Olive Oil",
        "amount": 20.8,
        "unit": "g",
        "calories": 184,
        "protein": 0,
        "carbs": 0,
        "fat": 20.8
      }
    ],
    "enhancement_notes": "Added olive oil to meet fat requirements and enhance Persian cuisine authenticity"
  },
  "user_id": "user_123"
}
```

## Implementation Notes

1. **Optimization Algorithm**: Use linear programming or similar optimization techniques to adjust ingredient quantities
2. **Ingredient Database**: Maintain a database of ingredients with nutritional information per 100g
3. **Cuisine Preferences**: Consider user cuisine preferences when suggesting additional ingredients
4. **Dietary Restrictions**: Respect dietary restrictions and allergies when optimizing
5. **Cost Estimation**: Provide realistic cost estimates based on ingredient prices
6. **Performance**: Aim for response times under 5 seconds

## Testing

The frontend will automatically fall back to mock responses when this endpoint is not available, allowing you to test the UI while implementing the backend.
