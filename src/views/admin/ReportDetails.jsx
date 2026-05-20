import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import ReportActions from '@/components/admin/report-details/ReportActions';
import NavbarLoader from '@/components/admin/NavbarLoader';
import ReportChat from '@/components/admin/report-details/ReportChat';
import ReportAssignment from '@/components/admin/report-details/ReportAssignment';
import ReportInfoCard from '@/components/admin/report-details/ReportInfoCard';
import ReportStatusCard from '@/components/admin/report-details/ReportStatusCard';
import ReportAttachmentsCard from '@/components/admin/report-details/ReportAttachmentsCard';


const ReportDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, loading: profileLoading } = useAuth();
  
  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [orgUsers, setOrgUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
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
        toast({ title: 'Error fetching updates', description: error.message, variant: 'destructive' });
      }
  }, [id, toast]);

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
        toast({ title: 'Report not found', description: 'This report may have been deleted or you do not have permission to view it.', variant: 'destructive' });
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
       toast({ title: 'Error fetching report details', description: error.message, variant: 'destructive' });
       setReport(null);
    } finally {
        setLoading(false);
    }
  }, [id, toast, canAssign, profile, router, user, markMessagesAsRead, fetchUpdates]);

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
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated successfully!' });
      setReport(prev => ({...prev, status: newStatus}));
    }
  }, [id, toast]);

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
        toast({ title: 'Report assignments updated successfully' });
        const currentAssignedUsers = orgUsers.filter(u => newSelectedUserIds.includes(u.id));
        setSelectedUsers(currentAssignedUsers);
        if (newSelectedUserIds.length > 0 && report.status !== 'Assigned') handleStatusUpdate('Assigned');
    } catch (error) {
        toast({ title: 'Failed to assign report', description: error.message, variant: 'destructive' });
    }
  }, [id, user, canAssign, toast, report?.status, handleStatusUpdate, orgUsers]);

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
            toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
            setUpdates(prev => prev.filter(u => u.id !== tempId));
        } else {
            // No need to fetch here, optimistic update is enough.
            // The realtime subscription will update if another user messages.
        }
    } catch(error) {
        toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
        setUpdates(prev => prev.filter(u => u.id !== tempId));
    } finally {
        setIsSending(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.text(`Report: ${report.report_id}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Title: ${report.title}`, 14, 32);
    doc.text(`Status: ${report.status}`, 14, 42);
    doc.text(`Description:`, 14, 52);
    const splitDescription = doc.splitTextToSize(report.description, 180);
    doc.text(splitDescription, 14, 58);
    doc.save(`report-${report.report_id}.pdf`);
  };

  const handleTrashRestore = async () => {
    const is_trashed = !report.is_trashed;
    const trashed_at = is_trashed ? new Date() : null;
    const { error } = await supabase.from('reports').update({ is_trashed, trashed_at }).eq('id', id);
    if (error) {
      toast({ title: `Failed to ${is_trashed ? 'move to trash' : 'restore'} report`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Report ${is_trashed ? 'moved to trash' : 'restored'} successfully!` });
      setReport(prev => ({ ...prev, is_trashed, trashed_at }));
      if (is_trashed) router.push('/admin/reports');
      else fetchReportDetails();
    }
  };
  
  const handlePermanentDelete = async () => {
    if (profile?.user_type !== 'super_admin' || !report.is_trashed) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to permanently delete report', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report permanently deleted' });
      router.push('/admin/trashed-reports');
    }
  };

  if (loading || profileLoading) {
    return (
      <>
        <Helmet><title>Loading Report Details - WhistleBlower.ng</title></Helmet>
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
  if (!report) return <div className="p-4 text-center">Report not found or access denied.</div>;

  return (
    <>
      <Helmet><title>Report Details - {report.report_id}</title></Helmet>
      <div className="space-y-8">
        <Link href={report.is_trashed ? "/admin/trashed-reports" : "/admin/reports"} className="flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to Reports</Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Report Details</h1>
            <p className="text-muted-foreground mt-1">Report ID - {report.report_id}</p>
          </div>
          <ReportActions report={report} userRole={profile?.user_type} onDownloadPDF={handleDownloadPDF} onTrashRestore={handleTrashRestore} onPermanentDelete={handlePermanentDelete}/>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader><CardTitle className="text-2xl">{report.title}</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap">{report.description}</p></CardContent>
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
            <ReportAttachmentsCard evidencePath={report.evidence_path} isVoiceNote={report.is_voice_note} />
            {canAssign && <ReportAssignment orgUsers={orgUsers} selectedUsers={selectedUsers} onAssignReport={handleAssignReport} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportDetails;