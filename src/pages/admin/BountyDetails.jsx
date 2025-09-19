import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Upload, Trash2 } from 'lucide-react';
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
import BountyStatusCard from '@/components/admin/bounty-details/BountyStatusCard';

const BountyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
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

    const handleUpdateStatus = async (status) => {
        const { data, error } = await supabase.from('bounties').update({ status }).eq('id', id).select().single();
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to update status', description: error.message });
        } else {
            toast({ title: 'Bounty status updated!' });
            setBounty(data);
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

        const { error: newsError } = await supabase.from('news').insert({
            title: bounty.title,
            content: bounty.description,
            category: 'bounty',
            status: 'draft',
            bounty_id: bounty.id,
            featured_image: Array.isArray(bounty.evidence) && bounty.evidence.length > 0 ? bounty.evidence[0] : null
        });

        if (newsError) {
            toast({ variant: 'destructive', title: 'Failed to create news draft', description: newsError.message });
        } else {
            toast({ title: 'Success!', description: 'Bounty sent to News Editor as a draft.' });
            navigate('/admin/news-editor');
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

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    if (!bounty) return null;

    const bountyAsReport = {
        ...bounty,
        report_id: bounty.bounty_id,
        incident_date: bounty.created_at,
        category: bounty.type_of_crime,
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
                        <p className="text-muted-foreground mt-1">Bounty ID - {bounty.bounty_id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSendToEditor} disabled={bounty.status !== 'approved'} className="bg-green-600 hover:bg-green-700 text-white">
                            <Upload className="mr-2 h-4 w-4" />Send to News Editor
                        </Button>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                        </Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader><CardTitle className="text-2xl">{bounty.title}</CardTitle></CardHeader>
                            <CardContent><p className="whitespace-pre-wrap">{bounty.description}</p></CardContent>
                        </Card>
                        <ReportChat updates={updates} user={user} newMessage={newMessage} setNewMessage={setNewMessage} onSendMessage={handleSendMessage} isSending={isSending} />
                    </div>
                    <div className="space-y-8">
                        <ReportInfoCard report={bountyAsReport} />
                        <BountyStatusCard status={bounty.status} onStatusUpdate={handleUpdateStatus} />
                        <ReportAttachmentsCard evidencePath={bounty.evidence} isVoiceNote={false} />
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