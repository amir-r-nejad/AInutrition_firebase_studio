'use client';

import { useState } from 'react';
import { SingleMealOptimizationService } from '@/services/single-meal-optimization';
import { SingleMealOptimizationRequest, RAGResponse } from '@/types/meal-optimization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, ChefHat, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SingleMealOptimizationFormProps {
  ragResponse: RAGResponse;
  onOptimizationComplete: (result: any) => void;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealType: string; // e.g., "lunch", "breakfast", "dinner"
}

export const SingleMealOptimizationForm: React.FC<SingleMealOptimizationFormProps> = ({
  ragResponse,
  onOptimizationComplete,
  targetMacros,
  mealType,
}) => {
  const { toast } = useToast();
  
  const [userPreferences, setUserPreferences] = useState({
    dietary_restrictions: [] as string[],
    allergies: [] as string[],
    preferred_cuisines: ['persian'],
    calorie_preference: 'moderate' as const,
    protein_preference: 'high' as const,
    carb_preference: 'moderate' as const,
    fat_preference: 'moderate' as const,
  });

  const [dietaryRestrictionsInput, setDietaryRestrictionsInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);
    
    try {
      console.log('Submitting single meal optimization request:', {
        ragResponse,
        targetMacros,
        userPreferences,
        mealType
      });

      const request: SingleMealOptimizationRequest = {
        rag_response: ragResponse,
        target_macros: {
          calories: targetMacros.calories,
          protein: targetMacros.protein,
          carbohydrates: targetMacros.carbs,
          fat: targetMacros.fat,
        },
        user_preferences: userPreferences,
        user_id: 'user_123', // TODO: Get from authentication system
        meal_type: mealType,
      };

      console.log('Sending request to Single Meal Optimization API:', request);

      const result = await SingleMealOptimizationService.optimizeSingleMeal(request);
      console.log('Single meal optimization result received:', result);
      
      onOptimizationComplete(result);
      
      toast({
        title: "Success!",
        description: `Your ${mealType} has been optimized successfully!`,
        variant: "default",
      });
    } catch (err) {
      console.error('Single meal optimization failed:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setLocalError(errorMessage);
      
      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDietaryRestriction = () => {
    if (dietaryRestrictionsInput.trim()) {
      setUserPreferences(prev => ({
        ...prev,
        dietary_restrictions: [...prev.dietary_restrictions, dietaryRestrictionsInput.trim()]
      }));
      setDietaryRestrictionsInput('');
    }
  };

  const removeDietaryRestriction = (index: number) => {
    setUserPreferences(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.filter((_, i) => i !== index)
    }));
  };

  const addAllergy = () => {
    if (allergiesInput.trim()) {
      setUserPreferences(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergiesInput.trim()]
      }));
      setAllergiesInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setUserPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          Single Meal Optimization Settings
        </CardTitle>
        <CardDescription>
          Customize your preferences for optimal {mealType} planning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Macros Display */}
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-medium mb-3 text-primary">Target Macros for {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.calories} kcal
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Calories</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.protein}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Protein</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.carbs}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Carbs</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="w-full justify-center">
                  {targetMacros.fat}g
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Fat</p>
              </div>
            </div>
          </div>

          {/* User Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary">User Preferences</h3>
            
            {/* Preferred Cuisines */}
            <div>
              <Label htmlFor="cuisines">Preferred Cuisines</Label>
              <Input
                id="cuisines"
                type="text"
                value={userPreferences.preferred_cuisines.join(', ')}
                onChange={(e) => setUserPreferences(prev => ({ 
                  ...prev, 
                  preferred_cuisines: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }))}
                placeholder="persian, mediterranean, italian"
                className="mt-1"
              />
            </div>

            {/* Dietary Restrictions */}
            <div>
              <Label>Dietary Restrictions</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={dietaryRestrictionsInput}
                  onChange={(e) => setDietaryRestrictionsInput(e.target.value)}
                  placeholder="e.g., vegetarian, gluten-free"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDietaryRestriction())}
                />
                <Button type="button" onClick={addDietaryRestriction} variant="outline">
                  Add
                </Button>
              </div>
              {userPreferences.dietary_restrictions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.dietary_restrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeDietaryRestriction(index)}>
                      {restriction} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div>
              <Label>Allergies</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="e.g., nuts, dairy"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <Button type="button" onClick={addAllergy} variant="outline">
                  Add
                </Button>
              </div>
              {userPreferences.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {userPreferences.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeAllergy(index)}>
                      {allergy} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Macro Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calorie-pref">Calorie Preference</Label>
                <Select
                  value={userPreferences.calorie_preference}
                  onValueChange={(value: 'low' | 'moderate' | 'high') => 
                    setUserPreferences(prev => ({ ...prev, calorie_preference: value }))
                  }
                >
                  <SelectTrigger id="calorie-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="protein-pref">Protein Preference</Label>
                <Select
                  value={userPreferences.protein_preference}
                  onValueChange={(value: 'low' | 'moderate' | 'high') => 
                    setUserPreferences(prev => ({ ...prev, protein_preference: value }))
                  }
                >
                  <SelectTrigger id="protein-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="carb-pref">Carb Preference</Label>
                <Select
                  value={userPreferences.carb_preference}
                  onValueChange={(value: 'low' | 'moderate' | 'high') => 
                    setUserPreferences(prev => ({ ...prev, carb_preference: value }))
                  }
                >
                  <SelectTrigger id="carb-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fat-pref">Fat Preference</Label>
                <Select
                  value={userPreferences.fat_preference}
                  onValueChange={(value: 'low' | 'moderate' | 'high') => 
                    setUserPreferences(prev => ({ ...prev, fat_preference: value }))
                  }
                >
                  <SelectTrigger id="fat-pref">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {localError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Optimization Error</p>
              </div>
              <p className="text-red-700 mt-2">{localError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Optimizing {mealType.charAt(0).toUpperCase() + mealType.slice(1)}...
              </>
            ) : (
              <>
                <Target className="mr-2 h-5 w-5" />
                Optimize {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
