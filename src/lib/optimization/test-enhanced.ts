// Test the enhanced optimization algorithm
import { optimizeMealAdvanced, Ingredient, Targets } from './meal-optimizer';

// Your specific test case
const testIngredients: Ingredient[] = [
  {
    name: "Ground Beef",
    cal: 2.0,
    prot: 0.2,
    carb: 0,
    fat: 0.15
  },
  {
    name: "Onion",
    cal: 0.4,
    prot: 0.01,
    carb: 0.09,
    fat: 0
  },
  {
    name: "Pita Bread",
    cal: 2.8,
    prot: 0.08,
    carb: 0.54,
    fat: 0.02
  },
  {
    name: "Grilled Tomato",
    cal: 0.2,
    prot: 0.01,
    carb: 0.04,
    fat: 0
  }
];

const testTargets: Targets = {
  calories: 637.2,
  protein: 47.7,
  carbs: 79.65,
  fat: 14.18
};

async function testEnhancedAlgorithm() {
  console.log("🧪 Testing Enhanced Optimization Algorithm");
  console.log("📊 Target Macros:", testTargets);
  console.log("🧪 Base Ingredients:", testIngredients.map(i => i.name));
  console.log("=".repeat(80));

  // Test enhanced algorithm
  console.log("\n🚀 Testing Enhanced PSO Algorithm");
  console.log("-".repeat(40));
  
  const startTime = Date.now();
  const result = optimizeMealAdvanced(testIngredients, testTargets, 'test-meal', 'enhanced');
  const endTime = Date.now();
  
  const executionTime = endTime - startTime;
  
  console.log(`⏱️  Execution time: ${executionTime}ms`);
  console.log(`✅ Feasible: ${result.feasible}`);
  console.log(`📊 Fitness score: ${result.result.toFixed(2)}`);
  console.log(`🎯 Achieved macros:`, result.achieved);
  console.log(`🧬 Algorithm used: ${result.algorithm_used}`);
  
  if (result.helpers_added && result.helpers_added.length > 0) {
    console.log(`🆘 Helpers added: ${result.helpers_added.join(', ')}`);
  }
  
  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
  }

  // Calculate accuracy percentages
  const calAccuracy = Math.abs(result.achieved.calories - testTargets.calories) / testTargets.calories * 100;
  const protAccuracy = Math.abs(result.achieved.protein - testTargets.protein) / testTargets.protein * 100;
  const carbAccuracy = Math.abs(result.achieved.carbs - testTargets.carbs) / testTargets.carbs * 100;
  const fatAccuracy = Math.abs(result.achieved.fat - testTargets.fat) / testTargets.fat * 100;

  console.log("\n📈 Accuracy Analysis:");
  console.log(`   Calories: ${calAccuracy.toFixed(1)}% deviation`);
  console.log(`   Protein: ${protAccuracy.toFixed(1)}% deviation`);
  console.log(`   Carbs: ${carbAccuracy.toFixed(1)}% deviation`);
  console.log(`   Fat: ${fatAccuracy.toFixed(1)}% deviation`);

  // Check if within 15% tolerance
  const tolerance = 15;
  const isWithinTolerance = calAccuracy <= tolerance && protAccuracy <= tolerance && 
                           carbAccuracy <= tolerance && fatAccuracy <= tolerance;

  console.log(`\n🎯 Result: ${isWithinTolerance ? '✅ SUCCESS' : '❌ CHALLENGE'}`);
  if (isWithinTolerance) {
    console.log("🎉 Enhanced algorithm achieved targets within 15% tolerance!");
  } else {
    console.log("💡 Targets may be difficult to achieve with current ingredients");
    console.log("🔍 Consider adding more diverse ingredients or adjusting targets");
  }

  return result;
}

// Run the test
if (require.main === module) {
  testEnhancedAlgorithm().catch(console.error);
}

export { testEnhancedAlgorithm };

