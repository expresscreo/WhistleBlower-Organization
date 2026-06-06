'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/form-feedback';
import { validatePlaceBountyStep } from '@/lib/placeBountyValidation';
import { PLACE_BOUNTY_STEPS } from './placeBountyStepMeta';
import FormStepIndicator from '@/components/submit-report/FormStepIndicator';
import WizardMobileFooter from '@/components/submit-report/WizardMobileFooter';
import BountyReviewSummary from './BountyReviewSummary';
import BountyPasswordSection from './BountyPasswordSection';
import BountyCaseStep from './steps/BountyCaseStep';
import BountyLocationStep from './steps/BountyLocationStep';
import BountyEvidenceStep from './steps/BountyEvidenceStep';
import BountyRewardStep from './steps/BountyRewardStep';
import { useBountyFormLocation } from './useBountyFormLocation';

export default function BountyFormWizard({
  formData,
  handleInputChange,
  isSubmitting,
  uploadProgress,
  onHeaderChange,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [fieldError, setFieldError] = useState({ message: '', focusId: null });

  const steps = PLACE_BOUNTY_STEPS;
  const totalSteps = steps.length;
  const activeStepId = steps[currentStep - 1]?.id;
  const stepMeta = steps[currentStep - 1];
  const progress = (currentStep / totalSteps) * 100;

  const { hasLgasForState } = useBountyFormLocation(formData, handleInputChange);

  const validationContext = useMemo(
    () => ({ formData, hasLgasForState }),
    [formData, hasLgasForState]
  );

  const errorFor = (focusId) =>
    fieldError.focusId === focusId ? fieldError.message : '';

  const notifyHeader = useCallback(
    (step, dir) => {
      onHeaderChange?.({
        currentStep: step,
        direction: dir,
        stepMeta: steps[step - 1],
      });
    },
    [onHeaderChange, steps]
  );

  useEffect(() => {
    notifyHeader(currentStep, direction);
  }, [currentStep, direction, notifyHeader]);

  const runValidation = (stepId = activeStepId) => {
    const result = validatePlaceBountyStep(stepId, validationContext);
    if (!result.valid) {
      const message = [result.title, result.description].filter(Boolean).join(': ');
      setFieldError({ message, focusId: result.focusId ?? null });
      if (result.focusId) {
        setTimeout(() => document.getElementById(result.focusId)?.focus(), 100);
      }
      return false;
    }
    setFieldError({ message: '', focusId: null });
    return true;
  };

  const goToStep = (step, dir = step > currentStep ? 1 : -1) => {
    setDirection(dir);
    setCurrentStep(step);
    notifyHeader(step, dir);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = () => {
    if (!runValidation()) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1, 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1, -1);
  };

  const handleStepClick = (step) => {
    if (step < currentStep) goToStep(step, -1);
  };

  const submitLabel = 'Submit Bounty';

  const renderStepContent = () => {
    switch (activeStepId) {
      case 'case':
        return (
          <BountyCaseStep
            formData={formData}
            handleInputChange={handleInputChange}
            fieldErrors={{
              title: errorFor('bounty-title'),
              description: errorFor('bounty-description'),
              typeOfCrime: errorFor('bounty-crime-type'),
            }}
          />
        );
      case 'location':
        return (
          <BountyLocationStep
            formData={formData}
            handleInputChange={handleInputChange}
            fieldErrors={{
              state: errorFor('bounty-state'),
              lga: errorFor('bounty-lga'),
              dateOfIncident: errorFor('bounty-incident-date'),
            }}
          />
        );
      case 'evidence':
        return (
          <BountyEvidenceStep
            files={formData.evidenceFiles}
            onFilesChange={(files) => handleInputChange('evidenceFiles', files)}
            disabled={isSubmitting}
            uploadProgress={uploadProgress}
            fieldError={errorFor('bounty-file-upload')}
          />
        );
      case 'reward':
        return (
          <BountyRewardStep
            formData={formData}
            handleInputChange={handleInputChange}
            fieldError={errorFor('bounty-amount')}
          />
        );
      case 'finish':
        return (
          <div className="space-y-6">
            <BountyReviewSummary
              formData={formData}
              files={formData.evidenceFiles}
              onGoToStep={(s) => goToStep(s, -1)}
              steps={steps}
            />
            <BountyPasswordSection
              formData={formData}
              handleInputChange={handleInputChange}
              fieldErrors={{
                password: errorFor('bounty-password'),
                confirmPassword: errorFor('bounty-confirm-password'),
              }}
            />
            <FieldError message={errorFor('bounty-terms')} className="mb-2" />
            <div className="flex items-start gap-3">
              <Checkbox
                id="bounty-terms"
                checked={formData.agreeTerms}
                onCheckedChange={(c) => handleInputChange('agreeTerms', !!c)}
              />
              <label htmlFor="bounty-terms" className="text-sm leading-snug cursor-pointer">
                I have read and agree to the{' '}
                <Link href="/terms-of-service" className="text-primary underline">
                  Terms and Conditions
                </Link>
                .
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <FormStepIndicator
        steps={steps}
        currentStep={currentStep}
        totalSteps={totalSteps}
        progress={progress}
        onStepClick={handleStepClick}
      />

      <div className="submit-report-step-body box-border w-full max-w-full min-w-0 px-4 md:px-8 pt-4 md:pt-6 pb-28 md:pb-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStepId}
            custom={direction}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="submit-report-step-fields box-border w-full max-w-full min-w-0 space-y-4"
          >
            {fieldError.message && !fieldError.focusId ? (
              <FieldError message={fieldError.message} />
            ) : null}
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hidden md:flex items-center gap-3 px-4 md:px-8 pt-6 pb-6 border-t">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        <div className="flex-1" />
        {currentStep < totalSteps ? (
          <Button type="button" onClick={handleContinue} disabled={isSubmitting}>
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!formData.agreeTerms}
            onClick={(e) => {
              if (!runValidation('finish')) {
                e.preventDefault();
              }
            }}
          >
            {submitLabel}
          </Button>
        )}
      </div>

      <WizardMobileFooter
        formId="place-bounty-form"
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onContinue={handleContinue}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </>
  );
}
