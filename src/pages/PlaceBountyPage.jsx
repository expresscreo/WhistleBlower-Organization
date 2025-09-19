
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import bcrypt from 'bcryptjs';
import { Award } from 'lucide-react';

import BountyForm from './submit-report/BountyForm';
import SubmissionSuccess from './submit-report/SubmissionSuccess';
import { sanitizeFilename } from '@/lib/utils';

const PlaceBountyPage = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionData, setSubmissionData] = useState({ id: '', password: '', type: 'bounty' });
    const [uploadProgress, setUploadProgress] = useState({});

    const generateBountyId = () => `WBB${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

    const handleBountySubmit = async (bountyData) => {
        setIsSubmitting(true);
        setUploadProgress({});

        try {
            const bountyId = generateBountyId();
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(bountyData.password, salt);

            let evidencePaths = [];
            if (bountyData.evidenceFiles.length > 0) {
                const uploadPromises = bountyData.evidenceFiles.map(async (file, index) => {
                    const sanitizedName = sanitizeFilename(file.name);
                    const filePath = `bounties/${bountyId}/${Date.now()}-${sanitizedName}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('wb_evio')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false,
                            contentType: file.type,
                        }, (event) => {
                            if (event.type === 'progress') {
                                setUploadProgress(prev => ({ ...prev, [index]: (event.loaded / event.total) * 100 }));
                            }
                        });

                    if (uploadError) {
                        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                    }
                    return filePath;
                });
                evidencePaths = await Promise.all(uploadPromises);
            }

            const { data, error } = await supabase
                .from('bounties')
                .insert({
                    bounty_id: bountyId,
                    title: bountyData.title,
                    description: bountyData.description,
                    type_of_crime: bountyData.typeOfCrime,
                    state: bountyData.state,
                    location: bountyData.lga,
                    bounty_amount: bountyData.bountyAmount || null,
                    password: passwordHash,
                    status: 'pending_review',
                    evidence: evidencePaths,
                })
                .select('bounty_id')
                .single();

            if (error) throw error;

            setSubmissionData({ id: data.bounty_id, password: bountyData.password, type: 'bounty' });
            setIsSubmitted(true);

        } catch (error) {
            toast({ title: "Bounty Submission Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return <SubmissionSuccess 
            id={submissionData.id} 
            password={submissionData.password} 
            type={submissionData.type} 
        />;
    }
  
    return (
      <>
        <Helmet><title>Place a Bounty - WhistleBlower.ng</title></Helmet>
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
              <Award className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Place a <span className="gradient-text">Bounty</span></h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Offer a reward for information leading to the resolution of a case. Your identity is protected.
              </p>
            </motion.div>
            
            <BountyForm 
                onSubmit={handleBountySubmit} 
                isSubmitting={isSubmitting}
                uploadProgress={uploadProgress}
            />
          </div>
        </div>
      </>
    );
};

export default PlaceBountyPage;
