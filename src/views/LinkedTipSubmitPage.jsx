'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FieldError } from '@/components/ui/form-feedback';
import { supabase } from '@/lib/customSupabaseClient';
import { generateUUID, hashPassword } from '@/lib/cryptoUtils';
import { sanitizeFilename } from '@/lib/utils';
import { uploadStorageFile } from '@/lib/supabaseStorageService';
import { validateAllSteps } from '@/lib/submitReportValidation';
import { buildCreateReportRpcParams } from '@/lib/submitReportRpc';
import { linkHunterReportToBounty } from '@/lib/bountyStatus';
import { linkSightingReportToMostWanted } from '@/lib/mostWantedStatus';
import { formatDateForInput } from '@/components/submit-report/reportFormUtils';
import { getSubmitReportSteps } from '@/components/submit-report/submitReportStepMeta';
import { useReportFormLocation } from '@/components/submit-report/useReportFormLocation';
import { buildMatchedOrganization } from '@/components/submit-report/steps/OrganizationStep';
import SubmitReportStepHero from '@/components/submit-report/SubmitReportStepHero';
import ReportFormWizard from '@/components/submit-report/ReportFormWizard';
import SuccessView from '@/components/submit-report/SuccessView';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';
import { notifyNewReport } from '@/lib/notify';

const initialFormData = {
  organization: null,
  category: '',
  title: '',
  description: '',
  stateOfIncident: '',
  lga: '',
  incidentAddress: '',
  dateOfIncident: null,
  timeSeen: '',
  mostWantedIdentifiers: [],
  mostWantedDirection: '',
  mostWantedObservedDetails: '',
  reporterType: 'anonymous',
  anonymousPassword: '',
  confirmPassword: '',
  agreeTerms: false,
};

export default function LinkedTipSubmitPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(initialFormData);
  const [submitError, setSubmitError] = useState('');
  const [files, setFiles] = useState([]);
  const [descriptionMode, setDescriptionMode] = useState('text');
  const [voiceNoteFile, setVoiceNoteFile] = useState([]);
  const [isOrganizationLocked, setIsOrganizationLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [successPassword, setSuccessPassword] = useState('');
  const [voiceSubmitProgress, setVoiceSubmitProgress] = useState(null);
  const [mostWantedContext, setMostWantedContext] = useState({ reportId: '', title: '', sex: '' });
  const [wizardHeader, setWizardHeader] = useState(() => ({
    currentStep: 1,
    direction: 1,
    stepMeta: getSubmitReportSteps({ isBountyMode: false, isMostWantedMode: false })[0],
  }));
  const submitIntentRef = useRef(false);

  const handleVoiceNoteAdd = useCallback((note) => {
    setVoiceNoteFile((current) => [...(Array.isArray(current) ? current : []), note]);
  }, []);

  const handleVoiceNoteClear = useCallback((noteId) => {
    setVoiceNoteFile((current) => {
      const notes = Array.isArray(current) ? current : current ? [current] : [];
      const removedNotes = noteId ? notes.filter((note) => note.id === noteId) : notes;

      removedNotes.forEach((note) => {
        if (note?.url) URL.revokeObjectURL(note.url);
      });

      return noteId ? notes.filter((note) => note.id !== noteId) : [];
    });
  }, []);

  const isFeedbackMode = searchParams.get('feedback') === 'true';
  const isBountyMode = searchParams.has('bounty_id');
  const isMostWantedMode =
    searchParams.get('category') === 'most_wanted' && searchParams.has('news_id');
  const isLinkedTipMode = isBountyMode || isMostWantedMode;
  const bountyIdFromUrl = searchParams.get('bounty_id');
  const newsIdFromUrl = searchParams.get('news_id');
  const orgIdFromUrl =
    searchParams.get('organization_id') ||
    searchParams.get('company_id');

  const wizardSteps = useMemo(
    () => getSubmitReportSteps({ isFeedbackMode, isBountyMode, isMostWantedMode }),
    [isFeedbackMode, isBountyMode, isMostWantedMode]
  );

  const [bountyTitle, setBountyTitle] = useState('');

  const handleSelectChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const { hasLgasForState } = useReportFormLocation(formData, handleSelectChange);

  useEffect(() => {
    document.body.classList.add('submit-report-flow');
    return () => document.body.classList.remove('submit-report-flow');
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      document.body.classList.remove('submit-report-flow');
    }
  }, [isSubmitted]);

  useEffect(() => {
    const bountyTitleParam = searchParams.get('bounty_title');
    const categoryParam = searchParams.get('category');

    if (!isBountyMode && !isMostWantedMode) {
      setMostWantedContext({ reportId: '', title: '', sex: '' });
      return;
    }

    if (bountyTitleParam) {
      setBountyTitle(bountyTitleParam);
    }

    const loadContext = async () => {
      let title = bountyTitleParam || '';
      let state = '';
      let location = '';
      let description = '';

      if (isMostWantedMode && newsIdFromUrl) {
        const { data } = await supabase
          .from('news')
          .select('title, most_wanted_details, content')
          .eq('id', newsIdFromUrl)
          .maybeSingle();

        if (data) {
          title = title || data.title || '';
          const details = data.most_wanted_details || {};
          setMostWantedContext({
            reportId: details.case_reference || '',
            title: data.title || '',
            sex: details.sex || '',
          });
          state = details.crime_state || '';
          location = '';
          description = '';
        }
      } else if (bountyIdFromUrl) {
        const { data } = await supabase
          .from('bounties')
          .select('title, state, location')
          .eq('id', bountyIdFromUrl)
          .maybeSingle();

        if (data) {
          title = title || data.title || '';
          state = data.state || '';
          location = data.location || '';
        }
      }

      setBountyTitle(title);
      setFormData((prev) => ({
        ...prev,
        title,
        category:
          categoryParam === 'most_wanted' || isMostWantedMode ? 'Most Wanted' : 'Bounty',
        description: isMostWantedMode ? '' : description || prev.description,
        stateOfIncident: state || prev.stateOfIncident,
        incidentAddress: isMostWantedMode ? '' : location || prev.incidentAddress,
      }));
      setDescriptionMode('text');
    };

    loadContext();
  }, [searchParams, isBountyMode, isMostWantedMode, bountyIdFromUrl, newsIdFromUrl]);

  useEffect(() => {
    if (!isFeedbackMode) return;
    const autoPwd = Math.random().toString(36).slice(-12);
    setFormData((prev) => ({
      ...prev,
      anonymousPassword: autoPwd,
      confirmPassword: autoPwd,
    }));
  }, [isFeedbackMode]);

  useEffect(() => {
    if (!orgIdFromUrl || isLinkedTipMode) return;
    const loadOrg = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', orgIdFromUrl)
        .single();
      if (error || !data) {
        setSubmitError('The organization link is not valid.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        organization: buildMatchedOrganization(data.id, data.name),
      }));
      setIsOrganizationLocked(true);
    };
    loadOrg();
  }, [orgIdFromUrl, isLinkedTipMode]);

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

  const buildMostWantedDescription = useCallback(() => {
    const lines = [
      formData.description?.trim(),
      '',
      '--- Most Wanted Sighting Details ---',
      `Alert: ${bountyTitle || formData.title || 'Most Wanted tip'}`,
      newsIdFromUrl ? `Alert ID: ${newsIdFromUrl}` : '',
      mostWantedContext.reportId ? `Report ID: ${mostWantedContext.reportId}` : '',
      formData.timeSeen ? `Time seen: ${formData.timeSeen}` : '',
      Array.isArray(formData.mostWantedIdentifiers) && formData.mostWantedIdentifiers.length
        ? `Matched identifiers: ${formData.mostWantedIdentifiers.join(', ')}`
        : '',
      formData.mostWantedDirection ? `Direction/movement: ${formData.mostWantedDirection}` : '',
      formData.mostWantedObservedDetails ? `Observed details: ${formData.mostWantedObservedDetails}` : '',
    ].filter((line) => line !== null && line !== undefined);

    return lines.join('\n').trim();
  }, [formData, bountyTitle, mostWantedContext.reportId]);

  const generateReportId = () =>
    'WB' + String(Math.floor(Math.random() * 10000000)).padStart(7, '0');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submitIntentRef.current || wizardHeader.currentStep < wizardSteps.length) {
      submitIntentRef.current = false;
      return;
    }
    submitIntentRef.current = false;

    setSubmitError('');
    const validation = validateAllSteps(validationContext, wizardSteps);
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
    setVoiceSubmitProgress(null);

    try {
      const newReportId = generateReportId();
      let passwordHash = null;
      let passwordSalt = null;
      const plainPassword = isFeedbackMode ? null : formData.anonymousPassword;

      if (!isFeedbackMode && plainPassword) {
        const { hash, salt } = await hashPassword(plainPassword);
        passwordHash = hash;
        passwordSalt = salt;
      }

      let evidencePaths = [];
      const reportUUIDForPath = generateUUID();

      const voiceNotes = Array.isArray(voiceNoteFile)
        ? voiceNoteFile.filter((note) => note?.blob)
        : voiceNoteFile?.blob
          ? [voiceNoteFile]
          : [];

      if (descriptionMode === 'voice' && voiceNotes.length > 0) {
        setVoiceSubmitProgress(10);
        const uploadedVoicePaths = [];

        for (let index = 0; index < voiceNotes.length; index += 1) {
          const note = voiceNotes[index];
          const ext = note.audioFormat || 'wav';
          const sanitizedName = sanitizeFilename(
            note.fileName || `voice-report-${index + 1}.${ext}`
          );
          const voicePath = `reports/${reportUUIDForPath}/${Date.now()}-${index + 1}-${sanitizedName}`;
          const { error: voiceError } = await supabase.storage
            .from('wb_evio')
            .upload(voicePath, note.blob, {
              contentType: `audio/${ext}`,
            });
          if (voiceError) throw voiceError;
          uploadedVoicePaths.push(voicePath);
          setVoiceSubmitProgress(Math.round(((index + 1) / voiceNotes.length) * 90));
        }

        evidencePaths.push(...uploadedVoicePaths);
        setVoiceSubmitProgress(100);
      }

      if (files.length > 0) {
        const reportFolder = `reports/${reportUUIDForPath}`;
        const uploads = await Promise.all(
          files.map((file) => uploadStorageFile(file, reportFolder, reportUUIDForPath))
        );
        evidencePaths = [...evidencePaths, ...uploads];
      }

      const incidentDate = formData.dateOfIncident
        ? formatDateForInput(formData.dateOfIncident)
        : null;

      const org = formData.organization;
      const isUnmatchedOrg = org?.isUnmatched === true;

      const rpcParams = buildCreateReportRpcParams({
        reportId: newReportId,
        organizationId: isLinkedTipMode
          ? null
          : isUnmatchedOrg
            ? null
            : org?.value ?? null,
        organizationName: isLinkedTipMode
          ? null
          : isUnmatchedOrg
            ? org?.label ?? null
            : null,
        title:
          descriptionMode === 'voice'
            ? 'Voice Note Report'
            : formData.title ||
              (isMostWantedMode ? 'Most Wanted Tip' : isBountyMode ? 'Bounty Tip' : 'Report'),
        description:
          descriptionMode === 'voice'
            ? 'This report was submitted via an anonymized voice note.'
            : isMostWantedMode
              ? buildMostWantedDescription()
              : formData.description,
        category:
          formData.category ||
          (isMostWantedMode ? 'Most Wanted' : isBountyMode ? 'Bounty' : ''),
        state: formData.stateOfIncident,
        lga: formData.lga,
        incidentAddress: formData.incidentAddress || null,
        incidentDate: incidentDate || null,
        isAnonymous: formData.reporterType !== 'reward',
        passwordHash,
        passwordSalt,
        evidencePaths,
        reportType: descriptionMode === 'voice' ? 'voice' : 'text',
        isVoiceNote: descriptionMode === 'voice',
        isFeedback: isFeedbackMode,
      });

      const { data: createdReportId, error: rpcError } = await supabase.rpc(
        'create_report_with_evidence',
        rpcParams
      );

      if (rpcError) throw rpcError;

      if (isBountyMode) {
        const bountyId = searchParams.get('bounty_id');
        if (bountyId) {
          try {
            await linkHunterReportToBounty(supabase, bountyId, {
              reportRowId: createdReportId,
              publicReportId: newReportId,
            });
          } catch (bountyLinkError) {
            console.error('Bounty link failed:', bountyLinkError);
          }
        }
      }

      if (isMostWantedMode && newsIdFromUrl) {
        try {
          await linkSightingReportToMostWanted(supabase, newsIdFromUrl, {
            reportRowId: createdReportId,
            publicReportId: newReportId,
          });
        } catch (mostWantedLinkError) {
          console.error('Most Wanted link failed:', mostWantedLinkError);
        }
      }

      setReportId(newReportId);
      setSuccessPassword(plainPassword || '');
      setIsSubmitted(true);
      notifyNewReport(newReportId);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
      setVoiceSubmitProgress(null);
    }
  };

  if (isSubmitted) {
    return (
      <SuccessView
        reportId={reportId}
        password={successPassword || null}
        isFeedbackMode={isFeedbackMode}
        isBountyMode={isLinkedTipMode}
      />
    );
  }

  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.submitReport,
    url: '/submit-report',
    type: 'website',
  });

  return (
    <>
      <SEOHead {...seoMeta} />
      <div className="submit-report-page flex-1 flex flex-col min-h-0 py-20 bg-muted/30 max-md:pb-0">
        <div className="submit-report-shell flex-1 flex flex-col min-h-0 max-w-[var(--submit-report-card-width,56rem)] mx-auto px-[var(--submit-report-gutter,1rem)] w-full">
          <SubmitReportStepHero
            stepMeta={wizardHeader.stepMeta}
            direction={wizardHeader.direction}
          />
          <motion.form
            id="submit-report-form"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || e.defaultPrevented) return;
              if (e.target instanceof HTMLTextAreaElement) return;
              if (wizardHeader.currentStep < wizardSteps.length) {
                e.preventDefault();
              }
            }}
            className="submit-report-card glass-effect border rounded-xl overflow-hidden w-full max-w-full min-w-0"
          >
            <FieldError message={submitError} className="mx-4 md:mx-8 mt-4" />
            <ReportFormWizard
              formData={formData}
              handleSelectChange={handleSelectChange}
              onOrganizationChange={(org) => handleSelectChange('organization', org)}
              isOrganizationLocked={isOrganizationLocked}
              descriptionMode={descriptionMode}
              onDescriptionModeChange={setDescriptionMode}
              voiceNoteFile={voiceNoteFile}
              onVoiceNoteComplete={handleVoiceNoteAdd}
              onVoiceNoteClear={handleVoiceNoteClear}
              files={files}
              onFilesChange={setFiles}
              isFeedbackMode={isFeedbackMode}
              isBountyMode={isBountyMode}
              isMostWantedMode={isMostWantedMode}
              bountyTitle={bountyTitle}
              mostWantedContext={mostWantedContext}
              isSubmitting={isSubmitting}
              voiceSubmitProgress={voiceSubmitProgress}
              onHeaderChange={setWizardHeader}
              onStepChange={() => setSubmitError('')}
              onSubmitIntent={() => {
                submitIntentRef.current = true;
              }}
              hasLgasForState={hasLgasForState}
            />
          </motion.form>
        </div>
      </div>
    </>
  );
}
