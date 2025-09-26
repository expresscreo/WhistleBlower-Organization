import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Edit2, FileType2, Mic, Type } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
// import * as bcrypt from 'bcryptjs'; // Temporarily disabled for debugging

import OrganizationSearch from './OrganizationSearch';
import IncidentDetails from './IncidentDetails';
import EvidenceUploader from './EvidenceUploader';
import ReporterIdentity from './ReporterIdentity';
import VoiceRecorder from './VoiceRecorder';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { sanitizeFilename } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const feedbackCategories = [
    "Suggestion",
    "Fraud & Financial Misconduct",
    "Harassment & Discrimination",
    "Safety Violations",
    "Compliance Breach",
    "Theft",
    "Environmental Violations",
    "Conflicts of Interest",
    "others"
];

const standardCategories = [
    "Bounty",
    "Fraud & Financial Misconduct",
    "Harassment & Discrimination",
    "Safety Violations",
    "Theft or Vandalism",
    "Cybersecurity Breach",
    "Substance Abuse",
    "Policy Violation",
    "Other"
];

const ReportForm = ({ submissionType, isSubmitting, setIsSubmitting, setIsSubmitted, setSubmissionData }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isFeedbackMode, setIsFeedbackMode] = useState(false);
    const [isBountyReportMode, setIsBountyReportMode] = useState(false);
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
    
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    useEffect(() => {
        const orgIdFromUrl = searchParams.get('organization_id');
        const feedbackParam = searchParams.get('feedback');
        const bountyIdParam = searchParams.get('bounty_id');
        const bountyTitleParam = searchParams.get('bounty_title');
        const categoryParam = searchParams.get('category');
        const mostWantedTypeParam = searchParams.get('most_wanted_type');

        if (bountyIdParam) {
            setIsBountyReportMode(true);
            handleInputChange('title', bountyTitleParam || `Information regarding bounty ${bountyIdParam}`);
            handleInputChange('category', 'Bounty');
        } else if (categoryParam === 'most_wanted' && bountyTitleParam) {
            setIsBountyReportMode(true);
            handleInputChange('title', bountyTitleParam);
            handleInputChange('category', 'Most Wanted');
        }

        if (feedbackParam === 'true') {
            setIsFeedbackMode(true);
            const randomPassword = Math.random().toString(36).slice(-10);
            handleInputChange('password', randomPassword);
            handleInputChange('confirmPassword', randomPassword);
        }

        if (orgIdFromUrl) {
            const fetchOrganization = async () => {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .eq('id', orgIdFromUrl)
                    .single();
                
                if (error || !data) {
                    toast({ title: "Invalid Organization", description: "The organization ID in the link is not valid.", variant: "destructive" });
                    navigate('/submit-report', { replace: true });
                } else {
                    setFormData(prev => ({ ...prev, organizationName: data.name, organizationId: data.id }));
                    setIsOrgFromUrl(true);
                }
            };
            fetchOrganization();
        }
    }, [searchParams, toast, navigate, handleInputChange]);

    const generateReportId = () => 'WB' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeTerms) {
            toast({ title: 'Terms and Conditions', description: 'You must agree to the terms and conditions.', variant: 'destructive' });
            return;
        }

        if (!isFeedbackMode && (formData.password.length < 8 || formData.password !== formData.confirmPassword)) {
            toast({ title: 'Password Error', description: 'Passwords must be at least 8 characters long and must match.', variant: 'destructive' });
            return;
        }
        
        if (submissionType === 'voice' && !voiceNote) {
            toast({ title: 'Voice Note Required', description: 'Please record a voice note for your report.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        setUploadProgress({});
        
        try {
            const newReportId = generateReportId();
            
            // const salt = bcrypt.genSaltSync(10);
            // const passwordHash = isFeedbackMode ? null : bcrypt.hashSync(formData.password, salt);
            const passwordHash = isFeedbackMode ? null : 'temp_hash_for_debugging';
            const passwordForSuccess = isFeedbackMode ? null : formData.password;

            let evidencePaths = [];
            const reportUUIDForPath = crypto.randomUUID();

            if (submissionType === 'voice' && voiceNote) {
                const sanitizedName = sanitizeFilename(`${Date.now()}-voice-report.wav`);
                const voiceNotePath = `reports/${reportUUIDForPath}/${sanitizedName}`;
                const { error: uploadError } = await supabase.storage.from('wb_evio').upload(voiceNotePath, voiceNote, {
                    contentType: 'audio/wav',
                });
                if (uploadError) throw uploadError;
                evidencePaths.push(voiceNotePath);
            }
            
            if (evidenceFiles.length > 0) {
                const uploadPromises = evidenceFiles.map(async (file) => {
                    const sanitizedName = sanitizeFilename(file.name);
                    const filePath = `reports/${reportUUIDForPath}/${Date.now()}-${sanitizedName}`;
                    const { error: uploadError } = await supabase.storage.from('wb_evio').upload(filePath, file, { cacheControl: '3600', upsert: false });
                    if (uploadError) throw uploadError;
                    return filePath;
                });
                const otherEvidence = await Promise.all(uploadPromises);
                evidencePaths.push(...otherEvidence);
            }

            const { data: reportData, error: rpcError } = await supabase.rpc('create_report_with_evidence', {
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
                is_anonymous_param: true, 
                anonymous_password_hash_param: passwordHash,
                evidence_paths_param: evidencePaths.length > 0 ? evidencePaths : null,
                report_type_param: submissionType,
                is_voice_note_param: submissionType === 'voice',
                is_feedback_param: isFeedbackMode,
            });

            if (rpcError) throw rpcError;

            if (isBountyReportMode) {
                const bountyId = searchParams.get('bounty_id');
                const { error: bountyReportError } = await supabase
                    .from('bounty_reports')
                    .insert({ bounty_id: bountyId, report_id: reportData });
                if (bountyReportError) {
                    // Log this, but don't fail the whole submission
                    console.error('Failed to link report to bounty:', bountyReportError);
                }
            }
            
            setSubmissionData({ id: newReportId, password: passwordForSuccess, type: 'report' });
            setIsSubmitted(true);

        } catch (error) {
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 border">
            {!isBountyReportMode && (
                <OrganizationSearch 
                    organizationName={formData.organizationName}
                    onOrganizationChange={handleInputChange}
                    isOrgFromUrl={isOrgFromUrl}
                />
            )}
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={submissionType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="flex items-center"><Type className="mr-2 h-4 w-4" />Report Title</Label>
                            <Input id="title" placeholder="e.g., Suspicious financial transactions in Q3" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required disabled={isBountyReportMode} />
                        </div>
                        
                        {submissionType === 'text' ? (
                            <div className="space-y-2">
                                <Label htmlFor="description" className="flex items-center"><FileType2 className="mr-2 h-4 w-4" />Detailed Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the incident in detail. Include dates, times, locations, and any individuals involved."
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={8}
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="flex items-center"><Mic className="mr-2 h-4 w-4" />Voice Recording</Label>
                                <VoiceRecorder onRecordingComplete={setVoiceNote} />
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <IncidentDetails
                formData={formData}
                onInputChange={handleInputChange}
                categories={isFeedbackMode ? feedbackCategories : standardCategories}
                isBountyReportMode={isBountyReportMode}
            />
            <EvidenceUploader
                evidenceFiles={evidenceFiles}
                setEvidenceFiles={setEvidenceFiles}
                uploadProgress={uploadProgress}
                isSubmitting={isSubmitting}
            />
            
            {!isFeedbackMode && (
                <ReporterIdentity
                    formData={formData}
                    onInputChange={handleInputChange}
                />
            )}

            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(c) => handleInputChange('agreeTerms', c)} />
                <Label htmlFor="terms" className="text-sm">I have read and agree to the <Link to="/terms-of-service" className="underline">Terms and Conditions</Link>.</Label>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !formData.agreeTerms}>
                {isSubmitting ? <>Submitting...</> : `Submit ${isFeedbackMode ? 'Feedback' : 'Report'}`}
            </Button>
        </motion.form>
    );
};

export default ReportForm;