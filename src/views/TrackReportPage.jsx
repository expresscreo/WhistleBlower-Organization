import { useRouter } from 'next/navigation';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import {
  authenticateTrackedReport,
  fetchTrackedReportUpdates,
  sendTrackedReportMessage,
  updateTrackedReport,
} from '@/lib/trackApi';
import ReportSummary from '@/views/track-report/ReportSummary';
import Chat from '@/components/Chat';
import RewardSection from '@/views/track-report/RewardSection';
import UpdateReportDialog from '@/views/track-report/UpdateReportDialog';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const TrackReportPage = ({ reportId, password }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [updateFeedback, setUpdateFeedback] = useState({ error: '', success: '' });
  const router = useRouter();

  const markMessagesAsRead = useCallback(async (reportId) => {
    if (!reportId) return;
    const { error } = await supabase.rpc('mark_messages_as_read', { p_report_id: reportId, p_reader_id: null });
    if (error) console.error("Error marking messages as read:", error);
  }, []);

  const fetchUpdates = useCallback(async (currentReportData, forceRefresh = false) => {
    if (!currentReportData) return;
    
    // Skip fetch if page is not visible and not forced
    if (!forceRefresh && document.visibilityState !== 'visible') {
      return;
    }
    
    try {
      const { updates: nextUpdates } = await fetchTrackedReportUpdates(reportId, password);
      setUpdates(nextUpdates || []);
    } catch (error) {
      console.error('Error fetching report updates:', error);
    }
  }, [reportId, password]);

  // Debounced version to prevent rapid successive calls
  const debouncedFetchUpdates = useCallback(() => {
    if (!reportData) return;
    const timeoutId = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        fetchUpdates(reportData, true);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [reportData, fetchUpdates]);

  const setAuthenticatedState = useCallback(async (report, shouldFetchUpdates = true) => {
    setReportData(report);
    setAuthenticated(true);
    await markMessagesAsRead(report.id);
    if (shouldFetchUpdates) {
      await fetchUpdates(report, true);
    }
  }, [markMessagesAsRead, fetchUpdates]);

  const handleLogout = useCallback(() => {
    setReportData(null);
    setAuthenticated(false);
    router.replace('/');
  }, [router]);

  const handleAuthentication = useCallback(async () => {
    setLoading(true);
    try {
        const { report, updates: initialUpdates } = await authenticateTrackedReport(reportId, password);
        setUpdates(initialUpdates || []);
        await setAuthenticatedState(report, false);
    } catch (error) {
        sessionStorage.setItem('trackAuthError', error.message || 'Please check the Report ID and password.');
        setLoading(false);
        router.push('/track');
        return;
    }
    setLoading(false);
  }, [reportId, password, router, setAuthenticatedState]);

  useEffect(() => {
    handleAuthentication();
  }, [handleAuthentication]);

  useEffect(() => {
    if (reportData?.id) {
        const channel = supabase
            .channel(`report_updates_${reportData.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'report_updates', filter: `report_id=eq.${reportData.id}` }, async (payload) => {
                fetchUpdates(reportData, true);
                if (document.visibilityState === 'visible') {
                    await markMessagesAsRead(reportData.id);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${reportData.id}` }, async () => {
                try {
                  const { report, updates: nextUpdates } = await authenticateTrackedReport(reportId, password);
                  setReportData(report);
                  setUpdates(nextUpdates || []);
                } catch (error) {
                  console.error('Error refreshing report after realtime update:', error);
                }
            })
            .subscribe();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                await markMessagesAsRead(reportData.id);
                // Use debounced fetch to prevent rapid successive calls
                debouncedFetchUpdates();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }
  }, [reportData, fetchUpdates, markMessagesAsRead, debouncedFetchUpdates, reportId, password]);


  const handleUpdateReport = async () => {
    setUpdateFeedback({ error: '', success: '' });
    if (!updateMessage.trim() && newEvidenceFiles.length === 0) {
      setUpdateFeedback({ error: 'Please add a message or files.', success: '' });
      return;
    }
    setIsUpdating(true);
    let newPaths = [];
    if (newEvidenceFiles.length > 0) {
      const reportUUID = reportData.id || crypto.randomUUID();
      for (let i = 0; i < newEvidenceFiles.length; i++) {
        const file = newEvidenceFiles[i];
        const filePath = `reports/${reportUUID}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('wb_evio').upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          setUpdateFeedback({ error: `Could not upload ${file.name}.`, success: '' });
          setIsUpdating(false);
          return;
        }
        newPaths.push(filePath);
      }
    }
    
    try {
      const { report: updatedReportData, update } = await updateTrackedReport({
        reportId,
        password,
        message: updateMessage,
        evidencePaths: newPaths,
      });

      setReportData(updatedReportData);
      if (update) {
        setUpdates(prev => {
          const exists = prev.find(u => u.id === update.id);
          return exists ? prev : [...prev, update];
        });
      }
      setUpdateFeedback({ error: '', success: 'Your report has been updated.' });
      setUpdateModalOpen(false);
      setUpdateMessage('');
      setNewEvidenceFiles([]);
    } catch (error) {
      console.error('Report update failed:', error);
      setUpdateFeedback({ error: 'Could not update your report.', success: '' });
    }
    setIsUpdating(false);
  };

  const handleSendMessage = async ({ message, replyToMessageId }) => {
    setIsSendingMessage(true);
    try {
      const { update } = await sendTrackedReportMessage({
        reportId,
        password,
        message,
        replyToMessageId,
      });

      return update;
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  // Generate SEO metadata
  const seoMeta = generateSEOMeta({
    ...DEFAULT_SEO_PAGES.trackReport,
    url: '/track-report',
    type: 'website'
  });

  // Generate structured data
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Track Your Report - WhistleBlower.ng',
      description: 'Securely track the status of your submitted report using your unique Report ID.',
      mainEntity: {
        '@type': 'Service',
        name: 'Report Tracking Service',
        description: 'Secure platform for tracking submitted crime reports and feedback in Nigeria'
      }
    }
  ];

  return (
    <>
      <SEOHead
        {...seoMeta}
        structuredData={structuredData}
      />
      <div className="container mx-auto px-4 py-8 sm:py-16 md:py-24 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {authenticated && reportData && (
              <motion.div key="reportDetails" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Report Summary</h1>
                </div>
                <div className="space-y-8">
                    <ReportSummary report={reportData} onUpdateReport={() => setUpdateModalOpen(true)} onLogout={handleLogout} />
                    {!reportData.is_feedback && <RewardSection report={reportData} />}
                    <Chat 
                      report={reportData}
                      updates={updates}
                      onSendMessage={handleSendMessage}
                      isSending={isSendingMessage}
                      onNewMessage={(newUpdate) => {
                        console.log('Reporter TrackReportPage received new message:', newUpdate);
                        // Add the new message to updates immediately
                        setUpdates(prev => {
                          // Check if message already exists to avoid duplicates
                          const exists = prev.find(u => u.id === newUpdate.id);
                          if (exists) return prev;
                          return [...prev, newUpdate];
                        });
                        
                        // Mark admin messages as read when visible
                        if (document.visibilityState === 'visible' && newUpdate.updated_by) {
                          setTimeout(() => markMessagesAsRead(reportData.id), 500);
                        }
                      }}
                      onRefreshUpdates={() => {
                        console.log('Reporter refreshing updates');
                        fetchUpdates(reportData, true);
                      }}
                    />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {reportData && (
        <UpdateReportDialog isOpen={isUpdateModalOpen} onOpenChange={setUpdateModalOpen} onUpdate={handleUpdateReport} updateMessage={updateMessage} setUpdateMessage={setUpdateMessage} newEvidenceFiles={newEvidenceFiles} setNewEvidenceFiles={setNewEvidenceFiles} isUpdating={isUpdating} uploadProgress={uploadProgress} updateError={updateFeedback.error} updateSuccess={updateFeedback.success} />
      )}
    </>
  );
};
export default TrackReportPage;
