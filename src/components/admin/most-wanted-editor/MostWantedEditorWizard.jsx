'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FieldError } from '@/components/ui/form-feedback';
import { Button } from '@/components/ui/button';
import FormStepIndicator from '@/components/submit-report/FormStepIndicator';
import { validateMostWantedStep } from '@/lib/mostWantedValidation';
import { MOST_WANTED_EDITOR_STEPS } from './mostWantedStepMeta';
import MostWantedReviewSummary from './MostWantedReviewSummary';
import CaseFactsStep from './steps/CaseFactsStep';
import IdentityStep from './steps/IdentityStep';
import PhysicalDescriptionStep from './steps/PhysicalDescriptionStep';
import NarrativeStep from './steps/NarrativeStep';
import MediaStep from './steps/MediaStep';
import { useMostWantedFormLocation } from './useMostWantedFormLocation';

export default function MostWantedEditorWizard({
  title,
  onTitleChange,
  details,
  onDetailsChange,
  featuredImageUrl,
  onFeaturedFileSelect,
  onFeaturedRemove,
  galleryPaths,
  onGalleryPathsChange,
  pendingGalleryFiles,
  onPendingGalleryFilesChange,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [fieldError, setFieldError] = useState({ message: '', focusId: null });

  const steps = MOST_WANTED_EDITOR_STEPS;
  const totalSteps = steps.length;
  const activeStepId = steps[currentStep - 1]?.id;
  const stepMeta = steps[currentStep - 1];
  const progress = (currentStep / totalSteps) * 100;
  const hasFeaturedImage = Boolean(featuredImageUrl);
  const { hasLgasForState } = useMostWantedFormLocation(details, onDetailsChange);

  const validationContext = useMemo(
    () => ({ details, title, hasFeaturedImage, hasLgasForState }),
    [details, title, hasFeaturedImage, hasLgasForState]
  );

  const errorFor = (focusId) =>
    fieldError.focusId === focusId ? fieldError.message : '';

  const runValidation = (stepId = activeStepId) => {
    const result = validateMostWantedStep(stepId, validationContext);
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

  const goToStep = useCallback((step, dir = step > currentStep ? 1 : -1) => {
    setDirection(dir);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const renderStepContent = () => {
    switch (activeStepId) {
      case 'case_facts':
        return (
          <CaseFactsStep
            details={details}
            onChange={onDetailsChange}
            fieldErrors={{
              crime_type: errorFor('mw-crime-type'),
              crime_state: errorFor('mw-crime-state'),
              crime_lga: errorFor('mw-crime-lga'),
              law_enforcement: errorFor('mw-law-enforcement'),
              law_enforcement_other: errorFor('mw-law-enforcement-other'),
            }}
          />
        );
      case 'identity':
        return (
          <IdentityStep
            title={title}
            details={details}
            onTitleChange={onTitleChange}
            onChange={onDetailsChange}
            fieldErrors={{
              title: errorFor('mw-title'),
              suspect_name: errorFor('mw-suspect-name'),
            }}
          />
        );
      case 'physical':
        return (
          <PhysicalDescriptionStep
            details={details}
            onChange={onDetailsChange}
            fieldErrors={{
              whereabouts: errorFor('mw-whereabouts'),
              sex: errorFor('mw-sex'),
            }}
          />
        );
      case 'narrative':
        return (
          <NarrativeStep
            details={details}
            onChange={onDetailsChange}
            fieldErrors={{
              full_details: errorFor('mw-full-details'),
            }}
          />
        );
      case 'media':
        return (
          <MediaStep
            featuredImageUrl={featuredImageUrl}
            onFeaturedFileSelect={onFeaturedFileSelect}
            onFeaturedRemove={onFeaturedRemove}
            galleryPaths={galleryPaths}
            onGalleryPathsChange={onGalleryPathsChange}
            pendingGalleryFiles={pendingGalleryFiles}
            onPendingGalleryFilesChange={onPendingGalleryFilesChange}
            fieldErrors={{ featured_image: errorFor('mw-featured-image') }}
          />
        );
      case 'review':
        return (
          <MostWantedReviewSummary
            title={title}
            details={details}
            hasFeaturedImage={hasFeaturedImage}
            onGoToStep={(s) => goToStep(s, -1)}
            steps={steps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <FormStepIndicator
        steps={steps}
        currentStep={currentStep}
        totalSteps={totalSteps}
        progress={progress}
        onStepClick={handleStepClick}
      />

      <div className="min-w-0 pb-24 md:pb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{stepMeta?.title}</h2>
          <p className="text-sm text-muted-foreground">{stepMeta?.subtitle}</p>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStepId}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        <FieldError message={fieldError.message} className="mt-4" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:px-0 md:py-0">
        {currentStep > 1 && (
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 md:flex-none">
            Back
          </Button>
        )}
        <div className="hidden flex-1 md:block" />
        {currentStep < totalSteps ? (
          <Button type="button" onClick={handleContinue} className="flex-1 md:flex-none">
            Continue
          </Button>
        ) : (
          <p className="flex-1 text-center text-sm text-muted-foreground md:text-right">
            Use Save in the sidebar to publish.
          </p>
        )}
      </div>
    </div>
  );
}
