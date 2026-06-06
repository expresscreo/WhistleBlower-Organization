'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function WizardMobileFooter({
  formId = 'submit-report-form',
  currentStep,
  totalSteps,
  onBack,
  onContinue,
  isSubmitting,
  submitLabel,
  continueLabel = 'Continue',
  showSkip = false,
  onSkip,
  onSubmitIntent,
}) {
  const [mounted, setMounted] = useState(false);
  const isLastStep = currentStep === totalSteps;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const footer = (
    <nav
      role="navigation"
      aria-label="Form navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="submit-report-footer-inner flex items-center gap-3 px-4 py-3 max-w-[var(--submit-report-card-width,56rem)] mx-auto">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
            Back
          </Button>
        )}
        {showSkip && !isLastStep && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isSubmitting} className="shrink-0">
            Skip for now
          </Button>
        )}
        {isLastStep ? (
          <Button
            type="submit"
            form={formId}
            loading={isSubmitting}
            className="flex-1"
            onClick={() => onSubmitIntent?.()}
          >
            {submitLabel}
          </Button>
        ) : (
          <Button type="button" onClick={onContinue} disabled={isSubmitting} className="flex-1">
            {continueLabel}
          </Button>
        )}
      </div>
    </nav>
  );

  return createPortal(footer, document.body);
}
