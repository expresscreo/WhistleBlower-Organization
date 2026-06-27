import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import ReportActions from '@/components/admin/report-details/ReportActions';
import NavbarLoader from '@/components/admin/NavbarLoader';
import ReportChat from '@/components/admin/report-details/ReportChat';
import ReportAssignment from '@/components/admin/report-details/ReportAssignment';
import ReportInfoCard from '@/components/admin/report-details/ReportInfoCard';
import ReportStatusCard from '@/components/admin/report-details/ReportStatusCard';
import ReportAttachmentsCard from '@/components/admin/report-details/ReportAttachmentsCard';
import { FieldError } from '@/components/ui/form-feedback';
import FormattedReportDescription from '@/components/report/FormattedReportDescription';
import VoiceNotePlayerList from '@/components/media/VoiceNotePlayerList';
import {
  findVoiceNotePath,
  findVoiceNotePaths,
  splitVoiceNoteDescription,
} from '@/lib/voiceNoteUtils';
import { notifyAdminMessage, notifyStatusUpdate } from '@/lib/notify';

const formatSupabaseError = (error, fallback = 'Action failed.') => {
  if (!error) return fallback;
  const message = [error.message, error.details, error.hint].filter(Boolean).join(' ');
  return message || fallback;
};

const ReportDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile, loading: profileLoading } = useAuth();
  
  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [orgUsers, setOrgUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [actionFeedback, setActionFeedback] = useState({ error: '', success: '' });
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Refs to prevent unnecessary re-fetching
  const hasInitialData = useRef(false);
  const lastFetchTime = useRef(0);
  const fetchReportDetailsRef = useRef(null);
  const fetchUpdatesRef = useRef(null);
  
  const canAssign = !profileLoading && (profile?.user_type === 'super_admin' || profile?.user_type === 'executive_admin' || profile?.user_type === 'organization_admin');

  const markMessagesAsRead = useCallback(async (reportId, readerId) => {
    if (!reportId || !readerId) return;
    const { error } = await supabase.rpc('mark_messages_as_read', {
      p_report_id: reportId,
      p_reader_id: readerId,
    });
    if (error) console.error("Error marking messages as read:", error);
  }, []);

  const fetchUpdates = useCallback(async (forceRefresh = false) => {
      console.log('fetchUpdates (ReportDetails) called:', { forceRefresh, hasData: hasInitialData.current, reportId: id });
      
      if(!id) return;
      
      // Prevent unnecessary re-fetching
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;
      
      // If we already have data and it's been less than 30 seconds, don't fetch again unless forced
      if (hasInitialData.current && timeSinceLastFetch < 30000 && !forceRefresh) {
        console.log('Skipping fetch - too soon since last fetch');
        return;
      }
      
      // Skip fetch if page is not visible and not forced
      if (!forceRefresh && document.visibilityState !== 'visible') {
        console.log('Skipping fetch - page not visible');
        return;
      }
      
      console.log('Actually fetching report updates...');
      lastFetchTime.current = now;
      
      try {
        const { data: updatesData, error: updatesError } = await supabase.from('report_updates').select('*, users(name)').eq('report_id', id).order('created_at', { ascending: true });
        if (updatesError) throw updatesError;
        setUpdates(updatesData);
      } catch(error) {
        console.error('Error fetching report updates:', error);
      }
  }, [id]);

  // Debounced version to prevent rapid successive calls
  const debouncedFetchUpdates = useCallback(() => {
    if (!id) return;
    const timeoutId = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        fetchUpdates(true);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [id, fetchUpdates]);

  const fetchReportDetails = useCallback(async (forceRefresh = false) => {
    console.log('fetchReportDetails called:', { forceRefresh, hasData: hasInitialData.current, reportId: id });
    
    if(!id || !profile) return;
    
    // Prevent unnecessary re-fetching
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // If we already have data and it's been less than 30 seconds, don't fetch again unless forced
    if (hasInitialData.current && timeSinceLastFetch < 30000 && !forceRefresh) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    
    // Skip fetch if page is not visible and not forced
    if (!forceRefresh && document.visibilityState !== 'visible') {
      console.log('Skipping fetch - page not visible');
      return;
    }
    
    console.log('Actually fetching report details...');
    setLoading(true);
    lastFetchTime.current = now;
    
    try {
      const { data: reportData, error: reportError } = await supabase.from('reports').select('*, organizations(name)').eq('id', id).single();
      
      if (reportError || (reportData.is_trashed && profile.user_type !== 'super_admin')) {
        setReport(null);
        router.push('/admin/reports');
        return;
      }

      setReport(reportData);
      await markMessagesAsRead(reportData.id, user.id);
      fetchUpdates(true);

      if (reportData.organization_id && canAssign) {
          const { data: usersData, error: usersError } = await supabase.from('users').select('id, name, user_type').eq('organization_id', reportData.organization_id);
          if(usersError) throw usersError;
          const assignableUsers = usersData.filter(u => ['organization_admin', 'staff'].includes(u.user_type));
          setOrgUsers(assignableUsers);
          
          const { data: assignments, error: assignmentsError } = await supabase.from('report_assignments').select('assigned_to').eq('report_id', id);
          if (assignmentsError) throw assignmentsError;
          const assignedIds = assignments.map(a => a.assigned_to);
          const currentAssignedUsers = assignableUsers.filter(u => assignedIds.includes(u.id));
          setSelectedUsers(currentAssignedUsers);
      }

      await supabase.from('reports').update({ admin_has_viewed: true }).eq('id', id);
      hasInitialData.current = true;
    } catch (error) {
       console.error('Error fetching report details:', error);
       setReport(null);
    } finally {
        setLoading(false);
    }
  }, [id, canAssign, profile, router, user, markMessagesAsRead, fetchUpdates]);

  // Store the latest fetch functions in refs
  fetchReportDetailsRef.current = fetchReportDetails;
  fetchUpdatesRef.current = fetchUpdates;

  // Initial data fetch - only runs once when profile is loaded
  useEffect(() => {
    if (!profileLoading && profile && !hasInitialData.current) {
        fetchReportDetails(true); // Force initial fetch
    }
  }, [profileLoading, profile?.id, id]); // Only depend on stable references

  useEffect(() => {
    if (id && user?.id) {
        console.log('Setting up ReportDetails real-time subscription for report:', id);
        
        const channel = supabase
            .channel(`report_details_main_${id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'report_updates', 
                filter: `report_id=eq.${id}` 
            }, async (payload) => {
                console.log('ReportDetails main subscription received INSERT:', payload.new);
                
                const newUpdate = payload.new;
                
                // Add message immediately to state if it's from reporter (not current admin user)
                if (!newUpdate.updated_by) {
                    console.log('Adding reporter message to admin chat immediately');
                    setUpdates(prev => {
                        const exists = prev.find(u => u.id === newUpdate.id);
                        if (exists) {
                            console.log('Message already exists, skipping');
                            return prev;
                        }
                        console.log('Adding new reporter message to state');
                        return [...prev, newUpdate];
                    });
                } else if (newUpdate.updated_by !== user.id) {
                    console.log('Adding other admin message to chat immediately');
                    setUpdates(prev => {
                        const exists = prev.find(u => u.id === newUpdate.id);
                        if (exists) return prev;
                        return [...prev, newUpdate];
                    });
                }
                
                // Mark messages as read if page is visible
                if (document.visibilityState === 'visible' && !newUpdate.updated_by) {
                    setTimeout(() => markMessagesAsRead(id, user.id), 500);
                }
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'report_updates', 
                filter: `report_id=eq.${id}` 
            }, async (payload) => {
                console.log('ReportDetails main subscription received UPDATE:', payload.new);
                // Handle read status updates by refreshing
                setTimeout(() => fetchUpdates(true), 300);
            })
            .subscribe((status) => {
                console.log('ReportDetails main subscription status:', status);
            });

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                await markMessagesAsRead(id, user.id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            console.log('Cleaning up ReportDetails main subscription');
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }
  }, [id, user?.id, markMessagesAsRead, fetchUpdates]);

  // Removed excessive polling that was causing performance issues

  const handleStatusUpdate = useCallback(async (newStatus) => {
    const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('Failed to update status:', error);
    } else {
      setReport(prev => ({...prev, status: newStatus}));
      notifyStatusUpdate(id, newStatus);
    }
  }, [id]);

  const handleAssignReport = useCallback(async (newSelectedUserIds) => {
    if (!canAssign) return;
    try {
        const { error: deleteError } = await supabase.from('report_assignments').delete().eq('report_id', id);
        if (deleteError) throw deleteError;

        if (newSelectedUserIds.length > 0) {
            const assignments = newSelectedUserIds.map(userId => ({ report_id: id, assigned_to: userId, assigned_by: user.id }));
            const { error } = await supabase.from('report_assignments').insert(assignments);
            if (error) throw error;
        }
        const currentAssignedUsers = orgUsers.filter(u => newSelectedUserIds.includes(u.id));
        setSelectedUsers(currentAssignedUsers);
        if (newSelectedUserIds.length > 0 && report.status !== 'Assigned') handleStatusUpdate('Assigned');
    } catch (error) {
        console.error('Failed to assign report:', error);
    }
  }, [id, user, canAssign, report?.status, handleStatusUpdate, orgUsers]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !profile) return;
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const newUpdate = {
        id: tempId,
        report_id: id,
        message: newMessage,
        updated_by: user.id,
        created_at: new Date().toISOString(),
        is_read: false,
        users: { name: profile.name || 'You' }
    };

    setUpdates(prev => [...prev, newUpdate]);
    setNewMessage('');
    
    try {
        await supabase.from('reports').update({ reporter_has_viewed: false }).eq('id', id);
        const { error } = await supabase.from('report_updates').insert({ 
          report_id: id, 
          message: newUpdate.message, 
          updated_by: user.id, 
          is_read: false 
        });
        
        if(error) {
            console.error('Failed to send message:', error);
            setUpdates(prev => prev.filter(u => u.id !== tempId));
        } else {
            notifyAdminMessage(id, newUpdate.message);
        }
    } catch(error) {
        console.error('Failed to send message:', error);
        setUpdates(prev => prev.filter(u => u.id !== tempId));
    } finally {
        setIsSending(false);
    }
  };

  const buildPdfPayload = useCallback(() => {
    const paths = Array.isArray(report.evidence_path)
      ? report.evidence_path
      : report.evidence_path
        ? [report.evidence_path]
        : [];

    let voiceNote = null;
    let attachments = paths.map((file_url) => ({ file_url }));

    if (report.is_voice_note && paths.length > 0) {
      const voicePaths = findVoiceNotePaths(paths);
      const primaryVoicePath = voicePaths[0] || findVoiceNotePath(paths);
      voiceNote = primaryVoicePath ? { file_url: primaryVoicePath } : null;
      attachments = paths
        .filter((path) => !voicePaths.includes(path))
        .map((file_url) => ({ file_url }));
    }

    return {
      report,
      updates,
      attachments,
      voiceNote,
      assignedUsers: selectedUsers.map((user) => ({ name: user.name })),
    };
  }, [report, updates, selectedUsers]);

  const handleDownloadPDF = async () => {
    if (!report) return;

    setIsPdfGenerating(true);
    setActionFeedback({ error: '', success: '' });

    try {
      const { downloadReportPdf } = await import('@/lib/generateReportPdf');
      await downloadReportPdf(buildPdfPayload());
    } catch (error) {
      setActionFeedback({
        error: error.message || 'Could not generate PDF.',
        success: '',
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleTrashRestore = async () => {
    const is_trashed = !report.is_trashed;
    const trashed_at = is_trashed ? new Date() : null;
    const { error } = await supabase.from('reports').update({ is_trashed, trashed_at }).eq('id', id);
    if (error) {
      console.error('Failed to update trash status:', error);
    } else {
      setReport(prev => ({ ...prev, is_trashed, trashed_at }));
      if (is_trashed) router.push('/admin/reports');
      else fetchReportDetails();
    }
  };
  
  const handlePermanentDelete = async () => {
    if (profile?.user_type !== 'super_admin' || !report.is_trashed) return;
    setActionFeedback({ error: '', success: '' });
    const { error } = await supabase.rpc('delete_report_and_dependencies', { p_report_id: id });
    if (error) {
      const message = formatSupabaseError(error, 'Failed to permanently delete report.');
      console.error('Failed to permanently delete report:', message, error);
      setActionFeedback({ error: message, success: '' });
    } else {
      router.push('/admin/trashed-reports');
    }
  };

  const resolveVoiceNoteUrl = useCallback(async (mediaPath) => {
    const { data, error } = await supabase.functions.invoke('create-signed-url', {
      body: { path: mediaPath },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data.signedUrl;
  }, []);

  const renderReportDescription = () => {
    if (!report) return null;

    const evidencePaths = Array.isArray(report.evidence_path)
      ? report.evidence_path
      : report.evidence_path
        ? [report.evidence_path]
        : [];
    const voiceNotePaths = report.is_voice_note ? findVoiceNotePaths(evidencePaths) : [];
    const voiceNoteDescription = splitVoiceNoteDescription(report.description);

    if (!report.is_voice_note || !voiceNotePaths.length) {
      return <FormattedReportDescription text={report.description} />;
    }

    if (voiceNoteDescription.hasMarker) {
      return (
        <div className="space-y-5">
          <FormattedReportDescription text={voiceNoteDescription.intro} />
          <VoiceNotePlayerList paths={evidencePaths} resolveUrl={resolveVoiceNoteUrl} showDownload />
          {voiceNoteDescription.remainder.trim() ? (
            <FormattedReportDescription text={voiceNoteDescription.remainder} />
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <FormattedReportDescription text={report.description} />
        <VoiceNotePlayerList paths={evidencePaths} resolveUrl={resolveVoiceNoteUrl} showDownload />
      </div>
    );
  };

  if (loading || profileLoading) {
    return (
      <>
        <PageHead title="Loading Report Details — WhistleBlower.ng" />
        <NavbarLoader />
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Report Details</h1>
            {/* Loading indication is handled by NavbarLoader */}
          </div>
        </div>
      </>
    );
  }
  if (!report) {
    return null;
  }

  return (
    <>
      <PageHead title={`Report Details - ${report.report_id}`} />
      <div className="space-y-8">
        <Link href={report.is_trashed ? "/admin/trashed-reports" : "/admin/reports"} className="flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to Reports</Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Report Details</h1>
            <p className="text-muted-foreground mt-1">Report ID - {report.report_id}</p>
          </div>
          <ReportActions
            report={report}
            userRole={profile?.user_type}
            onDownloadPDF={handleDownloadPDF}
            onTrashRestore={handleTrashRestore}
            onPermanentDelete={handlePermanentDelete}
            isPdfGenerating={isPdfGenerating}
          />
        </div>

        <FieldError message={actionFeedback.error} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader><CardTitle className="text-2xl">{report.title}</CardTitle></CardHeader>
              <CardContent>{renderReportDescription()}</CardContent>
            </Card>
            <ReportChat 
              report={report}
              updates={updates.filter(upd => upd.message)} 
              user={user} 
              newMessage={newMessage} 
              setNewMessage={setNewMessage} 
              onSendMessage={handleSendMessage} 
              isSending={isSending}
              onNewMessage={(newUpdate) => {
                console.log('ReportChat component received new message:', newUpdate);
                // Force immediate update
                setUpdates(prev => {
                  const exists = prev.find(u => u.id === newUpdate.id);
                  if (exists) {
                    console.log('Message already exists in ReportChat callback');
                    return prev;
                  }
                  console.log('Adding message via ReportChat callback');
                  return [...prev, newUpdate];
                });
                
                // Auto-mark messages as read for admin if it's from reporter
                if (!newUpdate.updated_by) {
                  setTimeout(() => markMessagesAsRead(id, user.id), 1000);
                }
              }}
              onRefreshUpdates={() => {
                console.log('Admin refreshing updates');
                fetchUpdates(true);
              }}
            />
          </div>

          <div className="space-y-8">
            <ReportInfoCard report={report} />
            <ReportStatusCard status={report.status} onStatusUpdate={handleStatusUpdate}/>
            <ReportAttachmentsCard
              evidencePath={report.evidence_path}
              isVoiceNote={report.is_voice_note}
              hideVoiceNote={report.is_voice_note}
            />
            {canAssign && <ReportAssignment orgUsers={orgUsers} selectedUsers={selectedUsers} onAssignReport={handleAssignReport} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportDetails;