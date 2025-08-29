// Runner script for testing advanced meal optimization algorithms
import { testAllAlgorithms, testSpecificAlgorithm, testDifferentScenarios } from './test-optimization';

async function main() {
  console.log("🚀 Advanced Meal Optimization Algorithm Test Suite");
  console.log("=".repeat(80));
  
  // Test 1: Compare all algorithms
  console.log("\n📊 TEST 1: Comparing All Algorithms");
  await testAllAlgorithms();
  
  // Test 2: Test hybrid algorithm specifically
  console.log("\n📊 TEST 2: Testing Hybrid Algorithm");
  await testSpecificAlgorithm('hybrid');
  
  // Test 3: Test different scenarios
  console.log("\n📊 TEST 3: Testing Different Scenarios");
  await testDifferentScenarios();
  
  console.log("\n✅ All tests completed!");
  console.log("\n💡 Key Insights:");
  console.log("   • Hybrid algorithm combines GA, PSO, and SA for best results");
  console.log("   • PSO is good for continuous optimization problems");
  console.log("   • SA is effective for escaping local minima");
  console.log("   • GA provides good exploration of the solution space");
  console.log("   • All algorithms automatically add helper ingredients when needed");
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { main };
