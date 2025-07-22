'use client';

import LoadingScreen from '@/components/ui/LoadingScreen';
import type {
  BaseProfileData,
  MealPlans,
  UserPlanType,
  WeeklyMealPlan,
} from '@/lib/schemas';
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./pdfViewer'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

type PDFViewProps = {
  profile: BaseProfileData;
  plan: UserPlanType;
  mealPlan: MealPlans;
};

// Register custom fonts
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2',
      fontWeight: 600,
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2',
      fontWeight: 700,
    },
  ],
});

// Clean, minimal PDF styles
const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },

  page: {
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    padding: 0,
  },

  // Header & Footer
  header: {
    backgroundColor: '#2d5a2d',
    padding: 24,
    marginBottom: 0,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#ffffff',
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#e8f5e8',
    fontWeight: 400,
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  headerDate: {
    fontSize: 10,
    color: '#e8f5e8',
    marginBottom: 2,
  },

  headerUser: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 600,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderTop: '1px solid #e9ecef',
  },

  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 8,
    color: '#6c757d',
  },

  // Content Container
  content: {
    padding: 32,
    paddingBottom: 80,
  },

  // Section Styles
  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2px solid #f1f3f4',
  },

  sectionIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    color: '#2d5a2d',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#2d5a2d',
  },

  // Card Styles
  card: {
    backgroundColor: '#fafbfc',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    border: '1px solid #e9ecef',
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#495057',
    marginBottom: 12,
  },

  // Grid Layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },

  gridItem: {
    flex: 1,
    minWidth: '33.333%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },

  gridItemHalf: {
    flex: 1,
    minWidth: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },

  // Data Display
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottom: '1px solid #f1f3f4',
  },

  dataLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: 400,
    flex: 1,
  },

  dataValue: {
    fontSize: 10,
    color: '#212529',
    fontWeight: 600,
    textAlign: 'right',
  },

  // Meal Plan Table
  mealTable: {
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #dee2e6',
    marginBottom: 20,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d5a2d',
  },

  tableHeaderCell: {
    flex: 1,
    padding: 12,
    borderRight: '1px solid #4a7c59',
  },

  tableHeaderText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#ffffff',
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f3f4',
    minHeight: 80,
  },

  mealTypeCell: {
    width: 100,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRight: '1px solid #dee2e6',
    justifyContent: 'center',
  },

  mealTypeText: {
    fontSize: 10,
    fontWeight: 600,
    color: '#495057',
    textAlign: 'center',
  },

  dayCell: {
    flex: 1,
    padding: 12,
    borderRight: '1px solid #f1f3f4',
    backgroundColor: '#ffffff',
  },

  mealName: {
    fontSize: 9,
    fontWeight: 600,
    color: '#212529',
    marginBottom: 4,
  },

  mealMacros: {
    fontSize: 8,
    color: '#6c757d',
    marginBottom: 6,
  },

  mealIngredient: {
    fontSize: 8,
    color: '#868e96',
    marginBottom: 2,
  },

  emptyMeal: {
    fontSize: 8,
    color: '#dc3545',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Plan Indicators
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },

  userPlanBadge: {
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
  },

  aiPlanBadge: {
    backgroundColor: '#cce7ff',
    border: '1px solid #99d6ff',
  },

  planBadgeText: {
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 6,
  },

  userPlanText: {
    color: '#155724',
  },

  aiPlanText: {
    color: '#004085',
  },

  // Macro Summary
  macroSummary: {
    flexDirection: 'row',
    backgroundColor: '#2d5a2d',
    borderRadius: 6,
    padding: 16,
    marginTop: 12,
  },

  macroItem: {
    flex: 1,
    alignItems: 'center',
  },

  macroLabel: {
    fontSize: 8,
    color: '#e8f5e8',
    fontWeight: 400,
    marginBottom: 2,
  },

  macroValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 700,
  },

  macroUnit: {
    fontSize: 8,
    color: '#e8f5e8',
    fontWeight: 400,
  },

  // Warning Box
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
  },

  warningText: {
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    fontWeight: 500,
  },

  // Stats Cards
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 16,
    marginHorizontal: 6,
    border: '1px solid #e9ecef',
    alignItems: 'center',
  },

  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2d5a2d',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 9,
    color: '#6c757d',
    textAlign: 'center',
  },

  statUnit: {
    fontSize: 12,
    color: '#868e96',
  },
});

function PDFView({ profile, plan, mealPlan }: PDFViewProps) {
  const formatArray = (arr: string[] | null | undefined, fallback = 'None') => {
    if (!arr || arr.length === 0) return fallback;
    return arr.join(', ');
  };

  const formatValue = (
    value: number | string | null | undefined,
    suffix = '',
    fallback = 'N/A',
    decimals = 1
  ) => {
    if (value === null || value === undefined || value === '') return fallback;

    if (typeof value === 'number') {
      return value.toFixed(decimals) + suffix;
    }

    const numValue = parseFloat(String(value));
    if (!isNaN(numValue)) {
      return numValue.toFixed(decimals) + suffix;
    }

    return String(value) + suffix;
  };

  const formatIntValue = (
    value: number | string | null | undefined,
    suffix = '',
    fallback = 'N/A'
  ) => {
    return formatValue(value, suffix, fallback, 0);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getMealsByType = (weeklyPlan: WeeklyMealPlan) => {
    const mealTypes = [
      'Breakfast',
      'Morning Snack',
      'Lunch',
      'Afternoon Snack',
      'Dinner',
    ];
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    return mealTypes.map((mealType) => ({
      type: mealType,
      meals: days.map((day) => {
        const dayData = weeklyPlan.days?.find(
          (d) => d.day_of_week.toLowerCase() === day.toLowerCase()
        );
        const meal = dayData?.meals?.find(
          (m) =>
            m.name?.toLowerCase().includes(mealType.toLowerCase()) ||
            m.custom_name?.toLowerCase().includes(mealType.toLowerCase())
        );
        return meal || null;
      }),
    }));
  };

  const renderMealPlanTable = (
    weeklyPlan: WeeklyMealPlan,
    isAIPlan = false
  ) => {
    const mealsByType = getMealsByType(weeklyPlan);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <View>
        <View
          style={[
            styles.planBadge,
            isAIPlan ? styles.aiPlanBadge : styles.userPlanBadge,
          ]}
        >
          <Text
            style={[
              styles.planBadgeText,
              isAIPlan ? styles.aiPlanText : styles.userPlanText,
            ]}
          >
            {isAIPlan ? 'AI-Generated Meal Plan' : 'Your Current Meal Plan'}
          </Text>
        </View>

        <View style={styles.mealTable}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, { width: 100 }]}>
              <Text style={styles.tableHeaderText}>Meal Type</Text>
            </View>
            {days.map((day, idx) => (
              <View key={idx} style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {mealsByType.map((mealTypeData, typeIdx) => (
            <View key={typeIdx} style={styles.tableRow}>
              <View style={styles.mealTypeCell}>
                <Text style={styles.mealTypeText}>{mealTypeData.type}</Text>
              </View>

              {mealTypeData.meals.map((meal, dayIdx) => (
                <View key={dayIdx} style={styles.dayCell}>
                  {meal && meal.ingredients && meal.ingredients.length > 0 ? (
                    <View>
                      <Text style={styles.mealName}>
                        {meal.custom_name || meal.name || 'Meal'}
                      </Text>
                      <Text style={styles.mealMacros}>
                        {formatIntValue(meal.total_calories, ' kcal', '0 kcal')}
                      </Text>
                      <Text style={styles.mealMacros}>
                        P: {formatValue(meal.total_protein, 'g', '0g')} | C:{' '}
                        {formatValue(meal.total_carbs, 'g', '0g')} | F:{' '}
                        {formatValue(meal.total_fat, 'g', '0g')}
                      </Text>
                      {meal.ingredients.slice(0, 3).map((ingredient, idx) => (
                        <Text key={idx} style={styles.mealIngredient}>
                          • {ingredient.name}
                        </Text>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <Text style={styles.mealIngredient}>
                          +{meal.ingredients.length - 3} more items
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.emptyMeal}>No meal planned</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {weeklyPlan.weekly_summary && (
          <View style={styles.macroSummary}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Total Calories</Text>
              <Text style={styles.macroValue}>
                {formatIntValue(
                  weeklyPlan.weekly_summary.total_calories,
                  '',
                  '0'
                )}
              </Text>
              <Text style={styles.macroUnit}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Total Protein</Text>
              <Text style={styles.macroValue}>
                {formatValue(weeklyPlan.weekly_summary.total_protein, '', '0')}
              </Text>
              <Text style={styles.macroUnit}>grams</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Total Carbs</Text>
              <Text style={styles.macroValue}>
                {formatValue(weeklyPlan.weekly_summary.total_carbs, '', '0')}
              </Text>
              <Text style={styles.macroUnit}>grams</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Total Fat</Text>
              <Text style={styles.macroValue}>
                {formatValue(weeklyPlan.weekly_summary.total_fat, '', '0')}
              </Text>
              <Text style={styles.macroUnit}>grams</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const doc = (
    <Document>
      {/* Page 1: Profile Overview */}
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Nutrition Profile Report</Text>
              <Text style={styles.headerSubtitle}>
                Complete health and meal planning overview
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerDate}>
                Generated on {getCurrentDate()}
              </Text>
              <Text style={styles.headerUser}>
                For: {profile.name || 'User'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatIntValue(profile.age, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatIntValue(profile.height_cm, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>Height (cm)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatValue(profile.current_weight_kg, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>Current Weight (kg)</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Biological Sex</Text>
                <Text style={styles.dataValue}>
                  {profile.biological_sex || 'N/A'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Target Weight (1 month)</Text>
                <Text style={styles.dataValue}>
                  {formatValue(profile.target_weight_1month_kg, ' kg')}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Long-term Goal Weight</Text>
                <Text style={styles.dataValue}>
                  {formatValue(profile.long_term_goal_weight_kg, ' kg')}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Activity Level</Text>
                <Text style={styles.dataValue}>
                  {profile.physical_activity_level || 'N/A'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Primary Diet Goal</Text>
                <Text style={styles.dataValue}>
                  {profile.primary_diet_goal || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Nutrition Targets */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nutrition Targets</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatIntValue(plan.bmr_kcal, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>BMR (kcal/day)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatIntValue(plan.maintenance_calories_tdee, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>TDEE (kcal/day)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatIntValue(plan.target_daily_calories, '', 'N/A')}
                </Text>
                <Text style={styles.statLabel}>Target Calories</Text>
              </View>
            </View>

            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein Target</Text>
                <Text style={styles.macroValue}>
                  {formatValue(plan.target_protein_g, '', '0')}
                </Text>
                <Text style={styles.macroUnit}>
                  grams (
                  {formatValue(plan.target_protein_percentage, '%', '0%')})
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Carbs Target</Text>
                <Text style={styles.macroValue}>
                  {formatValue(plan.target_carbs_g, '', '0')}
                </Text>
                <Text style={styles.macroUnit}>
                  grams ({formatValue(plan.target_carbs_percentage, '%', '0%')})
                </Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fat Target</Text>
                <Text style={styles.macroValue}>
                  {formatValue(plan.target_fat_g, '', '0')}
                </Text>
                <Text style={styles.macroUnit}>
                  grams ({formatValue(plan.target_fat_percentage, '%', '0%')})
                </Text>
              </View>
            </View>
          </View>

          {/* Body Composition */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Body Composition</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridItemHalf}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Body Fat Percentage</Text>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Current</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.bf_current, '%')}
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Target</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.bf_target, '%')}
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Ideal</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.bf_ideal, '%')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.gridItemHalf}>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Muscle Mass Percentage</Text>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Current</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.mm_current, '%')}
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Target</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.mm_target, '%')}
                    </Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Ideal</Text>
                    <Text style={styles.dataValue}>
                      {formatValue(profile.mm_ideal, '%')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Diet Preferences */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Diet Preferences & Health</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Preferred Diet</Text>
                <Text style={styles.dataValue}>
                  {profile.preferred_diet || 'N/A'}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Allergies</Text>
                <Text style={styles.dataValue}>
                  {formatArray(profile.allergies)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Preferred Cuisines</Text>
                <Text style={styles.dataValue}>
                  {formatArray(profile.preferred_cuisines)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Medical Conditions</Text>
                <Text style={styles.dataValue}>
                  {formatArray(profile.medical_conditions)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Medications</Text>
                <Text style={styles.dataValue}>
                  {formatArray(profile.medications)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              AI Nutrition Studio - Personalized Meal Planning
            </Text>
            <Text style={styles.footerText}>Page 1 of 3</Text>
          </View>
        </View>
      </Page>

      {/* Page 2: Current Meal Plan */}
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Your Current Meal Plan</Text>
              <Text style={styles.headerSubtitle}>
                Weekly meal schedule and nutrition breakdown
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerDate}>
                Generated on {getCurrentDate()}
              </Text>
              <Text style={styles.headerUser}>
                For: {profile.name || 'User'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {!mealPlan.meal_data.days || mealPlan.meal_data.days.length === 0 ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ No current meal plan data found. Please create your meal plan
                to see your weekly schedule.
              </Text>
            </View>
          ) : (
            renderMealPlanTable(mealPlan.meal_data, false)
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              AI Nutrition Studio - Personalized Meal Planning
            </Text>
            <Text style={styles.footerText}>Page 2 of 3</Text>
          </View>
        </View>
      </Page>

      {/* Page 3: AI-Generated Meal Plan */}
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>AI-Generated Meal Plan</Text>
              <Text style={styles.headerSubtitle}>
                Optimized meal recommendations based on your profile
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerDate}>
                Generated on {getCurrentDate()}
              </Text>
              <Text style={styles.headerUser}>
                For: {profile.name || 'User'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {!mealPlan.ai_plan.days || mealPlan.ai_plan.days.length === 0 ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ No AI-generated meal plan found. Generate an AI meal plan to
                see personalized recommendations.
              </Text>
            </View>
          ) : (
            renderMealPlanTable(mealPlan.ai_plan as any, true)
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              AI Nutrition Studio - Personalized Meal Planning
            </Text>
            <Text style={styles.footerText}>Page 3 of 3</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (
    <div>
      <PDFViewer className='w-full h-svh'>{doc}</PDFViewer>
    </div>
  );
}

export default PDFView;
