'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { hashPassword } from '@/lib/cryptoUtils';
import { sanitizeFilename } from '@/lib/utils';
import { validateAllSteps } from '@/lib/submitReportValidation';
import { formatDateForInput } from '@/components/submit-report/reportFormUtils';
import { getSubmitReportSteps } from '@/components/submit-report/submitReportStepMeta';
import { useReportFormLocation } from '@/components/submit-report/useReportFormLocation';
import SubmitReportStepHero from '@/components/submit-report/SubmitReportStepHero';
import ReportFormWizard from '@/components/submit-report/ReportFormWizard';
import SuccessView from '@/components/submit-report/SuccessView';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const initialFormData = {
  organization: null,
  category: '',
  title: '',
  description: '',
  stateOfIncident: '',
  lga: '',
  incidentAddress: '',
  dateOfIncident: null,
  reporterType: 'anonymous',
  anonymousPassword: '',
  confirmPassword: '',
  agreeTerms: false,
};

export default function SubmitReportPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState([]);
  const [descriptionMode, setDescriptionMode] = useState('text');
  const [voiceNoteFile, setVoiceNoteFile] = useState(null);
  const [isOrganizationLocked, setIsOrganizationLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [successPassword, setSuccessPassword] = useState('');
  const [voiceSubmitProgress, setVoiceSubmitProgress] = useState(null);
  const [wizardHeader, setWizardHeader] = useState({
    currentStep: 1,
    direction: 1,
    stepMeta: getSubmitReportSteps()[0],
  });

  const isFeedbackMode = searchParams.get('feedback') === 'true';
  const isBountyMode = searchParams.has('bounty_id');
  const orgIdFromUrl =
    searchParams.get('organization_id') ||
    searchParams.get('company_id');

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
    const bountyTitle = searchParams.get('bounty_title');
    const categoryParam = searchParams.get('category');
    if (isBountyMode) {
      setFormData((prev) => ({
        ...prev,
        title: bountyTitle || prev.title,
        category: categoryParam === 'most_wanted' ? 'Most Wanted' : 'Bounty',
      }));
      setDescriptionMode('text');
    }
    if (isFeedbackMode) {
      const autoPwd = Math.random().toString(36).slice(-12);
      setFormData((prev) => ({
        ...prev,
        anonymousPassword: autoPwd,
        confirmPassword: autoPwd,
      }));
    }
  }, [searchParams, isBountyMode, isFeedbackMode]);

  useEffect(() => {
    if (!orgIdFromUrl) return;
    const loadOrg = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', orgIdFromUrl)
        .single();
      if (error || !data) {
        toast({
          title: 'Invalid organization',
          description: 'The organization link is not valid.',
          variant: 'destructive',
        });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        organization: { value: data.id, label: data.name },
      }));
      setIsOrganizationLocked(true);
    };
    loadOrg();
  }, [orgIdFromUrl, toast]);

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

  const generateReportId = () =>
    'WB' + String(Math.floor(Math.random() * 10000000)).padStart(7, '0');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateAllSteps(validationContext);
    if (!validation.valid) {
      toast({
        title: validation.title,
        description: validation.description,
        variant: 'destructive',
      });
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
      const reportUUIDForPath = crypto.randomUUID();

      if (descriptionMode === 'voice' && voiceNoteFile?.blob) {
        setVoiceSubmitProgress(10);
        const ext = voiceNoteFile.audioFormat || 'webm';
        const sanitizedName = sanitizeFilename(
          voiceNoteFile.fileName || `voice-report.${ext}`
        );
        const voicePath = `reports/${reportUUIDForPath}/${Date.now()}-${sanitizedName}`;
        const { error: voiceError } = await supabase.storage
          .from('wb_evio')
          .upload(voicePath, voiceNoteFile.blob, {
            contentType: `audio/${ext}`,
          });
        setVoiceSubmitProgress(90);
        if (voiceError) throw voiceError;
        evidencePaths.push(voicePath);
        setVoiceSubmitProgress(100);
      }

      if (files.length > 0) {
        const uploads = await Promise.all(
          files.map(async (file) => {
            const sanitizedName = sanitizeFilename(file.name);
            const filePath = `reports/${reportUUIDForPath}/${Date.now()}-${sanitizedName}`;
            const { error } = await supabase.storage
              .from('wb_evio')
              .upload(filePath, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            return filePath;
          })
        );
        evidencePaths = [...evidencePaths, ...uploads];
      }

      const incidentDate = formData.dateOfIncident
        ? formatDateForInput(formData.dateOfIncident)
        : null;

      const { error: rpcError } = await supabase.rpc('create_report_with_evidence', {
        report_id_param: newReportId,
        organization_id_param: formData.organization?.value ?? null,
        organization_name_param: formData.organization?.value
          ? null
          : formData.organization?.label,
        title_param:
          descriptionMode === 'voice'
            ? 'Voice Note Report'
            : formData.title || 'Report',
        description_param:
          descriptionMode === 'voice'
            ? 'This report was submitted via an anonymized voice note.'
            : formData.description,
        category_param: formData.category,
        state_param: formData.stateOfIncident,
        lga_param: formData.lga,
        incident_address_param: formData.incidentAddress || null,
        incident_date_param: incidentDate || null,
        is_anonymous_param: formData.reporterType !== 'reward',
        anonymous_password_hash_param: passwordHash,
        anonymous_password_salt_param: passwordSalt,
        evidence_paths_param: evidencePaths.length > 0 ? evidencePaths : null,
        report_type_param: descriptionMode === 'voice' ? 'voice' : 'text',
        is_voice_note_param: descriptionMode === 'voice',
        is_feedback_param: isFeedbackMode,
      });

      if (rpcError) throw rpcError;

      if (isBountyMode) {
        const bountyId = searchParams.get('bounty_id');
        if (bountyId) {
          await supabase
            .from('bounty_reports')
            .insert({ bounty_id: Number(bountyId), report_id: newReportId })
            .then(({ error }) => {
              if (error) console.error('Bounty link failed:', error);
            });
        }
      }

      setReportId(newReportId);
      setSuccessPassword(plainPassword || '');
      setIsSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
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
      <div className="submit-report-page py-20 bg-muted/30 max-md:flex-1 max-md:flex max-md:flex-col max-md:min-h-0 max-md:pb-0">
        <div className="submit-report-shell max-w-[var(--submit-report-card-width,56rem)] mx-auto px-[var(--submit-report-gutter,1rem)] max-md:flex-1 max-md:flex max-md:flex-col max-md:min-h-0 w-full">
          <SubmitReportStepHero
            stepMeta={wizardHeader.stepMeta}
            direction={wizardHeader.direction}
          />
          <motion.form
            id="submit-report-form"
            onSubmit={handleSubmit}
            className="submit-report-card glass-effect border rounded-xl overflow-hidden"
          >
            <ReportFormWizard
              formData={formData}
              handleSelectChange={handleSelectChange}
              onOrganizationChange={(org) => handleSelectChange('organization', org)}
              isOrganizationLocked={isOrganizationLocked}
              descriptionMode={descriptionMode}
              onDescriptionModeChange={setDescriptionMode}
              voiceNoteFile={voiceNoteFile}
              onVoiceNoteComplete={setVoiceNoteFile}
              onVoiceNoteClear={() => setVoiceNoteFile(null)}
              files={files}
              onFilesChange={setFiles}
              isFeedbackMode={isFeedbackMode}
              isBountyMode={isBountyMode}
              isSubmitting={isSubmitting}
              voiceSubmitProgress={voiceSubmitProgress}
              onHeaderChange={setWizardHeader}
              hasLgasForState={hasLgasForState}
            />
          </motion.form>
        </div>
      </div>
    </>
  );
}
