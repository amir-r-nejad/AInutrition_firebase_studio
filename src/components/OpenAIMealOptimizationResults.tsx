"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle, 
  Target, 
  ChefHat, 
  RotateCcw,
  TrendingUp,
  Info
} from "lucide-react";

interface OpenAIMealOptimizationResultsProps {
  result: {
    meal_name: string;
    ingredients: {
      name: string;
      quantity_grams: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
    total_macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    optimization_method: string;
    explanation: string;
    target_achievement: string;
  };
  targetMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onReset: () => void;
}

export default function OpenAIMealOptimizationResults({
  result,
  targetMacros,
  onReset,
}: OpenAIMealOptimizationResultsProps) {
  const { meal_name, ingredients, total_macros, optimization_method, explanation, target_achievement } = result;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="h-12 w-12 text-green-500 mr-3" />
          <h2 className="text-3xl font-bold text-green-600">
            Optimization Complete!
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Your meal has been successfully optimized using AI genetic algorithm
        </p>
      </div>

      {/* Optimization Method & Achievement */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Optimization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md bg-blue-50">
              <p className="text-sm font-medium text-blue-800">Method</p>
              <p className="text-lg font-semibold text-blue-900">{optimization_method}</p>
            </div>
            <div className="p-3 border rounded-md bg-green-50">
              <p className="text-sm font-medium text-green-800">Target Achievement</p>
              <p className="text-lg font-semibold text-green-900">{target_achievement}</p>
            </div>
          </div>
          
          {explanation && (
            <div className="p-3 border rounded-md bg-gray-50">
              <p className="text-sm font-medium text-gray-800 mb-2">Explanation</p>
              <p className="text-gray-700">{explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optimized Meal */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
                         {meal_name}
          </CardTitle>
          <CardDescription>
            AI-optimized meal with perfect macro balance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
                     {/* Total Macros Summary */}
           <div className="p-4 border rounded-md bg-green-50">
             <h3 className="text-lg font-medium mb-3 text-green-800">
               Target Achievement Summary
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-900">
                   {total_macros.calories.toFixed(1)}
                 </p>
                 <p className="text-sm text-green-700">Calories</p>
                 <p className="text-xs text-green-600">Target: {targetMacros?.calories?.toFixed(1) || 'N/A'} kcal</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-900">
                   {total_macros.protein.toFixed(1)}g
                 </p>
                 <p className="text-sm text-green-700">Protein</p>
                 <p className="text-xs text-green-600">Target: {targetMacros?.protein?.toFixed(1) || 'N/A'}g</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-900">
                   {total_macros.carbs.toFixed(1)}g
                 </p>
                 <p className="text-sm text-green-700">Carbs</p>
                 <p className="text-xs text-green-600">Target: {targetMacros?.carbs?.toFixed(1) || 'N/A'}g</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-900">
                   {total_macros.fat.toFixed(1)}g
                 </p>
                 <p className="text-sm text-green-700">Fat</p>
                 <p className="text-xs text-green-600">Target: {targetMacros?.fat?.toFixed(1) || 'N/A'}g</p>
               </div>
             </div>
           </div>

                     {/* Ingredients Table */}
           <div>
             <h3 className="text-lg font-medium mb-3 text-primary">
               Optimized Ingredients
             </h3>
             <div className="border rounded-md overflow-hidden">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-gray-50">
                     <TableHead className="font-semibold">Ingredient</TableHead>
                     <TableHead className="text-center font-semibold">Quantity (g)</TableHead>
                     <TableHead className="text-center font-semibold">Calories</TableHead>
                     <TableHead className="text-center font-semibold">Protein (g)</TableHead>
                     <TableHead className="text-center font-semibold">Carbs (g)</TableHead>
                     <TableHead className="text-center font-semibold">Fat (g)</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {ingredients.map((ingredient, index) => (
                     <TableRow key={index} className="hover:bg-gray-50">
                       <TableCell className="font-medium">{ingredient.name}</TableCell>
                       <TableCell className="text-center">
                         <Badge variant="outline">{ingredient.quantity_grams.toFixed(1)}g</Badge>
                       </TableCell>
                       <TableCell className="text-center font-medium text-blue-600">
                         {ingredient.calories.toFixed(1)}
                       </TableCell>
                       <TableCell className="text-center font-medium text-green-600">
                         {ingredient.protein.toFixed(1)}g
                       </TableCell>
                       <TableCell className="text-center font-medium text-orange-600">
                         {ingredient.carbs.toFixed(1)}g
                       </TableCell>
                       <TableCell className="text-center font-medium text-purple-600">
                         {ingredient.fat.toFixed(1)}g
                       </TableCell>
                     </TableRow>
                   ))}
                   {/* Total Row */}
                   <TableRow className="bg-green-50 font-semibold">
                     <TableCell className="font-bold">TOTAL</TableCell>
                     <TableCell className="text-center">
                       {ingredients.reduce((sum, ing) => sum + ing.quantity_grams, 0).toFixed(1)}g
                     </TableCell>
                     <TableCell className="text-center font-bold text-green-700">
                       {total_macros.calories.toFixed(1)}
                     </TableCell>
                     <TableCell className="text-center font-bold text-green-700">
                       {total_macros.protein.toFixed(1)}g
                     </TableCell>
                     <TableCell className="text-center font-bold text-green-700">
                       {total_macros.carbs.toFixed(1)}g
                     </TableCell>
                     <TableCell className="text-center font-bold text-green-700">
                       {total_macros.fat.toFixed(1)}g
                     </TableCell>
                   </TableRow>
                 </TableBody>
               </Table>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Optimize Another Meal
        </Button>
      </div>

      {/* Info Box */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-1">
                How the AI Optimization Works:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Analyzes your current ingredients and target macros</li>
                <li>Uses genetic algorithm principles to optimize quantities</li>
                <li>Suggests additional ingredients if targets cannot be met</li>
                <li>Ensures balanced and appetizing meal composition</li>
                <li>Provides precise nutritional calculations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
