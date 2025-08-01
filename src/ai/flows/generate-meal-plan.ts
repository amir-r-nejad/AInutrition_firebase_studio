'use server';

import { geminiModel } from '@/ai/genkit';
import {
  GeneratePersonalizedMealPlanInputSchema,
  GeneratePersonalizedMealPlanOutputSchema,
  type GeneratePersonalizedMealPlanOutput,
  type GeneratePersonalizedMealPlanInput,
} from '@/lib/schemas';
import { getAIApiErrorMessage } from '@/lib/utils';

export async function generatePersonalizedMealPlan(
  input: GeneratePersonalizedMealPlanInput
): Promise<GeneratePersonalizedMealPlanOutput> {
  return generatePersonalizedMealPlanFlow(input);
}

const prompt = geminiModel.definePrompt({
  name: 'generatePersonalizedMealPlanPrompt',
  input: { schema: GeneratePersonalizedMealPlanInputSchema },
  output: { schema: GeneratePersonalizedMealPlanOutputSchema },

  prompt: `You are NutriMind, an elite AI nutritionist and meal planning specialist with 15+ years of experience in personalized nutrition. You create coach-quality, professional meal plans that satisfy both fitness coaches and their clients.

**YOUR MISSION:** Generate a complete, precise 7-day meal plan with 6 meals per day that coaches can confidently provide to their clients. This plan must be nutritionally accurate, delicious, and perfectly aligned with the user's goals.

**CONTEXT & USER DATA:**
\`\`\`json
{
  // Demographics & Physical Stats
  "age": {{age}},
  "biological_sex": "{{biological_sex}}",
  "height_cm": {{height_cm}},
  "current_weight_kg": {{current_weight_kg}},
  "primary_diet_goal": "{{primary_diet_goal}}",
  "physical_activity_level": "{{physical_activity_level}}",
  
  // Diet Preferences & Restrictions (STRICTLY ENFORCE)
  "preferred_diet": "{{preferred_diet}}",
  "allergies": [{{#if allergies.length}}"{{#each allergies}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "preferred_cuisines": [{{#if preferred_cuisines.length}}"{{#each preferred_cuisines}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "dispreferrred_cuisines": [{{#if dispreferrred_cuisines.length}}"{{#each dispreferrred_cuisines}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "preferred_ingredients": [{{#if preferred_ingredients.length}}"{{#each preferred_ingredients}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "dispreferrred_ingredients": [{{#if dispreferrred_ingredients.length}}"{{#each dispreferrred_ingredients}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "medical_conditions": [{{#if medical_conditions.length}}"{{#each medical_conditions}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],
  "preferred_micronutrients": [{{#if preferred_micronutrients.length}}"{{#each preferred_micronutrients}}{{this}}"{{#unless @last}}, {{/unless}}{{/each}}"{{/if}}],

  // EXACT DAILY NUTRITIONAL TARGETS (Hit these targets precisely)
  "target_daily_calories": {{meal_data.target_daily_calories}},
  "target_protein_g": {{meal_data.target_protein_g}},
  "target_carbs_g": {{meal_data.target_carbs_g}},
  "target_fat_g": {{meal_data.target_fat_g}}
}
\`\`\`

**STEP-BY-STEP GENERATION PROCESS:**

**Step 1: Analyze User Profile**
- Assess dietary restrictions, allergies, and preferences
- Note medical conditions that affect food choices
- Understand the primary diet goal and activity level
- Calculate meal distribution strategy for 6 meals/day

**Step 2: Plan Meal Distribution Strategy**
Create a logical calorie and macro distribution:
- Breakfast: 25% of daily calories (substantial start)
- Morning Snack: 10% of daily calories (light fuel)
- Lunch: 30% of daily calories (main meal)
- Afternoon Snack: 10% of daily calories (energy maintenance)
- Dinner: 20% of daily calories (recovery focused)
- Evening Snack: 5% of daily calories (light, low-carb)

**Step 3: Generate Complete 7-Day Plan**
For each day (Monday through Sunday), create 6 distinct meals that:
- Are complete recipes with descriptive names (not single ingredients)
- Include 3-8 ingredients per meal with precise nutritional data
- Match the meal type (breakfast foods for breakfast, etc.)
- Provide variety across the week (no repeated meals)
- Respect ALL dietary restrictions and preferences

**Step 4: Calculate Precise Nutritional Values**
- Each ingredient must have accurate calories, protein, carbs, fat per 100g
- Calculate actual values based on specified quantities
- Ensure daily totals match targets within ±5% margin
- Sum weekly totals accurately

**CRITICAL SUCCESS CRITERIA:**
✅ EXACTLY 7 days (Monday-Sunday)
✅ EXACTLY 6 meals per day
✅ Complete recipe names (e.g., "Mediterranean Quinoa Bowl with Grilled Chicken")
✅ Precise ingredient quantities and nutritional calculations
✅ Daily macros within ±5% of targets
✅ Zero conflicts with allergies/restrictions
✅ Professional quality that coaches trust
✅ Weekly summary with accurate totals

**MEAL NAMING STANDARDS:**
- Breakfast: "Protein-Rich Oatmeal with Berries and Almonds"
- Morning Snack: "Greek Yogurt with Honey and Walnuts"
- Lunch: "Grilled Salmon with Quinoa and Roasted Vegetables"
- Afternoon Snack: "Apple Slices with Almond Butter"
- Dinner: "Lean Beef Stir-fry with Brown Rice"
- Evening Snack: "Cottage Cheese with Cucumber Slices"

**CRITICAL JSON OUTPUT RULES:**
1. Return ONLY valid JSON - no markdown code blocks, no extra text, no comments
2. Use only double quotes for strings
3. All numeric values must be numbers, not strings
4. No trailing commas anywhere in the JSON
5. No JavaScript-style comments (//) in the JSON

**EXACT OUTPUT FORMAT - COPY THIS STRUCTURE:**

{
  "days": [
    {
      "day_of_week": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "custom_name": "Protein-Packed Scrambled Eggs with Spinach Toast",
          "ingredients": [
            {
              "name": "Large Eggs",
              "quantity": 120,
              "unit": "g",
              "calories": 155,
              "protein": 13,
              "carbs": 1.1,
              "fat": 11
            },
            {
              "name": "Fresh Spinach",
              "quantity": 40,
              "unit": "g", 
              "calories": 23,
              "protein": 2.9,
              "carbs": 3.6,
              "fat": 0.4
            }
          ],
          "total_calories": 465,
          "total_protein": 32,
          "total_carbs": 42,
          "total_fat": 25
        }
      ]
    }
  ],
  "weekly_summary": {
    "total_calories": 17500,
    "total_protein": 1400,
    "total_carbs": 1575,
    "total_fat": 622
  }
}

**FINAL VALIDATION:** Before responding, verify:
- All 7 days included with 6 meals each (42 total meals)
- Each meal has 3-8 ingredients with complete nutritional data
- Daily totals match targets within acceptable range
- Weekly summary accurately reflects sum of all days
- No allergens or disliked ingredients included
- Meal names are descriptive and appetizing
- JSON structure is valid and complete
- NO markdown formatting, code blocks, or extra text
- NO JavaScript comments or trailing commas
- ALL strings use double quotes only

**RESPONSE INSTRUCTIONS:**
- Start your response immediately with the opening curly brace {
- End your response with the closing curly brace }
- Include nothing else before or after the JSON
- Double-check all commas and brackets are properly placed
- Ensure all numbers are unquoted (155 not "155")

Generate the complete meal plan now.`,
});

// Transform AI output to required schema if needed
function transformAIOutputToWeekSchema(output: any): any {
  if (output && output.days && Array.isArray(output.days)) {
    return {
      days: output.days.map((dayObj: any) => ({
        day_of_week: dayObj.day_of_week || dayObj.day || '',
        meals: (dayObj.meals || []).map((meal: any) => ({
          meal_name: meal.meal_name || meal.meal_type || '',
          custom_name: meal.custom_name || meal.name || '',
          ingredients: (meal.ingredients || []).map((ingredient: any) => ({
            name: ingredient.name || '',
            quantity: ingredient.quantity || 0,
            unit: ingredient.unit || 'g',
            calories: ingredient.calories || 0,
            protein: ingredient.protein || 0,
            carbs: ingredient.carbs || 0,
            fat: ingredient.fat || 0,
          })),
          total_calories: meal.total_calories || 0,
          total_protein: meal.total_protein || 0,
          total_carbs: meal.total_carbs || 0,
          total_fat: meal.total_fat || 0,
        })),
      })),
      weekly_summary: output.weekly_summary || {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      },
    };
  }
  return output;
}

// Normalize input data to ensure all meals have required fields
function normalizeInputData(input: any): any {
  const normalizedInput = JSON.parse(JSON.stringify(input)); // Deep clone
  
  // Ensure meal_data exists with proper structure
  if (!normalizedInput.meal_data) {
    normalizedInput.meal_data = { days: [] };
  }
  
  if (!normalizedInput.meal_data.days || !Array.isArray(normalizedInput.meal_data.days)) {
    normalizedInput.meal_data.days = [];
  }
  
  // Add default target macros if missing
  if (!normalizedInput.meal_data.target_daily_calories) {
    normalizedInput.meal_data.target_daily_calories = 2000;
  }
  if (!normalizedInput.meal_data.target_protein_g) {
    normalizedInput.meal_data.target_protein_g = 150;
  }
  if (!normalizedInput.meal_data.target_carbs_g) {
    normalizedInput.meal_data.target_carbs_g = 200;
  }
  if (!normalizedInput.meal_data.target_fat_g) {
    normalizedInput.meal_data.target_fat_g = 70;
  }
  
  // Normalize days array
  normalizedInput.meal_data.days = normalizedInput.meal_data.days.map((day: any) => ({
    day_of_week: day.day_of_week || day.day || 'Monday',
    meals: (day.meals || []).map((meal: any) => ({
      name: meal.name || meal.meal_name || 'Unnamed Meal',
      custom_name: meal.custom_name || '',
      ingredients: (meal.ingredients || []).map((ingredient: any) => ({
        name: ingredient.name || '',
        quantity: ingredient.quantity || 0,
        unit: ingredient.unit || 'g',
        calories: ingredient.calories || 0,
        protein: ingredient.protein || 0,
        carbs: ingredient.carbs || 0,
        fat: ingredient.fat || 0,
      })),
      total_calories: meal.total_calories || 0,
      total_protein: meal.total_protein || 0,
      total_carbs: meal.total_carbs || 0,
      total_fat: meal.total_fat || 0,
    }))
  }));
  
  // Ensure other required fields have defaults
  normalizedInput.age = normalizedInput.age || 30;
  normalizedInput.biological_sex = normalizedInput.biological_sex || 'male';
  normalizedInput.height_cm = normalizedInput.height_cm || 175;
  normalizedInput.current_weight_kg = normalizedInput.current_weight_kg || 70;
  normalizedInput.physical_activity_level = normalizedInput.physical_activity_level || 'moderate';
  normalizedInput.primary_diet_goal = normalizedInput.primary_diet_goal || 'maintain_weight';
  normalizedInput.preferred_diet = normalizedInput.preferred_diet || 'balanced';
  normalizedInput.allergies = normalizedInput.allergies || [];
  normalizedInput.medical_conditions = normalizedInput.medical_conditions || [];
  normalizedInput.preferred_cuisines = normalizedInput.preferred_cuisines || [];
  normalizedInput.dispreferrred_cuisines = normalizedInput.dispreferrred_cuisines || [];
  normalizedInput.preferred_ingredients = normalizedInput.preferred_ingredients || [];
  normalizedInput.dispreferrred_ingredients = normalizedInput.dispreferrred_ingredients || [];
  normalizedInput.preferred_micronutrients = normalizedInput.preferred_micronutrients || [];
  
  return normalizedInput;
}

const generatePersonalizedMealPlanFlow = geminiModel.defineFlow(
  {
    name: 'generatePersonalizedMealPlanFlow',
    inputSchema: GeneratePersonalizedMealPlanInputSchema,
    outputSchema: GeneratePersonalizedMealPlanOutputSchema,
  },
  async (
    input: GeneratePersonalizedMealPlanInput
  ): Promise<GeneratePersonalizedMealPlanOutput> => {
    try {
      console.log('Raw input received:', JSON.stringify(input, null, 2));
      
      // Normalize input data to fix schema issues
      const normalizedInput = normalizeInputData(input);
      console.log('Normalized input:', JSON.stringify(normalizedInput, null, 2));
      
      // Validate normalized input
      const inputValidationResult = GeneratePersonalizedMealPlanInputSchema.safeParse(normalizedInput);
      if (!inputValidationResult.success) {
        console.error('Input validation error:', JSON.stringify(inputValidationResult.error.flatten(), null, 2));
        console.error('Failed input data:', JSON.stringify(normalizedInput, null, 2));
        throw new Error(`Input data validation failed: ${inputValidationResult.error.message}`);
      }

      console.log('Input validation successful, calling AI...');
      const { output } = await prompt(inputValidationResult.data);
      if (!output) throw new Error('AI did not return output.');

      console.log('Raw AI output:', JSON.stringify(output, null, 2));
      
      const transformedOutput = transformAIOutputToWeekSchema(output);
      console.log('Transformed output:', JSON.stringify(transformedOutput, null, 2));

      const validationResult = GeneratePersonalizedMealPlanOutputSchema.safeParse(transformedOutput);
      if (!validationResult.success) {
        console.error('AI output validation error:', JSON.stringify(validationResult.error.flatten(), null, 2));
        console.error('Failed output data:', JSON.stringify(transformedOutput, null, 2));
        throw new Error(`AI returned data in an unexpected format. Details: ${validationResult.error.message}`);
      }

      console.log('Output validation successful');
      return validationResult.data;
    } catch (error: any) {
      console.error('Error in generatePersonalizedMealPlanFlow:', error);
      console.error('Error stack:', error.stack);
      throw new Error(getAIApiErrorMessage(error));
    }
  }
);
