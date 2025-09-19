
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Info, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const NairaSign = () => <span className="font-sans">₦</span>;

const BountyPostPage = () => {
    const { id } = useParams(); // This is the bounty's internal UUID from the URL
    const navigate = useNavigate();
    const { toast } = useToast();
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBounty = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bounties')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single();
            
        if (error || !data) {
            toast({ variant: 'destructive', title: 'Bounty not found', description: 'This bounty may not exist or has not been published.' });
            navigate('/news');
        } else {
            setBounty(data);
        }
        setLoading(false);
    }, [id, toast, navigate]);

    useEffect(() => {
        fetchBounty();
    }, [fetchBounty]);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    if (!bounty) return null;

    const giveInfoUrl = `/submit-report?bounty_id=${bounty.id}&bounty_title=${encodeURIComponent(bounty.title)}`;

    return (
        <>
            <Helmet><title>{bounty.title} - Bounty</title></Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <Link to="/news" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="mr-2 h-4 w-4" />Back to News</Link>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl md:text-4xl font-bold">{bounty.title}</CardTitle>
                            <CardDescription className="text-lg pt-2">
                                Published on {format(new Date(bounty.created_at), 'PPP')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <Link to={giveInfoUrl}>
                                <Button size="lg" className="w-full md:w-auto">
                                    <Info className="mr-2 h-5 w-5" />
                                    Give Information About This Person
                                </Button>
                            </Link>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-xl mb-4">Bounty Details</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">{bounty.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="h-6 w-6 text-primary mt-1 flex items-center justify-center"><NairaSign /></div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bounty Amount</p>
                                        <p className="font-bold text-2xl text-primary flex items-center"><NairaSign />{bounty.bounty_amount ? `${Number(bounty.bounty_amount).toLocaleString()}` : 'Not specified'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-semibold text-lg">{bounty.location}, {bounty.state}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Type of Crime</p>
                                        <p className="font-semibold text-lg">{bounty.type_of_crime}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default BountyPostPage;
