// Test script for advanced meal optimization algorithms
import { 
  optimizeMealAdvanced, 
  convertMealToIngredients, 
  createTargetsFromMacros,
  Ingredient,
  Targets 
} from './meal-optimizer';

// Test meal ingredients
const testIngredients: Ingredient[] = [
  {
    name: "Ground Beef",
    cal: 2.0, // calories per gram
    prot: 0.2, // protein per gram
    carb: 0, // carbs per gram
    fat: 0.15 // fat per gram
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

// Test targets
const testTargets: Targets = {
  calories: 637.2,
  protein: 47.7,
  carbs: 79.65,
  fat: 14.18
};

// Test function to compare all algorithms
export async function testAllAlgorithms() {
  console.log("🧪 Testing Advanced Meal Optimization Algorithms");
  console.log("📊 Target Macros:", testTargets);
  console.log("🧪 Base Ingredients:", testIngredients.map(i => i.name));
  console.log("=".repeat(80));

  const algorithms = ['ga', 'pso', 'sa', 'hybrid'] as const;
  const results: any[] = [];

  for (const algorithm of algorithms) {
    console.log(`\n🚀 Testing ${algorithm.toUpperCase()} Algorithm`);
    console.log("-".repeat(40));
    
    const startTime = Date.now();
    const result = optimizeMealAdvanced(testIngredients, testTargets, 'test-meal', algorithm);
    const endTime = Date.now();
    
    const executionTime = endTime - startTime;
    
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`✅ Feasible: ${result.feasible}`);
    console.log(`📊 Fitness score: ${result.result.toFixed(2)}`);
    console.log(`🎯 Achieved macros:`, result.achieved);
    
    if (result.helpers_added && result.helpers_added.length > 0) {
      console.log(`🆘 Helpers added: ${result.helpers_added.join(', ')}`);
    }
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    }
    
    results.push({
      algorithm: algorithm.toUpperCase(),
      feasible: result.feasible,
      fitness: result.result,
      achieved: result.achieved,
      executionTime,
      helpers: result.helpers_added || [],
      error: result.error
    });
  }

  // Compare results
  console.log("\n" + "=".repeat(80));
  console.log("🏆 ALGORITHM COMPARISON RESULTS");
  console.log("=".repeat(80));
  
  // Sort by fitness (lower is better)
  results.sort((a, b) => a.fitness - b.fitness);
  
  results.forEach((result, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📊";
    console.log(`${medal} ${result.algorithm}:`);
    console.log(`   Fitness: ${result.fitness.toFixed(2)}`);
    console.log(`   Feasible: ${result.feasible ? "✅" : "❌"}`);
    console.log(`   Time: ${result.executionTime}ms`);
    console.log(`   Macros: ${result.achieved.calories}cal/${result.achieved.protein}p/${result.achieved.carbs}c/${result.achieved.fat}f`);
    if (result.helpers.length > 0) {
      console.log(`   Helpers: ${result.helpers.join(', ')}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log("");
  });

  // Check if any algorithm achieved targets
  const feasibleResults = results.filter(r => r.feasible);
  if (feasibleResults.length > 0) {
    console.log("✅ SUCCESS: At least one algorithm achieved the targets!");
    console.log(`🏆 Best algorithm: ${feasibleResults[0].algorithm} with fitness ${feasibleResults[0].fitness.toFixed(2)}`);
  } else {
    console.log("❌ CHALLENGE: No algorithm achieved targets within 10% tolerance");
    console.log("💡 This suggests the targets may be difficult to achieve with the given ingredients");
    console.log("🔍 Consider adding more diverse ingredients or adjusting targets");
  }

  return results;
}

// Test specific algorithm
export async function testSpecificAlgorithm(algorithm: 'ga' | 'pso' | 'sa' | 'hybrid') {
  console.log(`🧪 Testing ${algorithm.toUpperCase()} Algorithm Only`);
  console.log("📊 Target Macros:", testTargets);
  console.log("🧪 Base Ingredients:", testIngredients.map(i => i.name));
  console.log("=".repeat(60));

  const startTime = Date.now();
  const result = optimizeMealAdvanced(testIngredients, testTargets, 'test-meal', algorithm);
  const endTime = Date.now();

  console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
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

  return result;
}

// Test with different target scenarios
export async function testDifferentScenarios() {
  console.log("🧪 Testing Different Target Scenarios");
  console.log("=".repeat(60));

  const scenarios = [
    {
      name: "High Protein",
      targets: { calories: 600, protein: 60, carbs: 50, fat: 15 }
    },
    {
      name: "Low Carb",
      targets: { calories: 500, protein: 40, carbs: 20, fat: 30 }
    },
    {
      name: "Balanced",
      targets: { calories: 700, protein: 50, carbs: 80, fat: 20 }
    },
    {
      name: "High Fat",
      targets: { calories: 800, protein: 30, carbs: 40, fat: 60 }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`\n🎯 Testing ${scenario.name} Scenario`);
    console.log(`📊 Targets: ${scenario.targets.calories}cal/${scenario.targets.protein}p/${scenario.targets.carbs}c/${scenario.targets.fat}f`);
    
    const result = optimizeMealAdvanced(testIngredients, scenario.targets, 'test-meal', 'hybrid');
    
    console.log(`✅ Feasible: ${result.feasible}`);
    console.log(`📊 Fitness: ${result.result.toFixed(2)}`);
    console.log(`🎯 Achieved: ${result.achieved.calories}cal/${result.achieved.protein}p/${result.achieved.carbs}c/${result.achieved.fat}f`);
    
    if (result.helpers_added && result.helpers_added.length > 0) {
      console.log(`🆘 Helpers: ${result.helpers_added.join(', ')}`);
    }
  }
}

// Export test functions
export { testIngredients, testTargets };
