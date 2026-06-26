import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import {
    authenticateTrackedBounty,
    fetchTrackedBountyUpdates,
    sendTrackedBountyMessage,
    updateTrackedBounty,
} from '@/lib/trackApi';
import Chat from '@/components/Chat';
import { BOUNTY_CHAT_CONFIG } from '@/lib/chatEntityConfig';
import UpdateReportDialog from '@/views/track-report/UpdateReportDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import { uploadFileToLocal } from '@/lib/fileUtils';
import { fetchPublishedBountyPostPath } from '@/lib/bountyPostUrl';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta } from '@/lib/seoUtils';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useTrackedChatPolling } from '@/hooks/useTrackedChatPolling';

const statusConfig = {
    'pending_review': { progress: 10, color: 'bg-yellow-400', label: 'Pending Review' },
    'approved': { progress: 30, color: 'bg-blue-400', label: 'Approved' },
    'published': { progress: 60, color: 'bg-purple-400', label: 'Published' },
    'report_received': { progress: 75, color: 'bg-orange-400', label: 'Report Received' },
    'resolved': { progress: 100, color: 'bg-green-500', label: 'Resolved' },
    'rejected': { progress: 100, color: 'bg-red-500', label: 'Rejected' },
    'refunded': { progress: 100, color: 'bg-gray-500', label: 'Refunded' },
};

const BountySummary = ({ bounty, publishedBountyUrl, onUpdateBounty, onLogout }) => {
    const currentStatus = statusConfig[bounty.status] || { progress: 0, color: 'bg-gray-400', label: 'Unknown' };
    const evidencePaths = Array.isArray(bounty.evidence) ? bounty.evidence : [];

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="text-lg sm:text-xl">REPORT ID — {bounty.bounty_id}</CardTitle>
                    <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={onUpdateBounty} className="flex-1 min-w-0 sm:flex-initial uppercase">
                            <span className="hidden xs:inline">Update Bounty</span>
                            <span className="xs:hidden">Update</span>
                        </Button>
                        <Button
                            onClick={onLogout}
                            aria-label="Logout"
                            className="shrink-0 h-9 w-9 p-0 bg-red-500 text-white hover:bg-red-600 border-red-500 hover:border-red-600 sm:h-10 sm:w-auto sm:px-4 uppercase"
                        >
                            <LogOut className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Report Status Bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">{currentStatus.label}</p>
                        <p className="text-sm text-muted-foreground">{currentStatus.progress}% Complete</p>
                    </div>
                    <Progress value={currentStatus.progress} indicatorClassName={currentStatus.color} />
                </div>

                {publishedBountyUrl && (
                    <div className="rounded-lg border bg-primary/5 p-4 sm:p-5 space-y-3">
                        <div>
                            <p className="font-semibold">Your bounty is live</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                View the public page others see on the site and share it with potential contributors.
                            </p>
                        </div>
                        <Button asChild className="w-full sm:w-auto uppercase">
                            <Link href={publishedBountyUrl}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View published bounty
                            </Link>
                        </Button>
                    </div>
                )}
                
                {/* Report Title */}
                <div className="border-t pt-6 border-b pb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">{bounty.title}</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bounty.description}</p>
                </div>
                
                {/* Report Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div><p className="text-sm text-muted-foreground">Type of Crime</p><p className="font-semibold">{bounty.type_of_crime}</p></div>
                    <div><p className="text-sm text-muted-foreground">Incident Date</p><p className="font-semibold">{format(new Date(bounty.incident_date || bounty.created_at), 'PPP')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Submitted</p><p className="font-semibold">{format(new Date(bounty.created_at), 'PPP')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Bounty Amount</p><p className="font-bold text-primary text-lg">{bounty.bounty_amount ? `${Number(bounty.bounty_amount).toLocaleString()}` : 'Not specified'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Location</p><p className="font-semibold">{bounty.location}{bounty.state ? `, ${bounty.state}` : ''}</p></div>
                    {bounty.full_address && (
                        <div className="md:col-span-2"><p className="text-sm text-muted-foreground">Address</p><p className="font-semibold break-words">{bounty.full_address}</p></div>
                    )}
                </div>
                
                {/* Attachments */}
                <div className="mt-6 border-t pt-6">
                    {evidencePaths.length > 0 ? (
                        <EvidenceThumbnailGallery paths={evidencePaths} title="Attachments" />
                    ) : (
                        <p className="text-sm text-muted-foreground">No attachments for this bounty.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const TrackBountyPage = ({ bountyId, password, initialAuthData, onAuthFailure, onLogout }) => {
    const router = useRouter();
    const [updateFeedback, setUpdateFeedback] = useState({ error: '', success: '' });

    const [loading, setLoading] = useState(!initialAuthData);
    const [bountyData, setBountyData] = useState(initialAuthData?.bounty ?? null);
    const [authenticated, setAuthenticated] = useState(!!initialAuthData);

    const [updates, setUpdates] = useState(initialAuthData?.updates ?? []);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [publishedBountyUrl, setPublishedBountyUrl] = useState(null);
    const consumedInitialAuth = useRef(false);

    const handleLogout = () => {
        onLogout?.();
    };

    const markMessagesAsRead = useCallback(async (entityId) => {
        if (!entityId) return;
        const { error } = await supabase.rpc('mark_bounty_messages_as_read', {
            p_bounty_id: entityId,
            p_reader_id: null,
        });
        if (error) console.error('Error marking bounty messages as read:', error);
    }, []);

    const fetchUpdates = useCallback(async (forceRefresh = false) => {
        if (!bountyData?.id) return;
        if (!forceRefresh && document.visibilityState !== 'visible') return;

        try {
            const { updates: nextUpdates } = await fetchTrackedBountyUpdates(bountyId, password);
            setUpdates(nextUpdates || []);
        } catch (error) {
            console.error('Error fetching bounty updates:', error);
        }
    }, [bountyData?.id, bountyId, password]);

    const isPageVisible = usePageVisibility();

    const pollChatUpdates = useCallback(async () => {
        await fetchUpdates(true);
        if (bountyData?.id) {
            await markMessagesAsRead(bountyData.id);
        }
    }, [fetchUpdates, bountyData?.id, markMessagesAsRead]);

    useTrackedChatPolling(pollChatUpdates, {
        enabled: authenticated && Boolean(bountyData?.id),
    });

    const applyInitialAuth = useCallback(async (authData) => {
        sessionStorage.setItem('trackId', bountyId);
        sessionStorage.setItem('trackPassword', password);
        sessionStorage.setItem('trackType', 'bounty');
        setUpdates(authData.updates || []);
        setBountyData(authData.bounty);
        setAuthenticated(true);
        await markMessagesAsRead(authData.bounty.id);
        setLoading(false);
    }, [bountyId, password, markMessagesAsRead]);

    const handleAuthentication = useCallback(async () => {
        setLoading(true);
        try {
            const { bounty, updates: initialUpdates } = await authenticateTrackedBounty(bountyId, password);
            sessionStorage.setItem('trackId', bountyId);
            sessionStorage.setItem('trackPassword', password);
            sessionStorage.setItem('trackType', 'bounty');
            setUpdates(initialUpdates || []);
            setBountyData(bounty);
            setAuthenticated(true);
            await markMessagesAsRead(bounty.id);
        } catch (error) {
            onAuthFailure?.(error.message || 'Please check the Bounty ID and password.');
            return;
        }
        setLoading(false);
    }, [bountyId, password, onAuthFailure, markMessagesAsRead]);

    useEffect(() => {
        if (initialAuthData?.bounty && !consumedInitialAuth.current) {
            consumedInitialAuth.current = true;
            applyInitialAuth(initialAuthData);
            return;
        }

        if (!initialAuthData?.bounty) {
            handleAuthentication();
        }
    }, [applyInitialAuth, handleAuthentication, initialAuthData]);

    useEffect(() => {
        if (!bountyData?.id) {
            setPublishedBountyUrl(null);
            return;
        }

        let cancelled = false;

        fetchPublishedBountyPostPath(supabase, bountyData).then((path) => {
            if (!cancelled) setPublishedBountyUrl(path);
        });

        return () => {
            cancelled = true;
        };
    }, [bountyData?.id, bountyData?.status, bountyData?.title]);

    const handleUpdateBounty = async () => {
        setUpdateFeedback({ error: '', success: '' });
        if (!updateMessage.trim() && newEvidenceFiles.length === 0) {
            setUpdateFeedback({ error: 'Please add a message or files.', success: '' });
            return;
        }
        setIsUpdating(true);
        setUploadProgress({});
        let newPaths = [];

        if (newEvidenceFiles.length > 0) {
            for (let i = 0; i < newEvidenceFiles.length; i++) {
                const file = newEvidenceFiles[i];
                
                try {
                    // Update progress
                    setUploadProgress(prev => ({ ...prev, [i]: 50 }));
                    
                    // Upload to local storage (use generic folder name to hide bounty ID)
                    const filePath = await uploadFileToLocal(file, 'bounties', 'delito');
                    
                    // Complete progress
                    setUploadProgress(prev => ({ ...prev, [i]: 100 }));
                    
                    newPaths.push(filePath);
                } catch (error) {
                    setUpdateFeedback({ error: `Could not upload ${file.name}: ${error.message}`, success: '' });
                    setIsUpdating(false);
                    return;
                }
            }
        }
        
        try {
            const { bounty: updatedBountyData } = await updateTrackedBounty({
                bountyId,
                password,
                message: updateMessage,
                evidencePaths: newPaths,
            });

            setBountyData(updatedBountyData);
            await fetchUpdates(true);
            setUpdateFeedback({ error: '', success: 'Your bounty has been updated.' });
            setIsUpdateDialogOpen(false);
            setUpdateMessage('');
            setNewEvidenceFiles([]);
        } catch (error) {
            console.error('Bounty update failed:', error);
            setUpdateFeedback({ error: 'Could not add your update.', success: '' });
        }
        setIsUpdating(false);
    };

    const handleSendMessage = async ({ message, replyToMessageId }) => {
        setIsSendingMessage(true);
        try {
            const { update } = await sendTrackedBountyMessage({
                bountyId,
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

    if (!authenticated || !bountyData) {
        return (
            <div className="container mx-auto px-4 py-8 sm:py-16 md:py-24 min-h-screen">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8">Bounty Tracking</h1>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-[#2e2e2e] rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200 text-center">
                            Authentication failed or bounty not found. Please check your Bounty ID and password.
                        </p>
                        <div className="mt-4 text-center">
                            <button 
                                onClick={() => router.push('/track-bounty')}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Generate SEO metadata
    const seoMeta = generateSEOMeta({
        title: 'Track Your Bounty Status',
        description: 'Securely track the progress of your submitted bounty in real-time. Monitor bounty updates and stay informed about the status of your submissions.',
        url: '/track-bounty',
        keywords: ['track bounty', 'bounty status', 'bounty tracking', 'whistleblower bounty', 'bounty progress'],
        type: 'website'
    });

    // Generate structured data
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Track Your Bounty — WhistleBlower.ng',
            description: 'Securely track the status of your submitted bounty using your unique Bounty ID.',
            mainEntity: {
                '@type': 'Service',
                name: 'Bounty Tracking Service',
                description: 'Secure platform for tracking submitted bounties in Nigeria'
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
                        {authenticated && bountyData && (
                            <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-2xl sm:text-3xl font-bold break-words">Report Summary</h1>
                                </div>
                                <div className="space-y-8">
                                    <BountySummary
                                        bounty={bountyData}
                                        publishedBountyUrl={publishedBountyUrl}
                                        onUpdateBounty={() => setIsUpdateDialogOpen(true)}
                                        onLogout={handleLogout}
                                    />
                                    <Card>
                                        <CardContent className="pt-6">
                                            <Chat
                                                entity={bountyData}
                                                chatConfig={BOUNTY_CHAT_CONFIG}
                                                updates={updates}
                                                isLive={isPageVisible}
                                                onSendMessage={handleSendMessage}
                                                isSending={isSendingMessage}
                                                onNewMessage={(newUpdate) => {
                                                    setUpdates((prev) => {
                                                        const exists = prev.find((item) => item.id === newUpdate.id);
                                                        if (exists) return prev;
                                                        return [...prev, newUpdate];
                                                    });
                                                    if (document.visibilityState === 'visible' && newUpdate.updated_by) {
                                                        setTimeout(() => markMessagesAsRead(bountyData.id), 500);
                                                    }
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {bountyData && (
                <UpdateReportDialog isOpen={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen} onUpdate={handleUpdateBounty} updateMessage={updateMessage} setUpdateMessage={setUpdateMessage} newEvidenceFiles={newEvidenceFiles} setNewEvidenceFiles={setNewEvidenceFiles} isUpdating={isUpdating} uploadProgress={uploadProgress} updateError={updateFeedback.error} updateSuccess={updateFeedback.success} />
            )}
        </>
    );
};

export default TrackBountyPage;