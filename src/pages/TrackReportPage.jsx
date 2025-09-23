
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ReportSummary from '@/pages/track-report/ReportSummary';
import Chat from '@/components/Chat';
import RewardSection from '@/pages/track-report/RewardSection';
import UpdateReportDialog from '@/pages/track-report/UpdateReportDialog';
import { useNavigate } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const TrackReportPage = ({ reportId, password }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();

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
    
    const { data, error } = await supabase.from('report_updates').select('*').eq('report_id', currentReportData.id).order('created_at', { ascending: true });
    if (!error) {
      setUpdates(data);
    }
  }, []);

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

  const setAuthenticatedState = useCallback(async (report) => {
    setReportData(report);
    setAuthenticated(true);
    await markMessagesAsRead(report.id);
    await fetchUpdates(report, true);
  }, [markMessagesAsRead, fetchUpdates]);

  const handleLogout = useCallback(() => {
    setReportData(null);
    setAuthenticated(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const handleAuthentication = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('reports').select('*').eq('report_id', reportId).single();

    if (error || !data) {
        toast({ variant: 'destructive', title: 'Report Not Found', description: 'Please check the Report ID and try again.' });
        setLoading(false);
        navigate('/track');
        return;
    }

    if (data.is_feedback) {
        await setAuthenticatedState(data);
        setLoading(false);
        return;
    }

    const { data: verifyData, error: verifyError } = await supabase.rpc('verify_password', { password: password, hash: data.anonymous_password_hash });

    if (verifyError || !verifyData) {
        toast({ variant: 'destructive', title: 'Authentication Failed', description: 'The password you entered is incorrect.' });
        setLoading(false);
        navigate('/track');
        return;
    }

    await supabase.from('reports').update({ reporter_has_viewed: true }).eq('id', data.id);
    const fullReportData = { ...data, reporter_has_viewed: true };
    await setAuthenticatedState(fullReportData);
    setLoading(false);
  }, [reportId, password, navigate, toast, setAuthenticatedState]);

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
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${reportData.id}` }, (payload) => {
                setReportData(prev => ({...prev, ...payload.new}));
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
  }, [reportData, fetchUpdates, markMessagesAsRead]);


  const handleUpdateReport = async () => {
    if (!updateMessage.trim() && newEvidenceFiles.length === 0) {
      toast({ variant: "destructive", title: "Nothing to update", description: "Please add a message or files." });
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
          toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
          setIsUpdating(false);
          return;
        }
        newPaths.push(filePath);
      }
    }
    
    const { error: updateError } = await supabase.from('report_updates').insert({ report_id: reportData.id, message: `${updateMessage}\n\n${newPaths.length > 0 ? `Added ${newPaths.length} new file(s).` : ''}`.trim(), updated_by: null });
    
    if (updateError) {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not add your update.' });
    } else {
      const updatedEvidence = [...(reportData.evidence_path || []), ...newPaths];
      const { data: updatedReportData, error: reportUpdateError } = await supabase.from('reports').update({ evidence_path: updatedEvidence, admin_has_viewed: false }).eq('id', reportData.id).select().single();
      
      if (!reportUpdateError) {
        setReportData(updatedReportData);
        toast({ title: "Success", description: "Your report has been updated." });
        setUpdateModalOpen(false);
        setUpdateMessage('');
        setNewEvidenceFiles([]);
      } else {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save new evidence links.' });
      }
    }
    setIsUpdating(false);
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
                    <h1 className="text-2xl sm:text-3xl font-bold break-words">{reportData.title}</h1>
                </div>
                <div className="space-y-8">
                    <ReportSummary report={reportData} onUpdateReport={() => setUpdateModalOpen(true)} onLogout={handleLogout} />
                    {!reportData.is_feedback && <RewardSection report={reportData} />}
                    <Chat 
                      report={reportData}
                      updates={updates}
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
        <UpdateReportDialog isOpen={isUpdateModalOpen} onOpenChange={setUpdateModalOpen} onUpdate={handleUpdateReport} updateMessage={updateMessage} setUpdateMessage={setUpdateMessage} newEvidenceFiles={newEvidenceFiles} setNewEvidenceFiles={setNewEvidenceFiles} isUpdating={isUpdating} uploadProgress={uploadProgress} />
      )}
    </>
  );
};
export default TrackReportPage;
