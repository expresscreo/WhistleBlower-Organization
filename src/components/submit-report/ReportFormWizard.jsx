'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/form-feedback';
import { validateStepById } from '@/lib/submitReportValidation';
import { getSubmitReportSteps, enrichStepMeta } from './submitReportStepMeta';
import FormStepIndicator from './FormStepIndicator';
import FormReviewSummary from './FormReviewSummary';
import ContactInfo from './ContactInfo';
import WizardMobileFooter from './WizardMobileFooter';
import OrganizationStep from './steps/OrganizationStep';
import ContextStep from './steps/ContextStep';
import StoryStep from './steps/StoryStep';
import EvidenceStep from './steps/EvidenceStep';
import MostWantedMatchStep from './steps/MostWantedMatchStep';

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
  isMostWantedMode,
  bountyTitle,
  mostWantedContext,
  isSubmitting,
  onHeaderChange,
  onStepChange,
  onSubmitIntent,
  hasLgasForState,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [fieldError, setFieldError] = useState({ message: '', focusId: null });

  const errorFor = (focusId) =>
    fieldError.focusId === focusId ? fieldError.message : '';

  const steps = useMemo(
    () => getSubmitReportSteps({ isFeedbackMode, isBountyMode, isMostWantedMode }),
    [isFeedbackMode, isBountyMode, isMostWantedMode]
  );
  const totalSteps = steps.length;
  const activeStepId = steps[currentStep - 1]?.id;
  const stepMeta = steps[currentStep - 1];
  const progress = (currentStep / totalSteps) * 100;

  const validationContext = useMemo(
    () => ({
      formData,
      descriptionMode,
      voiceNoteFile,
      isFeedbackMode,
      isBountyMode,
      isMostWantedMode,
      hasLgasForState,
    }),
    [formData, descriptionMode, voiceNoteFile, isFeedbackMode, isBountyMode, isMostWantedMode, hasLgasForState]
  );

  const notifyHeader = useCallback(
    (step, dir) => {
      const baseMeta = steps[step - 1];
      onHeaderChange?.({
        currentStep: step,
        direction: dir,
        stepMeta: enrichStepMeta(baseMeta, { isBountyMode, isMostWantedMode, bountyTitle }),
      });
    },
    [onHeaderChange, steps, isBountyMode, isMostWantedMode, bountyTitle]
  );

  useEffect(() => {
    notifyHeader(currentStep, direction);
  }, [currentStep, direction, notifyHeader]);

  const runValidation = (stepId = activeStepId) => {
    const result = validateStepById(stepId, validationContext);
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
    setFieldError({ message: '', focusId: null });
    setDirection(dir);
    setCurrentStep(step);
    notifyHeader(step, dir);
    onStepChange?.(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinue = () => {
    const stepId = steps[currentStep - 1]?.id;
    if (!stepId || stepId === 'finish') return;
    if (!runValidation(stepId)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1, 1);
  };

  const handleBack = () => {
    if (currentStep > 1) goToStep(currentStep - 1, -1);
  };

  const handleStepClick = (step) => {
    if (step < currentStep) goToStep(step, -1);
  };

  const handleSkipEvidence = () => {
    if (activeStepId === 'evidence') goToStep(currentStep + 1, 1);
  };

  const submitLabel = isFeedbackMode
    ? 'Submit Feedback'
    : isMostWantedMode
      ? 'Submit Most Wanted Tip'
    : isBountyMode
      ? 'Submit Tip'
      : 'Submit Report';

  const canUploadEvidence = isBountyMode || isMostWantedMode || !!formData.organization?.label?.trim();

  const renderStepContent = () => {
    switch (activeStepId) {
      case 'organization':
        return (
          <OrganizationStep
            formData={formData}
            onOrganizationChange={onOrganizationChange}
            isOrganizationLocked={isOrganizationLocked}
            fieldError={errorFor('companyName')}
          />
        );
      case 'context':
        return (
          <ContextStep
            formData={formData}
            handleSelectChange={handleSelectChange}
            isFeedbackMode={isFeedbackMode}
            isBountyMode={isBountyMode}
            isMostWantedMode={isMostWantedMode}
            mostWantedContext={mostWantedContext}
            fieldErrors={{
              category: errorFor('category'),
              stateOfIncident: errorFor('stateOfIncident'),
              lga: errorFor('lga'),
              dateOfIncident: errorFor('dateOfIncident'),
              timeSeen: errorFor('timeSeen'),
            }}
          />
        );
      case 'match':
        return (
          <MostWantedMatchStep
            formData={formData}
            handleSelectChange={handleSelectChange}
            fieldErrors={{
              identifiers: errorFor('mostWantedIdentifiers'),
            }}
          />
        );
      case 'story':
        return (
          <StoryStep
            formData={formData}
            handleSelectChange={handleSelectChange}
            descriptionMode={descriptionMode}
            onDescriptionModeChange={onDescriptionModeChange}
            voiceNoteFile={voiceNoteFile}
            onVoiceNoteComplete={onVoiceNoteComplete}
            onVoiceNoteClear={onVoiceNoteClear}
            hasOrganization={canUploadEvidence}
            isBountyMode={isBountyMode}
            isMostWantedMode={isMostWantedMode}
            fieldErrors={{
              voice: errorFor('voice-recorder'),
              title: errorFor('reportTitle'),
              description: errorFor('reportDescription'),
            }}
          />
        );
      case 'evidence':
        return (
          <EvidenceStep
            files={files}
            onFilesChange={onFilesChange}
            hasOrganization={canUploadEvidence}
            disabled={isSubmitting}
            isBountyMode={isBountyMode}
          />
        );
      case 'finish':
        return (
          <div className="space-y-6">
            <FormReviewSummary
              formData={formData}
              descriptionMode={descriptionMode}
              files={files}
              onGoToStep={(s) => goToStep(s, -1)}
              isFeedbackMode={isFeedbackMode}
              isBountyMode={isBountyMode}
              isMostWantedMode={isMostWantedMode}
              steps={steps}
              bountyTitle={bountyTitle}
            />
            {!isFeedbackMode && (
              <ContactInfo
                formData={formData}
                onInputChange={handleSelectChange}
                embedded
                isBountyMode={isBountyMode || isMostWantedMode}
                fieldErrors={{
                  anonymousPassword: errorFor('anonymousPassword'),
                  confirmPassword: errorFor('confirmPassword'),
                }}
              />
            )}
            <FieldError message={errorFor('agreeTerms')} className="mb-2" />
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
        {activeStepId === 'evidence' && (
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
            loading={isSubmitting}
            disabled={!formData.agreeTerms}
            onClick={(e) => {
              if (!runValidation('finish')) {
                e.preventDefault();
                return;
              }
              onSubmitIntent?.();
            }}
          >
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
        showSkip={activeStepId === 'evidence'}
        onSkip={handleSkipEvidence}
        onSubmitIntent={onSubmitIntent}
      />
    </>
  );
}
