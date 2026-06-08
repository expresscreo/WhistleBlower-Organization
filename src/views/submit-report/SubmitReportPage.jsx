import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Mic, Text } from 'lucide-react';
import { FieldError } from '@/components/ui/form-feedback';
import { supabase } from '@/lib/customSupabaseClient';
import { generateUUID, hashPassword } from '@/lib/cryptoUtils';

import OrganizationSearch from './OrganizationSearch';
import ReportCategorization from './ReportCategorization';
import IncidentDetails from './IncidentDetails';
import EvidenceUploader from './EvidenceUploader';
import ReporterIdentity from './ReporterIdentity';
import SubmissionSuccess from './SubmissionSuccess';
import VoiceRecorder from './VoiceRecorder';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { sanitizeFilename, slugify } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { uploadFileToLocal } from '@/lib/fileUtils';
import { uploadStorageFile } from '@/lib/supabaseStorageService';
import { generateReportId } from '@/lib/utils';

const SubmitReportPage = () => {
    const [submitError, setSubmitError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [submissionType, setSubmissionType] = useState('text');
    const [voiceNote, setVoiceNote] = useState(null);

    const [formData, setFormData] = useState({
        organizationName: '',
        organizationId: null,
        category: '',
        title: '',
        description: '',
        state: '',
        lga: '',
        incidentAddress: '',
        incidentDate: '',
        reporterType: 'anonymous',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({});
    const [isOrgFromUrl, setIsOrgFromUrl] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionData, setSubmissionData] = useState({ reportId: '', password: '' });

    useEffect(() => {
        const orgIdFromUrl = searchParams.get('organization_id');
        if (orgIdFromUrl) {
            const fetchOrganization = async () => {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .eq('id', orgIdFromUrl)
                    .single();
                
                if (error || !data) {
                    setSubmitError('The organization ID in the link is not valid.');
                    router.replace('/submit-report');
                } else {
                    setFormData(prev => ({ ...prev, organizationName: data.name, organizationId: data.id }));
                    setIsOrgFromUrl(true);
                }
            };
            fetchOrganization();
        }
    }, [searchParams, router]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const generateReportId = () => 'WB' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!formData.agreeTerms) {
            setSubmitError('You must agree to the terms and conditions.');
            return;
        }
        if (formData.password.length < 8 || formData.password !== formData.confirmPassword) {
            setSubmitError('Passwords must be at least 8 characters long and must match.');
            return;
        }
        if (submissionType === 'voice' && !voiceNote) {
            setSubmitError('Please submit a voice note for your report.');
            return;
        }
        
        setIsSubmitting(true);
        setUploadProgress({});
        
        try {
            // Route to bounty management when category is Bounty (or bounty_id present)
            const bountyIdFromQuery = searchParams.get('bounty_id');
            const isBountyCategory = String(formData.category || '').toLowerCase() === 'bounty';
            if (bountyIdFromQuery || isBountyCategory) {
                let evidencePaths = [];
                const subfolder = bountyIdFromQuery || slugify(formData.title || 'bounty');

                // Voice note upload (local)
                if (submissionType === 'voice' && voiceNote) {
                    try {
                        const uploadedPath = await uploadFileToLocal(voiceNote, 'bounties', subfolder);
                        evidencePaths.push(uploadedPath);
                    } catch (e) {
                        console.error('Voice upload failed:', e);
                    }
                }

                // Evidence files upload (local)
                if (evidenceFiles.length > 0) {
                    for (const file of evidenceFiles) {
                        try {
                            const uploadedPath = await uploadFileToLocal(file, 'bounties', subfolder);
                            evidencePaths.push(uploadedPath);
                        } catch (e) {
                            console.error('Evidence upload failed:', e);
                        }
                    }
                }

                const composedMessage = [
                    formData.title?.trim() ? `Title: ${formData.title.trim()}` : null,
                    formData.description?.trim() ? formData.description.trim() : null,
                    evidencePaths.length > 0 ? `Attached ${evidencePaths.length} file(s).` : null
                ].filter(Boolean).join('\n\n');

                // Determine bounty id. If not provided in query, try to resolve or create a bounty placeholder
                let targetBountyId = bountyIdFromQuery || null;
                if (!targetBountyId) {
                    // Try match an existing bounty by title
                    const { data: existingBounty } = await supabase
                        .from('bounties')
                        .select('id')
                        .ilike('title', formData.title || '')
                        .maybeSingle();
                    if (existingBounty?.id) {
                        targetBountyId = existingBounty.id;
                    }
                }

                // If still no bounty, create a minimal pending bounty record for management
                if (!targetBountyId) {
                    const { data: created, error: createError } = await supabase
                        .from('bounties')
                        .insert({
                            title: formData.title || 'Bounty Report',
                            description: formData.description || '',
                            status: 'pending_review',
                            evidence: evidencePaths.length > 0 ? evidencePaths : [],
                        })
                        .select('id')
                        .single();
                    if (createError) throw createError;
                    targetBountyId = created.id;
                }

                const { error: tipError } = await supabase
                    .from('bounty_updates')
                    .insert({ bounty_id: targetBountyId, message: composedMessage, updated_by: null });

                if (tipError) throw tipError;

                // Append evidence to bounty record for easier access
                if (evidencePaths.length > 0) {
                    const { data: bountyData } = await supabase
                        .from('bounties')
                        .select('id, evidence')
                        .eq('id', targetBountyId)
                        .single();
                    const updatedEvidence = [...(bountyData?.evidence || []), ...evidencePaths];
                    await supabase
                        .from('bounties')
                        .update({ evidence: updatedEvidence })
                        .eq('id', targetBountyId);
                }

                // Create a report record for tracking purposes
                const newReportId = generateReportId();
                const { hash: passwordHash, salt } = await hashPassword(formData.password);
                
                const { error: reportError } = await supabase.rpc('create_report_with_evidence', {
                    report_id_param: newReportId,
                    organization_id_param: formData.organizationId,
                    organization_name_param: formData.organizationId ? null : formData.organizationName,
                    title_param: formData.title || 'Bounty Report',
                    description_param: composedMessage,
                    category_param: 'Bounty',
                    state_param: formData.state,
                    lga_param: formData.lga,
                    incident_address_param: formData.incidentAddress,
                    incident_date_param: formData.incidentDate,
                    is_anonymous_param: true,
                    anonymous_password_hash_param: `${passwordHash}:${salt}`,
                    evidence_paths_param: evidencePaths.length > 0 ? evidencePaths : null,
                    report_type_param: submissionType,
                    is_voice_note_param: submissionType === 'voice',
                    is_feedback_param: false,
                });

                if (reportError) {
                    console.error('Failed to create report record:', reportError);
                    // Don't fail the whole submission, just log the error
                } else {
                    // Link the report to the bounty
                    const { error: bountyReportError } = await supabase
                        .from('bounty_reports')
                        .insert({ bounty_id: targetBountyId, report_id: newReportId });
                    if (bountyReportError) {
                        console.error('Failed to link report to bounty:', bountyReportError);
                    }
                }

                // Show success page with report ID for tracking
                setSubmissionData({ reportId: newReportId, password: formData.password });
                setIsSubmitted(true);
                return;
            }

            const newReportId = generateReportId();
            
            const { hash: passwordHash, salt } = await hashPassword(formData.password);
            const passwordForSuccess = formData.password;

            let evidencePaths = [];
            const reportUUIDForPath = generateUUID();

            if (submissionType === 'voice' && voiceNote) {
                const voiceNotePath = `reports/${reportUUIDForPath}/${Date.now()}-voice-report.wav`;
                const { error: uploadError } = await supabase.storage.from('wb_evio').upload(voiceNotePath, voiceNote, {
                    contentType: 'audio/wav',
                });
                if (uploadError) throw uploadError;
                evidencePaths.push(voiceNotePath);
            }
            
            if (evidenceFiles.length > 0) {
                const reportFolder = `reports/${reportUUIDForPath}`;
                const uploadPromises = evidenceFiles.map((file) =>
                    uploadStorageFile(file, reportFolder, reportUUIDForPath)
                );
                const otherEvidence = await Promise.all(uploadPromises);
                evidencePaths.push(...otherEvidence);
            }

            const { error: rpcError } = await supabase.rpc('create_report_with_evidence', {
                report_id_param: newReportId,
                organization_id_param: formData.organizationId,
                organization_name_param: formData.organizationId ? null : formData.organizationName,
                title_param: submissionType === 'voice' ? 'Voice Note Report' : formData.title,
                description_param: submissionType === 'voice' ? 'This report was submitted via an anonymized voice note.' : formData.description,
                category_param: formData.category,
                state_param: formData.state,
                lga_param: formData.lga,
                incident_address_param: formData.incidentAddress,
                incident_date_param: formData.incidentDate,
                is_anonymous_param: formData.reporterType === 'anonymous',
                anonymous_password_hash_param: `${passwordHash}:${salt}`, // Store hash:salt as a single field
                evidence_paths_param: evidencePaths.length > 0 ? evidencePaths : null,
                report_type_param: submissionType,
                is_voice_note_param: submissionType === 'voice',
                is_feedback_param: searchParams.get('feedback') === 'true'
            });

            if (rpcError) throw rpcError;
            
            setSubmissionData({ reportId: newReportId, password: passwordForSuccess });
            setIsSubmitted(true);

        } catch (error) {
            console.error("Submission error details:", error);
            setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return <SubmissionSuccess reportId={submissionData.reportId} password={submissionData.password} />;
    }
  
    return (
      <>
        <PageHead title="Submit Report — WhistleBlower.ng" />
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
              <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Submit Your <span className="gradient-text">Report</span></h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Report crimes and illegal activities safely. Your identity is protected.</p>
            </motion.div>
            <motion.form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 border">
              <FieldError message={submitError} />
              
              <div className="flex justify-center bg-muted p-1 space-x-1">
                <Button type="button" onClick={() => setSubmissionType('text')} variant={submissionType === 'text' ? 'default' : 'ghost'} className="flex-1">
                  <Text className="mr-2 h-4 w-4" /> Text Report
                </Button>
                <Button type="button" onClick={() => setSubmissionType('voice')} variant={submissionType === 'voice' ? 'default' : 'ghost'} className="flex-1">
                  <Mic className="mr-2 h-4 w-4" /> Voice Report
                </Button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={submissionType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  {submissionType === 'text' ? (
                     <div className="space-y-8">
                        <OrganizationSearch 
                            organizationName={formData.organizationName}
                            onOrganizationChange={handleInputChange}
                            isOrgFromUrl={isOrgFromUrl}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="title">Report Title</Label>
                            <Input id="title" placeholder="e.g., Embezzlement at XYZ Corp" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Detailed Description</Label>
                            <Textarea id="description" placeholder="Provide a detailed account of the incident..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
                        </div>
                        <ReportCategorization formData={formData} onInputChange={handleInputChange}/>
                     </div>
                  ) : (
                    <>
                        <OrganizationSearch 
                            organizationName={formData.organizationName}
                            onOrganizationChange={handleInputChange}
                            isOrgFromUrl={isOrgFromUrl}
                        />
                        <ReportCategorization formData={formData} onInputChange={handleInputChange}/>
                        <VoiceRecorder onRecordingComplete={setVoiceNote} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
              
              <IncidentDetails
                formData={formData}
                onInputChange={handleInputChange}
              />
              <EvidenceUploader
                evidenceFiles={evidenceFiles}
                setEvidenceFiles={setEvidenceFiles}
                uploadProgress={uploadProgress}
                isSubmitting={isSubmitting}
              />
              <ReporterIdentity
                formData={formData}
                onInputChange={handleInputChange}
              />
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(c) => handleInputChange('agreeTerms', c)} />
                <Label htmlFor="terms" className="text-sm">I have read and agree to the <Link href="/terms-of-service" className="underline">Terms and Conditions</Link>.</Label>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={!formData.agreeTerms}>
                Submit Report
              </Button>
            </motion.form>
          </div>
        </div>
      </>
    );
};

export default SubmitReportPage;