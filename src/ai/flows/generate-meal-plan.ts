
"use server";

import { geminiModel } from "@/ai/genkit";
import {
  GeneratePersonalizedMealPlanInput,
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutput,
  GeneratePersonalizedMealPlanOutputSchema,
} from "@/lib/schemas";

// Define the Gemini prompt for meal plan generation
const generateMealPlanPrompt = geminiModel.definePrompt({
  name: "generateWeeklyMealPlan",
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },
  prompt: `You are a professional nutritionist creating a 7-day meal plan. 

**REQUIREMENTS:**
1. Create exactly 7 days (Monday to Sunday)
2. Each day has exactly 6 meals: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack
3. Each meal must match its target macros within ±5% accuracy
4. All 42 meals must be unique dishes
5. Use realistic ingredients with accurate nutritional values

**USER PREFERENCES:**
- Diet Type: {{preferred_diet}}
- Allergies: {{#if allergies.length}}{{#each allergies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Avoid: {{#if dispreferrred_ingredients.length}}{{#each dispreferrred_ingredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Prefer: {{#if preferred_ingredients.length}}{{#each preferred_ingredients}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
- Medical Conditions: {{#if medical_conditions.length}}{{#each medical_conditions}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

**DAILY TARGETS:**
- Calories: {{meal_data.target_daily_calories}}
- Protein: {{meal_data.target_protein_g}}g
- Carbs: {{meal_data.target_carbs_g}}g
- Fat: {{meal_data.target_fat_g}}g

**MEAL TARGETS:**
{{#each meal_distributions}}
{{mealName}}: {{calories}} calories, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat
{{/each}}

**IMPORTANT NUTRITIONAL VALUES (per 100g):**
- Chicken breast: 165 cal, 31g protein, 0g carbs, 3.6g fat
- Brown rice (cooked): 112 cal, 2.6g protein, 23g carbs, 0.9g fat
- Eggs: 155 cal, 13g protein, 1.1g carbs, 11g fat
- Greek yogurt (plain): 59 cal, 10g protein, 3.6g carbs, 0.4g fat
- Oats: 389 cal, 16.9g protein, 66.3g carbs, 6.9g fat
- Salmon: 208 cal, 25g protein, 0g carbs, 12g fat
- Banana: 89 cal, 1.1g protein, 22.8g carbs, 0.3g fat
- Almonds: 579 cal, 21.2g protein, 21.6g carbs, 49.9g fat
- Olive oil: 884 cal, 0g protein, 0g carbs, 100g fat
- Sweet potato: 86 cal, 1.6g protein, 20.1g carbs, 0.1g fat

**OUTPUT REQUIREMENTS:**
You must return a JSON object with this exact structure:
{
  "days": [
    {
      "day_of_week": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "meals": [
        {
          "meal_name": "Breakfast|Morning Snack|Lunch|Afternoon Snack|Dinner|Evening Snack",
          "custom_name": "Descriptive meal name",
          "ingredients": [
            {
              "name": "ingredient name",
              "quantity": number,
              "unit": "g|ml|piece|cup",
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number
            }
          ],
          "total_calories": number,
          "total_protein": number,
          "total_carbs": number,
          "total_fat": number
        }
      ],
      "daily_totals": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "weekly_summary": {
    "total_calories": number,
    "total_protein": number,
    "total_carbs": number,
    "total_fat": number
  }
}

Generate a complete 7-day meal plan with precise macro calculations.`,
});

// Main function to generate meal plan
export async function generatePersonalizedMealPlan(input: {
  profile: any;
  macro_targets: any;
  meal_distributions: any[];
}): Promise<GeneratePersonalizedMealPlanOutput> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log("🚀 Starting AI meal plan generation...");
      console.log("📊 Daily targets:", input.macro_targets);
      console.log("🍽️ Meal distributions:", input.meal_distributions);

      // Prepare input according to schema
      const geminiInput: GeneratePersonalizedMealPlanInput = {
        age: input.profile.age || 30,
        biological_sex: input.profile.biological_sex || "other",
        height_cm: input.profile.height_cm || 170,
        current_weight_kg: input.profile.current_weight_kg || 70,
        target_weight_kg: input.profile.target_weight_1month_kg || input.profile.current_weight_kg || 70,
        physical_activity_level: input.profile.physical_activity_level || "moderate",
        primary_diet_goal: input.profile.primary_diet_goal || "fat_loss",
        preferred_diet: (input.profile.preferred_diet === "fat_loss" || 
                        input.profile.preferred_diet === "muscle_gain" || 
                        input.profile.preferred_diet === "recomp") 
                       ? "Standard" 
                       : (input.profile.preferred_diet || "Standard"),
        allergies: input.profile.allergies || [],
        dispreferrred_ingredients: input.profile.dispreferrred_ingredients || [],
        preferred_ingredients: input.profile.preferred_ingredients || [],
        medical_conditions: input.profile.medical_conditions || [],
        meal_data: {
          target_daily_calories: input.macro_targets.target_daily_calories || 2000,
          target_protein_g: input.macro_targets.target_protein_g || 150,
          target_carbs_g: input.macro_targets.target_carbs_g || 200,
          target_fat_g: input.macro_targets.target_fat_g || 67,
        },
        meal_distributions: input.meal_distributions.map((dist) => ({
          mealName: dist.mealName as "Breakfast" | "Morning Snack" | "Lunch" | "Afternoon Snack" | "Dinner" | "Evening Snack",
          calories_pct: dist.calories_pct,
        })),
      };

      // Validate input against schema
      const validatedInput = GeneratePersonalizedMealPlanInputSchema.parse(geminiInput);

      console.log("📝 Sending request to Gemini...");
      const { output } = await generateMealPlanPrompt(validatedInput);

      if (!output) {
        throw new Error("No response from Gemini AI");
      }

      // Validate output against schema
      const validatedOutput = GeneratePersonalizedMealPlanOutputSchema.parse(output);

      console.log("✅ Successfully generated meal plan");
      return validatedOutput;
    } catch (error: any) {
      console.error(`❌ Meal plan generation failed (attempt ${retryCount + 1}):`, error);

      if (error.message?.includes("400")) {
        throw new Error(
          "Invalid request to AI service. Please check your profile data.",
        );
      } else if (error.message?.includes("403")) {
        throw new Error(
          "AI service access denied. Please check your API configuration.",
        );
      } else if (error.message?.includes("503") && retryCount < maxRetries - 1) {
        console.log("⏳ Gemini service unavailable, retrying in 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        retryCount++;
        continue;
      } else {
        throw new Error(`Meal plan generation failed: ${error.message}`);
      }
    }
  }

  throw new Error(`Meal plan generation failed after ${maxRetries} attempts.`);
}

// Helper to validate meal plan accuracy
export async function validateMealPlanAccuracy(
  mealPlan: GeneratePersonalizedMealPlanOutput,
  targets: any,
): Promise<boolean> {
  const tolerance = 0.05; // 5% tolerance

  for (const day of mealPlan.days) {
    const dailyTotals = day.daily_totals;

    // Check if daily totals are within 5% of targets
    if (
      Math.abs(dailyTotals.calories - targets.calories) >
        targets.calories * tolerance ||
      Math.abs(dailyTotals.protein - targets.protein) >
        targets.protein * tolerance ||
      Math.abs(dailyTotals.carbs - targets.carbs) > targets.carbs * tolerance ||
      Math.abs(dailyTotals.fat - targets.fat) > targets.fat * tolerance
    ) {
      return false;
    }
  }

  return true;
}
