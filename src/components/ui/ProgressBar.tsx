'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: string;
  className?: string;
}

export default function ProgressBar({ steps, currentStep, className }: ProgressBarProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex || step.status === 'completed';
          const isActive = step.id === currentStep && step.status === 'active';
          const isPending = step.status === 'pending' && index > currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                    {
                      'border-green-500 bg-green-500 text-white': isCompleted,
                      'border-blue-500 bg-blue-500 text-white animate-pulse': isActive,
                      'border-gray-300 bg-white text-gray-400': isPending,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-20',
                    {
                      'text-green-600': isCompleted,
                      'text-blue-600': isActive,
                      'text-gray-400': isPending,
                    }
                  )}
                >
                  {step.label}
                </span>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-16 mx-2 transition-all duration-300',
                    {
                      'bg-green-500': isCompleted,
                      'bg-gray-300': !isCompleted,
                    }
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Predefined steps for meal plan generation
export const MEAL_PLAN_GENERATION_STEPS: ProgressStep[] = [
  { id: 'validating', label: 'Validating Data', status: 'pending' },
  { id: 'preparing', label: 'Preparing Input', status: 'pending' },
  { id: 'generating', label: 'AI Generating', status: 'pending' },
  { id: 'processing', label: 'Processing', status: 'pending' },
  { id: 'saving', label: 'Saving Plan', status: 'pending' },
  { id: 'completed', label: 'Completed', status: 'pending' },
];
