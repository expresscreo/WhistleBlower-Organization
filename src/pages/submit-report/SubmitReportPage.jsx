import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Loader2, Mic, Text } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import bcrypt from 'bcryptjs';

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
import { Link } from 'react-router-dom';
import { sanitizeFilename } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const SubmitReportPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
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
                    toast({ title: "Invalid Organization", description: "The organization ID in the link is not valid.", variant: "destructive" });
                    navigate('/submit-report', { replace: true });
                } else {
                    setFormData(prev => ({ ...prev, organizationName: data.name, organizationId: data.id }));
                    setIsOrgFromUrl(true);
                }
            };
            fetchOrganization();
        }
    }, [searchParams, toast, navigate]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const generateReportId = () => 'WB' + String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeTerms) {
            toast({ title: 'Terms and Conditions', description: 'You must agree to the terms and conditions.', variant: 'destructive' });
            return;
        }
        if (formData.password.length < 8 || formData.password !== formData.confirmPassword) {
            toast({ title: 'Password Error', description: 'Passwords must be at least 8 characters long and must match.', variant: 'destructive' });
            return;
        }
        if (submissionType === 'voice' && !voiceNote) {
            toast({ title: 'Voice Note Required', description: 'Please submit a voice note for your report.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        setUploadProgress({});
        
        try {
            const newReportId = generateReportId();
            
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(formData.password, salt);
            const passwordForSuccess = formData.password;

            let evidencePaths = [];
            const reportUUIDForPath = crypto.randomUUID();

            if (submissionType === 'voice' && voiceNote) {
                const voiceNotePath = `reports/${reportUUIDForPath}/${Date.now()}-voice-report.wav`;
                const { error: uploadError } = await supabase.storage.from('wb_evio').upload(voiceNotePath, voiceNote, {
                    contentType: 'audio/wav',
                });
                if (uploadError) throw uploadError;
                evidencePaths.push(voiceNotePath);
            }
            
            if (evidenceFiles.length > 0) {
                const uploadPromises = evidenceFiles.map(async (file, index) => {
                    const sanitizedName = sanitizeFilename(file.name);
                    const filePath = `reports/${reportUUIDForPath}/${Date.now()}-${sanitizedName}`;
                    const { error: uploadError } = await supabase.storage.from('wb_evio').upload(filePath, file, { cacheControl: '3600', upsert: false });
                    if (uploadError) throw uploadError;
                    return filePath;
                });
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
                anonymous_password_hash_param: passwordHash,
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
            toast({ title: "Submission Failed", description: error.message || "An unexpected error occurred. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return <SubmissionSuccess reportId={submissionData.reportId} password={submissionData.password} />;
    }
  
    return (
      <>
        <Helmet><title>Submit Report - WhistleBlower.ng</title></Helmet>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
              <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Submit Your <span className="gradient-text">Report</span></h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">Report crimes and illegal activities safely. Your identity is protected.</p>
            </motion.div>
            <motion.form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 border">
              
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
                <Label htmlFor="terms" className="text-sm">I have read and agree to the <Link to="/terms-of-service" className="underline">Terms and Conditions</Link>.</Label>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !formData.agreeTerms}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Report'}
              </Button>
            </motion.form>
          </div>
        </div>
      </>
    );
};

export default SubmitReportPage;