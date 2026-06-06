'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FieldError } from '@/components/ui/form-feedback';
import { hashPassword } from '@/lib/cryptoUtils';
import { createTrackedBounty } from '@/lib/trackApi';
import SubmissionSuccess from './submit-report/SubmissionSuccess';
import { uploadFileToLocal } from '@/lib/fileUtils';
import { formatDateForInput } from '@/components/submit-report/reportFormUtils';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import SubmitReportStepHero from '@/components/submit-report/SubmitReportStepHero';
import BountyFormWizard from '@/components/place-bounty/BountyFormWizard';
import { PLACE_BOUNTY_STEPS } from '@/components/place-bounty/placeBountyStepMeta';
import { validateAllPlaceBountySteps } from '@/lib/placeBountyValidation';
import { useBountyFormLocation } from '@/components/place-bounty/useBountyFormLocation';

const initialFormData = {
  title: '',
  description: '',
  typeOfCrime: '',
  state: '',
  fullAddress: '',
  lga: '',
  dateOfIncident: null,
  bountyAmount: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  evidenceFiles: [],
};

const PlaceBountyPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState({ id: '', password: '', type: 'bounty' });
  const [uploadProgress, setUploadProgress] = useState({});
  const [wizardHeader, setWizardHeader] = useState(() => ({
    currentStep: 1,
    direction: 1,
    stepMeta: PLACE_BOUNTY_STEPS[0],
  }));

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const { hasLgasForState } = useBountyFormLocation(formData, handleInputChange);

  const validationContext = useMemo(
    () => ({ formData, hasLgasForState }),
    [formData, hasLgasForState]
  );

  useEffect(() => {
    document.body.classList.add('submit-report-flow');
    return () => document.body.classList.remove('submit-report-flow');
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      document.body.classList.remove('submit-report-flow');
    }
  }, [isSubmitted]);

  const generateBountyId = () =>
    `WBB${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

  const handleBountySubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const validation = validateAllPlaceBountySteps(validationContext, PLACE_BOUNTY_STEPS);
    if (!validation.valid) {
      setSubmitError(
        [validation.title, validation.description].filter(Boolean).join(': ')
      );
      if (validation.focusId) {
        document.getElementById(validation.focusId)?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({});

    try {
      const bountyId = generateBountyId();
      const { hash: passwordHash, salt } = await hashPassword(formData.password);

      let evidencePaths = [];
      if (formData.evidenceFiles.length > 0) {
        const uploadPromises = formData.evidenceFiles.map(async (file, index) => {
          setUploadProgress((prev) => ({ ...prev, [index]: 50 }));
          const filePath = await uploadFileToLocal(file, 'bounties', 'delito');
          setUploadProgress((prev) => ({ ...prev, [index]: 100 }));
          return filePath;
        });
        evidencePaths = await Promise.all(uploadPromises);
      }

      const { bountyId: createdBountyId } = await createTrackedBounty({
        bountyId,
        title: formData.title,
        description: formData.description,
        typeOfCrime: formData.typeOfCrime,
        state: formData.state,
        location: formData.lga,
        fullAddress: formData.fullAddress || null,
        incidentDate: formData.dateOfIncident
          ? formatDateForInput(formData.dateOfIncident)
          : null,
        bountyAmount: formData.bountyAmount.replace(/,/g, '') || null,
        passwordHash: `${passwordHash}:${salt}`,
        evidencePaths,
      });

      setSubmissionData({ id: createdBountyId, password: formData.password, type: 'bounty' });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'Bounty submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <SubmissionSuccess
        id={submissionData.id}
        password={submissionData.password}
        type={submissionData.type}
      />
    );
  }

  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.placeBounty,
    url: '/place-bounty',
    type: 'website',
  });

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Place a Public Bounty - WhistleBlower.ng',
      description:
        'Place public bounties for specific information or missing persons. Reward citizens for providing valuable intelligence.',
      mainEntity: {
        '@type': 'Service',
        name: 'Public Bounty Placement',
        description: 'Secure platform for placing public bounties and rewarding information',
      },
    },
  ];

  return (
    <>
      <SEOHead {...seoMeta} structuredData={structuredData} />
      <div className="submit-report-page flex-1 flex flex-col min-h-0 py-20 bg-muted/30 max-md:pb-0">
        <div className="submit-report-shell flex-1 flex flex-col min-h-0 max-w-[var(--submit-report-card-width,56rem)] mx-auto px-[var(--submit-report-gutter,1rem)] w-full">
          <SubmitReportStepHero
            stepMeta={wizardHeader.stepMeta}
            direction={wizardHeader.direction}
          />
          <motion.form
            id="place-bounty-form"
            onSubmit={handleBountySubmit}
            className="submit-report-card glass-effect border rounded-xl overflow-hidden w-full max-w-full min-w-0"
          >
            <FieldError message={submitError} className="mx-4 md:mx-8 mt-4" />
            <BountyFormWizard
              formData={formData}
              handleInputChange={handleInputChange}
              isSubmitting={isSubmitting}
              uploadProgress={uploadProgress}
              onHeaderChange={setWizardHeader}
            />
          </motion.form>
        </div>
      </div>
    </>
  );
};

export default PlaceBountyPage;
