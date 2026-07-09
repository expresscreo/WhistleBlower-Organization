'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  MapPin,
  Mic,
  Paperclip,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldError } from '@/components/ui/form-feedback';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import EvidenceUpload from '@/components/submit-report/EvidenceUpload';
import ContactInfo from '@/components/submit-report/ContactInfo';
import MobileIncidentDateField from '@/components/submit-report/MobileIncidentDateField';
import VoiceRecordingWidget from '@/components/submit-report/VoiceRecordingWidget';
import SubmitReportReviewSummary from '@/components/submit-report/SubmitReportReviewSummary';
import {
  PUBLIC_REPORT_CATEGORIES,
  formatDateForInput,
} from '@/components/submit-report/reportFormUtils';
import nigerianStatesAndLgas from '@/data/nigerianStatesAndLgas.json';
import { generateUUID, hashPassword } from '@/lib/cryptoUtils';
import {
  fieldLabelClasses,
  v2ControlClasses,
  v2DateInputClasses,
  v2TextareaClasses,
} from '@/lib/fieldStyles';
import { notifyNewReport } from '@/lib/notify';
import { supabase } from '@/lib/customSupabaseClient';
import { buildCreateReportRpcParams } from '@/lib/submitReportRpc';
import { uploadStorageFile } from '@/lib/supabaseStorageService';
import { sanitizeFilename } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';
import { DEFAULT_SEO_PAGES, generateSEOMeta } from '@/lib/seoUtils';
import SuccessView from '@/components/submit-report/SuccessView';

const DatePicker = dynamic(() => import('react-datepicker'), { ssr: false });

const STEPS = [
  {
    id: 'category',
    eyebrow: 'Start here',
    title: 'What kind of crime or incident are you reporting?',
    helper: 'Choose the closest match. You can still explain the full story later.',
    icon: Sparkles,
  },
  {
    id: 'location',
    eyebrow: 'Location',
    title: 'Where did this happen?',
    helper: 'Pick the state first. LGA and address are optional.',
    icon: MapPin,
  },
  {
    id: 'date',
    eyebrow: 'Timing',
    title: 'Do you know when it happened?',
    helper: 'An exact date helps, but you can continue if you are not sure.',
    icon: Calendar,
  },
  {
    id: 'story',
    eyebrow: 'Your story',
    title: 'Tell us more about this incident',
    helper: "Write a detailed report or record a voice note. We'll change your voice to protect your identity.",
    icon: Mic,
  },
  {
    id: 'evidence',
    eyebrow: 'Evidence',
    title: 'Do you have evidence to add?',
    helper: 'Photos, screenshots, documents, audio, or video can help. This is optional.',
    icon: Paperclip,
  },
  {
    id: 'review',
    eyebrow: 'Secure submit',
    title: 'Review and submit securely',
    helper: 'Create a private password so you can track this report after submission.',
    icon: ShieldCheck,
  },
];

const initialFormData = {
  category: '',
  confirmNotUrgent: false,
  title: '',
  description: '',
  stateOfIncident: '',
  lga: '',
  incidentAddress: '',
  knowsDate: null,
  dateOfIncident: null,
  anonymousPassword: '',
  confirmPassword: '',
  reporterType: 'anonymous',
  agreeTerms: false,
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18 } },
};

const nativeSelectFieldClasses = [
  'appearance-none pr-12',
  v2ControlClasses,
].join(' ');

function NativeSelect({ id, className = '', children, ...props }) {
  return (
    <div className="relative w-full">
      <select id={id} className={[nativeSelectFieldClasses, className].join(' ')} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

function generateReportId() {
  return 'WB' + String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
}

function categoryToPhrase(category) {
  if (!category) return 'this incident';
  return category
    .toLowerCase()
    .replace(/\s*\/\s*/g, ' or ')
    .replace(/\s*&\s*/g, ' and ');
}

function ButtonChoice({ selected, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={[
        'flex w-full items-center justify-between rounded-xl border bg-background px-4 py-4 text-left transition-all',
        'hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border',
        className,
      ].join(' ')}
      {...props}
    >
      <span className="text-sm font-semibold md:text-base">{children}</span>
      <span
        className={[
          'flex h-6 w-6 items-center justify-center rounded-full border',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
        ].join(' ')}
        aria-hidden
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function Reveal({ show, children }) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: 14, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FieldLabel({ htmlFor, children, optional = false }) {
  return (
    <label htmlFor={htmlFor} className={fieldLabelClasses}>
      {children}
      {optional ? (
        <span className="font-normal normal-case tracking-normal"> (optional)</span>
      ) : null}
    </label>
  );
}

function FormField({ id, label, optional = false, children }) {
  return (
    <div className="w-full min-w-0">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      {children}
    </div>
  );
}

export default function SubmitReportPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [descriptionMode, setDescriptionMode] = useState('text');
  const [voiceNoteFile, setVoiceNoteFile] = useState([]);
  const [files, setFiles] = useState([]);
  const [wantsEvidence, setWantsEvidence] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [hasAttemptedReviewSubmit, setHasAttemptedReviewSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [reportId, setReportId] = useState('');
  const [successPassword, setSuccessPassword] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const skipStepEnterAnimation = useRef(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeStep = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const categoryPhrase = categoryToPhrase(formData.category);

  const states = useMemo(() => nigerianStatesAndLgas.map((item) => item.state), []);
  const lgas = useMemo(() => {
    if (!formData.stateOfIncident) return [];
    return nigerianStatesAndLgas.find((item) => item.state === formData.stateOfIncident)?.lgas || [];
  }, [formData.stateOfIncident]);
  const canRevealAddress = !!formData.stateOfIncident && (formData.lga || lgas.length === 0);
  const maxIncidentDate = useMemo(() => new Date(), []);

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
    setFieldError('');
    setSubmitError('');
    setHasAttemptedReviewSubmit(false);
  }, [currentStep]);

  const reviewPasswordError =
    hasAttemptedReviewSubmit && fieldError === 'Password must be at least 8 characters.'
      ? fieldError
      : '';
  const reviewConfirmPasswordError =
    hasAttemptedReviewSubmit && fieldError === 'Both passwords must match.'
      ? fieldError
      : '';
  const reviewTermsError =
    hasAttemptedReviewSubmit && fieldError === 'You must agree to the terms and conditions.'
      ? fieldError
      : '';
  const stepFooterError = activeStep.id === 'review' ? submitError : fieldError || submitError;

  const handleChange = (field, value) => {
    setFieldError('');
    setSubmitError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStateChange = (value) => {
    setFieldError('');
    setSubmitError('');
    setFormData((prev) => ({
      ...prev,
      stateOfIncident: value,
      lga: '',
      incidentAddress: '',
    }));
  };

  const handleVoiceNoteAdd = (note) => {
    setVoiceNoteFile((current) => [...(Array.isArray(current) ? current : []), note]);
  };

  const handleVoiceNoteClear = (noteId) => {
    setVoiceNoteFile((current) => {
      const notes = Array.isArray(current) ? current : current ? [current] : [];
      const removedNotes = noteId ? notes.filter((note) => note.id === noteId) : notes;
      removedNotes.forEach((note) => {
        if (note?.url) URL.revokeObjectURL(note.url);
      });
      return noteId ? notes.filter((note) => note.id !== noteId) : [];
    });
  };

  const voiceNotes = Array.isArray(voiceNoteFile)
    ? voiceNoteFile.filter((note) => note?.blob)
    : voiceNoteFile?.blob
      ? [voiceNoteFile]
      : [];

  const validateCurrentStep = () => {
    switch (activeStep.id) {
      case 'category':
        if (!formData.category) return 'Choose the kind of incident you want to report.';
        if (!formData.confirmNotUrgent) {
          return 'Please confirm this form is not for something that needs urgent Police attention.';
        }
        return '';
      case 'location':
        if (!formData.stateOfIncident) return 'Select the state where this happened.';
        return '';
      case 'date':
        if (formData.knowsDate === null) return 'Choose Yes or No so we know whether to ask for a date.';
        if (formData.knowsDate === true && !formData.dateOfIncident) {
          return 'Select the date it happened, or choose No / Not sure.';
        }
        return '';
      case 'story':
        if (descriptionMode === 'voice') {
          if (!voiceNotes.length) return 'Record at least one voice note before continuing.';
          return '';
        }
        if (!formData.title.trim()) return 'Give this report a short title.';
        if (!formData.description.trim()) return 'Tell us what happened in your own words.';
        return '';
      case 'evidence':
        if (wantsEvidence === null) return 'Choose whether you want to add evidence or skip this step.';
        if (wantsEvidence === true && files.length === 0) {
          return 'Please upload at least one supporting file before continuing.';
        }
        return '';
      case 'review':
        if (formData.anonymousPassword.length < 8) return 'Password must be at least 8 characters.';
        if (formData.anonymousPassword !== formData.confirmPassword) return 'Both passwords must match.';
        if (!formData.agreeTerms) return 'You must agree to the terms and conditions.';
        return '';
      default:
        return '';
    }
  };

  const goNext = () => {
    const error = validateCurrentStep();
    if (error) {
      setFieldError(error);
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setFieldError('');
      skipStepEnterAnimation.current = false;
      setCurrentStep((step) => step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep === 0) return;
    setFieldError('');
    setSubmitError('');
    skipStepEnterAnimation.current = false;
    setCurrentStep((step) => step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToReviewStep = (stepIndex) => {
    setFieldError('');
    setSubmitError('');
    skipStepEnterAnimation.current = false;
    setCurrentStep(stepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setHasAttemptedReviewSubmit(true);
    const error = validateCurrentStep();
    if (error) {
      setFieldError(error);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const newReportId = generateReportId();
      const plainPassword = formData.anonymousPassword;
      const { hash, salt } = await hashPassword(plainPassword);
      const reportUUIDForPath = generateUUID();
      let evidencePaths = [];

      if (descriptionMode === 'voice' && voiceNotes.length > 0) {
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
          evidencePaths.push(voicePath);
        }
      }

      if (files.length > 0) {
        const reportFolder = `reports/${reportUUIDForPath}`;
        const uploads = await Promise.all(
          files.map((file) => uploadStorageFile(file, reportFolder, reportUUIDForPath))
        );
        evidencePaths = [...evidencePaths, ...uploads];
      }

      const incidentDate = formData.knowsDate && formData.dateOfIncident
        ? formatDateForInput(formData.dateOfIncident)
        : null;

      const rpcParams = buildCreateReportRpcParams({
        reportId: newReportId,
        organizationId: null,
        organizationName: null,
        title:
          descriptionMode === 'voice'
            ? `${formData.category || 'Incident'} voice report`
            : formData.title.trim(),
        description:
          descriptionMode === 'voice'
            ? `This ${categoryPhrase} report was submitted as a protected voice note.`
            : formData.description.trim(),
        category: formData.category,
        state: formData.stateOfIncident,
        lga: formData.lga || null,
        incidentAddress: formData.incidentAddress || null,
        incidentDate,
        isAnonymous: formData.reporterType !== 'reward',
        passwordHash: hash,
        passwordSalt: salt,
        evidencePaths,
        reportType: descriptionMode === 'voice' ? 'voice' : 'text',
        isVoiceNote: descriptionMode === 'voice',
        isFeedback: false,
      });

      const { error: rpcError } = await supabase.rpc('create_report_with_evidence', rpcParams);
      if (rpcError) throw rpcError;

      setReportId(newReportId);
      setSuccessPassword(plainPassword);
      setIsSubmitted(true);
      notifyNewReport(newReportId);
    } catch (submissionError) {
      console.error('Submission error:', submissionError);
      setSubmitError(submissionError.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.submitReport,
    url: '/submit-report',
    type: 'website',
  });

  if (isSubmitted) {
    return <SuccessView reportId={reportId} password={successPassword} />;
  }

  const stepTitle = activeStep.id === 'story'
    ? `Tell us more about this ${categoryPhrase}`
    : activeStep.title;
  const Icon = activeStep.icon;
  const primaryLabel = activeStep.id === 'review' ? 'Submit Report' : 'Continue';

  return (
    <>
      <SEOHead {...seoMeta} />
      <main className="min-h-[calc(100vh-4rem)] bg-muted/30 px-4 py-8 md:py-12">
        <form
          onSubmit={(event) => event.preventDefault()}
          className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col"
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.defaultPrevented) return;
            if (event.target instanceof HTMLTextAreaElement) return;
            event.preventDefault();
          }}
        >
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-border" aria-label="Submit report progress" />
          </div>

          <section className="flex flex-1 flex-col justify-center pb-28 md:pb-12">
            <div className="w-full md:mx-auto md:flex md:max-w-3xl md:flex-col md:items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.id}
                  variants={fadeUp}
                  initial={skipStepEnterAnimation.current ? false : 'hidden'}
                  animate="visible"
                  exit="exit"
                  className="w-full rounded-3xl border bg-card/95 p-5 shadow-sm md:p-8"
                >
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {activeStep.eyebrow}
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                    {stepTitle}
                  </h1>
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {activeStep.helper}
                  </p>
                </div>

                <div className="w-full space-y-5 text-left">
                  {activeStep.id === 'category' && (
                    <div className="space-y-4">
                      <FormField id="category" label="Incident type">
                        <NativeSelect
                          id="category"
                          value={formData.category}
                          onChange={(event) => handleChange('category', event.target.value)}
                        >
                          <option value="" disabled>
                            Select the closest category
                          </option>
                          {PUBLIC_REPORT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="confirmNotUrgent"
                          className="mt-0.5"
                          checked={formData.confirmNotUrgent}
                          onCheckedChange={(checked) => handleChange('confirmNotUrgent', checked === true)}
                        />
                        <label htmlFor="confirmNotUrgent" className="text-sm leading-relaxed">
                          I confirm that this form is not being used to report something that requires urgent Police attention.
                        </label>
                      </div>
                    </div>
                  )}

                  {activeStep.id === 'location' && (
                    <div className="space-y-5">
                      <FormField id="stateOfIncident" label="State">
                        <NativeSelect
                          id="stateOfIncident"
                          value={formData.stateOfIncident}
                          onChange={(event) => handleStateChange(event.target.value)}
                        >
                          <option value="" disabled>
                            Select the state where it happened
                          </option>
                          {states.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </NativeSelect>
                      </FormField>

                      <Reveal show={!!formData.stateOfIncident && lgas.length > 0}>
                        <div className="pt-1">
                          <FormField id="lga" label="Local government area" optional>
                            <NativeSelect
                              id="lga"
                              value={formData.lga}
                              onChange={(event) => handleChange('lga', event.target.value)}
                            >
                              <option value="">Select LGA if you know it</option>
                              {lgas.map((lga) => (
                                <option key={lga} value={lga}>
                                  {lga}
                                </option>
                              ))}
                            </NativeSelect>
                          </FormField>
                        </div>
                      </Reveal>

                      <Reveal show={canRevealAddress}>
                        <div className="pt-1">
                          <FormField id="incidentAddress" label="Address, area, or landmark" optional>
                            <Input
                              id="incidentAddress"
                              value={formData.incidentAddress}
                              onChange={(event) => handleChange('incidentAddress', event.target.value)}
                              placeholder="Street, area, building, or landmark"
                              className={v2ControlClasses}
                            />
                          </FormField>
                        </div>
                      </Reveal>
                    </div>
                  )}

                  {activeStep.id === 'date' && (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ButtonChoice
                          selected={formData.knowsDate === true}
                          onClick={() => handleChange('knowsDate', true)}
                        >
                          Yes, I know the date
                        </ButtonChoice>
                        <ButtonChoice
                          selected={formData.knowsDate === false}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              knowsDate: false,
                              dateOfIncident: null,
                            }));
                            setFieldError('');
                          }}
                        >
                          No / Not sure
                        </ButtonChoice>
                      </div>

                      <Reveal show={formData.knowsDate === true}>
                        <div className="pt-1">
                          <FormField id="dateOfIncident" label="Date it happened">
                            <MobileIncidentDateField
                              id="dateOfIncident"
                              value={formData.dateOfIncident}
                              onChange={(date) => handleChange('dateOfIncident', date)}
                              placeholder="Select the date"
                              ariaLabel="Date the incident happened"
                              maxDate={maxIncidentDate}
                              triggerClassName={v2ControlClasses}
                            />
                            {isMounted ? (
                              <div className="hidden md:block w-full min-w-0 max-w-full">
                                <DatePicker
                                  id="dateOfIncidentDesktop"
                                  selected={formData.dateOfIncident}
                                  onChange={(date) => handleChange('dateOfIncident', date)}
                                  maxDate={maxIncidentDate}
                                  placeholderText="Select the date"
                                  dateFormat="MMMM d, yyyy"
                                  className={v2DateInputClasses}
                                  wrapperClassName="w-full"
                                  showPopperArrow={false}
                                  popperPlacement="bottom-start"
                                  showMonthDropdown
                                  showYearDropdown
                                  dropdownMode="select"
                                  calendarClassName="rounded-lg border border-border bg-card shadow-lg"
                                  popperClassName="submit-report-datepicker"
                                  portalId="submit-report-datepicker-portal"
                                  aria-label="Date the incident happened"
                                />
                              </div>
                            ) : null}
                          </FormField>
                        </div>
                      </Reveal>
                    </div>
                  )}

                  {activeStep.id === 'story' && (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ButtonChoice
                          selected={descriptionMode === 'text'}
                          onClick={() => setDescriptionMode('text')}
                        >
                          <span className="inline-flex items-center gap-2">
                            <FileText className="h-4 w-4" aria-hidden />
                            TEXT REPORT
                          </span>
                        </ButtonChoice>
                        <ButtonChoice
                          selected={descriptionMode === 'voice'}
                          onClick={() => setDescriptionMode('voice')}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Mic className="h-4 w-4" aria-hidden />
                            VOICE REPORT
                          </span>
                        </ButtonChoice>
                      </div>

                      {descriptionMode === 'text' ? (
                        <div className="space-y-4">
                          <FormField id="reportTitle" label="Short title">
                            <Input
                              id="reportTitle"
                              value={formData.title}
                              onChange={(event) => handleChange('title', event.target.value)}
                              placeholder={`Short title for this ${categoryPhrase}`}
                              className={v2ControlClasses}
                            />
                          </FormField>
                          <FormField id="reportDescription" label="What happened?">
                            <Textarea
                              id="reportDescription"
                              value={formData.description}
                              onChange={(event) => handleChange('description', event.target.value)}
                              placeholder="Describe what happened, who was involved, and any details that could help investigators."
                              className={v2TextareaClasses}
                              rows={7}
                            />
                          </FormField>
                        </div>
                      ) : (
                        <VoiceRecordingWidget
                          voiceNotes={voiceNotes}
                          onVoiceNoteAdd={handleVoiceNoteAdd}
                          onVoiceNoteDelete={handleVoiceNoteClear}
                          hasOrganization
                        />
                      )}
                    </div>
                  )}

                  {activeStep.id === 'evidence' && (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ButtonChoice
                          selected={wantsEvidence === true}
                          onClick={() => {
                            setWantsEvidence(true);
                            setFieldError('');
                          }}
                        >
                          Add evidence
                        </ButtonChoice>
                        <ButtonChoice
                          selected={wantsEvidence === false}
                          onClick={() => {
                            setWantsEvidence(false);
                            setFiles([]);
                            setFieldError('');
                          }}
                        >
                          Skip for now
                        </ButtonChoice>
                      </div>

                      <Reveal show={wantsEvidence === true}>
                        <div className="pt-1">
                          <EvidenceUpload
                            files={files}
                            onFilesChange={(nextFiles) => {
                              setFiles(nextFiles);
                              if (nextFiles.length > 0) setFieldError('');
                            }}
                            hasOrganization
                            disabled={isSubmitting}
                          />
                        </div>
                      </Reveal>
                    </div>
                  )}

                  {activeStep.id === 'review' && (
                    <div className="space-y-6">
                      <SubmitReportReviewSummary
                        formData={formData}
                        descriptionMode={descriptionMode}
                        voiceNoteCount={voiceNotes.length}
                        files={files}
                        onGoToStep={goToReviewStep}
                      />
                      <ContactInfo
                        formData={formData}
                        onInputChange={handleChange}
                        embedded
                        showFieldLabels
                        controlClassName={v2ControlClasses}
                        fieldErrors={{
                          anonymousPassword: reviewPasswordError,
                          confirmPassword: reviewConfirmPasswordError,
                        }}
                      />
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="agreeTerms"
                          className="mt-0.5"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) => handleChange('agreeTerms', checked === true)}
                        />
                        <label htmlFor="agreeTerms" className="text-sm leading-snug cursor-pointer">
                          I have read and agree to the{' '}
                          <Link href="/terms-of-service" className="text-primary underline">
                            Terms and Conditions
                          </Link>
                          .
                        </label>
                      </div>
                      <FieldError message={reviewTermsError} />
                    </div>
                  )}

                  <FieldError message={stepFooterError} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur md:relative md:mt-6 md:w-full md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <div className="mx-auto flex w-full max-w-3xl items-center gap-3 md:w-auto md:justify-center md:gap-4">
                <Button
                  type="button"
                  onClick={goBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className="h-11 min-w-0 flex-1 gap-2 px-4 md:min-w-36 md:flex-none md:px-6"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={activeStep.id === 'review' ? handleSubmit : goNext}
                  loading={isSubmitting}
                  className="h-11 min-w-0 flex-[1.45] gap-2 px-4 md:min-w-64 md:flex-none md:px-6"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            </div>
          </section>
        </form>
      </main>
    </>
  );
}
