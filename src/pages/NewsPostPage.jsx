import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Tag, ArrowLeft, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLocalFileUrl } from '@/lib/fileUtils';

const NewsPostPage = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);

    // Function to determine bounty type and appropriate button text
    const getBountyInfo = (post) => {
        if (post.category !== 'bounty') return null;
        
        const title = post.title.toLowerCase();
        const content = post.content.toLowerCase();
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
                buttonText: 'Give Information About This Person',
                description: 'Have information about this person? Submit it anonymously and earn the reward.'
            };
        }
        
        // Check for organization-related content
        if (organizationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'organization',
                buttonText: 'Give Information About This Organization',
                description: 'Have information about this organization? Submit it anonymously and earn the reward.'
            };
        }
        
        // Check for location-related content
        if (locationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'location',
                buttonText: 'Give Information About This Location',
                description: 'Have information about this location? Submit it anonymously and earn the reward.'
            };
        }
        
        // Check for vehicle-related content
        if (vehicleKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'vehicle',
                buttonText: 'Give Information About This Vehicle',
                description: 'Have information about this vehicle? Submit it anonymously and earn the reward.'
            };
        }
        
        // Check for item-related content
        if (itemKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'item',
                buttonText: 'Give Information About This Item',
                description: 'Have information about this item? Submit it anonymously and earn the reward.'
            };
        }
        
        // Default fallback
        return {
            type: 'general',
            buttonText: 'Give Information About This Case',
            description: 'Have information about this case? Submit it anonymously and earn the reward.'
        };
    };

    const getMostWantedInfo = (post) => {
        if (post.category !== 'most_wanted') return null;
        
        const title = post.title.toLowerCase();
        const content = post.content.toLowerCase();
        const combinedText = `${title} ${content}`;
        
        // Keywords for different most wanted types
        const personKeywords = ['person', 'individual', 'suspect', 'criminal', 'fugitive', 'wanted', 'man', 'woman', 'boy', 'girl', 'teenager', 'adult', 'elderly'];
        const organizationKeywords = ['organization', 'gang', 'group', 'syndicate', 'cartel', 'network', 'ring', 'crew'];
        const locationKeywords = ['location', 'place', 'building', 'house', 'property', 'area', 'site', 'venue', 'facility', 'premises'];
        const vehicleKeywords = ['vehicle', 'car', 'truck', 'bus', 'motorcycle', 'bike', 'van', 'suv', 'automobile', 'transport'];
        
        // Check for person-related content
        if (personKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'person',
                buttonText: 'Report Information About This Person',
                description: 'Have information about this wanted person? Submit it anonymously and help bring them to justice.'
            };
        }
        
        // Check for organization-related content
        if (organizationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'organization',
                buttonText: 'Report Information About This Organization',
                description: 'Have information about this wanted organization? Submit it anonymously and help authorities.'
            };
        }
        
        // Check for location-related content
        if (locationKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'location',
                buttonText: 'Report Information About This Location',
                description: 'Have information about this wanted location? Submit it anonymously and help authorities.'
            };
        }
        
        // Check for vehicle-related content
        if (vehicleKeywords.some(keyword => combinedText.includes(keyword))) {
            return {
                type: 'vehicle',
                buttonText: 'Report Information About This Vehicle',
                description: 'Have information about this wanted vehicle? Submit it anonymously and help authorities.'
            };
        }
        
        // Default fallback
        return {
            type: 'general',
            buttonText: 'Report Information About This Case',
            description: 'Have information about this wanted case? Submit it anonymously and help bring justice.'
        };
    };

    const fetchPost = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'News post not found.' });
            setPost(null);
            setFeaturedImageUrl(null);
        } else {
            setPost(data);
            // Generate fresh image URL to avoid cache issues
            if (data.featured_image) {
                const imageUrl = getLocalFileUrl(data.featured_image);
                setFeaturedImageUrl(imageUrl);
            } else {
                setFeaturedImageUrl(null);
            }
        }
        setLoading(false);
    }, [id, toast]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    // Real-time subscription for specific post updates
    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`news-post-${id}`)
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'news',
                    filter: `id=eq.${id}`
                }, 
                (payload) => {
                    console.log('News post update received:', payload);
                    // Update the post data when it's modified
                    if (payload.new && payload.new.status === 'published') {
                        setPost(payload.new);
                        // Update image URL to ensure fresh content
                        if (payload.new.featured_image) {
                            const imageUrl = getLocalFileUrl(payload.new.featured_image);
                            setFeaturedImageUrl(imageUrl);
                        } else {
                            setFeaturedImageUrl(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const { data } = supabase.storage.from('wb_evio').getPublicUrl(path);
        return data.publicUrl;
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[80vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!post) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Post Not Found</h1>
                <p className="text-muted-foreground">The requested news post could not be found.</p>
                <Link to="/news" className="mt-4 inline-block text-primary hover:underline">Back to News</Link>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{post.title} - WhistleBlower.ng</title>
                <meta name="description" content={post.content.substring(0, 160)} />
            </Helmet>
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto">
                    <Link to="/news" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to All News
                    </Link>
                    <Card>
                        {featuredImageUrl && (
                            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                                <img src={featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-3xl md:text-4xl font-bold">{post.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 pt-4 text-sm">
                                <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4" /> {format(new Date(post.created_at), 'PPP')}</span>
                                <span className="flex items-center capitalize"><Tag className="mr-1.5 h-4 w-4" /> {post.category}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {post.category === 'bounty' && (() => {
                                const bountyInfo = getBountyInfo(post);
                                return bountyInfo && (
                                    <div className="text-center py-6 border-t border-b bg-primary/5 rounded-lg">
                                        <Link to={`/submit-report?bounty_id=${post.bounty_id}&bounty_title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`}>
                                            <Button size="lg" className="w-full md:w-auto">
                                                <Info className="mr-2 h-5 w-5" />
                                                {bountyInfo.buttonText}
                                            </Button>
                                        </Link>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {bountyInfo.description}
                                        </p>
                                    </div>
                                );
                            })()}
                            
                            {post.category === 'most_wanted' && (() => {
                                const mostWantedInfo = getMostWantedInfo(post);
                                return mostWantedInfo && (
                                    <div className="text-center py-6 border-t border-b bg-red-50 dark:bg-red-950/20 rounded-lg">
                                        <Link to={`/submit-report?bounty_title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}&most_wanted_type=${encodeURIComponent(mostWantedInfo.type)}`}>
                                            <Button size="lg" className="w-full md:w-auto bg-red-600 hover:bg-red-700">
                                                <Info className="mr-2 h-5 w-5" />
                                                {mostWantedInfo.buttonText}
                                            </Button>
                                        </Link>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {mostWantedInfo.description}
                                        </p>
                                    </div>
                                );
                            })()}
                            <div 
                                className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default NewsPostPage;