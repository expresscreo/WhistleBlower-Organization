'use client';

import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function FormStepIndicator({
  steps,
  currentStep,
  totalSteps,
  progress,
  onStepClick,
  isStepComplete: isStepCompleteProp,
  isStepClickable: isStepClickableProp,
}) {
  const currentMeta = steps[currentStep - 1];
  const percent = Math.round(progress);
  const isStepComplete = (stepNum) =>
    isStepCompleteProp ? isStepCompleteProp(stepNum) : stepNum < currentStep;
  const isStepClickable = (stepNum) => {
    if (!onStepClick || stepNum === currentStep) return false;
    if (isStepClickableProp) return isStepClickableProp(stepNum);
    return stepNum < currentStep;
  };

  return (
    <div className="submit-report-wizard-section box-border w-full max-w-full min-w-0 px-4 md:px-8 pt-6 md:pt-8 pb-4 border-b border-border/60 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
          <span className="hidden sm:inline"> · {currentMeta?.shortLabel}</span>
        </p>
        <span className="text-sm font-medium text-primary">{percent}%</span>
      </div>

      <Progress
        value={progress}
        className="h-1.5 bg-border"
        aria-label="Form progress"
      />

      {/* Desktop stepper */}
      <nav
        className="hidden md:flex items-center justify-between gap-2 mb-2"
        aria-label="Form progress"
      >
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = isStepComplete(stepNum);
          const isCurrent = stepNum === currentStep;
          const isClickable = isStepClickable(stepNum);
          const Icon = step.icon;

          return (
            <Fragment key={step.id}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(stepNum)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex flex-col items-center gap-2 flex-1 min-w-0 transition-opacity',
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    isComplete && 'border-primary bg-primary/10 text-primary',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    isClickable &&
                      !isComplete &&
                      !isCurrent &&
                      'border-primary/50 text-primary/80',
                    !isComplete &&
                      !isCurrent &&
                      !isClickable &&
                      'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" aria-hidden />
                  ) : (
                    Icon && <Icon className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight max-w-[5.5rem]',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.shortLabel}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 min-w-[1rem] max-w-[3rem] -mt-6 transition-colors',
                    isComplete ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                  aria-hidden
                />
              )}
            </Fragment>
          );
        })}
      </nav>

      {/* Mobile dots */}
      <div
        className="flex md:hidden items-center justify-center gap-2 py-1"
        aria-label="Form progress"
      >
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isComplete = isStepComplete(stepNum);
          const isCurrent = stepNum === currentStep;
          const isClickable = isStepClickable(stepNum);
          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(stepNum)}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={step.shortLabel}
              className={cn(
                'h-2 rounded-full transition-all',
                isCurrent ? 'w-6 bg-primary' : 'w-2',
                isComplete && !isCurrent && 'bg-primary/60',
                !isComplete && !isCurrent && 'bg-muted-foreground/30',
                isClickable ? 'cursor-pointer' : 'cursor-default'
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
