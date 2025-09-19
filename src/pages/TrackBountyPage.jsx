import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ChatWindow from '@/pages/track-report/ChatWindow';
import UpdateReportDialog from '@/pages/track-report/UpdateReportDialog';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import AttachmentPreview from './track-report/AttachmentPreview';
import { sanitizeFilename } from '@/lib/utils';

const NairaSign = () => <span className="font-sans">₦</span>;

const statusConfig = {
    'pending_review': { progress: 10, color: 'bg-yellow-400', label: 'Pending Review' },
    'approved': { progress: 30, color: 'bg-blue-400', label: 'Approved' },
    'published': { progress: 60, color: 'bg-purple-400', label: 'Published' },
    'resolved': { progress: 100, color: 'bg-green-500', label: 'Resolved' },
    'rejected': { progress: 100, color: 'bg-red-500', label: 'Rejected' },
    'refunded': { progress: 100, color: 'bg-gray-500', label: 'Refunded' },
};

const BountySummary = ({ bounty, onUpdateBounty }) => {
    const currentStatus = statusConfig[bounty.status] || { progress: 0, color: 'bg-gray-400', label: 'Unknown' };
    const evidencePaths = Array.isArray(bounty.evidence) ? bounty.evidence : [];

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle>Bounty Summary</CardTitle>
                    <Button variant="outline" onClick={onUpdateBounty}>
                        Update Bounty
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">{currentStatus.label}</p>
                        <p className="text-sm text-muted-foreground">{currentStatus.progress}% Complete</p>
                    </div>
                    <Progress value={currentStatus.progress} indicatorClassName={currentStatus.color} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div><p className="text-sm text-muted-foreground">Bounty ID</p><p className="font-semibold">{bounty.bounty_id}</p></div>
                    <div><p className="text-sm text-muted-foreground">Type of Crime</p><p className="font-semibold">{bounty.type_of_crime}</p></div>
                    <div><p className="text-sm text-muted-foreground">Submitted</p><p className="font-semibold">{format(new Date(bounty.created_at), 'PPP')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Bounty Amount</p><p className="font-semibold text-primary flex items-center"><NairaSign />{bounty.bounty_amount ? `${Number(bounty.bounty_amount).toLocaleString()}` : 'Not specified'}</p></div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="font-semibold text-xl mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bounty.description}</p>
                </div>
                <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold text-xl mb-4">Attachments</h3>
                    {evidencePaths.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {evidencePaths.map((path, index) => <AttachmentPreview key={index} path={path} />)}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No attachments for this bounty.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const TrackBountyPage = ({ bountyId, password }) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [bountyData, setBountyData] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);

    const [updates, setUpdates] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [newEvidenceFiles, setNewEvidenceFiles] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    const handleLogout = () => {
        sessionStorage.removeItem('trackId');
        sessionStorage.removeItem('trackPassword');
        sessionStorage.removeItem('trackType');
        setBountyData(null);
        setAuthenticated(false);
        navigate('/track', { replace: true });
    };

    const handleAuthentication = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('bounties').select('*').eq('bounty_id', bountyId).single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Bounty Not Found', description: 'Please check the Bounty ID and try again.' });
            setLoading(false);
            handleLogout();
            return;
        }

        const { data: verifyData, error: verifyError } = await supabase.rpc('verify_password', { password: password, hash: data.password });

        if (verifyError || !verifyData) {
            toast({ variant: 'destructive', title: 'Authentication Failed', description: 'The password you entered is incorrect.' });
            setLoading(false);
            handleLogout();
            return;
        }

        setBountyData(data);
        setAuthenticated(true);
        setLoading(false);
    }, [bountyId, password, navigate, toast]);

    useEffect(() => {
        handleAuthentication();
    }, [handleAuthentication]);

    const handleUpdateBounty = async () => {
        if (!updateMessage.trim() && newEvidenceFiles.length === 0) {
            toast({ variant: "destructive", title: "Nothing to update", description: "Please add a message or files." });
            return;
        }
        setIsUpdating(true);
        setUploadProgress({});
        let newPaths = [];

        if (newEvidenceFiles.length > 0) {
            for (let i = 0; i < newEvidenceFiles.length; i++) {
                const file = newEvidenceFiles[i];
                const sanitizedName = sanitizeFilename(file.name);
                const filePath = `bounties/${bountyData.bounty_id}/${Date.now()}-${sanitizedName}`;
                
                const { error: uploadError } = await supabase.storage.from('wb_evio').upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                }, (event) => {
                    if (event.type === 'progress') {
                        setUploadProgress(prev => ({ ...prev, [i]: (event.loaded / event.total) * 100 }));
                    }
                });

                if (uploadError) {
                    toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}.` });
                    setIsUpdating(false);
                    return;
                }
                newPaths.push(filePath);
            }
        }
        
        const { error: updateError } = await supabase.from('bounty_updates').insert({ bounty_id: bountyData.id, message: `${updateMessage}\n\n${newPaths.length > 0 ? `Added ${newPaths.length} new file(s).` : ''}`.trim(), updated_by: null });
        
        if (updateError) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not add your update.' });
        } else {
            const updatedEvidence = [...(bountyData.evidence || []), ...newPaths];
            const { data: updatedBountyData, error: bountyUpdateError } = await supabase.from('bounties').update({ evidence: updatedEvidence }).eq('id', bountyData.id).select().single();
            
            if (!bountyUpdateError) {
                setBountyData(updatedBountyData);
                toast({ title: "Success", description: "Your bounty has been updated." });
                setIsUpdateDialogOpen(false);
                setUpdateMessage('');
                setNewEvidenceFiles([]);
            } else {
                toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save new evidence links.' });
            }
        }
        setIsUpdating(false);
    };

    const handleSendMessage = () => {
        toast({
            title: '🚧 Feature Not Implemented',
            description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    return (
        <>
            <Helmet>
                <title>Track Your Bounty - WhistleBlower.ng</title>
                <meta name="description" content="Securely track the status of your submitted bounty." />
            </Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence>
                        {authenticated && bountyData && (
                            <motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-3xl font-bold">{bountyData.title}</h1>
                                    <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
                                </div>
                                <div className="space-y-8">
                                    <BountySummary bounty={bountyData} onUpdateBounty={() => setIsUpdateDialogOpen(true)} />
                                    <ChatWindow updates={updates} newMessage={newMessage} setNewMessage={setNewMessage} onSendMessage={handleSendMessage} isSending={isSending} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {bountyData && (
                <UpdateReportDialog isOpen={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen} onUpdate={handleUpdateBounty} updateMessage={updateMessage} setUpdateMessage={setUpdateMessage} newEvidenceFiles={newEvidenceFiles} setNewEvidenceFiles={setNewEvidenceFiles} isUpdating={isUpdating} uploadProgress={uploadProgress} />
            )}
        </>
    );
};

export default TrackBountyPage;