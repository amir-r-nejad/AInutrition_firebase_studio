"use server";

import { geminiModel } from "@/ai/genkit";
import { z } from "zod";

// Input schema for meal plan generation
const MealPlanInputSchema = z.object({
  // User profile data
  age: z.number().optional(),
  biological_sex: z.string().optional(),
  preferred_diet: z.string().default("Standard"),
  allergies: z.array(z.string()).default([]),
  dispreferrred_ingredients: z.array(z.string()).default([]),
  preferred_ingredients: z.array(z.string()).default([]),
  medical_conditions: z.array(z.string()).default([]),

  // Daily macro targets from macro splitter
  daily_targets: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),

  // Meal distributions from macro splitter (6 meals)
  meal_distributions: z.array(
    z.object({
      mealName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  ),
});

// Output schema for generated meal plan
const MealPlanOutputSchema = z.object({
  weekly_plan: z.array(
    z.object({
      day: z.string(),
      meals: z.array(
        z.object({
          meal_name: z.string(),
          dish_name: z.string(),
          ingredients: z.array(
            z.object({
              name: z.string(),
              amount: z.number(),
              unit: z.string(),
              calories: z.number(),
              protein: z.number(),
              carbs: z.number(),
              fat: z.number(),
            }),
          ),
          totals: z.object({
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fat: z.number(),
          }),
        }),
      ),
      daily_totals: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }),
    }),
  ),
});

// Define the Gemini prompt for meal plan generation
const generateMealPlanPrompt = geminiModel.definePrompt({
  name: "generateWeeklyMealPlan",
  input: { schema: MealPlanInputSchema },
  output: { schema: MealPlanOutputSchema },
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
- Calories: {{daily_targets.calories}}
- Protein: {{daily_targets.protein}}g
- Carbs: {{daily_targets.carbs}}g
- Fat: {{daily_targets.fat}}g

**MEAL TARGETS:**
{{#each meal_distributions}}
{{mealName}}: {{calories}} calories, {{protein}}g protein, {{carbs}}g carbs, {{fat}}g fat
{{/each}}

**STANDARD NUTRITIONAL VALUES (per 100g):**
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

Generate a complete 7-day meal plan with precise macro calculations.`,
});

// Main function to generate meal plan
export async function generatePersonalizedMealPlan(input: {
  profile: any;
  macro_targets: any;
  meal_distributions: any[];
}) {
  try {
    console.log("🚀 Starting AI meal plan generation...");
    console.log("📊 Daily targets:", input.macro_targets);
    console.log("🍽️ Meal distributions:", input.meal_distributions);

    // Prepare input for Gemini
    const geminiInput = {
      preferred_diet: input.profile.preferred_diet || "Standard",
      allergies: input.profile.allergies || [],
      dispreferrred_ingredients: input.profile.dispreferrred_ingredients || [],
      preferred_ingredients: input.profile.preferred_ingredients || [],
      medical_conditions: input.profile.medical_conditions || [],
      daily_targets: {
        calories: input.macro_targets.target_daily_calories,
        protein: input.macro_targets.target_protein_g,
        carbs: input.macro_targets.target_carbs_g,
        fat: input.macro_targets.target_fat_g,
      },
      meal_distributions: input.meal_distributions.map((dist) => ({
        mealName: dist.mealName,
        calories: Math.round(
          (input.macro_targets.target_daily_calories * dist.calories_pct) / 100,
        ),
        protein: Math.round(
          (input.macro_targets.target_protein_g * dist.calories_pct) / 100,
        ),
        carbs: Math.round(
          (input.macro_targets.target_carbs_g * dist.calories_pct) / 100,
        ),
        fat: Math.round(
          (input.macro_targets.target_fat_g * dist.calories_pct) / 100,
        ),
      })),
    };

    console.log("📝 Sending request to Gemini...");
    const { output } = await generateMealPlanPrompt(geminiInput);

    if (!output) {
      throw new Error("No response from Gemini AI");
    }

    console.log("✅ Successfully generated meal plan");
    return output;
  } catch (error: any) {
    console.error("❌ Meal plan generation failed:", error);

    if (error.message?.includes("400")) {
      throw new Error(
        "Invalid request to AI service. Please check your profile data.",
      );
    } else if (error.message?.includes("403")) {
      throw new Error(
        "AI service access denied. Please check your API configuration.",
      );
    } else {
      throw new Error(`Meal plan generation failed: ${error.message}`);
    }
  }
}

// Helper to validate meal plan accuracy
export async function validateMealPlanAccuracy(
  mealPlan: any,
  targets: any,
): Promise<boolean> {
  const tolerance = 0.05; // 5% tolerance

  for (const day of mealPlan.weekly_plan) {
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