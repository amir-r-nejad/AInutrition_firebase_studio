export const activityLevels = [
  {
    value: 'sedentary',
    label: 'Sedentary (little or no exercise)',
    activityFactor: 1.2,
    proteinFactorPerKg: 0.8,
  },
  {
    value: 'light',
    label: 'Lightly active (light exercise/sports 1-3 days/week)',
    activityFactor: 1.375,
    proteinFactorPerKg: 1.2,
  },
  {
    value: 'moderate',
    label: 'Moderately active (moderate exercise/sports 3-5 days/week)',
    activityFactor: 1.55,
    proteinFactorPerKg: 1.6,
  },
  {
    value: 'active',
    label: 'Very active (hard exercise/sports 6-7 days a week)',
    activityFactor: 1.725,
    proteinFactorPerKg: 2.0,
  },
  {
    value: 'extra_active',
    label: 'Super active (physical job or intense training)',
    activityFactor: 1.9,
    proteinFactorPerKg: 2.2,
  },
];

export const dietGoals = [
  // Used in old onboarding, kept for reference if needed elsewhere, but new onboarding uses smartPlannerDietGoals contextually
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'gain_weight', label: 'Gain Weight (Muscle)' },
];

export const smartPlannerDietGoals = [
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'recomp', label: 'Muscle gain and fat loss (Recomposition)' },
];

export const preferredDiets = [
  { value: 'none', label: 'None (Balanced)' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Ketogenic' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'low_fat', label: 'Low Fat' },
  { value: 'high_protein', label: 'High Protein' },
];

export const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const exerciseFrequencies = [
  { value: '1-2_days', label: '1-2 days/week' },
  { value: '3-4_days', label: '3-4 days/week' },
  { value: '5-6_days', label: '5-6 days/week' },
  { value: 'daily', label: 'Daily' },
];

export const exerciseIntensities = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'vigorous', label: 'Vigorous' },
];

export const subscriptionStatuses = [
  { value: 'free', label: 'Free Tier' },
  { value: 'premium', label: 'Premium Monthly' },
  { value: 'premium_annual', label: 'Premium Annual' },
  { value: 'trial', label: 'Trial Period' },
  { value: 'trial_ended', label: 'Trial Ended' },
];

export const mealNames = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Afternoon Snack',
  'Dinner',
  'Evening Snack',
];

export const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const defaultMacroPercentages: {
  [key: string]: {
    calories_pct: number;
    protein_pct: number;
    carbs_pct: number;
    fat_pct: number;
  };
} = {
  Breakfast: {
    calories_pct: 22.5,
    protein_pct: 21.4,
    carbs_pct: 25,
    fat_pct: 21.7,
  },
  'Morning Snack': {
    calories_pct: 10,
    protein_pct: 10.7,
    carbs_pct: 10,
    fat_pct: 10.6,
  },
  Lunch: {
    calories_pct: 22.5,
    protein_pct: 21.4,
    carbs_pct: 25,
    fat_pct: 21.7,
  },
  'Afternoon Snack': {
    calories_pct: 10,
    protein_pct: 10.7,
    carbs_pct: 10,
    fat_pct: 10.6,
  },
  Dinner: { calories_pct: 20, protein_pct: 21.4, carbs_pct: 20, fat_pct: 18.7 },
  'Evening Snack': {
    calories_pct: 15,
    protein_pct: 14.4,
    carbs_pct: 10,
    fat_pct: 16.7,
  },
};

export const onboardingStepsData = [
  {
    stepNumber: 1,
    title: 'Welcome to NutriPlan!',
    explanation:
      'Let’s personalize your nutrition journey. We’ll ask a few questions about your health and preferences to generate your ideal meal plan. It only takes 3–5 minutes.',
    tooltipText:
      'We’ll ask a few questions to personalize your nutrition plan. It only takes 3–5 minutes.',
    fieldsToValidate: [],
    isOptional: false,
  },
  {
    stepNumber: 2,
    title: 'Step 2 – Basic Profile Setup',
    explanation:
      'This helps us calculate your calorie needs and goals. We use your age, sex, height, weight, and activity level to estimate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) — the foundation of your meal plan.',
    tooltipText:
      'These details help us calculate your calorie needs based on your body and activity level.',
    fieldsToValidate: [
      'age',
      'gender',
      'height_cm',
      'current_weight',
      'goal_weight_1m',
      'activityLevel',
      'dietGoalOnboarding',
    ],
    isOptional: false,
  },
  {
    stepNumber: 3,
    title: 'Step 3 – Smart Calculation & Macros',
    explanation:
      'We’ll generate your personal targets using your data. We estimate your daily calories and macronutrients to support your weight or health goals — whether it’s fat loss, muscle gain, or maintenance.',
    tooltipText:
      'Based on your inputs, we estimate ideal calories and macronutrients to support your goals.',
    fieldsToValidate: [],
    isOptional: false,
  },
  {
    stepNumber: 4,
    title: 'Step 4 – Customize Your Targets (Optional)',
    explanation:
      'Want to fine-tune your plan? Adjust your total daily calories, protein intake, and how your remaining calories are split between carbs and fat.',
    tooltipText:
      'Optionally override the system-calculated targets with your own specific numbers.',
    fieldsToValidate: [
      'custom_total_calories',
      'custom_protein_per_kg',
      'remaining_calories_carb_pct',
    ],
    isOptional: true,
  },
  {
    stepNumber: 5,
    title: 'Step 5 – Ready for Your AI Meal Plan!',
    explanation:
      "You're all set! Your profile is complete. Click 'Finish Onboarding' to save your profile and proceed to the dashboard. You can then generate your first AI-powered meal plan.",
    tooltipText:
      'Get your first weekly plan — customized to your needs, goals, and preferences. You can always tweak it.',
    fieldsToValidate: [],
    isOptional: false,
  },
];
