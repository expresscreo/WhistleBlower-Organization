import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setNavigationState } from '@/lib/navigation-state';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Upload, Trash2, Play, Pause, Volume2 } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import ReportInfoCard from '@/components/admin/report-details/ReportInfoCard';
import ReportAttachmentsCard from '@/components/admin/report-details/ReportAttachmentsCard';
import ReportChat from '@/components/admin/report-details/ReportChat';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ReportStatusCard from '@/components/admin/report-details/ReportStatusCard';
import BountyStatusCard from '@/components/admin/bounty-details/BountyStatusCard';
import BountyHunterReportsPanel from '@/components/admin/bounty-details/BountyHunterReportsPanel';
import { getLocalFileUrl } from '@/lib/fileUtils';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import { isImagePath } from '@/lib/mediaUtils';
import { FieldError } from '@/components/ui/form-feedback';
import {
  countHunterSubmissionsForBounty,
  fetchHunterReportsForBounty,
  isValidAdminBountyStatusTransition,
} from '@/lib/bountyStatus';
import { notifyTrackingUpdatePush } from '@/lib/adminPushApi';
import { BOUNTY_CHAT_CONFIG } from '@/lib/chatEntityConfig';

const formatSupabaseError = (error, fallback = 'Update failed.') => {
    if (!error) return fallback;
    const message = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    return message || fallback;
};

// Voice Note Player Component
const VoiceNotePlayer = ({ voiceNotePath }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const loadAudioUrl = async () => {
            const url = await getLocalFileUrl(voiceNotePath);
            setAudioUrl(url);
        };
        if (voiceNotePath) {
            loadAudioUrl();
        }
    }, [voiceNotePath]);

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) return null;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Volume2 className="mr-2 h-5 w-5" />
                    Voice Note Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4">
                    <Button
                        onClick={togglePlayPause}
                        size="lg"
                        className="rounded-full w-12 h-12 p-0"
                    >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    
                    <div className="flex-1">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
                
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    preload="metadata"
                />
            </CardContent>
        </Card>
    );
};

const BountyDetails = () => {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const { invalidateCache } = useAdminData();
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingBounty, setIsDeletingBounty] = useState(false);
    const [statusFeedback, setStatusFeedback] = useState({ error: '', success: '' });
    const [hunterReportCount, setHunterReportCount] = useState(0);
    const [hunterReports, setHunterReports] = useState([]);
    const [loadingHunterReports, setLoadingHunterReports] = useState(false);

    const fetchBountyUpdates = useCallback(async (bountyUuid, forceRefresh = false) => {
        if (!bountyUuid) return;
        if (!forceRefresh && document.visibilityState !== 'visible') return;

        const { data, error } = await supabase
            .from('bounty_updates')
            .select('*')
            .eq('bounty_id', bountyUuid)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Failed to load bounty chat updates:', error);
            return;
        }

        setUpdates(data || []);
    }, []);

    const refreshHunterSubmissions = useCallback(async (bountyId) => {
        setLoadingHunterReports(true);
        try {
            const [count, reports] = await Promise.all([
                countHunterSubmissionsForBounty(supabase, bountyId),
                fetchHunterReportsForBounty(supabase, bountyId),
            ]);
            setHunterReportCount(count);
            setHunterReports(reports);
        } catch (error) {
            const message = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ');
            console.error('Failed to load hunter submissions:', message || error);
        } finally {
            setLoadingHunterReports(false);
        }
    }, []);

    const fetchBounty = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('bounties').select('*').eq('id', id).single();
        if (error || !data || data.is_trashed) {
            router.push('/admin/bounties');
            setLoading(false);
            return;
        }

        setBounty(data);
        await refreshHunterSubmissions(data.id);
        await fetchBountyUpdates(data.id);
        await supabase.from('bounties').update({ admin_has_viewed: true }).eq('id', data.id);
        setLoading(false);
    }, [id, router, refreshHunterSubmissions, fetchBountyUpdates]);

    const markBountyMessagesAsRead = useCallback(async (bountyUuid, readerId) => {
        if (!bountyUuid || !readerId) return;
        const { error } = await supabase.rpc('mark_bounty_messages_as_read', {
            p_bounty_id: bountyUuid,
            p_reader_id: readerId,
        });
        if (error) console.error('Error marking bounty messages as read:', error);
    }, []);

    useEffect(() => {
        fetchBounty();
    }, [fetchBounty]);

    useEffect(() => {
        if (!bounty?.id || !user?.id) return;

        const channel = supabase
            .channel(`bounty_chat_admin_${bounty.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bounty_updates', filter: `bounty_id=eq.${bounty.id}` },
                async (payload) => {
                    const newUpdate = payload.new;
                    if (!newUpdate.updated_by) {
                        setUpdates((prev) => {
                            const exists = prev.find((item) => item.id === newUpdate.id);
                            if (exists) return prev;
                            return [...prev, newUpdate];
                        });
                    }
                    if (document.visibilityState === 'visible' && !newUpdate.updated_by) {
                        setTimeout(() => markBountyMessagesAsRead(bounty.id, user.id), 500);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bounty_updates', filter: `bounty_id=eq.${bounty.id}` },
                () => fetchBountyUpdates(bounty.id, true)
            )
            .subscribe();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                await markBountyMessagesAsRead(bounty.id, user.id);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        markBountyMessagesAsRead(bounty.id, user.id);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [bounty?.id, user?.id, fetchBountyUpdates, markBountyMessagesAsRead]);

    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`bounty-hunter-submissions-${id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bounty_reports', filter: `bounty_id=eq.${id}` },
                () => refreshHunterSubmissions(id)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, refreshHunterSubmissions]);

    // Fetch a specific bounty report if a reportId query param is present
    useEffect(() => {
        const reportId = searchParams.get('reportId');
        if (!reportId) {
            setSelectedReport(null);
            return;
        }
        const fetchReport = async () => {
            setLoadingReport(true);
            const { data, error } = await supabase
                .from('reports')
                .select('*, organizations(name)')
                .eq('id', reportId)
                .maybeSingle();
            if (error) {
                setSelectedReport(null);
            } else {
                setSelectedReport(data || null);
            }
            setLoadingReport(false);
        };
        fetchReport();
    }, [searchParams]);

    const handleUpdateStatus = async (status) => {
        setStatusFeedback({ error: '', success: '' });

        if (!isValidAdminBountyStatusTransition(bounty?.status, status, hunterReportCount)) {
            setStatusFeedback({
                error:
                    'Report Received is only available after a hunter submits a report and you confirm it is legitimate.',
                success: '',
            });
            return;
        }

        const { data, error } = await supabase.from('bounties').update({ status }).eq('id', id).select().single();
        if (error) {
            const isMissingEnumValue = /invalid input value for enum bounty_status/i.test(
                `${error.message || ''} ${error.details || ''}`
            );
            const isMissingHunterReports = /bounty_status_report_received_requires_hunter_reports/i.test(
                `${error.message || ''} ${error.details || ''} ${error.hint || ''}`
            );
            let message = formatSupabaseError(error, 'Could not update bounty status.');
            if (isMissingEnumValue) {
                message =
                    'Report Received is not available in Supabase yet. Run database_migrations/fix_bounty_report_received_status.sql, then reload the API schema.';
            } else if (isMissingHunterReports) {
                message =
                    'Report Received requires at least one linked hunter report. Review submissions before confirming.';
            }
            console.error('Failed to update bounty status:', message, error);
            setStatusFeedback({ error: message, success: '' });
        } else {
            setBounty(data);
            setStatusFeedback({ error: '', success: 'Bounty status updated.' });
            invalidateCache('bounties');
        }
    };

    const handleReportStatusUpdate = async (status) => {
        if (!selectedReport) return;
        const { error } = await supabase.from('reports').update({ status }).eq('id', selectedReport.id);
        if (error) {
            console.error('Failed to update report status:', error);
        } else {
            setSelectedReport((prev) => ({ ...prev, status }));
            setHunterReports((prev) =>
                prev.map((report) =>
                    report.id === selectedReport.id ? { ...report, status } : report
                )
            );
            invalidateCache('bounties');
        }
    };

    const handleSendToEditor = async () => {
        if (bounty.status !== 'approved') return;

        const { data: existingNews, error: checkError } = await supabase
            .from('news')
            .select('id, bounty_amount')
            .eq('bounty_id', bounty.id)
            .maybeSingle();
        if (checkError) {
            console.error('Error checking for existing news item:', checkError);
            return;
        }
        if (existingNews) {
            if (!existingNews.bounty_amount && bounty.bounty_amount) {
                await supabase
                    .from('news')
                    .update({ bounty_amount: bounty.bounty_amount })
                    .eq('id', existingNews.id);
            }
            setNavigationState({
                prefillBountyAmount: bounty.bounty_amount || '',
                prefillBountyTypeOfCrime: bounty.type_of_crime || '',
                prefillBountyState: bounty.state || '',
                prefillBountyLga: bounty.location || '',
            });
            router.push(`/admin/news-editor/edit/${existingNews.id}`);
            return;
        }

        const firstImage = Array.isArray(bounty.evidence) ? bounty.evidence.find(isImagePath) : null;

        const { data: createdNews, error: newsError } = await supabase.from('news').insert({
            title: bounty.title,
            content: bounty.description,
            category: 'bounty',
            status: 'draft',
            bounty_id: bounty.id,
            bounty_amount: bounty.bounty_amount || null,
            featured_image: firstImage || null
        }).select('id').single();

        if (newsError) {
            console.error('Failed to create news draft:', newsError);
        } else {
            if (createdNews?.id) {
                setNavigationState({
                    prefillBountyAmount: bounty.bounty_amount || '',
                    prefillBountyTypeOfCrime: bounty.type_of_crime || '',
                    prefillBountyState: bounty.state || '',
                    prefillBountyLga: bounty.location || '',
                });
                router.push(`/admin/news-editor/edit/${createdNews.id}`);
            } else {
                router.push('/admin/news-editor');
            }
        }
    };

    const handleDeleteBounty = async () => {
        setIsDeletingBounty(true);
        try {
            const { error } = await supabase.from('bounties').update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq('id', id);
            if (error) {
                console.error('Failed to delete bounty:', error);
            } else {
                router.push('/admin/bounties');
            }
            setIsDeleteDialogOpen(false);
        } finally {
            setIsDeletingBounty(false);
        }
    };

    const handleSendMessage = async (messageText = newMessage, replyToMessageId = null) => {
        const messageToSend = (messageText || '').trim();
        if (!messageToSend || !user || !bounty) return;
        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        const optimisticUpdate = {
            id: tempId,
            bounty_id: bounty.id,
            message: messageToSend,
            updated_by: user.id,
            created_at: new Date().toISOString(),
            users: { name: profile?.name || 'You' },
        };

        setUpdates((prev) => [...prev, optimisticUpdate]);

        try {
            await supabase
                .from('bounties')
                .update({ placer_has_viewed: false })
                .eq('id', bounty.id);

            const insertPayload = {
                bounty_id: bounty.id,
                message: messageToSend,
                updated_by: user.id,
                is_read_by_placer: false,
                is_read_by_admin: false,
            };
            if (replyToMessageId) {
                insertPayload.reply_to_message_id = replyToMessageId;
            }

            const { data, error } = await supabase
                .from('bounty_updates')
                .insert(insertPayload)
                .select('*')
                .single();

            if (error) throw error;

            setUpdates((prev) =>
                prev.map((item) => (item.id === tempId ? data : item))
            );
            if (bounty.bounty_id) {
                notifyTrackingUpdatePush({ trackingType: 'bounty', trackingId: bounty.bounty_id }).catch((pushError) => {
                    console.error('Failed to send tracking push notification:', pushError);
                });
            }
        } catch (error) {
            console.error('Failed to send bounty message:', error);
            setUpdates((prev) => prev.filter((item) => item.id !== tempId));
            setNewMessage(messageToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectHunterReport = (reportUuid) => {
        router.push(`/admin/bounties/${id}?reportId=${reportUuid}`);
    };

    const handleClearHunterReportSelection = () => {
        router.push(`/admin/bounties/${id}`);
    };

    if (loading) {
        return (
            <>
                <PageHead title="Loading Bounty Details — WhistleBlower.ng" />
                <NavbarLoader />
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold">Bounty Details</h1>
                        {/* Loading indication is handled by NavbarLoader */}
                    </div>
                </div>
            </>
        );
    }
    if (!bounty) return null;

    const bountyAsReport = {
        ...bounty,
        report_id: bounty.bounty_id,
        incident_date: bounty.incident_date || bounty.created_at,
        category: bounty.type_of_crime,
        // Normalize fields for ReportInfoCard expectations
        lga: bounty.location,
        state: bounty.state,
        incident_address: bounty.full_address || bounty.incident_address || '',
        urgency: 'High',
        evidence_path: bounty.evidence,
        is_voice_note: false,
        organizations: { name: 'Public Bounty' }
    };
    const bountyEvidencePaths = Array.isArray(bounty.evidence) ? bounty.evidence : [];
    const hasBountyImages = bountyEvidencePaths.some(isImagePath);

    return (
        <>
            <PageHead title={`Bounty Details - ${bounty.bounty_id}`} />
            <div className="space-y-8">
                <Link href="/admin/bounties" className="flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to Bounties</Link>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">Bounty Details</h1>
                        <p className="text-muted-foreground mt-1">
                            {selectedReport ? (
                                <>
                                    Reviewing hunter submission{' '}
                                    <span className="font-mono font-medium text-foreground">{selectedReport.report_id}</span>
                                    {' · '}
                                    <span className="font-mono">{bounty.bounty_id}</span>
                                </>
                            ) : (
                                <>Bounty ID · <span className="font-mono font-medium text-foreground">{bounty.bounty_id}</span></>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSendToEditor} disabled={bounty.status !== 'approved'} className="bg-green-600 hover:bg-green-700 text-white uppercase">
                            <Upload className="mr-2 h-4 w-4" />Send to News Editor
                        </Button>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="uppercase">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                        </Button>
                    </div>
                </div>

                <FieldError message={statusFeedback.error} />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Voice Note Player - Show above title/description for voice note reports */}
                        {selectedReport && selectedReport.is_voice_note && selectedReport.evidence_path && selectedReport.evidence_path.length > 0 && (
                            <VoiceNotePlayer voiceNotePath={selectedReport.evidence_path[0]} />
                        )}
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">
                                    {selectedReport ? selectedReport.title || 'Hunter submission' : bounty.title}
                                </CardTitle>
                                {selectedReport && (
                                    <p className="text-sm text-muted-foreground pt-1">
                                        Submission details for this bounty
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {selectedReport ? selectedReport.description : bounty.description}
                                </p>
                            </CardContent>
                        </Card>

                        <BountyHunterReportsPanel
                            reports={hunterReports}
                            selectedReportId={selectedReport?.id ?? null}
                            onSelectReport={handleSelectHunterReport}
                            onClearSelection={selectedReport ? handleClearHunterReportSelection : undefined}
                            loading={loadingHunterReports}
                        />

                        <ReportChat
                            entity={bounty}
                            chatConfig={BOUNTY_CHAT_CONFIG}
                            updates={updates}
                            user={user}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            onSendMessage={handleSendMessage}
                            isSending={isSending}
                            onNewMessage={(newUpdate) => {
                                setUpdates((prev) => {
                                    const exists = prev.find((item) => item.id === newUpdate.id);
                                    if (exists) return prev;
                                    return [...prev, newUpdate];
                                });
                            }}
                            onRefreshUpdates={() => fetchBountyUpdates(bounty.id, true)}
                        />
                    </div>
                    <div className="space-y-8">
                        <ReportInfoCard report={selectedReport || bountyAsReport} />
                        {selectedReport ? (
                            <ReportStatusCard status={selectedReport.status} onStatusUpdate={handleReportStatusUpdate} />
                        ) : (
                            <BountyStatusCard
                                status={bounty.status}
                                onStatusUpdate={handleUpdateStatus}
                                hunterReportCount={hunterReportCount}
                            />
                        )}
                        {!selectedReport && hasBountyImages && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bounty Image Thumbnails</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EvidenceThumbnailGallery
                                        paths={bountyEvidencePaths}
                                        title=""
                                        showOtherAttachments={false}
                                    />
                                </CardContent>
                            </Card>
                        )}
                        <ReportAttachmentsCard 
                            evidencePath={(selectedReport && selectedReport.evidence_path) || bounty.evidence} 
                            isVoiceNote={selectedReport ? !!selectedReport.is_voice_note : false}
                            hideVoiceNote={selectedReport && selectedReport.is_voice_note}
                        />
                    </div>
                </div>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will move the bounty to the trash. It will be permanently deleted after 30 days.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBounty} loading={isDeletingBounty} className="bg-destructive hover:bg-destructive/90">
                            Move to Trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default BountyDetails;