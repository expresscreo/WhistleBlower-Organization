import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, Banknote } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { verifyPassword } from '@/lib/cryptoUtils';
import { useToast } from '@/components/ui/use-toast';
import ChatWindow from '@/views/track-report/ChatWindow';
import UpdateReportDialog from '@/views/track-report/UpdateReportDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import AttachmentPreview from './track-report/AttachmentPreview';
import { sanitizeFilename } from '@/lib/utils';
import { uploadFileToLocal } from '@/lib/fileUtils';
import SEOHead from '@/components/SEOHead';
import { generateSEOMeta, STRUCTURED_DATA_TEMPLATES, DEFAULT_SEO_PAGES } from '@/lib/seoUtils';

const MoneyIcon = () => <Banknote className="h-4 w-4" />;

const statusConfig = {
    'pending_review': { progress: 10, color: 'bg-yellow-400', label: 'Pending Review' },
    'approved': { progress: 30, color: 'bg-blue-400', label: 'Approved' },
    'published': { progress: 60, color: 'bg-purple-400', label: 'Published' },
    'resolved': { progress: 100, color: 'bg-green-500', label: 'Resolved' },
    'rejected': { progress: 100, color: 'bg-red-500', label: 'Rejected' },
    'refunded': { progress: 100, color: 'bg-gray-500', label: 'Refunded' },
};

const BountySummary = ({ bounty, onUpdateBounty, onLogout }) => {
    const currentStatus = statusConfig[bounty.status] || { progress: 0, color: 'bg-gray-400', label: 'Unknown' };
    const evidencePaths = Array.isArray(bounty.evidence) ? bounty.evidence : [];

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <CardTitle className="text-lg sm:text-xl">REPORT ID — {bounty.bounty_id}</CardTitle>
                    <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={onUpdateBounty} className="flex-1 sm:flex-initial uppercase">
                            <span className="hidden xs:inline">Update Bounty</span>
                            <span className="xs:hidden">Update</span>
                        </Button>
                        <Button 
                            onClick={onLogout}
                            className="bg-red-500 text-white hover:bg-red-600 border-red-500 hover:border-red-600 flex-1 sm:flex-initial uppercase"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
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
                
                {/* Report Title */}
                <div className="border-t pt-6 border-b pb-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">{bounty.title}</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap">{bounty.description}</p>
                </div>
                
                {/* Report Info */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                    <div><p className="text-sm text-muted-foreground">Type of Crime</p><p className="font-semibold">{bounty.type_of_crime}</p></div>
                    <div><p className="text-sm text-muted-foreground">Submitted</p><p className="font-semibold">{format(new Date(bounty.created_at), 'PPP')}</p></div>
                    <div><p className="text-sm text-muted-foreground">Bounty Amount</p><p className="font-bold text-primary text-lg">{bounty.bounty_amount ? `${Number(bounty.bounty_amount).toLocaleString()}` : 'Not specified'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Location</p><p className="font-semibold">{bounty.location}{bounty.state ? `, ${bounty.state}` : ''}</p></div>
                    {bounty.full_address && (
                        <div className="md:col-span-2"><p className="text-sm text-muted-foreground">Address</p><p className="font-semibold break-words">{bounty.full_address}</p></div>
                    )}
                </div>
                
                {/* Attachments */}
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
    const router = useRouter();
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
        router.replace('/');
    };

    const handleAuthentication = useCallback(async () => {
        setLoading(true);
        console.log('Starting authentication for bounty:', bountyId, 'with password:', password);
        
        const { data, error } = await supabase.from('bounties').select('*').eq('bounty_id', bountyId).single();

        if (error || !data) {
            console.error('Bounty not found:', error);
            toast({ variant: 'destructive', title: 'Bounty Not Found', description: 'Please check the Bounty ID and try again.' });
            setLoading(false);
            handleLogout();
            return;
        }

        console.log('Bounty data found:', {
            bounty_id: data.bounty_id,
            has_password: !!data.password,
            password_value: data.password,
            password_length: data.password?.length
        });

        // Verify password using Web Crypto API
        // The verifyPassword function handles all format detection internally
        const isValidPassword = await verifyPassword(password, data.password, '');

        console.log('Password verification result:', isValidPassword);
        console.log('Type of isValidPassword:', typeof isValidPassword);
        console.log('Boolean value of isValidPassword:', Boolean(isValidPassword));

        if (!isValidPassword) {
            console.log('Authentication failed - isValidPassword is falsy');
            toast({ variant: 'destructive', title: 'Authentication Failed', description: 'The password you entered is incorrect.' });
            setLoading(false);
            handleLogout();
            return;
        }

        console.log('Authentication successful - proceeding to set bounty data');

        try {
            setBountyData(data);
            console.log('Bounty data set successfully');
            
            setAuthenticated(true);
            console.log('Authentication state set to true');
            
            setLoading(false);
            console.log('Loading state set to false');
        } catch (error) {
            console.error('Error setting bounty data or authentication state:', error);
        }
    }, [bountyId, password, router, toast]);

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
                
                try {
                    // Update progress
                    setUploadProgress(prev => ({ ...prev, [i]: 50 }));
                    
                    // Upload to local storage (use generic folder name to hide bounty ID)
                    const filePath = await uploadFileToLocal(file, 'bounties', 'delito');
                    
                    // Complete progress
                    setUploadProgress(prev => ({ ...prev, [i]: 100 }));
                    
                    newPaths.push(filePath);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Upload Failed', description: `Could not upload ${file.name}: ${error.message}` });
                    setIsUpdating(false);
                    return;
                }
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

    console.log('Component render state:', { 
        loading, 
        authenticated, 
        hasBountyData: !!bountyData,
        bountyId,
        password: password ? '***' : 'none'
    });

    if (loading) {
        console.log('Rendering loading state');
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!authenticated || !bountyData) {
        console.log('Rendering authentication required state');
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
            name: 'Track Your Bounty - WhistleBlower.ng',
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
                                    <BountySummary bounty={bountyData} onUpdateBounty={() => setIsUpdateDialogOpen(true)} onLogout={handleLogout} />
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