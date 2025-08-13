"use server";

// Ensure Node types for process in TS without @types/node
declare const process: any;

import {
  SuggestMealsForMacrosInputSchema,
  SuggestMealsForMacrosOutputSchema,
  type SuggestMealsForMacrosInput,
  type SuggestMealsForMacrosOutput,
} from "@/lib/schemas";
import { getAIApiErrorMessage } from "@/lib/utils";

// OpenAI function for meal suggestions
async function generateWithOpenAI(
  prompt: string,
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not found in environment variables");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are NutriMind, an expert AI nutritionist. Always:
 - Respect ALL user preferences, allergies, and medical conditions strictly
 - Suggest exactly ONE meal (not a plan), with a protein source + carb source + fat source + up to 2 vegetables
 - Use reliable nutrition references (USDA FoodData Central typical per-100g values). If uncertain, use the fallback table provided in the user prompt
 - Compute macros per-ingredient using (grams/100) * per-100g values and provide totals
 - Hit target macros within ±5% (Calories, Protein, Carbs, Fat)
 - Return ONLY valid JSON matching the requested schema. No extra text, no commentary.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Clean and parse JSON
    let cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error("Could not parse AI response as JSON:", cleanedContent);
          // Instead of throwing error, return a basic structure that can be optimized
          parsed = {
            suggestions: [
              {
                mealTitle: "AI Generated Meal",
                description: "Meal suggestion from AI",
                ingredients: [],
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
              },
            ],
          };
        }
      } else {
        console.error("No JSON found in AI response:", cleanedContent);
        // Return basic structure instead of throwing error
        parsed = {
          suggestions: [
            {
              mealTitle: "AI Generated Meal",
              description: "Meal suggestion from AI",
              ingredients: [],
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
            },
          ],
        };
      }
    }

    // Return the parsed data without strict validation
    // The optimization step will handle any data issues
    return parsed as SuggestMealsForMacrosOutput;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildPrompt(input: SuggestMealsForMacrosInput): string {
  const allergiesText =
    Array.isArray(input.allergies) && input.allergies?.length
      ? input.allergies.join(", ")
      : "None";
  const medicalConditionsText =
    Array.isArray(input.medical_conditions) && input.medical_conditions?.length
      ? input.medical_conditions.join(", ")
      : "None";
  const preferencesText = input.preferences || "None";
  const preferredDietText = input.preferred_diet || "None";
  const preferredCuisinesText =
    Array.isArray(input.preferred_cuisines) && input.preferred_cuisines?.length
      ? input.preferred_cuisines.join(", ")
      : "None";
  const dispreferredCuisinesText =
    Array.isArray(input.dispreferrred_cuisines) &&
    input.dispreferrred_cuisines?.length
      ? input.dispreferrred_cuisines.join(", ")
      : "None";
  const preferredIngredientsText =
    Array.isArray(input.preferred_ingredients) &&
    input.preferred_ingredients?.length
      ? input.preferred_ingredients.join(", ")
      : "None";
  const dispreferredIngredientsText =
    Array.isArray(input.dispreferrred_ingredients) &&
    input.dispreferrred_ingredients?.length
      ? input.dispreferrred_ingredients.join(", ")
      : "None";

  return `
Generate ONE personalized meal suggestion for ${input.meal_name} that includes explicit sources of protein, carbohydrates, and fat.

**User Profile:**
- Age: ${input.age}
- Gender: ${input.gender}
- Activity Level: ${input.activity_level}
- Diet Goal: ${input.diet_goal}
- Preferred Diet (MUST respect): ${preferredDietText}
- Preferences (MUST respect): ${preferencesText}
- Preferred Cuisines: ${preferredCuisinesText}
- Dispreferred Cuisines: ${dispreferredCuisinesText}
- Preferred Ingredients: ${preferredIngredientsText}
- Dispreferred Ingredients: ${dispreferredIngredientsText}
- Allergies: ${allergiesText}
- Medical Conditions: ${medicalConditionsText}

**Target Macros:**
- Calories: ${input.target_calories} kcal
- Protein: ${input.target_protein_grams}g
- Carbs: ${input.target_carbs_grams}g
- Fat: ${input.target_fat_grams}g

**Requirements:**
1. ONE meal with 5–8 ingredients minimum (at least: 2 protein sources, 1-2 carb sources, 1 fat source, and 2-3 vegetables)
2. STRICTLY respect preferences/allergies/medical conditions (e.g., avoid excluded ingredients, match cuisine/halal/vegetarian requests, cooking method preferences)
   - If preferred diet includes "vegetarian": do NOT include meat, poultry, or fish (eggs/dairy allowed). If "vegan": exclude all animal products
   - For diabetes: prefer lower-glycemic carbs and whole grains; avoid added sugars
3. Use nutritional values from USDA FoodData Central (typical per-100g). If uncertain, use this fallback table exactly as numeric references
4. For high protein targets (>40g): combine 2+ protein sources (e.g., tofu + lentils, eggs + Greek yogurt)
5. For high carb targets (>70g): use 1-2 carb sources with good amounts (e.g., quinoa + sweet potato)
6. Keep fat sources reasonable (5-15g from nuts/oils, moderate amounts from avocado/tahini)
7. Total macros must match targets within ±3% margin. Calculate precisely: (amount_grams ÷ 100) × per_100g_values
8. Favor variety and ensure NO ingredient is 0g in the final result

**Fallback Nutrition Table (per 100g, use only if USDA value not available):**
Vegetarian Proteins: Eggs (155 cal, 13g P, 1.1g C, 11g F), Tofu (144 cal, 15.8g P, 4.3g C, 8.7g F), Tempeh (193 cal, 19g P, 9g C, 11g F), Greek Yogurt (100 cal, 10g P, 4g C, 5g F), Cottage Cheese (98 cal, 11g P, 3.4g C, 4.3g F), Lentils cooked (116 cal, 9g P, 20g C, 0.4g F), Chickpeas (164 cal, 8.9g P, 27g C, 2.6g F), Black Beans (132 cal, 8.9g P, 23g C, 0.5g F)
Carbs: Rice Brown (112 cal, 2.6g P, 23g C, 0.9g F), Quinoa (120 cal, 4.4g P, 21.3g C, 1.9g F), Sweet Potato (86 cal, 1.6g P, 20.1g C, 0.1g F), Whole Wheat Pasta (124 cal, 4.5g P, 25g C, 1.1g F), Oats (389 cal, 16.9g P, 66.3g C, 6.9g F), Barley (123 cal, 2.3g P, 28g C, 0.4g F)
Healthy Fats: Olive Oil (884 cal, 0g P, 0g C, 100g F), Avocado (160 cal, 2g P, 8.5g C, 14.7g F), Almonds (579 cal, 21.2g P, 21.6g C, 49.9g F), Walnuts (654 cal, 15.2g P, 13.7g C, 65.2g F), Tahini (595 cal, 17g P, 21g C, 54g F), Hemp Seeds (553 cal, 31g P, 4.7g C, 49g F)
Vegetables: Spinach (23 cal, 2.9g P, 3.6g C, 0.4g F), Broccoli (34 cal, 2.8g P, 7g C, 0.4g F), Bell Pepper (31 cal, 1g P, 7g C, 0.3g F), Tomato (18 cal, 0.9g P, 3.9g C, 0.2g F), Kale (35 cal, 2.9g P, 4.4g C, 1.5g F), Cauliflower (25 cal, 1.9g P, 5g C, 0.3g F)

**Calculation:** For each ingredient, calculate: (amount_grams ÷ 100) × nutrition_per_100g
**Verify:** Sum of all ingredient macros matches targets within ±5%

**IMPORTANT: Return ONLY valid JSON in this exact format:**
{
  "suggestions": [
    {
      "mealTitle": "Meal name",
      "description": "Brief description",
      "ingredients": [
        {
          "name": "Ingredient name",
          "amount": 100,
          "unit": "g",
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6,
          "macrosString": "165 cal, 31g protein, 0g carbs, 3.6g fat"
        }
      ],
      "totalCalories": 500,
      "totalProtein": 45,
      "totalCarbs": 30,
      "totalFat": 15
    }
  ]
}

Return exactly ONE meal suggestion with precise calculations. JSON only.
`;
}

// Main entry function using OpenAI
export async function suggestMealsForMacros(
  input: SuggestMealsForMacrosInput,
): Promise<SuggestMealsForMacrosOutput> {
  try {
    // Log input for debugging
    console.log(
      "Input to suggestMealsForMacros (OpenAI):",
      JSON.stringify(input, null, 2),
    );

    // Validate input
    const validatedInput = SuggestMealsForMacrosInputSchema.parse(input);

    // Generate the prompt
    const prompt = buildPrompt(validatedInput);

    // Get AI response
    const result = await generateWithOpenAI(prompt, validatedInput);

    // Log the AI response for debugging
    console.log("AI Response:", JSON.stringify(result, null, 2));

    // Return the AI response directly without strict validation
    // The optimization step will handle any formatting issues
    return result;
  } catch (error: any) {
    console.error("Error in suggestMealsForMacros (OpenAI):", error);
    throw new Error(getAIApiErrorMessage(error));
  }
}
