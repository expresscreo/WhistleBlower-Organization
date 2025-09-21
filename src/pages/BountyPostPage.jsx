
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Info, MapPin, Calendar, Banknote, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { getLocalFileUrl } from '@/lib/fileUtils';

const MoneyIcon = () => <Banknote className="h-4 w-4" />;

const BountyPostPage = () => {
    const { id } = useParams(); // This is the bounty's internal UUID from the URL
    const navigate = useNavigate();
    const { toast } = useToast();
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('wb_evio').getPublicUrl(path);
        return data.publicUrl;
    };

    const fetchBounty = useCallback(async () => {
        setLoading(true);
        
        // First, check if there's a published news item for this bounty
        const { data: newsData, error: newsError } = await supabase
            .from('news')
            .select('*')
            .eq('bounty_id', id)
            .eq('status', 'published')
            .single();

        // If there's a published news item, use it
        if (newsData && !newsError) {
            console.log('Found published news item for bounty:', newsData);
            
            // Fetch the original bounty data to get additional fields
            const { data: bountyData, error: bountyError } = await supabase
                .from('bounties')
                .select('*')
                .eq('id', id)
                .single();
            
            if (bountyError || !bountyData) {
                toast({ variant: 'destructive', title: 'Bounty not found', description: 'This bounty may not exist or has not been published.' });
                navigate('/news');
                setLoading(false);
                return;
            }
            
            // Merge bounty data with updated news content
            const updatedBounty = {
                ...bountyData,
                title: newsData.title,
                description: newsData.content,
                featured_image: newsData.featured_image,
                updated_at: newsData.updated_at
            };
            setBounty(updatedBounty);
            
            // Set featured image URL if available
            if (newsData.featured_image) {
                const imageUrl = getLocalFileUrl(newsData.featured_image);
                setFeaturedImageUrl(imageUrl);
            } else {
                setFeaturedImageUrl(null);
            }
            setLoading(false);
            return;
        }

        // If no published news item, check if the bounty itself is published
        const { data: bountyData, error: bountyError } = await supabase
            .from('bounties')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single();

        // If no published news item found, check if bounty is published
        if (bountyError || !bountyData) {
            toast({ variant: 'destructive', title: 'Bounty not found', description: 'This bounty may not exist or has not been published.' });
            navigate('/news');
            setLoading(false);
            return;
        }

        // Use original bounty data
        setBounty(bountyData);
        setFeaturedImageUrl(null);
        setLoading(false);
    }, [id, toast, navigate]);

    useEffect(() => {
        fetchBounty();
    }, [fetchBounty]);

    // Real-time subscription for bounty updates (when updated through news editor)
    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`bounty-updates-${id}`)
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'bounties',
                    filter: `id=eq.${id}`
                }, 
                (payload) => {
                    console.log('Bounty update received:', payload);
                    // Update the bounty data when it's modified
                    if (payload.new && payload.new.status === 'published') {
                        setBounty(payload.new);
                    }
                }
            )
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'news',
                    filter: `bounty_id=eq.${id}`
                }, 
                (payload) => {
                    console.log('Bounty news update received:', payload);
                    // Refresh bounty data when related news is updated
                    if (payload.new && payload.new.status === 'published') {
                        fetchBounty();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, fetchBounty]);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    if (!bounty) return null;

    // Function to determine bounty type and appropriate button text
    const getBountyInfo = (bounty) => {
        const title = bounty.title.toLowerCase();
        const content = bounty.description.toLowerCase();
        const combinedText = `${title} ${content}`;
        
        // Keywords for different bounty types
        const personKeywords = ['person', 'individual', 'suspect', 'criminal', 'fugitive', 'wanted', 'man', 'woman', 'boy', 'girl', 'teenager', 'adult', 'elderly'];
        const organizationKeywords = ['company', 'organization', 'corporation', 'business', 'firm', 'agency', 'group', 'society', 'association', 'institution'];
        const locationKeywords = ['location', 'place', 'building', 'house', 'property', 'area', 'site', 'venue', 'facility', 'premises'];
        const vehicleKeywords = ['vehicle', 'car', 'truck', 'bus', 'motorcycle', 'bike', 'van', 'suv', 'automobile', 'transport'];
        const itemKeywords = ['item', 'object', 'document', 'file', 'package', 'parcel', 'goods', 'product', 'material', 'equipment'];
        
        // Check for person-related content
        if (personKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'person',
                buttonText: 'Give Information About This Person'
            };
        }
        
        // Check for organization-related content
        if (organizationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'organization',
                buttonText: 'Give Information About This Organization'
            };
        }
        
        // Check for location-related content
        if (locationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'location',
                buttonText: 'Give Information About This Location'
            };
        }
        
        // Check for vehicle-related content
        if (vehicleKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'vehicle',
                buttonText: 'Give Information About This Vehicle'
            };
        }
        
        // Check for item-related content
        if (itemKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'item',
                buttonText: 'Give Information About This Item'
            };
        }
        
        // Default fallback
        return {
            type: 'general',
            buttonText: 'Give Information About This Case'
        };
    };

    const bountyInfo = getBountyInfo(bounty);
    const giveInfoUrl = `/submit-report?bounty_id=${bounty.id}&bounty_title=${encodeURIComponent(bounty.title)}`;

    return (
        <>
            <Helmet>
                <title>{bounty.title} - WhistleBlower.ng</title>
                <meta name="description" content={bounty.description.substring(0, 160)} />
            </Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <Link to="/news" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="mr-2 h-4 w-4" />Back to News</Link>
                    
                    <Card>
                        {featuredImageUrl && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                <img src={featuredImageUrl} alt={bounty.title} className="w-full h-full object-cover" />
                            </div>
                        )}
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
                                    {bountyInfo.buttonText}
                                </Button>
                            </Link>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-xl mb-4">Bounty Details</h3>
                                <div 
                                    className="text-muted-foreground text-base leading-relaxed prose dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: bounty.description }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                                <div className="flex items-start gap-3">
                                    <Coins className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bounty Amount</p>
                                        <p className="font-bold text-2xl text-primary">{bounty.bounty_amount ? `${Number(bounty.bounty_amount).toLocaleString()}` : 'Not specified'}</p>
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
