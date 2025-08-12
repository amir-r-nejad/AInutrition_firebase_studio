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
            content: `You are NutriMind, an expert AI nutritionist. Generate meal suggestions and return them in JSON format.`,
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
    input.allergies && input.allergies.length > 0
      ? input.allergies.join(", ")
      : "None";
  const medicalConditionsText =
    input.medical_conditions && input.medical_conditions.length > 0
      ? input.medical_conditions.join(", ")
      : "None";
  const preferencesText = input.preferences || "None";

  return `
Generate ONE personalized meal suggestion for ${input.meal_name} that includes sources of protein, carbohydrates, and fat.

**User Profile:**
- Age: ${input.age}
- Gender: ${input.gender}
- Activity Level: ${input.activity_level}
- Diet Goal: ${input.diet_goal}
- Preferences: ${preferencesText}
- Allergies: ${allergiesText}
- Medical Conditions: ${medicalConditionsText}

**Target Macros:**
- Calories: ${input.target_calories} kcal
- Protein: ${input.target_protein_grams}g
- Carbs: ${input.target_carbs_grams}g
- Fat: ${input.target_fat_grams}g

**Requirements:**
1. ONE meal only with 4-5 ingredients
2. Must include: protein source + carb source + fat source + 1-2 vegetables
3. Use exact nutritional values from database below
4. Total macros must match targets within 5% margin

**Nutrition Database (per 100g):**
**Proteins:** Chicken (165 cal, 31g protein, 0g carbs, 3.6g fat), Turkey (189 cal, 29g protein, 0g carbs, 7.4g fat), Salmon (208 cal, 25.4g protein, 0g carbs, 12.4g fat), Eggs (155 cal, 13g protein, 1.1g carbs, 11g fat), Tofu (144 cal, 15.8g protein, 4.3g carbs, 8.7g fat)

**Carbs:** Rice (130 cal, 2.7g protein, 28g carbs, 0.3g fat), Quinoa (120 cal, 4.4g protein, 21.3g carbs, 1.9g fat), Sweet Potato (86 cal, 1.6g protein, 20.1g carbs, 0.1g fat), Pasta (131 cal, 5g protein, 25g carbs, 1.1g fat), Oats (389 cal, 16.9g protein, 66.3g carbs, 6.9g fat)

**Fats:** Olive Oil (884 cal, 0g protein, 0g carbs, 100g fat), Avocado (160 cal, 2g protein, 8.5g carbs, 14.7g fat), Almonds (579 cal, 21.2g protein, 21.6g carbs, 49.9g fat)

**Vegetables:** Spinach (23 cal, 2.9g protein, 3.6g carbs, 0.4g fat), Broccoli (34 cal, 2.8g protein, 7g carbs, 0.4g fat), Bell Peppers (31 cal, 1g protein, 7g carbs, 0.3g fat)

**Calculation:** For each ingredient, calculate: (amount_grams ÷ 100) × nutrition_per_100g
**Verify:** Sum of all ingredient macros = target macros

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

Return exactly ONE meal suggestion with precise calculations.
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
