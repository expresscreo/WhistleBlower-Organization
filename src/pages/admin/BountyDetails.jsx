import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
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
import { getLocalFileUrl } from '@/lib/fileUtils';

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
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { user } = useAuth();
    const { invalidateCache } = useAdminData();
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [updates, setUpdates] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchBounty = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('bounties').select('*').eq('id', id).single();
        if (error || !data || data.is_trashed) {
            toast({ variant: 'destructive', title: 'Bounty not found', description: 'This bounty may have been deleted or does not exist.' });
            navigate('/admin/bounties');
        } else {
            setBounty(data);
        }
        setLoading(false);
    }, [id, toast, navigate]);

    useEffect(() => {
        fetchBounty();
    }, [fetchBounty]);

    // Fetch a specific bounty report if a reportId query param is present
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
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
                // Non-blocking toast; we still show bounty details
                toast({ variant: 'destructive', title: 'Failed to load bounty report', description: error.message });
            } else {
                setSelectedReport(data || null);
            }
            setLoadingReport(false);
        };
        fetchReport();
    }, [location.search, toast]);

    const handleUpdateStatus = async (status) => {
        const { data, error } = await supabase.from('bounties').update({ status }).eq('id', id).select().single();
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update status', description: error.message });
        } else {
            toast({ title: 'Bounty status updated!' });
            setBounty(data);
            invalidateCache('bounties');
        }
    };

    const handleReportStatusUpdate = async (status) => {
        if (!selectedReport) return;
        const { error } = await supabase.from('reports').update({ status }).eq('id', selectedReport.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update report status', description: error.message });
        } else {
            toast({ title: 'Report status updated!' });
            setSelectedReport(prev => ({ ...prev, status }));
            invalidateCache('bounties');
        }
    };

    const handleSendToEditor = async () => {
        if (bounty.status !== 'approved') {
            toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'Only approved bounties can be sent to the editor.' });
            return;
        }

        const { data: existingNews, error: checkError } = await supabase.from('news').select('id').eq('bounty_id', bounty.id).maybeSingle();
        if (checkError) {
            toast({ variant: 'destructive', title: 'Error checking for existing news item', description: checkError.message });
            return;
        }
        if (existingNews) {
            toast({ title: 'Already Sent', description: 'This bounty has already been sent to the News Editor.' });
            navigate('/admin/news-editor');
            return;
        }

        const { data: createdNews, error: newsError } = await supabase.from('news').insert({
            title: bounty.title,
            content: bounty.description,
            category: 'bounty',
            status: 'draft',
            bounty_id: bounty.id,
            featured_image: Array.isArray(bounty.evidence) && bounty.evidence.length > 0 ? bounty.evidence[0] : null
        }).select('id').single();

        if (newsError) {
            toast({ variant: 'destructive', title: 'Failed to create news draft', description: newsError.message });
        } else {
            toast({ title: 'Success!', description: 'Bounty sent to News Editor as a draft.' });
            // Navigate directly to the editor for the new draft and prefill bounty amount
            if (createdNews?.id) {
                navigate(`/admin/news-editor/edit/${createdNews.id}`, {
                    state: { prefillBountyAmount: bounty.bounty_amount || '' }
                });
            } else {
                navigate('/admin/news-editor');
            }
        }
    };

    const handleDeleteBounty = async () => {
        const { error } = await supabase.from('bounties').update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to delete bounty', description: error.message });
        } else {
            toast({ title: 'Bounty moved to trash.' });
            navigate('/admin/bounties');
        }
        setIsDeleteDialogOpen(false);
    };

    const handleSendMessage = () => {
        toast({
            title: '🚧 Feature Not Implemented',
            description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    };

    if (loading) {
        return (
            <>
                <Helmet><title>Loading Bounty Details - WhistleBlower.ng</title></Helmet>
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
        incident_date: bounty.created_at,
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

    return (
        <>
            <Helmet><title>Bounty Details - {bounty.bounty_id}</title></Helmet>
            <div className="space-y-8">
                <Link to="/admin/bounties" className="flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" />Back to Bounties</Link>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">Bounty Details</h1>
                        <p className="text-muted-foreground mt-1">
                            {selectedReport ? `Report ID - ${selectedReport.report_id}` : `Bounty ID - ${bounty.bounty_id}`}
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
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Voice Note Player - Show above title/description for voice note reports */}
                        {selectedReport && selectedReport.is_voice_note && selectedReport.evidence_path && selectedReport.evidence_path.length > 0 && (
                            <VoiceNotePlayer voiceNotePath={selectedReport.evidence_path[0]} />
                        )}
                        
                        <Card>
                            <CardHeader><CardTitle className="text-2xl">{selectedReport ? selectedReport.title : bounty.title}</CardTitle></CardHeader>
                            <CardContent><p className="whitespace-pre-wrap">{selectedReport ? selectedReport.description : bounty.description}</p></CardContent>
                        </Card>
                        <ReportChat updates={updates} user={user} newMessage={newMessage} setNewMessage={setNewMessage} onSendMessage={handleSendMessage} isSending={isSending} />
                    </div>
                    <div className="space-y-8">
                        <ReportInfoCard report={selectedReport || bountyAsReport} />
                        {selectedReport ? (
                            <ReportStatusCard status={selectedReport.status} onStatusUpdate={handleReportStatusUpdate} />
                        ) : (
                            <BountyStatusCard status={bounty.status} onStatusUpdate={handleUpdateStatus} />
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
                        <AlertDialogAction onClick={handleDeleteBounty} className="bg-destructive hover:bg-destructive/90">
                            Move to Trash
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default BountyDetails;