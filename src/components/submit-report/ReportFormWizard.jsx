'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { validateStep } from '@/lib/submitReportValidation';
import { getSubmitReportSteps } from './submitReportStepMeta';
import FormStepIndicator from './FormStepIndicator';
import FormReviewSummary from './FormReviewSummary';
import ContactInfo from './ContactInfo';
import WizardMobileFooter from './WizardMobileFooter';
import OrganizationStep from './steps/OrganizationStep';
import ContextStep from './steps/ContextStep';
import StoryStep from './steps/StoryStep';
import EvidenceStep from './steps/EvidenceStep';

export default function ReportFormWizard({
  formData,
  handleSelectChange,
  onOrganizationChange,
  isOrganizationLocked,
  descriptionMode,
  onDescriptionModeChange,
  voiceNoteFile,
  onVoiceNoteComplete,
  onVoiceNoteClear,
  files,
  onFilesChange,
  isFeedbackMode,
  isBountyMode,
  isSubmitting,
  voiceSubmitProgress,
  onHeaderChange,
  hasLgasForState,
}) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const steps = useMemo(
    () => getSubmitReportSteps({ isFeedbackMode, isBountyMode }),
    [isFeedbackMode, isBountyMode]
  );
  const totalSteps = steps.length;
  const stepMeta = steps[currentStep - 1];
  const progress = (currentStep / totalSteps) * 100;

  const validationContext = useMemo(
    () => ({
      formData,
      descriptionMode,
      voiceNoteFile,
      isFeedbackMode,
      isBountyMode,
      hasLgasForState,
    }),
    [formData, descriptionMode, voiceNoteFile, isFeedbackMode, isBountyMode, hasLgasForState]
  );

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

  const runValidation = (step) => {
    const result = validateStep(step, validationContext);
    if (!result.valid) {
      toast({
        title: result.title,
        description: result.description,
        variant: 'destructive',
      });
      if (result.focusId) {
        setTimeout(() => document.getElementById(result.focusId)?.focus(), 100);
      }
      return false;
    }
    return true;
  };

  const goToStep = (step, dir = step > currentStep ? 1 : -1) => {
    setDirection(dir);
    setCurrentStep(step);
    notifyHeader(step, dir);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = () => {
    if (!runValidation(currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1, 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1, -1);
  };

  const handleStepClick = (step) => {
    if (step < currentStep) goToStep(step, -1);
  };

  const handleSkipEvidence = () => {
    if (currentStep === 4) goToStep(5, 1);
  };

  const submitLabel = isSubmitting
    ? voiceSubmitProgress != null
      ? `Changing Your Voice & Submitting... ${voiceSubmitProgress}%`
      : 'Submitting...'
    : isFeedbackMode
      ? 'Submit Feedback'
      : isBountyMode
        ? 'Submit Tip'
        : 'Submit Report';

  const hasOrganization = !!formData.organization?.value;

  return (
    <>
      <FormStepIndicator
        steps={steps}
        currentStep={currentStep}
        totalSteps={totalSteps}
        progress={progress}
        onStepClick={handleStepClick}
      />

      <div className="submit-report-step-body overflow-visible px-4 md:px-8 pt-4 md:pt-6 pb-28 md:pb-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 overflow-visible"
          >
            {currentStep === 1 && (
              <OrganizationStep
                formData={formData}
                onOrganizationChange={onOrganizationChange}
                isOrganizationLocked={isOrganizationLocked}
              />
            )}
            {currentStep === 2 && (
              <ContextStep
                formData={formData}
                handleSelectChange={handleSelectChange}
                isFeedbackMode={isFeedbackMode}
                isBountyMode={isBountyMode}
              />
            )}
            {currentStep === 3 && (
              <StoryStep
                formData={formData}
                handleSelectChange={handleSelectChange}
                descriptionMode={descriptionMode}
                onDescriptionModeChange={onDescriptionModeChange}
                voiceNoteFile={voiceNoteFile}
                onVoiceNoteComplete={onVoiceNoteComplete}
                onVoiceNoteClear={onVoiceNoteClear}
                hasOrganization={hasOrganization}
                isBountyMode={isBountyMode}
              />
            )}
            {currentStep === 4 && (
              <EvidenceStep
                files={files}
                onFilesChange={onFilesChange}
                hasOrganization={hasOrganization}
                disabled={isSubmitting}
              />
            )}
            {currentStep === 5 && (
              <div className="space-y-6">
                <FormReviewSummary
                  formData={formData}
                  descriptionMode={descriptionMode}
                  files={files}
                  onGoToStep={(s) => goToStep(s, -1)}
                  isFeedbackMode={isFeedbackMode}
                />
                {!isFeedbackMode && (
                  <ContactInfo
                    formData={formData}
                    onInputChange={handleSelectChange}
                    embedded
                  />
                )}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(c) => handleSelectChange('agreeTerms', !!c)}
                  />
                  <label htmlFor="agreeTerms" className="text-sm leading-snug cursor-pointer">
                    I have read and agree to the{' '}
                    <Link href="/terms-of-service" className="text-primary underline">
                      Terms and Conditions
                    </Link>
                    .
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop footer */}
      <div className="hidden md:flex items-center gap-3 px-4 md:px-8 pt-6 pb-6 border-t">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        {currentStep === 4 && (
          <Button type="button" variant="ghost" onClick={handleSkipEvidence} disabled={isSubmitting}>
            Skip for now
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
            disabled={isSubmitting || !formData.agreeTerms}
            onClick={(e) => {
              if (!runValidation(5)) {
                e.preventDefault();
              }
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        )}
      </div>

      <WizardMobileFooter
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onContinue={handleContinue}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        showSkip={currentStep === 4}
        onSkip={handleSkipEvidence}
      />
    </>
  );
}
