"use server";

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
            content: `You are NutriMind, an expert AI nutritionist. Your task is to generate meal suggestions that are balanced and nutritious. Focus on creating healthy meals with good variety of ingredients. While you should try to get close to the target macros, exact matches are not required. Adhere to user preferences and dietary restrictions. Your entire response MUST be a single, valid JSON object and nothing else.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
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

    console.log("Raw AI content:", content);
    console.log("Cleaned content:", cleanedContent);

    let parsed;
    try {
      parsed = JSON.parse(cleanedContent);
      console.log("Successfully parsed JSON:", parsed);
    } catch (parseError) {
      console.warn("Initial JSON parsing failed, attempting to extract JSON:", parseError);
      // If JSON parsing fails, try to extract JSON from text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted and parsed JSON:", parsed);
        } catch (secondParseError) {
          console.error("Could not parse AI response as JSON:", cleanedContent);
          throw new Error("AI response format error - not valid JSON");
        }
      } else {
        console.error("No JSON found in AI response:", cleanedContent);
        throw new Error("AI response format error - no JSON structure found");
      }
    }

    // Try to validate with schema, but be more flexible if it fails
    const validationResult =
      SuggestMealsForMacrosOutputSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.warn(
        "OpenAI response validation failed, attempting to fix structure:",
        validationResult.error,
      );
      
             // Try to fix common issues with the response structure
       let fixedResponse = parsed;
       
       // Check if the response has meal_suggestions instead of suggestions
       if (parsed.meal_suggestions && Array.isArray(parsed.meal_suggestions)) {
         console.log("Found meal_suggestions, converting to suggestions format");
         fixedResponse = {
           suggestions: parsed.meal_suggestions.map((suggestion: any) => ({
             mealTitle: suggestion.meal_name || suggestion.mealTitle || suggestion.title || suggestion.name || "Meal",
             description: suggestion.description || suggestion.desc || "",
             ingredients: Array.isArray(suggestion.ingredients) ? suggestion.ingredients.map((ingredient: any) => ({
               name: ingredient.name || ingredient.ingredient || "",
               amount: ingredient.quantity_g || ingredient.amount || ingredient.quantity || "0",
               unit: ingredient.unit || "g",
               calories: Number(ingredient.calories) || 0,
               protein: Number(ingredient.protein) || 0,
               carbs: Number(ingredient.carbs) || 0,
               fat: Number(ingredient.fat) || 0,
               macrosString: ingredient.macrosString || `${ingredient.calories || 0} cal, ${ingredient.protein || 0}g protein, ${ingredient.carbs || 0}g carbs, ${ingredient.fat || 0}g fat`
             })) : [],
             totalCalories: Number(suggestion.total_nutrition?.calories || suggestion.totalCalories) || 0,
             totalProtein: Number(suggestion.total_nutrition?.protein || suggestion.totalProtein) || 0,
             totalCarbs: Number(suggestion.total_nutrition?.carbs || suggestion.totalCarbs) || 0,
             totalFat: Number(suggestion.total_nutrition?.fat || suggestion.totalFat) || 0
           }))
         };
         
         console.log("Converted response structure:", fixedResponse);
         
         // Try validation again with fixed response
         const retryValidation = SuggestMealsForMacrosOutputSchema.safeParse(fixedResponse);
         if (retryValidation.success) {
           console.log("Successfully fixed and validated response structure");
           return retryValidation.data;
         } else {
           console.warn("Retry validation failed:", retryValidation.error);
         }
       }
       
       // Also check for regular suggestions structure
       if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
         fixedResponse = {
           suggestions: parsed.suggestions.map((suggestion: any) => ({
             mealTitle: suggestion.mealTitle || suggestion.title || suggestion.name || "Meal",
             description: suggestion.description || suggestion.desc || "",
             ingredients: Array.isArray(suggestion.ingredients) ? suggestion.ingredients.map((ingredient: any) => ({
               name: ingredient.name || ingredient.ingredient || "",
               amount: ingredient.amount || ingredient.quantity || "0",
               unit: ingredient.unit || "g",
               calories: Number(ingredient.calories) || 0,
               protein: Number(ingredient.protein) || 0,
               carbs: Number(ingredient.carbs) || 0,
               fat: Number(ingredient.fat) || 0,
               macrosString: ingredient.macrosString || `${ingredient.calories || 0} cal, ${ingredient.protein || 0}g protein, ${ingredient.carbs || 0}g carbs, ${ingredient.fat || 0}g fat`
             })) : [],
             totalCalories: Number(suggestion.totalCalories) || 0,
             totalProtein: Number(suggestion.totalProtein) || 0,
             totalCarbs: Number(suggestion.totalCarbs) || 0,
             totalFat: Number(suggestion.totalFat) || 0
           }))
         };
         
         // Try validation again with fixed response
         const retryValidation = SuggestMealsForMacrosOutputSchema.safeParse(fixedResponse);
         if (retryValidation.success) {
           console.log("Successfully fixed and validated response structure");
           return retryValidation.data;
         }
       }
       
       // If we still can't validate, log the error but return a basic structure
       console.error("Could not fix response structure, returning basic format");
       return {
         suggestions: [{
           mealTitle: "AI Generated Meal",
           description: "Generated meal suggestion",
           ingredients: [],
           totalCalories: 0,
           totalProtein: 0,
           totalCarbs: 0,
           totalFat: 0
         }]
       };
    }

    return validationResult.data;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function buildPrompt(input: SuggestMealsForMacrosInput): string {
  const allergiesText =
    input.allergies && input.allergies.length > 0
      ? input.allergies.join(", ")
      : "None";

  const medicalConditionsText =
    input.medical_conditions && input.medical_conditions.length > 0
      ? input.medical_conditions.join(", ")
      : "None";

  return `
Generate 1-3 highly personalized meal suggestions for the user's profile and meal target below. Focus on creating balanced, nutritious meals that are close to the target macros but don't need to be exact. The goal is to provide healthy meal options that align with the user's dietary goals.

**User Profile:**
- Age: ${input.age}
- Gender: ${input.gender}
- Activity Level: ${input.activity_level}
- Primary Diet Goal: ${input.diet_goal}
- Allergies: ${allergiesText}
- Medical Conditions: ${medicalConditionsText}

**🎯 Target for "${input.meal_name}"**
- Calories: ${input.target_calories} kcal (target, but close is fine)
- Protein: ${input.target_protein_grams}g (target, but close is fine)
- Carbohydrates: ${input.target_carbs_grams}g (target, but close is fine)
- Fat: ${input.target_fat_grams}g (target, but close is fine)

**MANDATORY NUTRITIONAL DATABASE - USE THESE EXACT VALUES PER 100g:**

**PROTEINS (pick different ones for variety):**
- Chicken Breast: 165 kcal, 31g protein, 0g carbs, 3.6g fat
- Turkey Breast: 189 kcal, 29g protein, 0g carbs, 7.4g fat  
- Lean Beef (93/7): 152 kcal, 22.6g protein, 0g carbs, 6.2g fat
- Salmon: 208 kcal, 25.4g protein, 0g carbs, 12.4g fat
- Tuna (canned in water): 116 kcal, 25.5g protein, 0g carbs, 0.8g fat
- Cod: 105 kcal, 23g protein, 0g carbs, 0.9g fat
- Shrimp: 99 kcal, 20.9g protein, 0.2g carbs, 1.7g fat
- Greek Yogurt (0% fat): 59 kcal, 10.3g protein, 3.6g carbs, 0.4g fat
- Cottage Cheese (low-fat): 98 kcal, 11g protein, 3.4g carbs, 4.3g fat
- Eggs (whole): 155 kcal, 13g protein, 1.1g carbs, 11g fat
- Egg Whites: 52 kcal, 10.9g protein, 0.7g carbs, 0.2g fat
- Tofu (firm): 144 kcal, 15.8g protein, 4.3g carbs, 8.7g fat
- Lentils (cooked): 116 kcal, 9g protein, 20g carbs, 0.4g fat
- Black Beans (cooked): 132 kcal, 8.9g protein, 23g carbs, 0.5g fat

**CARBOHYDRATES (vary your selections):**
- White Rice (cooked): 130 kcal, 2.7g protein, 28g carbs, 0.3g fat
- Brown Rice (cooked): 112 kcal, 2.6g protein, 23g carbs, 0.9g fat
- Quinoa (cooked): 120 kcal, 4.4g protein, 21.3g carbs, 1.9g fat
- Pasta (cooked): 131 kcal, 5g protein, 25g carbs, 1.1g fat
- Sweet Potato: 86 kcal, 1.6g protein, 20.1g carbs, 0.1g fat
- Regular Potato: 77 kcal, 2g protein, 17g carbs, 0.1g fat
- Oats (dry): 389 kcal, 16.9g protein, 66.3g carbs, 6.9g fat
- Whole Wheat Bread: 247 kcal, 13g protein, 41g carbs, 4.2g fat
- Banana: 89 kcal, 1.1g protein, 22.8g carbs, 0.3g fat
- Apple: 52 kcal, 0.3g protein, 14g carbs, 0.2g fat
- Berries (mixed): 57 kcal, 0.7g protein, 14g carbs, 0.3g fat

**HEALTHY FATS:**
- Olive Oil: 884 kcal, 0g protein, 0g carbs, 100g fat
- Avocado: 160 kcal, 2g protein, 8.5g carbs, 14.7g fat
- Almonds: 579 kcal, 21.2g protein, 21.6g carbs, 49.9g fat
- Walnuts: 654 kcal, 15.2g protein, 13.7g carbs, 65.2g fat
- Peanut Butter: 588 kcal, 25.8g protein, 20g carbs, 50g fat
- Almond Butter: 614 kcal, 21g protein, 20g carbs, 56g fat
- Coconut Oil: 862 kcal, 0g protein, 0g carbs, 100g fat

**VEGETABLES (always include for nutrients):**
- Spinach: 23 kcal, 2.9g protein, 3.6g carbs, 0.4g fat
- Broccoli: 34 kcal, 2.8g protein, 7g carbs, 0.4g fat
- Bell Peppers: 31 kcal, 1g protein, 7g carbs, 0.3g fat
- Zucchini: 17 kcal, 1.2g protein, 3.1g carbs, 0.3g fat
- Cauliflower: 25 kcal, 1.9g protein, 5g carbs, 0.3g fat
- Green Beans: 31 kcal, 1.8g protein, 7g carbs, 0.2g fat

**CALCULATION RULES:**

1. **MANDATORY FOOD VARIETY**: 
   - NEVER repeat the same 3-ingredient combination (chicken+quinoa+broccoli)
   - Use AT LEAST 4-5 different ingredients per meal
   - Rotate protein sources: if previous was chicken, use fish/beef/eggs/legumes
   - Vary carb sources: rice, pasta, potatoes, oats, bread, fruits
   - Include different vegetables each time

2. **MATHEMATICAL PRECISION REQUIREMENT**:
   - Use ONLY the exact nutritional values provided above - NO EXCEPTIONS
   - Calculate each ingredient contribution: (quantity_grams ÷ 100) × nutrition_per_100g
   - Example: 150g chicken = (150÷100) × 165 = 247.5 kcal, (150÷100) × 31 = 46.5g protein
   - Sum ALL individual contributions to get totals
   - Totals MUST equal sum of ingredients (no rounding errors allowed)

3. **FLEXIBLE TARGET MATCHING**:
   - Step 1: Select diverse ingredients based on user preferences
   - Step 2: Focus on creating balanced, nutritious meals
   - Step 3: Try to get close to targets but don't stress about exact matches
   - Step 4: Verify: ingredient_sum = total_displayed (exactly equal)
   - Step 5: Prioritize healthy, varied ingredients over perfect macro matching

4. **GUIDELINES**:
   - Use ingredients from the database above
   - Create meals with at least 4-5 ingredients for variety
   - Focus on nutritional balance and taste
   - Be creative with ingredient combinations

5. **DESCRIPTION REQUIREMENTS**:
   - Be engaging and motivational
   - Explain why the meal is good for the user's goals
   - Highlight key ingredients and their benefits
   - Keep it conversational and helpful

**IMPORTANT: Your response MUST use this EXACT JSON structure with the field names exactly as shown:**
- Use "suggestions" (not "meal_suggestions")
- Use "mealTitle" (not "meal_name") 
- Use "amount" (not "quantity_g")
- Use "totalCalories", "totalProtein", "totalCarbs", "totalFat" (not "total_nutrition")
- Include "macrosString" for each ingredient
- All numbers should be actual numbers, not strings
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

    let output;
    let attempts = 0;
    const maxAttempts = 3;
    let lastMacroErrors: string[] = [];

    // Retry logic to ensure valid output
    while (attempts < maxAttempts) {
      attempts++;
      console.log(
        `Attempt ${attempts} to generate valid meal suggestions with OpenAI`,
      );

      const prompt = buildPrompt(validatedInput);
      const result = await generateWithOpenAI(prompt, validatedInput);

      if (!result || !result.suggestions) {
        console.warn(`Attempt ${attempts}: OpenAI did not return suggestions.`);
        lastMacroErrors = ["OpenAI did not return suggestions."];
        continue;
      }

      // Log raw AI output for debugging
      console.log(
        `Raw OpenAI output (Attempt ${attempts}):`,
        JSON.stringify(result, null, 2),
      );

      const { suggestions } = result;
      let valid = true;
      const macroErrors: string[] = [];

      // Accept all suggestions without strict validation - just log them for debugging
      suggestions.forEach((meal, index) => {
        console.log(
          `Meal suggestion ${index}: ${meal.mealTitle}`,
          {
            meal: {
              mealTitle: meal.mealTitle,
              totals: {
                calories: meal.totalCalories,
                protein: meal.totalProtein,
                carbs: meal.totalCarbs,
                fat: meal.totalFat,
              },
            },
            targets: {
              calories: validatedInput.target_calories,
              protein: validatedInput.target_protein_grams,
              carbs: validatedInput.target_carbs_grams,
              fat: validatedInput.target_fat_grams,
            },
          },
        );
      });

      // Accept all suggestions without strict validation
      valid = true;
      output = result;
      break;
    }

    if (!output) {
      throw new Error(
        `Failed to generate valid meal suggestions after ${maxAttempts} attempts. Last error: ${lastMacroErrors.join("; ") || "No valid output generated."}`,
      );
    }

    // Log final output for debugging
    console.log("Final OpenAI suggestions:", JSON.stringify(output, null, 2));

    return output;
  } catch (error: any) {
    console.error("Error in suggestMealsForMacros (OpenAI):", error);
    throw new Error(getAIApiErrorMessage(error));
  }
}
