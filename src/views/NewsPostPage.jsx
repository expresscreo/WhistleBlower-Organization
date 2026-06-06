import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { Loader2, Calendar, Info, Coins, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import NewsPostHero from '@/components/news/NewsPostHero';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';
import { generateNewsPostSEO } from '@/lib/seoUtils';
import { findPublishedNewsByRouteSlug } from '@/lib/postSlug';
import { slugify } from '@/lib/utils';
import SocialShare from '@/components/SocialShare';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import MaximizableImage from '@/components/media/MaximizableImage';
import RichTextMediaContent from '@/components/media/RichTextMediaContent';
import { resolveMediaUrl } from '@/lib/mediaUtils';
import { getEvidencePathsForPublishedPost } from '@/lib/publishedEvidence';
import { hasStructuredMostWantedDetails } from '@/lib/mostWantedUtils';
import MostWantedPostLayout from '@/components/news/MostWantedPostLayout';
import { getLocalFileUrl, resolveImageUrl } from '@/lib/fileUtils';

const NewsPostPage = () => {
    const { slug } = useParams();
    const router = useRouter();
    const [fetchError, setFetchError] = useState('');
    const [post, setPost] = useState(null);
    const [bountyDetails, setBountyDetails] = useState(null);
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
        let data = null;
        let error = null;

        // Try to fetch by slug column if DB supports it
        // Fetch all published posts and resolve by title-based slug to avoid relying on a slug column
        const { data: list, error: listError } = await supabase
            .from('news')
            .select('*')
            .eq('status', 'published');

        if (!listError && Array.isArray(list)) {
            data = findPublishedNewsByRouteSlug(list, slug);
        } else if (listError) {
            error = listError;
        }

        if (!data) {
            setFetchError('News post not found.');
            setPost(null);
            setBountyDetails(null);
            setFeaturedImageUrl(null);
        } else {
            setFetchError('');
            setPost(data);
            if (data.category === 'bounty' && data.bounty_id) {
                const { data: bountyData, error: bountyError } = await supabase
                    .from('bounties')
                    .select('bounty_amount, evidence, location, state, type_of_crime')
                    .eq('id', data.bounty_id)
                    .maybeSingle();
                setBountyDetails(bountyError ? null : bountyData);
            } else {
                setBountyDetails(null);
            }
        }
        setLoading(false);
    }, [slug]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    useEffect(() => {
        if (!post?.featured_image) {
            setFeaturedImageUrl(null);
            return;
        }

        let cancelled = false;

        // Render a synchronous candidate immediately while async resolution runs.
        const immediateSrc =
            getLocalFileUrl(post.featured_image) ||
            resolveImageUrl(post.featured_image);
        if (immediateSrc) {
            setFeaturedImageUrl(immediateSrc);
        } else {
            setFeaturedImageUrl(null);
        }

        const resolveWithRetry = async () => {
            const resolved = await resolveMediaUrl(post.featured_image, {
                preferredSrc: immediateSrc,
            });

            if (!cancelled && resolved) {
                setFeaturedImageUrl(resolved);
                return;
            }

            // Retry once after a short delay for transient URL/storage race cases.
            if (!cancelled) {
                setTimeout(async () => {
                    const retryResolved = await resolveMediaUrl(post.featured_image, {
                        preferredSrc: immediateSrc,
                    });
                    if (!cancelled && retryResolved) {
                        setFeaturedImageUrl(retryResolved);
                    }
                }, 250);
            }
        };

        resolveWithRetry();

        return () => {
            cancelled = true;
        };
    }, [post?.id, post?.featured_image]);

    // Real-time subscription for specific post updates
    useEffect(() => {
        if (!post?.id) return;

        const channel = supabase
            .channel(`news-post-${post.id}`)
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'news',
                    filter: `id=eq.${post.id}`
                }, 
                (payload) => {
                    console.log('News post update received:', payload);
                    if (payload.new && payload.new.status === 'published') {
                        fetchPost();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post, fetchPost]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-[80vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }

    if (!post) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-lg">
                <PageErrorBanner error={fetchError || 'The requested news post could not be found.'} title="Post not found" className="mb-6" />
                <Link href="/news" className="inline-block text-primary hover:underline">Back to News</Link>
            </div>
        );
    }

    const publishedEvidencePaths =
        post?.category === 'bounty' && bountyDetails
            ? getEvidencePathsForPublishedPost(post, bountyDetails.evidence)
            : [];

    const isStructuredMostWanted = hasStructuredMostWantedDetails(post);

    // Generate SEO metadata for the post (uses title slug URL)
    const seoMeta = post ? generateNewsPostSEO({
        ...post,
        slug: slugify(post.title)
    }) : null;

    return (
        <>
            {seoMeta && <SEOHead {...seoMeta} />}
            <NewsPostHero post={post} />
            <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
                <Card className="overflow-hidden border-border/70 shadow-sm">
                        {featuredImageUrl && !isStructuredMostWanted && (
                            <MaximizableImage
                                src={featuredImageUrl}
                                alt={post.title}
                                wrapperClassName="aspect-video w-full"
                                imageClassName="h-full w-full object-cover"
                            />
                        )}
                        <CardContent className="space-y-8 p-6 md:p-8 lg:p-10">
                            {isStructuredMostWanted && (
                                <MostWantedPostLayout post={post} featuredImageUrl={featuredImageUrl} />
                            )}

                            {post.category === 'bounty' && (() => {
                                const bountyInfo = getBountyInfo(post);
                                return bountyInfo && (
                                    <div className="text-center py-6 border-t border-b bg-primary/5 rounded-lg">
                                        <Link href={`/submit-report?bounty_id=${post.bounty_id}&bounty_title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`}>
                                            <Button size="lg" className="w-full md:w-auto uppercase">
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
                            
                            {post.category === 'most_wanted' && !isStructuredMostWanted && (() => {
                                const mostWantedInfo = getMostWantedInfo(post);
                                return mostWantedInfo && (
                                    <div className="text-center py-6 border-t border-b border-[#2e2e2e] bg-red-50 dark:bg-red-950/20 rounded-lg">
                                        <Link href={`/submit-report?news_id=${encodeURIComponent(post.id)}&bounty_title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}&most_wanted_type=${encodeURIComponent(mostWantedInfo.type)}`}>
                                            <Button size="lg" className="w-full md:w-auto bg-red-600 hover:bg-red-700 uppercase">
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
                            {!isStructuredMostWanted && (
                            <RichTextMediaContent
                                html={post.content}
                                evidence={bountyDetails?.evidence || []}
                                thumbnailHover={false}
                                className="prose dark:prose-invert max-w-none text-lg leading-relaxed"
                            />
                            )}

                            {post.category === 'bounty' && bountyDetails && (
                                <div className="space-y-6 border-t pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <Coins className="h-6 w-6 text-primary mt-1" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Bounty Amount</p>
                                                <p className="font-bold text-2xl text-primary">
                                                    {(bountyDetails.bounty_amount || post.bounty_amount)
                                                        ? `${Number(bountyDetails.bounty_amount || post.bounty_amount).toLocaleString()}`
                                                        : 'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-6 w-6 text-primary mt-1" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Location</p>
                                                <p className="font-semibold text-lg">
                                                    {[bountyDetails.location, bountyDetails.state].filter(Boolean).join(', ') || 'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-6 w-6 text-primary mt-1" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Type of Crime</p>
                                                <p className="font-semibold text-lg">{bountyDetails.type_of_crime || 'Not specified'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {publishedEvidencePaths.length > 0 && (
                                        <EvidenceThumbnailGallery
                                            paths={publishedEvidencePaths}
                                            showOtherAttachments={false}
                                        />
                                    )}
                                </div>
                            )}
                            
                            {/* Social Share Section */}
                            <div className="border-t pt-6">
                                <SocialShare 
                                    title={post.title}
                                    url={`/news/post/${slugify(post.title)}`}
                                    description={post.content?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
                                    hashtags={['WhistleBlower', 'Nigeria', post.category]}
                                />
                            </div>
                        </CardContent>
                </Card>
            </div>
        </>
    );
};

export default NewsPostPage;