import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { FileText, Mic, Text } from 'lucide-react';

import ReportForm from './submit-report/ReportForm';
import SubmissionSuccess from './submit-report/SubmissionSuccess';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const SubmitReportPage = () => {
    const [searchParams] = useSearchParams();

    const [submissionType, setSubmissionType] = useState('text');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionData, setSubmissionData] = useState({ id: '', password: '', type: 'report' });
    const [isBountyReportFlow, setIsBountyReportFlow] = useState(false);

    useEffect(() => {
        if (searchParams.has('bounty_id')) {
            setIsBountyReportFlow(true);
            setSubmissionType('text'); // Default to text report for bounty responses
        } else {
            setIsBountyReportFlow(false);
        }
    }, [searchParams]);

    if (isSubmitted) {
        return <SubmissionSuccess 
            id={submissionData.id} 
            password={submissionData.password} 
            type={submissionData.type} 
        />;
    }

    // Generate SEO metadata
    const seoMeta = generateSEOMeta({
        ...DEFAULT_SEO_PAGES.submitReport,
        url: '/submit-report',
        type: 'website'
    });

    // Generate structured data
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Submit Report - WhistleBlower.ng',
            description: 'Report crimes and misconduct anonymously through Nigeria\'s most secure platform.',
            mainEntity: {
                '@type': 'Service',
                name: 'Anonymous Crime Reporting',
                description: 'Secure platform for reporting crimes and misconduct in Nigeria'
            }
        }
    ];
  
    return (
      <>
        <SEOHead
            {...seoMeta}
            structuredData={structuredData}
        />
        <div className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center mb-12">
              <FileText className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-6">Submit Your <span className="gradient-text">Report</span></h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {isBountyReportFlow ? 'Provide information for the bounty. Your identity is protected.' : 'Report crimes or submit feedback. Your identity is protected.'}
              </p>
            </motion.div>
            
            <div className="flex justify-center bg-muted p-1 space-x-1 mb-8">
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
                >
                    <ReportForm
                        submissionType={submissionType}
                        setIsSubmitting={setIsSubmitting}
                        setIsSubmitted={setIsSubmitted}
                        setSubmissionData={setSubmissionData}
                        isSubmitting={isSubmitting}
                    />
                </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </>
    );
};

export default SubmitReportPage;