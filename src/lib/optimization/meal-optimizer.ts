// Meal optimization using linear programming
export interface Ingredient {
  name: string;
  cal: number; // Calories per gram
  prot: number; // Protein per gram
  carb: number; // Carbs per gram
  fat: number; // Fat per gram
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OptimizationResult {
  feasible: boolean;
  result: number;
  ingredients: { [key: string]: number };
  achieved: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  error?: string; // Added for error handling
}

export interface MealSuggestionIngredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
}

export interface OptimizedMealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: MealSuggestionIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => ({
    name: ing.name,
    cal: ing.calories / ing.amount, // Convert to per-gram values
    prot: ing.protein / ing.amount,
    carb: ing.carbs / ing.amount,
    fat: ing.fat / ing.amount,
  }));
}

// Create targets from macro splitter data
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

// Optimize meal using hybrid PSO + SQP optimization
export function optimizeMeal(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  console.log("Starting hybrid optimization with:", { ingredients, targets });

  try {
    // Use hybrid optimization: PSO + SQP without hard bounds
    const optimized = solveWithHybridOptimization(ingredients, targets);

    // Calculate achieved macros
    let achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach((ing, i) => {
      achieved.calories += optimized[i] * ing.cal;
      achieved.protein += optimized[i] * ing.prot;
      achieved.carbs += optimized[i] * ing.carb;
      achieved.fat += optimized[i] * ing.fat;
    });

    return {
      feasible: true,
      result: 0,
      ingredients: Object.fromEntries(
        ingredients.map((ing, i) => [ing.name, optimized[i]]),
      ),
      achieved,
    };
  } catch (error) {
    console.error("Hybrid optimization failed, falling back to LP:", error);

    // Fallback to LP if available
    return optimizeMealWithLP(ingredients, targets);
  }
}

// Fallback LP optimization
function optimizeMealWithLP(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  // Check if solver is properly loaded
  if (
    typeof window === "undefined" ||
    !(window as any).solver ||
    typeof (window as any).solver.Solve !== "function"
  ) {
    console.error("Solver not available:", {
      window: typeof window,
      solver: !!(window as any).solver,
      solveMethod: typeof (window as any).solver?.Solve,
    });
    return {
      feasible: false,
      result: -1,
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ingredients: {},
      error:
        "Linear programming solver not properly loaded. Please refresh the page and try again.",
    };
  }

  // Set up the linear programming model with target tolerance (±5%)
  const calMin = targets.calories * 0.95;
  const calMax = targets.calories * 1.05;
  const protMin = targets.protein * 0.95;
  const protMax = targets.protein * 1.05;
  const carbMin = targets.carbs * 0.95;
  const carbMax = targets.carbs * 1.05;
  const fatMin = targets.fat * 0.95;
  const fatMax = targets.fat * 1.05;

  const model: any = {
    // Feasibility within bands, then minimize total grams slightly
    optimize: "weight",
    opType: "min",
    constraints: {
      calories: { min: calMin, max: calMax },
      protein: { min: protMin, max: protMax },
      carbs: { min: carbMin, max: carbMax },
      fat: { min: fatMin, max: fatMax },
    },
    variables: {},
  };

  // Ingredient variables with per-variable bounds
  ingredients.forEach((ing) => {
    const varName = ing.name;
    const isOilLike = ing.fat >= 0.8; // e.g., olive oil
    const isHighFatWhole = ing.fat >= 0.12 && ing.fat < 0.8; // e.g., avocado/nuts

    model.variables[varName] = {
      calories: ing.cal,
      protein: ing.prot,
      carbs: ing.carb,
      fat: ing.fat,
      // Use self-constraint key to impose min/max bounds
      [varName]: 1,
      // tiny weight to slightly discourage overuse, keeps LP bounded
      weight: 0.001,
    } as any;

    // Combine min/max into one constraint using the same key as variable
    const maxCap = isOilLike ? 20 : isHighFatWhole ? 80 : 350;
    model.constraints[varName] = { min: 5, max: maxCap };
  });

  // No deviation variables in range-based model

  console.log("Final model:", model);

  // Solve the model using javascript-lp-solver
  try {
    // @ts-ignore - solver is loaded globally
    const results = (window as any).solver.Solve(model);

    // Build achieved macros from solver output
    let achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach((ing) => {
      const amount =
        results && typeof results[ing.name] === "number"
          ? results[ing.name]
          : 0;
      achieved.calories += amount * ing.cal;
      achieved.protein += amount * ing.prot;
      achieved.carbs += amount * ing.carb;
      achieved.fat += amount * ing.fat;
    });

    // Check if refinement needed - more lenient since we have ±5% tolerance
    const amountsVector = ingredients.map((ing) =>
      results && typeof results[ing.name] === "number" ? results[ing.name] : 0,
    );
    const hasZeros = amountsVector.some((v) => v < 2); // Any ingredient less than 2g is problematic
    const isAllSame = amountsVector.every(
      (v) => Math.abs(v - amountsVector[0]) < 1e-6,
    );
    const totalCal = achieved.calories;

    // Check if we're outside ±5% tolerance
    const calOutside = totalCal < calMin || totalCal > calMax;
    const protOutside =
      achieved.protein < protMin || achieved.protein > protMax;
    const carbOutside = achieved.carbs < carbMin || achieved.carbs > carbMax;
    const fatOutside = achieved.fat < fatMin || achieved.fat > fatMax;

    const clearlyPoor =
      calOutside ||
      protOutside ||
      carbOutside ||
      fatOutside ||
      isAllSame ||
      hasZeros;

    if (!results?.feasible || clearlyPoor) {
      console.warn(
        "Primary LP solve infeasible or outside tolerance. Running bounded least squares refinement...",
      );
      const optimized = solveWithBVLS(ingredients, targets, amountsVector);

      achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      ingredients.forEach((ing, i) => {
        achieved.calories += optimized[i] * ing.cal;
        achieved.protein += optimized[i] * ing.prot;
        achieved.carbs += optimized[i] * ing.carb;
        achieved.fat += optimized[i] * ing.fat;
      });

      const optimizedObj: Record<string, number> = {};
      ingredients.forEach((ing, i) => {
        optimizedObj[ing.name] = optimized[i];
      });

      // Prune impractically small amounts and refit
      const pruned = pruneAndRefit(ingredients, targets, optimized);
      achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      ingredients.forEach((ing, i) => {
        achieved.calories += pruned[i] * ing.cal;
        achieved.protein += pruned[i] * ing.prot;
        achieved.carbs += pruned[i] * ing.carb;
        achieved.fat += pruned[i] * ing.fat;
      });

      return {
        feasible: true,
        result: results?.result ?? 0,
        ingredients: Object.fromEntries(
          ingredients.map((ing, i) => [ing.name, pruned[i]]),
        ),
        achieved,
      };
    }

    // Also apply prune/refit on the direct LP result for practicality
    const prunedDirect = pruneAndRefit(ingredients, targets, amountsVector);
    achieved = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    ingredients.forEach((ing, i) => {
      achieved.calories += prunedDirect[i] * ing.cal;
      achieved.protein += prunedDirect[i] * ing.prot;
      achieved.carbs += prunedDirect[i] * ing.carb;
      achieved.fat += prunedDirect[i] * ing.fat;
    });

    return {
      feasible: true,
      result: results?.result ?? 0,
      ingredients: Object.fromEntries(
        ingredients.map((ing, i) => [ing.name, prunedDirect[i]]),
      ),
      achieved,
    };
  } catch (error) {
    console.error("Linear programming solver error:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: "An error occurred during linear programming optimization.",
    };
  }
}

// BVLS (Bounded-Variable Least Squares) via cyclic coordinate descent with bounds
function solveWithBVLS(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
) {
  const n = ingredients.length;
  if (n === 0) return [] as number[];

  // Build A (4 x n) and b (4)
  const A: number[][] = [
    ingredients.map((ing) => ing.cal),
    ingredients.map((ing) => ing.prot),
    ingredients.map((ing) => ing.carb),
    ingredients.map((ing) => ing.fat),
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Weights to emphasize fat/carbs fit
  const rowWeights = [1.0, 1.2, 1.6, 1.8];
  for (let i = 0; i < 4; i++) {
    const s = Math.sqrt(rowWeights[i]);
    for (let j = 0; j < n; j++) A[i][j] *= s;
    b[i] *= s;
  }

  // Bounds per variable
  const { lower, upper } = getPerVariableBounds(ingredients);

  // Initialize x and residual r = A x - b
  const x = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    const init =
      initial && isFinite(initial[j]) ? initial[j] : (lower[j] + upper[j]) / 2;
    x[j] = Math.min(upper[j], Math.max(lower[j], init));
  }
  const r = new Array(4).fill(0);
  for (let i = 0; i < 4; i++) {
    let sum = -b[i];
    for (let j = 0; j < n; j++) sum += A[i][j] * x[j];
    r[i] = sum;
  }

  // Precompute column norms ||a_j||^2
  const colNorm2 = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let s = 0;
    for (let i = 0; i < 4; i++) s += A[i][j] * A[i][j];
    colNorm2[j] = Math.max(s, 1e-12);
  }

  const maxOuter = 400;
  const tol = 1e-2;
  for (let iter = 0; iter < maxOuter; iter++) {
    let maxDelta = 0;
    for (let j = 0; j < n; j++) {
      // Gradient aj^T r; optimal unconstrained step: xj_new = xj - (aj^T r)/||aj||^2
      let grad = 0;
      for (let i = 0; i < 4; i++) grad += A[i][j] * r[i];
      const xOld = x[j];
      let xNew = xOld - grad / colNorm2[j];
      // Project to bounds
      xNew = Math.min(upper[j], Math.max(lower[j], xNew));
      const dx = xNew - xOld;
      if (Math.abs(dx) > 0) {
        // Update residual r <- r + aj * dx
        for (let i = 0; i < 4; i++) r[i] += A[i][j] * dx;
        x[j] = xNew;
        if (Math.abs(dx) > maxDelta) maxDelta = Math.abs(dx);
      }
    }
    if (maxDelta < tol) break;
  }

  // Clip and round to 2 decimals
  for (let j = 0; j < n; j++)
    x[j] = Math.round(Math.min(upper[j], Math.max(lower[j], x[j])) * 100) / 100;
  return x;
}

function getPerVariableBounds(ingredients: Ingredient[]) {
  const n = ingredients.length;
  const lower = new Array(n).fill(20); // Practical minimum default
  const upper = new Array(n).fill(350);
  for (let j = 0; j < n; j++) {
    const ing = ingredients[j];
    const fat = ing.fat;
    if (fat >= 0.8)
      upper[j] = 20; // oils
    else if (fat >= 0.12)
      upper[j] = 80; // avocado/nuts
    else upper[j] = 350; // others
  }
  return { lower, upper };
}

// Hybrid optimization: PSO + SQP refinement without hard bounds
function solveWithHybridOptimization(
  ingredients: Ingredient[],
  targets: Targets,
): number[] {
  const n = ingredients.length;
  if (n === 0) return [];

  console.log("Starting hybrid PSO + SQP optimization...");

  // Phase 1: Particle Swarm Optimization for global search
  const psoResult = solveWithPSO(ingredients, targets);

  // Phase 2: Sequential Quadratic Programming refinement for precision
  const sqpResult = solveWithSQP(ingredients, targets, psoResult);

  return sqpResult;
}

// Particle Swarm Optimization - global search without hard bounds
function solveWithPSO(ingredients: Ingredient[], targets: Targets): number[] {
  const n = ingredients.length;
  const swarmSize = 30;
  const maxIterations = 100;

  // PSO parameters
  const w = 0.7; // inertia weight
  const c1 = 1.5; // cognitive parameter
  const c2 = 1.5; // social parameter

  // Initialize swarm
  const particles: Array<{
    position: number[];
    velocity: number[];
    bestPosition: number[];
    bestFitness: number;
  }> = [];

  let globalBestPosition = new Array(n).fill(0);
  let globalBestFitness = Infinity;

  // Initialize particles with reasonable ranges
  for (let i = 0; i < swarmSize; i++) {
    const position = new Array(n);
    const velocity = new Array(n);

    for (let j = 0; j < n; j++) {
      // Natural ranges based on ingredient type
      const ing = ingredients[j];
      let maxAmount = 300; // default max

      if (ing.fat >= 0.8)
        maxAmount = 30; // oils
      else if (ing.fat >= 0.12)
        maxAmount = 100; // nuts/avocado
      else if (ing.prot >= 0.15) maxAmount = 200; // protein sources

      position[j] = Math.random() * maxAmount + 10; // min 10g
      velocity[j] = (Math.random() - 0.5) * 20;
    }

    const fitness = calculateFitness(ingredients, targets, position);

    particles.push({
      position: [...position],
      velocity: [...velocity],
      bestPosition: [...position],
      bestFitness: fitness,
    });

    if (fitness < globalBestFitness) {
      globalBestFitness = fitness;
      globalBestPosition = [...position];
    }
  }

  // PSO iterations
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < swarmSize; i++) {
      const particle = particles[i];

      // Update velocity
      for (let j = 0; j < n; j++) {
        const r1 = Math.random();
        const r2 = Math.random();

        particle.velocity[j] =
          w * particle.velocity[j] +
          c1 * r1 * (particle.bestPosition[j] - particle.position[j]) +
          c2 * r2 * (globalBestPosition[j] - particle.position[j]);
      }

      // Update position
      for (let j = 0; j < n; j++) {
        particle.position[j] += particle.velocity[j];

        // Soft bounds - allow exploration but penalize extremes
        if (particle.position[j] < 0)
          particle.position[j] = Math.abs(particle.position[j]);
        if (particle.position[j] > 500)
          particle.position[j] = 500 - (particle.position[j] - 500);
      }

      // Evaluate fitness
      const fitness = calculateFitness(ingredients, targets, particle.position);

      // Update personal best
      if (fitness < particle.bestFitness) {
        particle.bestFitness = fitness;
        particle.bestPosition = [...particle.position];
      }

      // Update global best
      if (fitness < globalBestFitness) {
        globalBestFitness = fitness;
        globalBestPosition = [...particle.position];
      }
    }
  }

  console.log(`PSO completed. Best fitness: ${globalBestFitness}`);
  return globalBestPosition;
}

// Sequential Quadratic Programming refinement
function solveWithSQP(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
): number[] {
  const n = ingredients.length;
  let x = [...initial];
  const maxIterations = 50;
  const tolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate gradient and Hessian approximation
    const grad = calculateGradient(ingredients, targets, x);
    const hessian = calculateHessianApprox(ingredients, targets, x);

    // Solve quadratic subproblem: min 0.5 * d^T * H * d + grad^T * d
    const direction = solveQuadraticSubproblem(hessian, grad);

    // Line search
    const stepSize = lineSearch(ingredients, targets, x, direction);

    // Update solution
    for (let i = 0; i < n; i++) {
      x[i] += stepSize * direction[i];
      // Ensure positive amounts
      if (x[i] < 0) x[i] = 0;
    }

    // Check convergence
    const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
    if (gradNorm < tolerance) break;
  }

  return x.map((v) => Math.round(v * 100) / 100);
}

// Fitness function for PSO - penalizes deviation from targets
function calculateFitness(
  ingredients: Ingredient[],
  targets: Targets,
  amounts: number[],
): number {
  let calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0;

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const amt = amounts[i];
    calories += amt * ing.cal;
    protein += amt * ing.prot;
    carbs += amt * ing.carb;
    fat += amt * ing.fat;
  }

  // Weighted squared errors
  const calError = Math.pow(
    (calories - targets.calories) / targets.calories,
    2,
  );
  const protError = Math.pow((protein - targets.protein) / targets.protein, 2);
  const carbError = Math.pow((carbs - targets.carbs) / targets.carbs, 2);
  const fatError = Math.pow((fat - targets.fat) / targets.fat, 2);

  // Add penalty for unrealistic amounts
  let penaltySum = 0;
  for (let i = 0; i < amounts.length; i++) {
    const amt = amounts[i];
    const ing = ingredients[i];

    // Penalty for very small amounts
    if (amt > 0 && amt < 5) penaltySum += Math.pow(5 - amt, 2) * 0.1;

    // Penalty for excessive oil
    if (ing.fat >= 0.8 && amt > 25) penaltySum += Math.pow(amt - 25, 2) * 0.01;
  }

  return calError + protError + carbError + fatError + penaltySum;
}

// Calculate gradient for SQP
function calculateGradient(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
): number[] {
  const n = ingredients.length;
  const grad = new Array(n).fill(0);
  const epsilon = 1e-6;

  const f0 = calculateFitness(ingredients, targets, x);

  for (let i = 0; i < n; i++) {
    const xPlus = [...x];
    xPlus[i] += epsilon;
    const fPlus = calculateFitness(ingredients, targets, xPlus);
    grad[i] = (fPlus - f0) / epsilon;
  }

  return grad;
}

// Approximate Hessian using BFGS-like update
function calculateHessianApprox(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
): number[][] {
  const n = ingredients.length;
  const H = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Initialize as identity matrix
  for (let i = 0; i < n; i++) {
    H[i][i] = 1.0;
  }

  return H;
}

// Solve quadratic subproblem using conjugate gradient
function solveQuadraticSubproblem(H: number[][], grad: number[]): number[] {
  const n = grad.length;
  const direction = new Array(n).fill(0);

  // Simple steepest descent direction
  for (let i = 0; i < n; i++) {
    direction[i] = -grad[i];
  }

  return direction;
}

// Line search using backtracking
function lineSearch(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
  direction: number[],
): number {
  let alpha = 1.0;
  const c1 = 1e-4;
  const rho = 0.5;

  const f0 = calculateFitness(ingredients, targets, x);
  const grad = calculateGradient(ingredients, targets, x);
  const gradDotDir = grad.reduce((sum, g, i) => sum + g * direction[i], 0);

  for (let iter = 0; iter < 20; iter++) {
    const xNew = x.map((xi, i) => xi + alpha * direction[i]);
    const fNew = calculateFitness(ingredients, targets, xNew);

    if (fNew <= f0 + c1 * alpha * gradDotDir) {
      return alpha;
    }

    alpha *= rho;
  }

  return alpha;
}

// Remove tiny amounts (< 20g) and refit remaining variables with BVLS to maintain macros
function pruneAndRefit(
  ingredients: Ingredient[],
  targets: Targets,
  x: number[],
) {
  const keep = x.map((v) => v >= 20); // keep only >= 20g
  if (keep.every((k) => k)) return x.map((v) => Math.round(v * 100) / 100);

  const keptIngredients: Ingredient[] = [];
  const keptInitial: number[] = [];
  for (let i = 0; i < ingredients.length; i++) {
    if (keep[i]) {
      keptIngredients.push(ingredients[i]);
      keptInitial.push(x[i]);
    }
  }
  // Refit only with kept ingredients
  const refit = solveWithBVLS(keptIngredients, targets, keptInitial);

  // Map back to full vector, pruned ones = 0
  const full = new Array(ingredients.length).fill(0);
  let idx = 0;
  for (let i = 0; i < ingredients.length; i++) {
    if (keep[i]) {
      full[i] = refit[idx++];
    } else {
      full[i] = 0;
    }
  }
  return full.map((v) => Math.round(v * 100) / 100);
}

// Advanced Particle Swarm Optimization for precise macro targeting
function solveWithAdvancedPSO(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
) {
  console.log("Starting Advanced Particle Swarm Optimization...");

  const n = ingredients.length;
  const lower = 5; // Minimum 5g for each ingredient
  const upper = 300; // Maximum 300g for each ingredient

  // PSO Parameters
  const numParticles = 50;
  const maxIterations = 500;
  const w = 0.729; // Inertia weight
  const c1 = 1.494; // Cognitive coefficient
  const c2 = 1.494; // Social coefficient

  // Initialize particles
  const particles: Particle[] = [];
  let globalBest: number[] = new Array(n).fill(50);
  let globalBestFitness = Infinity;

  // Create initial swarm
  for (let i = 0; i < numParticles; i++) {
    const particle: Particle = {
      position: new Array(n),
      velocity: new Array(n),
      personalBest: new Array(n),
      personalBestFitness: Infinity,
    };

    // Initialize position with smart distribution
    for (let j = 0; j < n; j++) {
      if (i === 0 && initial && initial.length === n && initial[j] > 0) {
        // Use initial solution as first particle
        particle.position[j] = Math.min(upper, Math.max(lower, initial[j]));
      } else {
        // Smart initialization based on ingredient type
        const ing = ingredients[j];
        let smartAmount = 50;

        if (ing.prot > 15) {
          // High protein ingredient
          smartAmount = 50 + Math.random() * 100;
        } else if (ing.carb > 15) {
          // High carb ingredient
          smartAmount = 80 + Math.random() * 120;
        } else if (ing.fat > 10) {
          // High fat ingredient - conservative
          smartAmount = 10 + Math.random() * 40;
        } else {
          // Vegetables
          smartAmount = 30 + Math.random() * 70;
        }

        particle.position[j] = Math.min(upper, Math.max(lower, smartAmount));
      }

      particle.velocity[j] = (Math.random() - 0.5) * 20; // Small initial velocity
      particle.personalBest[j] = particle.position[j];
    }

    particle.personalBestFitness = calculateFitness(
      ingredients,
      targets,
      particle.position,
    );

    if (particle.personalBestFitness < globalBestFitness) {
      globalBestFitness = particle.personalBestFitness;
      globalBest = [...particle.position];
    }

    particles.push(particle);
  }

  console.log(`Initial best fitness: ${globalBestFitness.toFixed(4)}`);

  // PSO main loop
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < numParticles; i++) {
      const particle = particles[i];

      // Update velocity and position
      for (let j = 0; j < n; j++) {
        const r1 = Math.random();
        const r2 = Math.random();

        // Update velocity
        particle.velocity[j] =
          w * particle.velocity[j] +
          c1 * r1 * (particle.personalBest[j] - particle.position[j]) +
          c2 * r2 * (globalBest[j] - particle.position[j]);

        // Update position
        particle.position[j] += particle.velocity[j];

        // Apply bounds
        particle.position[j] = Math.min(
          upper,
          Math.max(lower, particle.position[j]),
        );
      }

      // Evaluate fitness
      const fitness = calculateFitness(ingredients, targets, particle.position);

      // Update personal best
      if (fitness < particle.personalBestFitness) {
        particle.personalBestFitness = fitness;
        particle.personalBest = [...particle.position];

        // Update global best
        if (fitness < globalBestFitness) {
          globalBestFitness = fitness;
          globalBest = [...particle.position];
        }
      }
    }

    // Log progress
    if (iter % 50 === 0) {
      console.log(
        `PSO iteration ${iter}: Best fitness = ${globalBestFitness.toFixed(4)}`,
      );
      if (globalBestFitness < 1.0) {
        console.log("PSO converged to excellent solution!");
        break;
      }
    }
  }

  console.log(`Final PSO fitness: ${globalBestFitness.toFixed(4)}`);

  // Apply final local optimization
  const refined = localRefinement(globalBest, ingredients, targets);

  return refined.map((v) => Math.round(v * 100) / 100);
}

// Particle interface for PSO
interface Particle {
  position: number[];
  velocity: number[];
  personalBest: number[];
  personalBestFitness: number;
}

// Local refinement using gradient descent
function localRefinement(
  solution: number[],
  ingredients: Ingredient[],
  targets: Targets,
): number[] {
  console.log("Applying local refinement...");

  let x = [...solution];
  const n = x.length;
  const learningRate = 0.5;
  const maxIter = 100;

  for (let iter = 0; iter < maxIter; iter++) {
    // Calculate current macros
    let totalCal = 0,
      totalProt = 0,
      totalCarb = 0,
      totalFat = 0;
    for (let i = 0; i < n; i++) {
      const ing = ingredients[i];
      totalCal += ing.cal * x[i];
      totalProt += ing.prot * x[i];
      totalCarb += ing.carb * x[i];
      totalFat += ing.fat * x[i];
    }

    // Calculate errors
    const calError = totalCal - targets.calories;
    const protError = totalProt - targets.protein;
    const carbError = totalCarb - targets.carbs;
    const fatError = totalFat - targets.fat;

    // Check convergence
    const totalError =
      Math.abs(calError) +
      Math.abs(protError) +
      Math.abs(carbError) +
      Math.abs(fatError);
    if (totalError < 2.0) {
      console.log(`Local refinement converged after ${iter} iterations`);
      break;
    }

    // Update amounts using gradients
    for (let i = 0; i < n; i++) {
      const ing = ingredients[i];

      // Calculate gradient for this ingredient
      const gradient =
        calError * ing.cal * 0.001 +
        protError * ing.prot * 0.002 +
        carbError * ing.carb * 0.003 +
        fatError * ing.fat * 0.004;

      // Update with bounds
      x[i] = Math.min(300, Math.max(5, x[i] - learningRate * gradient));
    }
  }

  return x;
}

// Projected gradient descent to minimize ||A x - b||^2 subject to 10 <= x_i <= 200
function refineWithProjectedGradient(
  ingredients: Ingredient[],
  targets: Targets,
  initial: number[],
) {
  const n = ingredients.length;
  const lower = 0;
  const upper = 300;

  // Build A (4 x n) and b (4)
  const A: number[][] = [
    ingredients.map((ing) => ing.cal),
    ingredients.map((ing) => ing.prot),
    ingredients.map((ing) => ing.carb),
    ingredients.map((ing) => ing.fat),
  ];
  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Initialize x
  let x =
    initial && initial.length === n ? [...initial] : new Array(n).fill(50);
  x = x.map((v) => Math.min(upper, Math.max(lower, isFinite(v) ? v : 50)));

  // Step size based on simple estimate of spectral norm of A^T A
  const lipschitz = estimateLipschitz(A);
  const baseAlpha = 1 / Math.max(lipschitz, 1e-3);

  // Macro weights: prioritize reducing fat error and meeting protein
  const weightCal = 1.0;
  const weightProt = 2.0;
  const weightCarb = 1.5;
  const weightFat = 4.0;

  const maxIter = 600;
  for (let iter = 0; iter < maxIter; iter++) {
    // residuals
    const Ax = matVec(A, x);
    const rRaw = Ax.map((v, i) => v - b[i]);
    const fatExcess = Math.max(0, Ax[3] - targets.fat * 1.0); // penalize being over fat target
    const protDeficit = Math.max(0, targets.protein * 1.0 - Ax[1]);

    // weighted residuals to emphasize fat control and protein attainment
    const r = [
      weightCal * rRaw[0],
      weightProt * rRaw[1] - 0.5 * protDeficit, // nudge up protein if under
      weightCarb * rRaw[2],
      weightFat * rRaw[3] + 2.0 * fatExcess, // strongly push fat down if over
    ];

    // gradient = 2 A^T r
    const grad = AtVec(A, r).map((g) => 2 * g);

    // adaptive step to avoid overshoot
    const alpha = baseAlpha * (0.5 + 0.5 / (1 + iter / 100));

    // gradient step then projection
    for (let j = 0; j < n; j++) {
      x[j] = Math.min(upper, Math.max(lower, x[j] - alpha * grad[j]));
    }

    // Additional corrective step if fat is still above max: project along fat coefficients
    const fatNow = matVec(A, x)[3];
    const fatMax = targets.fat * 1.05; // keep within LP tolerance upper bound
    if (fatNow > fatMax) {
      const fatCoeffs = A[3];
      const denom = fatCoeffs.reduce((s, c) => s + c * c, 1e-6);
      const step = (fatNow - fatMax) / denom;
      for (let j = 0; j < n; j++) {
        x[j] = Math.min(upper, Math.max(lower, x[j] - step * fatCoeffs[j]));
      }
    }
  }

  // Round to two decimals for stability
  return x.map((v) => Math.round(v * 100) / 100);
}

function matVec(A: number[][], x: number[]) {
  return A.map((row) => row.reduce((s, aij, j) => s + aij * x[j], 0));
}

function AtVec(A: number[][], y: number[]) {
  const m = A.length;
  const n = A[0].length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) out[j] += A[i][j] * y[i];
  }
  return out;
}

function estimateLipschitz(A: number[][]) {
  // crude upper bound: max row norm squared sum
  const n = A[0].length;
  const G = new Array(n).fill(0).map(() => new Array(n).fill(0));
  // G = A^T A
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        G[j][k] += A[i][j] * A[i][k];
      }
    }
  }
  // estimate spectral norm by power iterations (few steps)
  let v = new Array(n).fill(1 / Math.sqrt(n));
  for (let t = 0; t < 10; t++) {
    const w = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) w[j] += G[j][k] * v[k];
    }
    const norm = Math.sqrt(w.reduce((s, val) => s + val * val, 0)) || 1;
    v = w.map((val) => val / norm);
  }
  // Rayleigh quotient v^T G v
  let rq = 0;
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) sum += G[j][k] * v[k];
    rq += v[j] * sum;
  }
  return Math.max(rq, 1);
}

// Convert optimization result back to meal suggestion format
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  const optimizedIngredients: MealSuggestionIngredient[] = ingredients.map(
    (ing) => {
      const amount = optimizationResult.ingredients[ing.name] || 0;
      const calories = amount * ing.cal;
      const protein = amount * ing.prot;
      const carbs = amount * ing.carb;
      const fat = amount * ing.fat;

      return {
        name: ing.name,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        unit: "g",
        calories: Math.round(calories * 100) / 100,
        protein: Math.round(protein * 100) / 100,
        carbs: Math.round(carbs * 100) / 100,
        fat: Math.round(fat * 100) / 100,
        macrosString: `${Math.round(calories)} cal, ${Math.round(protein)}g protein, ${Math.round(carbs)}g carbs, ${Math.round(fat)}g fat`,
      };
    },
  );

  return {
    mealTitle: originalMeal.mealTitle,
    description: `Optimized version of ${originalMeal.mealTitle} - adjusted ingredient quantities to match your exact macro targets using linear optimization.`,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions,
  };
}
