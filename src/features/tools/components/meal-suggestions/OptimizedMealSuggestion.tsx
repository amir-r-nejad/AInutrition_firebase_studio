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
    if (typeof window !== "undefined" && !(window as any).solver) {
      const loadSolver = async () => {
        const cdnUrls = [
          "https://unpkg.com/javascript-lp-solver@0.4.24/solver.js",
          "https://cdn.jsdelivr.net/npm/javascript-lp-solver@0.4.24/solver.js",
          "https://cdn.skypack.dev/javascript-lp-solver@0.4.24/solver.js"
        ];

        for (let i = 0; i < cdnUrls.length; i++) {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = cdnUrls[i];
              script.async = true;
              script.defer = true;

              script.onload = () => {
                console.log(`Linear programming solver loaded successfully from ${cdnUrls[i]}`);
                setIsSolverAvailable(true);
                resolve(true);
              };

              script.onerror = () => {
                console.warn(`Failed to load solver from ${cdnUrls[i]}, trying next CDN...`);
                document.head.removeChild(script);
                reject(new Error(`Failed to load from ${cdnUrls[i]}`));
              };

              document.head.appendChild(script);

              // Set a timeout for each attempt
              setTimeout(() => {
                if (!(window as any).solver) {
                  document.head.removeChild(script);
                  reject(new Error(`Timeout loading from ${cdnUrls[i]}`));
                }
              }, 5000);
            });
            
            // If we get here, loading was successful
            break;
          } catch (error) {
            console.warn(`CDN ${i + 1} failed:`, error);
            
            // If this was the last CDN attempt, show error
            if (i === cdnUrls.length - 1) {
              console.error("Failed to load linear programming solver from all CDNs");
              toast({
                title: "Optimization Unavailable",
                description:
                  "Failed to load optimization tools from all sources. Please check your internet connection and try again.",
                variant: "destructive",
              });
              setIsSolverAvailable(false);
            }
          }
        }
      };

      loadSolver();
    } else if ((window as any).solver) {
      setIsSolverAvailable(true);
    }
  }, [toast]);

  const handleOptimize = async () => {
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
                // Retry loading the solver with fallback CDNs
                const loadSolver = async () => {
                  const cdnUrls = [
                    "https://unpkg.com/javascript-lp-solver@0.4.24/solver.js",
                    "https://cdn.jsdelivr.net/npm/javascript-lp-solver@0.4.24/solver.js",
                    "https://cdn.skypack.dev/javascript-lp-solver@0.4.24/solver.js"
                  ];

                  for (let i = 0; i < cdnUrls.length; i++) {
                    try {
                      await new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = cdnUrls[i];
                        script.async = true;
                        script.defer = true;

                        script.onload = () => {
                          console.log(`Linear programming solver loaded successfully on retry from ${cdnUrls[i]}`);
                          setIsSolverAvailable(true);
                          resolve(true);
                        };

                        script.onerror = () => {
                          document.head.removeChild(script);
                          reject(new Error(`Failed to load from ${cdnUrls[i]}`));
                        };

                        document.head.appendChild(script);

                        setTimeout(() => {
                          if (!(window as any).solver) {
                            document.head.removeChild(script);
                            reject(new Error(`Timeout loading from ${cdnUrls[i]}`));
                          }
                        }, 5000);
                      });
                      
                      break;
                    } catch (error) {
                      if (i === cdnUrls.length - 1) {
                        console.error("Failed to load linear programming solver on retry from all CDNs");
                        toast({
                          title: "Loading Failed",
                          description:
                            "Could not load optimization tools from any source. Please check your internet connection and try again.",
                          variant: "destructive",
                        });
                        setIsSolverAvailable(false);
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
