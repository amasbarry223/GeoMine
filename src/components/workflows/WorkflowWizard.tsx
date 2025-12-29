'use client';

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
  onNext?: () => void | Promise<void>;
  onBack?: () => void | Promise<void>;
}

export interface WorkflowWizardProps {
  steps: WorkflowStep[];
  onComplete: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  saveState?: boolean;
  storageKey?: string;
  className?: string;
}

export function WorkflowWizard({
  steps,
  onComplete,
  onCancel,
  title,
  description,
  saveState = true,
  storageKey = 'workflow-state',
  className,
}: WorkflowWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});

  // Load saved state
  React.useEffect(() => {
    if (saveState && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.step !== undefined) {
            setCurrentStep(parsed.step);
          }
          if (parsed.data) {
            setStepData(parsed.data);
          }
        } catch {
          // Invalid saved state, ignore
        }
      }
    }
  }, [saveState, storageKey]);

  // Save state
  const saveCurrentState = useCallback(() => {
    if (saveState && typeof window !== 'undefined') {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          step: currentStep,
          data: stepData,
        })
      );
    }
  }, [saveState, storageKey, currentStep, stepData]);

  const updateStepData = useCallback((stepId: string, data: any) => {
    setStepData((prev) => {
      const updated = { ...prev, [stepId]: data };
      saveCurrentState();
      return updated;
    });
  }, [saveCurrentState]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep];
    if (step.validate) {
      setIsValidating(true);
      try {
        const isValid = await Promise.resolve(step.validate());
        setIsValidating(false);
        return isValid;
      } catch {
        setIsValidating(false);
        return false;
      }
    }
    return true;
  }, [currentStep, steps]);

  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }

    const step = steps[currentStep];
    if (step.onNext) {
      await Promise.resolve(step.onNext());
    }

    if (currentStep < steps.length - 1) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - complete workflow
      await Promise.resolve(onComplete(stepData));
      if (saveState && typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
      }
    }
  }, [currentStep, steps, validateCurrentStep, stepData, onComplete, saveState, storageKey]);

  const handleBack = useCallback(async () => {
    if (currentStep > 0) {
      const step = steps[currentStep];
      if (step.onBack) {
        await Promise.resolve(step.onBack());
      }
      setCurrentStep(currentStep - 1);
    } else if (onCancel) {
      onCancel();
    }
  }, [currentStep, steps, onCancel]);

  const handleStepClick = useCallback(async (index: number) => {
    // Only allow clicking on completed steps or next step
    if (index <= currentStep || completedSteps.has(index - 1)) {
      setCurrentStep(index);
    }
  }, [currentStep, completedSteps]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className={cn('space-y-6', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-semibold">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Étape {currentStep + 1} sur {steps.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => handleStepClick(index)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                index === currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : completedSteps.has(index)
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground/30 text-muted-foreground',
                index <= currentStep || completedSteps.has(index - 1)
                  ? 'cursor-pointer hover:border-primary'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              {completedSteps.has(index) ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  completedSteps.has(index) ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <CardDescription>{currentStepData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {React.isValidElement(currentStepData.component)
            ? React.cloneElement(currentStepData.component as React.ReactElement<any>, {
                data: stepData[currentStepData.id],
                updateData: (data: any) => updateStepData(currentStepData.id, data),
              })
            : currentStepData.component}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isValidating}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? 'Annuler' : 'Précédent'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={isValidating}
        >
          {currentStep === steps.length - 1 ? (
            <>
              Terminer
              <Check className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


