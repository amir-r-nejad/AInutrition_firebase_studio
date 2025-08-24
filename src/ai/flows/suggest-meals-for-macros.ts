"use server";

// Ensure Node types for process in TS without @types/node
// declare const process: any; // Not needed for RAG system

// RAG System Configuration
const RAG_API_BASE = 'https://web-production-55aa.up.railway.app';
const RAG_API_KEY = 'sk-nutrition-8_S-o7F-3z2yCp7A6IPJxFDLO3ZWqYYO57OK8MvVltU';

import {
  SuggestMealsForMacrosInputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import { getAIApiErrorMessage } from "@/lib/utils";

// RAG System function for meal suggestions
async function generateWithRAG(
  prompt: string,
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  try {
    // Convert input to RAG format with proper enum mappings
    const mapActivityLevel = (level: string) => {
      switch (level?.toLowerCase()) {
        case 'sedentary': return 'sedentary';
        case 'light': 
        case 'lightly_active': 
        case 'low': return 'lightly_active';
        case 'moderate': 
        case 'moderately_active': 
        case 'medium': return 'moderately_active';
        case 'high': 
        case 'very_active': 
        case 'active': return 'very_active';
        default: return 'moderately_active';
      }
    };

    const mapMealType = (mealName: string) => {
      switch (mealName?.toLowerCase()) {
        case 'breakfast': return 'breakfast';
        case 'lunch': return 'lunch';
        case 'dinner': return 'dinner';
        case 'snack':
        case 'evening snack':
        case 'afternoon snack':
        case 'morning snack': return 'snack';
        default: return 'lunch';
      }
    };

    // Convert arrays to strings for RAG API
    const allergiesString = Array.isArray(input.allergies) && input.allergies.length > 0 
      ? input.allergies.join(", ") 
      : "";
    
    const medicalConditionsString = Array.isArray(input.medical_conditions) && input.medical_conditions.length > 0 
      ? input.medical_conditions.join(", ") 
      : "";

    const ragPayload = {
      user_profile: {
        age: input.age,
        gender: input.gender || "",
        activity_level: mapActivityLevel(input.activity_level || "moderate"),
        diet_goal: input.diet_goal || "",
        preferred_diet: input.preferred_diet || "",
        preferences: input.preferences || "",
        preferred_cuisines: Array.isArray(input.preferred_cuisines) ? input.preferred_cuisines.join(", ") : (input.preferred_cuisines || ""),
        dispreferrred_cuisines: Array.isArray(input.dispreferrred_cuisines) ? input.dispreferrred_cuisines.join(", ") : (input.dispreferrred_cuisines || ""),
        preferred_ingredients: Array.isArray(input.preferred_ingredients) ? input.preferred_ingredients.join(", ") : (input.preferred_ingredients || ""),
        dispreferrred_ingredients: Array.isArray(input.dispreferrred_ingredients) ? input.dispreferrred_ingredients.join(", ") : (input.dispreferrred_ingredients || ""),
        allergies: allergiesString,
        medical_conditions: medicalConditionsString,
        target_calories: input.target_calories || 0,
        target_protein_grams: input.target_protein_grams || 0,
        target_carbs_grams: input.target_carbs_grams || 0,
        target_fat_grams: input.target_fat_grams || 0,
      },
      meal_type: mapMealType(input.meal_name || "lunch"),
      prompt: prompt,
      api_key: RAG_API_KEY
    };

    console.log("Sending request to RAG system:", JSON.stringify(ragPayload, null, 2));
    console.log("🔍 Input preferences received:", {
      preferred_diet: input.preferred_diet,
      preferences: input.preferences,
      preferred_cuisines: input.preferred_cuisines,
      dispreferrred_cuisines: input.dispreferrred_cuisines,
      preferred_ingredients: input.preferred_ingredients,
      dispreferrred_ingredients: input.dispreferrred_ingredients,
      allergies: input.allergies,
      medical_conditions: input.medical_conditions,
      medications: input.medications
    });

    const response = await fetch(`${RAG_API_BASE}/meal-recommendation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ragPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RAG API Error:", errorText);
      throw new Error(
        `RAG API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("RAG API Response:", JSON.stringify(data, null, 2));
    console.log("🔍 Response structure check:", {
      hassuggestions: !!data.suggestions,
      suggestionsLength: data.suggestions?.length || 0,
      firstSuggestion: data.suggestions?.[0] ? {
        hasMealTitle: !!data.suggestions[0].mealTitle,
        hasDescription: !!data.suggestions[0].description,
        hasInstructions: !!data.suggestions[0].instructions,
        hasIngredients: !!data.suggestions[0].ingredients,
        ingredientsLength: data.suggestions[0].ingredients?.length || 0
      } : null
    });

    // Check if response has the expected structure
    if (data.suggestions && Array.isArray(data.suggestions)) {
      // Ensure instructions exist in each suggestion
      const processedData = {
        ...data,
        suggestions: data.suggestions.map((suggestion: any) => ({
          ...suggestion,
          instructions: suggestion.instructions || "Cook ingredients according to preference. Season to taste and serve."
        }))
      };
      return processedData as SuggestMealsForMacrosOutput;
    }

    // If response doesn't match expected format, try to adapt it
    if (data.meal_title || data.ingredients) {
      // Single meal response, wrap in suggestions array
      const adaptedResponse = {
            suggestions: [
              {
            mealTitle: data.meal_title || "RAG Generated Meal",
            description: data.description || "Meal suggestion from RAG system",
            instructions: data.instructions || "Mix ingredients together. Season to taste. Serve immediately.",
            ingredients: data.ingredients || [],
            totalCalories: data.total_calories || data.totalCalories || 0,
            totalProtein: data.total_protein || data.totalProtein || 0,
            totalCarbs: data.total_carbs || data.totalCarbs || 0,
            totalFat: data.total_fat || data.totalFat || 0,
              },
            ],
          };
      return adaptedResponse as SuggestMealsForMacrosOutput;
    }

    // If no recognizable format, return basic structure
    console.warn("Unexpected RAG response format, returning basic structure");
    return {
          suggestions: [
            {
          mealTitle: "RAG Generated Meal",
          description: "Meal suggestion from RAG system",
          instructions: "Prepare ingredients according to your preference. Season and serve.",
              ingredients: [],
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
            },
          ],
        };
  } catch (error: any) {
    console.error("RAG API Error:", error);
    throw error;
  }
}

function buildPrompt(input: SuggestMealsForMacrosInput): string {
  // Build preference strings - only include if they exist
  const preferences = [];
  
  if (input.preferred_diet && input.preferred_diet !== "none") {
    preferences.push(`Diet: ${input.preferred_diet}`);
  }
  
  if (input.allergies && Array.isArray(input.allergies) && input.allergies.length > 0) {
    preferences.push(`Allergies: ${input.allergies.join(", ")}`);
  }
  
  if (input.medical_conditions && Array.isArray(input.medical_conditions) && input.medical_conditions.length > 0) {
    preferences.push(`Medical: ${input.medical_conditions.join(", ")}`);
  }
  
  if (input.preferred_cuisines && Array.isArray(input.preferred_cuisines) && input.preferred_cuisines.length > 0) {
    preferences.push(`Preferred cuisines: ${input.preferred_cuisines.join(", ")}`);
  }
  
  if (input.dispreferrred_cuisines && Array.isArray(input.dispreferrred_cuisines) && input.dispreferrred_cuisines.length > 0) {
    preferences.push(`Avoid cuisines: ${input.dispreferrred_cuisines.join(", ")}`);
  }
  
  if (input.preferred_ingredients && Array.isArray(input.preferred_ingredients) && input.preferred_ingredients.length > 0) {
    preferences.push(`Preferred ingredients: ${input.preferred_ingredients.join(", ")}`);
  }
  
  if (input.dispreferrred_ingredients && Array.isArray(input.dispreferrred_ingredients) && input.dispreferrred_ingredients.length > 0) {
    preferences.push(`Avoid ingredients: ${input.dispreferrred_ingredients.join(", ")}`);
  }

  const preferencesText = preferences.length > 0 ? preferences.join(" | ") : "No specific preferences";

  return `Generate ${input.meal_name || "meal"} suggestion.

${preferencesText ? `Preferences: ${preferencesText}` : ''}
Target: ${input.target_calories || 0}cal, ${input.target_protein_grams || 0}g protein, ${input.target_carbs_grams || 0}g carbs, ${input.target_fat_grams || 0}g fat

Return JSON format:
{
  "suggestions": [{
    "mealTitle": "meal name",
    "description": "brief description",
    "instructions": "cooking steps",
    "ingredients": [{"name": "ingredient", "amount": 100, "unit": "g", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6}],
    "totalCalories": ${input.target_calories || 0},
    "totalProtein": ${input.target_protein_grams || 0},
    "totalCarbs": ${input.target_carbs_grams || 0},
    "totalFat": ${input.target_fat_grams || 0}
  }]
}`;
}

// Main entry function using RAG System
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  try {
    // Log input for debugging
    console.log(
      "Input to suggestMealsForMacros (RAG):",
      JSON.stringify(input, null, 2),
    );

    // Validate input
    const validatedInput = SuggestMealsForMacrosInputSchema.parse(input);

    // Generate the prompt
    const prompt = buildPrompt(validatedInput);

    // Get RAG response
    const result = await generateWithRAG(prompt, validatedInput);

    // Log the RAG response for debugging
    console.log("RAG Response:", JSON.stringify(result, null, 2));

    // Return the RAG response directly without strict validation
    // The optimization step will handle any formatting issues
    return result;
  } catch (error: any) {
    console.error("Error in suggestMealsForMacros (RAG):", error);
    throw new Error(getAIApiErrorMessage(error));
  }
}
