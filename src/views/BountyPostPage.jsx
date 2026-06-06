import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import React, { useState, useEffect, useCallback } from 'react';
import { findPublishedNewsByRouteSlug } from '@/lib/postSlug';
import { slugify } from '@/lib/utils';
import PageHead from '@/components/PageHead';
import { supabase } from '@/lib/customSupabaseClient';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NewsPostHero from '@/components/news/NewsPostHero';
import { Loader2, Info, MapPin, Calendar, Coins } from 'lucide-react';
import SocialShare from '@/components/SocialShare';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import RichTextMediaContent from '@/components/media/RichTextMediaContent';
import { resolveMediaUrl } from '@/lib/mediaUtils';
import { getEvidencePathsForPublishedPost } from '@/lib/publishedEvidence';
import { BOUNTY_STATUSES_WITH_PUBLIC_PAGE } from '@/lib/bountyPostUrl';
import { getBountyInfo } from '@/lib/bountyCta';
import { PUBLISHED_ARTICLE_PROSE_CLASS } from '@/lib/articleContentStyles';

const BountyPostPage = () => {
    const { slug } = useParams();
    const router = useRouter();
    const [fetchError, setFetchError] = useState('');
    const [bounty, setBounty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [featuredImageUrl, setFeaturedImageUrl] = useState(null);

    const fetchBounty = useCallback(async () => {
        setLoading(true);
        setFetchError('');

        const { data: newsList, error: newsListError } = await supabase
            .from('news')
            .select('*')
            .eq('status', 'published');

        if (newsListError) {
            console.error('Error loading published news:', newsListError);
            setFetchError('Could not load this bounty post.');
            setLoading(false);
            return;
        }

        const newsData = findPublishedNewsByRouteSlug(newsList, slug);

        // If there's a published news item, use it
        if (newsData?.bounty_id) {
            const bountyId = newsData.bounty_id;
            console.log('Found published news item for bounty:', newsData);
            
            // Fetch the original bounty data to get additional fields
            const { data: bountyData, error: bountyError } = await supabase
                .from('bounties')
                .select('*')
                .eq('id', bountyId)
                .single();
            
            if (bountyError || !bountyData) {
                setFetchError('This bounty may not exist or has not been published.');
                setLoading(false);
                return;
            }
            
            // Merge bounty data with updated news content
            const updatedBounty = {
                ...bountyData,
                title: newsData.title,
                description: newsData.content,
                featured_image: newsData.featured_image,
                published_evidence: newsData.published_evidence,
                news_bounty_amount: newsData.bounty_amount,
                updated_at: newsData.updated_at
            };
            setFetchError('');
            setBounty(updatedBounty);
            setFeaturedImageUrl(null);
            setLoading(false);
            return;
        }

        // If no published news item, check if the bounty itself is published
        const { data: bountyData, error: bountyError } = await supabase
            .from('bounties')
            .select('*')
            .ilike('title', slug.replace(/-/g, ' '))
            .in('status', BOUNTY_STATUSES_WITH_PUBLIC_PAGE)
            .single();

        // If no published news item found, check if bounty is published
        if (bountyError || !bountyData) {
            setFetchError('This bounty may not exist or has not been published.');
            setLoading(false);
            return;
        }

        // Use original bounty data
        setFetchError('');
        setBounty(bountyData);
        setFeaturedImageUrl(null);
        setLoading(false);
    }, [slug, router]);

    useEffect(() => {
        fetchBounty();
    }, [fetchBounty]);

    useEffect(() => {
        if (!bounty?.featured_image) {
            setFeaturedImageUrl(null);
            return;
        }

        let cancelled = false;
        resolveMediaUrl(bounty.featured_image).then((url) => {
            if (!cancelled) setFeaturedImageUrl(url);
        });

        return () => {
            cancelled = true;
        };
    }, [bounty?.featured_image]);

    // Real-time subscription for bounty updates (when updated through news editor)
    useEffect(() => {
        if (!bounty?.id) return;

        const channel = supabase
            .channel(`bounty-updates-${bounty.id}`)
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'bounties',
                    filter: `id=eq.${bounty.id}`
                }, 
                (payload) => {
                    console.log('Bounty update received:', payload);
                    if (payload.new && BOUNTY_STATUSES_WITH_PUBLIC_PAGE.includes(payload.new.status)) {
                        setBounty((prev) =>
                            prev
                                ? {
                                      ...payload.new,
                                      title: prev.title,
                                      description: prev.description,
                                      featured_image: prev.featured_image,
                                      published_evidence: prev.published_evidence,
                                      news_bounty_amount: prev.news_bounty_amount,
                                  }
                                : payload.new
                        );
                    }
                }
            )
            .on('postgres_changes', 
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'news',
                    filter: `bounty_id=eq.${bounty.id}`
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
    }, [bounty, fetchBounty]);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    if (!bounty) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-lg">
                <PageErrorBanner error={fetchError || 'This bounty may not exist or has not been published.'} title="Bounty not found" className="mb-6" />
                <Link href="/news" className="inline-block text-primary hover:underline">Back to news</Link>
            </div>
        );
    }

    const bountyInfo = getBountyInfo({
        title: bounty.title,
        content: bounty.description,
    });
    const giveInfoUrl = `/submit-report?bounty_id=${bounty.id}&bounty_title=${encodeURIComponent(bounty.title)}`;
    const publishedEvidencePaths = getEvidencePathsForPublishedPost(
        bounty.published_evidence !== undefined ? { published_evidence: bounty.published_evidence } : null,
        bounty.evidence
    );

    return (
        <>
            <PageHead
                title={`${bounty.title} - WhistleBlower.ng`}
                description={String(bounty.description || '').replace(/<[^>]*>/g, ' ').trim().substring(0, 160)}
            />
            <NewsPostHero
                post={{
                    title: bounty.title,
                    category: 'bounty',
                    created_at: bounty.incident_date || bounty.created_at,
                }}
            />
            <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
                <Card className="overflow-hidden border-border/70 shadow-sm">
                        {featuredImageUrl && (
                            <div className="aspect-video w-full overflow-hidden">
                                <img
                                    src={featuredImageUrl}
                                    alt={bounty.title}
                                    className="h-full w-full object-cover"
                                    onError={() => {
                                        if (bounty.featured_image) {
                                            resolveMediaUrl(bounty.featured_image).then(setFeaturedImageUrl);
                                        }
                                    }}
                                />
                            </div>
                        )}
                        <CardContent className="space-y-8 p-6 md:p-8 lg:p-10">
                            <div className="text-center py-6 border-t border-b bg-primary/5 rounded-lg">
                                <Link href={giveInfoUrl}>
                                    <Button size="lg" className="w-full md:w-auto uppercase">
                                        <Info className="mr-2 h-5 w-5" />
                                        {bountyInfo.buttonText}
                                    </Button>
                                </Link>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {bountyInfo.description}
                                </p>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-semibold text-xl mb-4">Bounty Details</h3>
                                <RichTextMediaContent
                                    html={bounty.description}
                                    evidence={bounty.evidence}
                                    thumbnailHover={false}
                                    className={PUBLISHED_ARTICLE_PROSE_CLASS}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                                <div className="flex items-start gap-3">
                                    <Coins className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bounty Amount</p>
                                        <p className="font-bold text-2xl text-primary">{(bounty.bounty_amount || bounty.news_bounty_amount) ? `${Number(bounty.bounty_amount || bounty.news_bounty_amount).toLocaleString()}` : 'Not specified'}</p>
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

                            {publishedEvidencePaths.length > 0 && (
                                <EvidenceThumbnailGallery
                                    paths={publishedEvidencePaths}
                                    showOtherAttachments={false}
                                    className="border-t pt-6"
                                />
                            )}
                            
                            {/* Social Share Section */}
                            <div className="border-t pt-6">
                                <SocialShare 
                                    title={bounty.title}
                                    url={`/bounties/${slugify(bounty.title)}`}
                                    description={`${String(bounty.description || '').replace(/<[^>]*>/g, '').trim().substring(0, 150)}...`}
                                    hashtags={['WhistleBlower', 'Nigeria', 'Bounty', bounty.type_of_crime]}
                                />
                            </div>
                        </CardContent>
                </Card>
            </div>
        </>
    );
};

export default BountyPostPage;
