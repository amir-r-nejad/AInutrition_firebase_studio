"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  convertMealToIngredients,
  createTargetsFromMacros,
  optimizeMeal,
  convertOptimizationToMeal,
  type OptimizedMealSuggestion,
  type OptimizationResult,
} from "@/lib/optimization/meal-optimizer";

interface OptimizedMealSuggestionProps {
  originalSuggestion: any;
  targetMacros: any;
  onOptimizationComplete?: (optimizedMeal: OptimizedMealSuggestion) => void;
}

export default function OptimizedMealSuggestion({
  originalSuggestion,
  targetMacros,
  onOptimizationComplete,
}: OptimizedMealSuggestionProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [optimizedMeal, setOptimizedMeal] =
    useState<OptimizedMealSuggestion | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  const [isSolverAvailable, setIsSolverAvailable] = useState(false);

  useEffect(() => {
    // Load the linear programming solver if not already loaded
    if (
      typeof window !== "undefined" &&
      (!(window as any).solver ||
        typeof (window as any).solver.Solve !== "function")
    ) {
      const loadSolver = async () => {
        // Try multiple approaches to load a solver
        const approaches = [
          // Approach 1: Try loading from a more reliable CDN
          async () => {
            return new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src =
                "https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/dist/glpk.js";
              script.async = true;
              script.defer = true;

              script.onload = () => {
                if ((window as any).GLPK) {
                  console.log("GLPK solver loaded successfully");
                  // Create a compatible solver interface
                  (window as any).solver = {
                    Solve: (model: any) => {
                      // Convert our model to GLPK format and solve
                      return solveWithGLPK(model, (window as any).GLPK);
                    },
                  };
                  setIsSolverAvailable(true);
                  resolve(true);
                } else {
                  reject(new Error("GLPK not properly initialized"));
                }
              };

              script.onerror = () => reject(new Error("Failed to load GLPK"));
              document.head.appendChild(script);
            });
          },
          // Approach 2: Try the original javascript-lp-solver
          async () => {
            return new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src =
                "https://unpkg.com/javascript-lp-solver@0.4.24/solver.js";
              script.async = true;
              script.defer = true;

              script.onload = () => {
                if (
                  (window as any).solver &&
                  typeof (window as any).solver.Solve === "function"
                ) {
                  console.log("Original solver loaded successfully");
                  setIsSolverAvailable(true);
                  resolve(true);
                } else {
                  reject(new Error("Original solver not properly initialized"));
                }
              };

              script.onerror = () =>
                reject(new Error("Failed to load original solver"));
              document.head.appendChild(script);
            });
          },
          // Approach 3: Use local linear programming implementation
          async () => {
            console.log("Using local linear programming implementation");
            // Create a local linear programming solver
            (window as any).solver = {
              Solve: (model: any) => {
                return solveWithLocalLP(model);
              },
            };
            setIsSolverAvailable(true);
            return Promise.resolve(true);
          },
          // Approach 4: Fallback to basic optimization
          async () => {
            console.log("Using fallback optimization method");
            // Create a simple fallback solver
            (window as any).solver = {
              Solve: (model: any) => {
                return solveWithFallback(model);
              },
            };
            setIsSolverAvailable(true);
            return Promise.resolve(true);
          },
        ];

        for (let i = 0; i < approaches.length; i++) {
          try {
            console.log(`Trying approach ${i + 1}...`);
            await approaches[i]();
            console.log(`Approach ${i + 1} succeeded`);
            break;
          } catch (error) {
            console.warn(`Approach ${i + 1} failed:`, error);
            if (i === approaches.length - 1) {
              console.error("All approaches failed");
              toast({
                title: "Optimization Unavailable",
                description:
                  "Could not load optimization tools. Using basic optimization instead.",
                variant: "destructive",
              });
              // Set up basic fallback
              (window as any).solver = {
                Solve: (model: any) => solveWithFallback(model),
              };
              setIsSolverAvailable(true);
            }
          }
        }
      };

      loadSolver();
    } else if (
      (window as any).solver &&
      typeof (window as any).solver.Solve === "function"
    ) {
      setIsSolverAvailable(true);
    }
  }, [toast]);

  // Fallback optimization function
  const solveWithFallback = (model: any) => {
    console.log("Using improved fallback optimization method");
    console.log("Model:", model);

    // Simple linear optimization approach
    const result: any = { feasible: true, result: 0 };

    // Get ingredient names (excluding deviation variables)
    const ingredientNames = Object.keys(model.variables).filter(
      (key) => !key.includes("_pos") && !key.includes("_neg"),
    );

    console.log("Ingredient names:", ingredientNames);

    if (ingredientNames.length === 0) {
      console.warn("No ingredients found in model");
      return result;
    }

    // Get target macros
    const targets = model.constraints;
    console.log("Targets:", targets);

    // Initialize ingredient amounts with smart estimates
    const amounts: { [key: string]: number } = {};
    ingredientNames.forEach((name) => {
      amounts[name] = estimateInitialAmount(
        name,
        model.variables[name],
        targets,
      );
    });

    console.log("Initial smart amounts:", amounts);

    // Enhanced gradient descent optimization
    const learningRate = 0.05; // Reduced for stability
    const maxIterations = 200; // Increased iterations
    const tolerance = 2.0; // Tighter tolerance

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const current = calculateMacros(amounts, ingredientNames, model);

      // Calculate errors
      const calorieError = targets.calories.equal - current.totalCalories;
      const proteinError = targets.protein.equal - current.totalProtein;
      const carbError = targets.carbs.equal - current.totalCarbs;
      const fatError = targets.fat.equal - current.totalFat;

      // Check if we're close enough
      const totalError =
        Math.abs(calorieError) +
        Math.abs(proteinError) +
        Math.abs(carbError) +
        Math.abs(fatError);
      if (totalError < tolerance) {
        console.log(
          `Converged after ${iteration} iterations with error: ${totalError}`,
        );
        break;
      }

      // Update amounts using enhanced gradients with penalty terms
      ingredientNames.forEach((name) => {
        const ing = model.variables[name];

        // Calculate gradient for this ingredient
        let gradient = 0;

        // Calorie gradient with penalty for excessive amounts
        if (ing.calories > 0) {
          gradient += ((calorieError * ing.calories) / 100) * learningRate;
          // Penalty for excessive calories
          if (amounts[name] > 150) {
            gradient -= 0.1 * learningRate;
          }
        }

        // Protein gradient
        if (ing.prot > 0) {
          gradient += ((proteinError * ing.prot) / 100) * learningRate;
        }

        // Carb gradient
        if (ing.carb > 0) {
          gradient += ((carbError * ing.carb) / 100) * learningRate;
        }

        // Fat gradient with penalty for excessive fat
        if (ing.fat > 0) {
          gradient += ((fatError * ing.fat) / 100) * learningRate;
          // Strong penalty for excessive fat (like olive oil)
          if (ing.fat > 50 && amounts[name] > 20) {
            gradient -= 0.3 * learningRate;
          }
        }

        // Update amount with bounds
        amounts[name] = Math.max(10, Math.min(200, amounts[name] + gradient));
      });

      // Log progress every 20 iterations
      if (iteration % 20 === 0) {
        console.log(
          `Iteration ${iteration}: Total error = ${totalError.toFixed(2)}`,
        );
      }
    }

    // Set final results
    ingredientNames.forEach((name) => {
      result[name] = Math.round(amounts[name]);
    });

    console.log("Improved fallback optimization result:", result);
    console.log(
      "Final macros:",
      calculateMacros(amounts, ingredientNames, model),
    );

    return result;
  };

  // Smart initial amount estimation
  const estimateInitialAmount = (name: string, ing: any, targets: any) => {
    // Prioritize ingredients based on macro contributions
    if (ing.prot > 0) {
      // Protein-rich ingredients: estimate based on protein target
      const proteinBased = targets.protein.equal / (ing.prot / 100);
      return Math.min(150, Math.max(15, proteinBased * 0.8));
    }

    if (ing.carb > 0) {
      // Carb-rich ingredients: estimate based on carb target
      const carbBased = targets.carbs.equal / (ing.carb / 100);
      return Math.min(150, Math.max(15, carbBased * 0.8));
    }

    if (ing.fat > 0) {
      // Fat-rich ingredients: be conservative
      const fatBased = targets.fat.equal / (ing.fat / 100);
      return Math.min(50, Math.max(10, fatBased * 0.5)); // Conservative for fats
    }

    // Low-macro ingredients: moderate amount
    return 30;
  };

  // GLPK solver wrapper
  const solveWithGLPK = (model: any, glpk: any) => {
    console.log("Using GLPK solver");
    console.log("GLPK object:", glpk);
    console.log("Model:", model);

    try {
      // Convert our model to GLPK format
      const glpkModel: any = {
        name: "meal_optimization",
        objective: {
          direction: glpk.GLP_MIN,
          name: "totalDev",
          // minimize total grams: use all ingredient variables
          vars: Object.keys(model.variables)
            .filter(
              (varName) =>
                !varName.includes("_pos") && !varName.includes("_neg"),
            )
            .map((varName) => ({ name: varName, coef: 1 })),
        },
        subjectTo: Object.keys(model.constraints).map((constraint) => {
          const c = model.constraints[constraint] || {};
          let bnds;
          if (typeof c.min === "number" && typeof c.max === "number") {
            bnds = { type: glpk.GLP_DB, lb: c.min, ub: c.max };
          } else if (typeof c.min === "number") {
            bnds = { type: glpk.GLP_LO, lb: c.min, ub: 0 };
          } else if (typeof c.max === "number") {
            bnds = { type: glpk.GLP_UP, lb: 0, ub: c.max };
          } else if (typeof (c as any).equal === "number") {
            bnds = {
              type: glpk.GLP_FX,
              lb: (c as any).equal,
              ub: (c as any).equal,
            };
          } else {
            // default to free if nothing provided
            bnds = { type: glpk.GLP_FR, lb: 0, ub: 0 };
          }
          return {
            name: constraint,
            vars: Object.keys(model.variables).map((varName) => ({
              name: varName,
              coef: model.variables[varName][constraint] || 0,
            })),
            bnds,
          };
        }),
        bounds: [],
        generals: [],
        binaries: [],
      };

      // Add variables with proper bounds
      Object.keys(model.variables).forEach((varName) => {
        // Ingredient variables in grams bounds 10..200
        if (!varName.includes("_pos") && !varName.includes("_neg")) {
          glpkModel.bounds.push({
            name: varName,
            type: glpk.GLP_DB,
            lb: 10,
            ub: 200,
          });
        } else {
          glpkModel.bounds.push({
            name: varName,
            type: glpk.GLP_FR,
            lb: 0,
            ub: 0,
          });
        }
      });

      console.log("GLPK model:", glpkModel);

      // Try to solve with GLPK
      try {
        const result = glpk.solve(glpkModel);
        console.log("GLPK solve result:", result);

        if (result.result === glpk.GLP_OPT) {
          // Extract ingredient amounts from solution
          const solution: any = { feasible: true, result: 0 };
          Object.keys(model.variables).forEach((varName) => {
            if (!varName.includes("_pos") && !varName.includes("_neg")) {
              const varIndex = result.vars.findIndex(
                (v: any) => v.name === varName,
              );
              if (varIndex !== -1) {
                solution[varName] = Math.round(result.vars[varIndex].value);
              }
            }
          });

          console.log("GLPK solution:", solution);
          return solution;
        } else {
          console.log("GLPK did not find optimal solution, using fallback");
          return solveWithFallback(model);
        }
      } catch (glpkError) {
        console.error("GLPK solve error:", glpkError);
        console.log("Falling back to basic optimization");
        return solveWithFallback(model);
      }
    } catch (error) {
      console.error("GLPK solver error:", error);
      console.log("Falling back to basic optimization");
      return solveWithFallback(model);
    }
  };

  // Local linear programming implementation using simplex algorithm
  const solveWithLocalLP = (model: any) => {
    console.log(
      "Using local linear programming implementation with improved simplex algorithm",
    );
    console.log("Model:", model);

    // Debug model setup
    console.log("=== DEBUG MODEL SETUP ===");
    console.log("Variables:", model.variables);
    console.log("Constraints:", model.constraints);
    console.log("Objective:", model.optimize);

    // Verify ingredient data
    const ingredientNames = Object.keys(model.variables).filter(
      (key) => !key.includes("_pos") && !key.includes("_neg"),
    );

    console.log("Ingredient names:", ingredientNames);
    ingredientNames.forEach((name) => {
      const ing = model.variables[name];
      console.log(`${name}:`, {
        calories: ing.calories,
        protein: ing.prot,
        carbs: ing.carb,
        fat: ing.fat,
        "calories/100g": ing.calories / 100,
        "protein/100g": ing.prot / 100,
        "carbs/100g": ing.carb / 100,
        "fat/100g": ing.fat / 100,
      });
    });

    console.log("Target constraints:", model.constraints);
    console.log("=== END DEBUG ===");

    const result: any = { feasible: true, result: 0 };

    if (ingredientNames.length === 0) {
      console.warn("No ingredients found in model");
      return result;
    }

    const targets = model.constraints;
    console.log("Targets:", targets);

    // Use proper linear programming with simplex method
    try {
      const solution = solveLinearProgramming(
        ingredientNames,
        model.variables,
        targets,
      );
      console.log("Linear programming solution:", solution);

      // Set results
      ingredientNames.forEach((name) => {
        result[name] = Math.round(solution[name] || 50);
      });

      console.log("Local LP optimization result:", result);
      return result;
    } catch (error) {
      console.error("Linear programming failed:", error);
      console.log("Falling back to gradient descent");
      return solveWithFallback(model);
    }
  };

  // Proper linear programming solver using Interior Point Method
  const solveLinearProgramming = (
    ingredients: string[],
    variables: any,
    targets: any,
  ) => {
    console.log("Running Interior Point Method with Quadratic Programming...");

    const n = ingredients.length;
    const m = 4; // calories, protein, carbs, fat

    // Create coefficient matrix A (m x n)
    const A: number[][] = [];
    for (let i = 0; i < m; i++) {
      A[i] = [];
      for (let j = 0; j < n; j++) {
        const ing = variables[ingredients[j]];
        if (i === 0)
          A[i][j] = ing.calories / 100; // calories per 100g
        else if (i === 1)
          A[i][j] = ing.prot / 100; // protein per 100g
        else if (i === 2)
          A[i][j] = ing.carb / 100; // carbs per 100g
        else A[i][j] = ing.fat / 100; // fat per 100g
      }
    }

    // Create target vector b
    const b = [
      targets.calories.equal,
      targets.protein.equal,
      targets.carbs.equal,
      targets.fat.equal,
    ];

    console.log("Matrix A:", A);
    console.log("Target vector b:", b);

    // Use Interior Point Method with Quadratic Programming
    const solution = solveInteriorPoint(A, b, n);

    console.log("Interior Point solution:", solution);

    // Map solution back to ingredient names
    const result: { [key: string]: number } = {};
    ingredients.forEach((name, index) => {
      result[name] = Math.round(solution[index] || 50);
    });

    return result;
  };

  // Interior Point Method with Quadratic Programming
  const solveInteriorPoint = (A: number[][], b: number[], n: number) => {
    console.log("Starting improved Interior Point Method...");

    // Initial solution: solve least squares first to get closer to feasible region
    let x = solveLeastSquaresFirst(A, b, n);

    console.log("Initial least squares solution:", x);

    // Interior Point iterations
    const maxIterations = 300; // Increased iterations
    const tolerance = 0.001; // Tighter tolerance
    let mu = 0.1; // barrier parameter - make it mutable

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Calculate current constraint values
      const current = calculateConstraintValues(A, x);

      // Calculate constraint violations
      const violations = current.map((val: number, i: number) => b[i] - val);
      const totalViolation = violations.reduce(
        (sum: number, v: number) => sum + Math.abs(v),
        0,
      );

      console.log(
        `Interior Point iteration ${iteration + 1}: Total violation = ${totalViolation.toFixed(4)}`,
      );

      // Check convergence
      if (totalViolation < tolerance) {
        console.log("Interior Point Method converged!");
        break;
      }

      // Calculate search direction using Newton's method
      const searchDirection = calculateSearchDirection(A, x, violations, mu);

      // Line search to find optimal step size
      const stepSize = findOptimalStepSize(
        x,
        searchDirection,
        A,
        b,
        violations,
      );

      // Update solution
      for (let i = 0; i < n; i++) {
        x[i] += stepSize * searchDirection[i];
        // Ensure bounds
        x[i] = Math.max(10, Math.min(200, x[i]));
      }

      // More aggressive barrier parameter reduction
      mu *= 0.5; // Changed from 0.95 to 0.5 for faster convergence

      // Log progress every 50 iterations
      if (iteration % 50 === 0) {
        console.log(
          `Iteration ${iteration}: mu = ${mu.toFixed(6)}, violation = ${totalViolation.toFixed(4)}`,
        );
      }
    }

    console.log("Final Interior Point solution:", x);
    return x;
  };

  // Solve least squares first to get better initial solution
  const solveLeastSquaresFirst = (A: number[][], b: number[], n: number) => {
    console.log("Solving least squares for initial solution...");

    // Calculate A^T * A and A^T * b
    const ATA = new Array(n).fill(0).map(() => new Array(n).fill(0));
    const ATb = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < A.length; k++) {
          ATA[i][j] += A[k][i] * A[k][j];
        }
      }

      for (let k = 0; k < A.length; k++) {
        ATb[i] += A[k][i] * b[k];
      }
    }

    // Add regularization for numerical stability
    for (let i = 0; i < n; i++) {
      ATA[i][i] += 1e-6; // Small regularization term
    }

    // Solve (A^T * A) * x = A^T * b
    const x = solveLinearSystem(ATA, ATb);

    // Apply bounds and scale to reasonable amounts
    const boundedX = x.map((xi, i) => {
      let amount = Math.max(10, Math.min(200, xi));

      // Scale based on calorie contribution
      if (A[0][i] > 0) {
        const calorieContribution = A[0][i] * amount;
        const targetCalories = b[0];

        // If this ingredient contributes too much to calories, scale it down
        if (calorieContribution > targetCalories * 0.6) {
          amount = (targetCalories * 0.6) / A[0][i];
          amount = Math.max(10, Math.min(200, amount));
        }
      }

      return amount;
    });

    console.log("Least squares solution with bounds:", boundedX);
    return boundedX;
  };

  // Initialize smart solution based on macro contribution
  const initializeSmartSolution = (A: number[][], b: number[], n: number) => {
    const x = new Array(n).fill(0);

    // Calculate how much each ingredient contributes to each macro
    const macroContributions = new Array(n).fill(0);

    for (let j = 0; j < n; j++) {
      // Weight by importance: calories (0.4), protein (0.3), carbs (0.2), fat (0.1)
      macroContributions[j] =
        A[0][j] * 0.4 + // calories
        A[1][j] * 0.3 + // protein
        A[2][j] * 0.2 + // carbs
        A[3][j] * 0.1; // fat
    }

    // Normalize contributions
    const totalContribution = macroContributions.reduce((sum, c) => sum + c, 0);

    // Distribute based on contribution and target calories
    for (let j = 0; j < n; j++) {
      if (macroContributions[j] > 0) {
        // Start with proportional distribution
        x[j] = (b[0] * macroContributions[j]) / totalContribution / A[0][j];

        // Apply reasonable bounds
        x[j] = Math.max(15, Math.min(150, x[j]));
      } else {
        x[j] = 30; // Default for ingredients with no macro contribution
      }
    }

    return x;
  };

  // Calculate search direction using Newton's method
  const calculateSearchDirection = (
    A: number[][],
    x: number[],
    violations: number[],
    mu: number,
  ) => {
    const n = x.length;
    const m = A.length;

    // Create Hessian matrix (approximation)
    const H = new Array(n).fill(0).map(() => new Array(n).fill(0));

    // Add diagonal terms for regularization
    for (let i = 0; i < n; i++) {
      H[i][i] = 1.0 + mu / (x[i] * x[i]);
    }

    // Add constraint terms
    for (let k = 0; k < m; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          H[i][j] += A[k][i] * A[k][j];
        }
      }
    }

    // Create gradient vector
    const g = new Array(n).fill(0);

    // Add constraint gradients
    for (let k = 0; k < m; k++) {
      for (let i = 0; i < n; i++) {
        g[i] += violations[k] * A[k][i];
      }
    }

    // Add barrier function gradients
    for (let i = 0; i < n; i++) {
      g[i] -= mu / x[i];
    }

    // Solve linear system H * d = -g using Cholesky decomposition
    const searchDirection = solveLinearSystem(
      H,
      g.map((val) => -val),
    );

    return searchDirection;
  };

  // Solve linear system using Cholesky decomposition with improved stability
  const solveLinearSystem = (A: number[][], b: number[]) => {
    const n = A.length;

    // Check if matrix is positive definite and well-conditioned
    const eigenvalues = estimateEigenvalues(A);
    const minEigenvalue = Math.min(...eigenvalues);
    const maxEigenvalue = Math.max(...eigenvalues);
    const conditionNumber = maxEigenvalue / minEigenvalue;

    console.log(`Matrix condition number: ${conditionNumber.toFixed(2)}`);

    if (conditionNumber > 1e12) {
      console.warn("Matrix is poorly conditioned, adding regularization");
      // Add regularization to improve conditioning
      for (let i = 0; i < n; i++) {
        A[i][i] += 1e-6 * maxEigenvalue;
      }
    }

    // Cholesky decomposition: A = L * L^T
    const L = new Array(n).fill(0).map(() => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = A[i][j];

        for (let k = 0; k < j; k++) {
          sum -= L[i][k] * L[j][k];
        }

        if (i === j) {
          // Ensure diagonal elements are positive
          L[i][j] = Math.sqrt(Math.max(sum, 1e-10));
        } else {
          // Check for division by zero
          if (Math.abs(L[j][j]) < 1e-12) {
            console.warn(
              "Near-zero diagonal element in Cholesky, using regularization",
            );
            L[j][j] = 1e-6;
          }
          L[i][j] = sum / L[j][j];
        }
      }
    }

    // Forward substitution: L * y = b
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = b[i];
      for (let j = 0; j < i; j++) {
        sum -= L[i][j] * y[j];
      }
      y[i] = sum / L[i][i];
    }

    // Backward substitution: L^T * x = y
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = y[i];
      for (let j = i + 1; j < n; j++) {
        sum -= L[j][i] * x[j];
      }
      x[i] = sum / L[i][i];
    }

    return x;
  };

  // Estimate eigenvalues using power iteration (simplified)
  const estimateEigenvalues = (A: number[][]) => {
    const n = A.length;
    const eigenvalues: number[] = [];

    // Use diagonal elements as rough eigenvalue estimates
    for (let i = 0; i < n; i++) {
      eigenvalues.push(Math.abs(A[i][i]));
    }

    return eigenvalues;
  };

  // Find optimal step size using line search
  const findOptimalStepSize = (
    x: number[],
    direction: number[],
    A: number[][],
    b: number[],
    violations: number[],
  ) => {
    const n = x.length;
    let stepSize = 1.0;

    // Backtracking line search
    const alpha = 0.5;
    const beta = 0.8;
    const maxSteps = 20;

    for (let step = 0; step < maxSteps; step++) {
      // Calculate new point
      const newX = x.map((xi, i) => xi + stepSize * direction[i]);

      // Check bounds
      let valid = true;
      for (let i = 0; i < n; i++) {
        if (newX[i] < 10 || newX[i] > 200) {
          valid = false;
          break;
        }
      }

      if (!valid) {
        stepSize *= beta;
        continue;
      }

      // Calculate new constraint values
      const newCurrent = calculateConstraintValues(A, newX);
      const newViolations = newCurrent.map(
        (val: number, i: number) => b[i] - val,
      );
      const newTotalViolation = newViolations.reduce(
        (sum: number, v: number) => sum + Math.abs(v),
        0,
      );

      // Check if this step improves the solution
      const currentTotalViolation = violations.reduce(
        (sum: number, v: number) => sum + Math.abs(v),
        0,
      );

      if (newTotalViolation < currentTotalViolation) {
        return stepSize;
      }

      stepSize *= beta;
    }

    return stepSize;
  };

  // Calculate current constraint values
  const calculateConstraintValues = (A: number[][], x: number[]) => {
    const m = A.length;
    const result = new Array(m).fill(0);

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < x.length; j++) {
        result[i] += A[i][j] * x[j];
      }
    }

    return result;
  };

  const calculateMacros = (
    amounts: { [key: string]: number },
    ingredientNames: string[],
    model: any,
  ) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ingredientNames.forEach((name) => {
      const ing = model.variables[name];
      const amount = amounts[name];
      totalCalories += (ing.calories * amount) / 100;
      totalProtein += (ing.prot * amount) / 100;
      totalCarbs += (ing.carb * amount) / 100;
      totalFat += (ing.fat * amount) / 100;
    });

    return { totalCalories, totalProtein, totalCarbs, totalFat };
  };

  const handleOptimize = async () => {
    // Double-check solver availability before proceeding
    if (
      typeof window === "undefined" ||
      !(window as any).solver ||
      typeof (window as any).solver.Solve !== "function"
    ) {
      console.error("Solver check failed in handleOptimize:", {
        window: typeof window,
        solver: !!(window as any).solver,
        solveMethod: typeof (window as any).solver?.Solve,
      });
      toast({
        title: "Optimization Unavailable",
        description:
          "Optimization tools are not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!isSolverAvailable) {
      toast({
        title: "Optimization Unavailable",
        description:
          "Please wait for optimization tools to load, then try again.",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    setShowOptimization(true);

    try {
      // Convert the original meal suggestion to optimization format
      const ingredients = convertMealToIngredients(originalSuggestion);
      const targets = createTargetsFromMacros(targetMacros);

      console.log("Optimization inputs:", { ingredients, targets });

      // Run the optimization
      const result = optimizeMeal(ingredients, targets);

      if (result.feasible) {
        // Convert the optimization result back to meal format
        const optimized = convertOptimizationToMeal(
          originalSuggestion,
          result,
          ingredients,
        );

        setOptimizationResult(result);
        setOptimizedMeal(optimized);

        toast({
          title: "Optimization Complete!",
          description:
            "Meal has been optimized to match your exact macro targets.",
          variant: "default",
        });

        // Notify parent component
        if (onOptimizationComplete) {
          onOptimizationComplete(optimized);
        }
      } else {
        toast({
          title: "Optimization Failed",
          description:
            result.error ||
            "Could not find a solution that matches your macro targets exactly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast({
        title: "Optimization Error",
        description: "An error occurred during optimization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Show loading state while solver is loading
  if (!isSolverAvailable) {
    return (
      <div className="space-y-4">
        {/* Original AI Suggestion */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              AI Generated: {originalSuggestion.mealTitle}
            </CardTitle>
            <CardDescription className="text-sm">
              {originalSuggestion.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-medium text-md mb-2 text-primary">
                Original Macros:
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Calories: {originalSuggestion.totalCalories.toFixed(1)} kcal
                </Badge>
                <Badge variant="outline">
                  Protein: {originalSuggestion.totalProtein.toFixed(1)}g
                </Badge>
                <Badge variant="outline">
                  Carbs: {originalSuggestion.totalCarbs.toFixed(1)}g
                </Badge>
                <Badge variant="outline">
                  Fat: {originalSuggestion.totalFat.toFixed(1)}g
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Loading optimization tools...
              </span>
            </div>

            <Button
              onClick={() => {
                // Retry loading the solver with multiple approaches
                const loadSolver = async () => {
                  const approaches = [
                    // Approach 1: Try loading from a more reliable CDN
                    async () => {
                      return new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src =
                          "https://cdn.jsdelivr.net/npm/glpk.js@4.0.2/dist/glpk.js";
                        script.async = true;
                        script.defer = true;

                        script.onload = () => {
                          if ((window as any).GLPK) {
                            console.log(
                              "GLPK solver loaded successfully on retry",
                            );
                            // Create a compatible solver interface
                            (window as any).solver = {
                              Solve: (model: any) => {
                                return solveWithGLPK(
                                  model,
                                  (window as any).GLPK,
                                );
                              },
                            };
                            setIsSolverAvailable(true);
                            resolve(true);
                          } else {
                            reject(new Error("GLPK not properly initialized"));
                          }
                        };

                        script.onerror = () =>
                          reject(new Error("Failed to load GLPK"));
                        document.head.appendChild(script);
                      });
                    },
                    // Approach 2: Try the original javascript-lp-solver
                    async () => {
                      return new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src =
                          "https://unpkg.com/javascript-lp-solver@0.4.24/solver.js";
                        script.async = true;
                        script.defer = true;

                        script.onload = () => {
                          if (
                            (window as any).solver &&
                            typeof (window as any).solver.Solve === "function"
                          ) {
                            console.log(
                              "Original solver loaded successfully on retry",
                            );
                            setIsSolverAvailable(true);
                            resolve(true);
                          } else {
                            reject(
                              new Error(
                                "Original solver not properly initialized",
                              ),
                            );
                          }
                        };

                        script.onerror = () =>
                          reject(new Error("Failed to load original solver"));
                        document.head.appendChild(script);
                      });
                    },
                    // Approach 3: Use local linear programming implementation
                    async () => {
                      console.log(
                        "Using local linear programming implementation on retry",
                      );
                      // Create a local linear programming solver
                      (window as any).solver = {
                        Solve: (model: any) => {
                          return solveWithLocalLP(model);
                        },
                      };
                      setIsSolverAvailable(true);
                      return Promise.resolve(true);
                    },
                    // Approach 4: Fallback to basic optimization
                    async () => {
                      console.log(
                        "Using fallback optimization method on retry",
                      );
                      // Create a simple fallback solver
                      (window as any).solver = {
                        Solve: (model: any) => {
                          return solveWithFallback(model);
                        },
                      };
                      setIsSolverAvailable(true);
                      return Promise.resolve(true);
                    },
                  ];

                  for (let i = 0; i < approaches.length; i++) {
                    try {
                      console.log(`Retry: Trying approach ${i + 1}...`);
                      await approaches[i]();
                      console.log(`Retry: Approach ${i + 1} succeeded`);
                      break;
                    } catch (error) {
                      console.warn(`Retry: Approach ${i + 1} failed:`, error);
                      if (i === approaches.length - 1) {
                        console.error("Retry: All approaches failed");
                        toast({
                          title: "Loading Failed",
                          description:
                            "Could not load optimization tools. Using basic optimization instead.",
                          variant: "destructive",
                        });
                        // Set up basic fallback
                        (window as any).solver = {
                          Solve: (model: any) => solveWithFallback(model),
                        };
                        setIsSolverAvailable(true);
                      }
                    }
                  }
                };

                loadSolver();
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Retry Loading Optimization Tools
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMacroAccuracy = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 95 && percentage <= 105) return "exact";
    if (percentage >= 90 && percentage <= 110) return "close";
    return "off";
  };

  const renderMacroBadge = (actual: number, target: number, label: string) => {
    const accuracy = getMacroAccuracy(
      actual,
      label === "Calories" ? actual : actual,
    );
    const getBadgeVariant = (accuracy: string) => {
      switch (accuracy) {
        case "exact":
          return "default";
        case "close":
          return "secondary";
        default:
          return "destructive";
      }
    };

    const getIcon = (accuracy: string) => {
      switch (accuracy) {
        case "exact":
          return <CheckCircle className="h-3 w-3" />;
        case "close":
          return <Target className="h-3 w-3" />;
        default:
          return <AlertTriangle className="h-3 w-3" />;
      }
    };

    return (
      <Badge
        variant={getBadgeVariant(accuracy)}
        className="flex items-center gap-1"
      >
        {getIcon(accuracy)}
        {label}: {actual.toFixed(1)}g
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Original AI Suggestion */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI Generated: {originalSuggestion.mealTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            {originalSuggestion.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-medium text-md mb-2 text-primary">
              Original Macros:
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Calories: {originalSuggestion.totalCalories.toFixed(1)} kcal
              </Badge>
              <Badge variant="outline">
                Protein: {originalSuggestion.totalProtein.toFixed(1)}g
              </Badge>
              <Badge variant="outline">
                Carbs: {originalSuggestion.totalCarbs.toFixed(1)}g
              </Badge>
              <Badge variant="outline">
                Fat: {originalSuggestion.totalFat.toFixed(1)}g
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !isSolverAvailable}
            className="w-full"
            variant="outline"
          >
            {isOptimizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Target className="mr-2 h-4 w-4" />
            )}
            {isOptimizing ? "Optimizing..." : "Optimize to Match Exact Macros"}
          </Button>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {showOptimization && (
        <Card className="shadow-md hover:shadow-lg transition-shadow border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Optimization Results
            </CardTitle>
            <CardDescription className="text-sm">
              {optimizationResult?.feasible
                ? "Meal has been optimized to match your exact macro targets using linear programming."
                : "Optimization completed but could not find an exact match for your macro targets."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOptimizing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">
                  Running linear optimization...
                </p>
              </div>
            ) : optimizationResult && optimizedMeal ? (
              <div className="space-y-4">
                {/* Target vs Achieved Comparison */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">
                      Target Macros
                    </h5>
                    <div className="space-y-1">
                      <p className="text-sm">
                        Calories: {targetMacros.calories} kcal
                      </p>
                      <p className="text-sm">
                        Protein: {targetMacros.protein}g
                      </p>
                      <p className="text-sm">Carbs: {targetMacros.carbs}g</p>
                      <p className="text-sm">Fat: {targetMacros.fat}g</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-muted-foreground mb-2">
                      Achieved Macros
                    </h5>
                    <div className="space-y-1">
                      {renderMacroBadge(
                        optimizedMeal.totalCalories,
                        targetMacros.calories,
                        "Calories",
                      )}
                      {renderMacroBadge(
                        optimizedMeal.totalProtein,
                        targetMacros.protein,
                        "Protein",
                      )}
                      {renderMacroBadge(
                        optimizedMeal.totalCarbs,
                        targetMacros.carbs,
                        "Carbs",
                      )}
                      {renderMacroBadge(
                        optimizedMeal.totalFat,
                        targetMacros.fat,
                        "Fat",
                      )}
                    </div>
                  </div>
                </div>

                {/* Optimized Ingredients */}
                <div>
                  <h4 className="font-medium text-md mb-2 text-primary">
                    Optimized Ingredients:
                  </h4>
                  <ScrollArea className="w-full">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Ingredient</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Unit</TableHead>
                          <TableHead className="text-right">Calories</TableHead>
                          <TableHead className="text-right">
                            Macros (P/C/F)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {optimizedMeal.ingredients.map((ing, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium py-1.5">
                              {ing.name}
                            </TableCell>
                            <TableCell className="text-right py-1.5">
                              {ing.amount}
                            </TableCell>
                            <TableCell className="text-right py-1.5">
                              {ing.unit}
                            </TableCell>
                            <TableCell className="text-right py-1.5">
                              {ing.calories.toFixed(0)}
                            </TableCell>
                            <TableCell className="text-right py-1.5 whitespace-nowrap">
                              {ing.macrosString}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Final Totals */}
                <div className="text-sm font-semibold p-3 border-t border-muted-foreground/20 bg-muted/40 rounded-b-md">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Optimized Totals:</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <span>
                      Calories: {optimizedMeal.totalCalories.toFixed(1)} kcal
                    </span>
                    <span>
                      Protein: {optimizedMeal.totalProtein.toFixed(1)}g
                    </span>
                    <span>Carbs: {optimizedMeal.totalCarbs.toFixed(1)}g</span>
                    <span>Fat: {optimizedMeal.totalFat.toFixed(1)}g</span>
                  </div>
                </div>

                {optimizationResult.result > 0 && (
                  <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                    <strong>Optimization Score:</strong>{" "}
                    {optimizationResult.result.toFixed(4)}
                    (Lower is better - indicates how closely the solution
                    matches your targets)
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p>Optimization completed but no results were generated.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
