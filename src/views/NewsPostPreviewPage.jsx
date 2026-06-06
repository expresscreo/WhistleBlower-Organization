'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Coins, Info, Loader2, MapPin, X } from 'lucide-react';
import PageHead from '@/components/PageHead';
import NewsPostHero from '@/components/news/NewsPostHero';
import MostWantedPostLayout from '@/components/news/MostWantedPostLayout';
import MaximizableImage from '@/components/media/MaximizableImage';
import RichTextMediaContent from '@/components/media/RichTextMediaContent';
import EvidenceThumbnailGallery from '@/components/media/EvidenceThumbnailGallery';
import SocialShare from '@/components/SocialShare';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { PUBLISHED_ARTICLE_PROSE_CLASS } from '@/lib/articleContentStyles';
import { getBountyInfo } from '@/lib/bountyCta';
import { getEvidencePathsForPublishedPost } from '@/lib/publishedEvidence';
import { hasStructuredMostWantedDetails } from '@/lib/mostWantedUtils';
import {
  getPreviewIdFromLocation,
  loadNewsPreviewPayloadWithFallbacks,
  subscribeToNewsPreviewPayload,
} from '@/lib/newsPreviewState';
import {
  buildBountySubmitReportHref,
  buildMostWantedSubmitReportHref,
} from '@/lib/submitReportHref';
import { slugify } from '@/lib/utils';

function getMostWantedInfo(post) {
  if (post.category !== 'most_wanted') return null;

  const combinedText = `${post.title} ${post.content}`.toLowerCase();
  const personKeywords = ['person', 'individual', 'suspect', 'criminal', 'fugitive', 'wanted', 'man', 'woman'];
  const organizationKeywords = ['organization', 'gang', 'group', 'syndicate', 'cartel', 'network'];
  const locationKeywords = ['location', 'place', 'building', 'house', 'property', 'area', 'site'];
  const vehicleKeywords = ['vehicle', 'car', 'truck', 'bus', 'motorcycle', 'bike', 'van', 'suv'];

  if (personKeywords.some((keyword) => combinedText.includes(keyword))) {
    return {
      type: 'person',
      buttonText: 'Report Information About This Person',
      description:
        'Have information about this wanted person? Submit it anonymously and help bring them to justice.',
    };
  }
  if (organizationKeywords.some((keyword) => combinedText.includes(keyword))) {
    return {
      type: 'organization',
      buttonText: 'Report Information About This Organization',
      description:
        'Have information about this wanted organization? Submit it anonymously and help authorities.',
    };
  }
  if (locationKeywords.some((keyword) => combinedText.includes(keyword))) {
    return {
      type: 'location',
      buttonText: 'Report Information About This Location',
      description:
        'Have information about this wanted location? Submit it anonymously and help authorities.',
    };
  }
  if (vehicleKeywords.some((keyword) => combinedText.includes(keyword))) {
    return {
      type: 'vehicle',
      buttonText: 'Report Information About This Vehicle',
      description:
        'Have information about this wanted vehicle? Submit it anonymously and help authorities.',
    };
  }

  return {
    type: 'general',
    buttonText: 'Report Information About This Case',
    description:
      'Have information about this wanted case? Submit it anonymously and help bring justice.',
  };
}

function PreviewBanner() {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-600/30 bg-amber-500 text-amber-950">
      <div className="container mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium">
        <span>Preview mode — this post is not published yet.</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-800/30 bg-amber-50/80 text-amber-950 hover:bg-amber-100"
          onClick={() => window.close()}
        >
          <X className="mr-1.5 h-4 w-4" />
          Close preview
        </Button>
      </div>
    </div>
  );
}

function PreviewUnavailable({ previewId }) {
  return (
    <div className="container mx-auto px-4 py-20 max-w-lg">
      <PageErrorBanner
        error={
          previewId
            ? 'This preview link has expired or could not be loaded. Return to the editor and click Preview again.'
            : 'No preview id was provided. Open preview from the news editor using the Preview button.'
        }
        title="Preview unavailable"
        className="mb-6"
      />
      <Link href="/admin/news-editor" className="inline-block text-primary hover:underline">
        Back to News Editor
      </Link>
    </div>
  );
}

function PreviewImageGallery({ urls, title = 'Gallery' }) {
  if (!urls?.length) return null;

  return (
    <div className="border-t pt-6">
      <h3 className="mb-4 text-xl font-semibold">{title}</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {urls.map((url, index) => (
          <MaximizableImage
            key={`${url}-${index}`}
            src={url}
            alt={`${title} ${index + 1}`}
            wrapperClassName="aspect-square w-full"
            imageClassName="h-full w-full object-cover"
          />
        ))}
      </div>
    </div>
  );
}

export default function NewsPostPreviewPage() {
  const searchParams = useSearchParams();
  const previewId = searchParams.get('id') || getPreviewIdFromLocation();
  const [payload, setPayload] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const loadedRef = useRef(false);

  const applyPayload = useCallback((nextPayload) => {
    if (!nextPayload?.post?.title?.trim()) return false;
    loadedRef.current = true;
    setPayload(nextPayload);
    setLoadState('ready');
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadedRef.current = false;
    setLoadState('loading');
    setPayload(null);

    const tryLoad = () => {
      if (cancelled) return false;
      const stored = loadNewsPreviewPayloadWithFallbacks(previewId);
      return stored ? applyPayload(stored) : false;
    };

    if (tryLoad()) {
      return undefined;
    }

    const retryDelays = [100, 250, 500, 900];
    const retryTimers = retryDelays.map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) tryLoad();
      }, delay)
    );

    const errorTimer = window.setTimeout(() => {
      if (!cancelled && !loadedRef.current) setLoadState('error');
    }, 1600);

    const unsubscribe = subscribeToNewsPreviewPayload(previewId, (messagePayload) => {
      if (!cancelled) applyPayload(messagePayload);
    });

    return () => {
      cancelled = true;
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(errorTimer);
      unsubscribe();
    };
  }, [previewId, applyPayload]);

  const post = payload?.post;
  const bountyDetails = payload?.bountyDetails;
  const isStructuredMostWanted = post ? hasStructuredMostWantedDetails(post) : false;

  const publishedEvidencePaths = useMemo(() => {
    if (!post) return [];
    if (post.category === 'bounty') {
      return getEvidencePathsForPublishedPost(
        { published_evidence: post.published_evidence },
        bountyDetails?.evidence || []
      );
    }
    if (post.category === 'most_wanted') {
      return getEvidencePathsForPublishedPost(post, []);
    }
    return [];
  }, [post, bountyDetails]);

  const previewGalleryUrls = Array.isArray(post?.preview_gallery_data_urls)
    ? post.preview_gallery_data_urls.filter(Boolean)
    : [];

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading preview" />
      </div>
    );
  }

  if (loadState === 'error' || !post?.title?.trim()) {
    return <PreviewUnavailable previewId={previewId || getPreviewIdFromLocation()} />;
  }

  const featuredImageUrl = post.featured_image_url || null;
  const heroDate = post.created_at || new Date().toISOString();
  const shareSlug = slugify(post.title);

  if (post.category === 'bounty') {
    const bountyInfo = getBountyInfo({ title: post.title, content: post.content });
    const giveInfoUrl = post.bounty_id
      ? buildBountySubmitReportHref({ bountyId: post.bounty_id, title: post.title })
      : '#';
    const bountyAmount = post.bounty_amount || bountyDetails?.bounty_amount;

    return (
      <>
        <PageHead title={`Preview: ${post.title} — WhistleBlower.ng`} />
        <PreviewBanner />
        <NewsPostHero
          post={{
            title: post.title,
            category: 'bounty',
            created_at: heroDate,
          }}
        />
        <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Card className="overflow-hidden border-border/70 shadow-sm">
            {featuredImageUrl && (
              <MaximizableImage
                src={featuredImageUrl}
                alt={post.title}
                wrapperClassName="aspect-video w-full"
                imageClassName="h-full w-full object-cover"
              />
            )}
            <CardContent className="space-y-8 p-6 md:p-8 lg:p-10">
              <div className="rounded-lg border-t border-b bg-primary/5 py-6 text-center">
                <Button size="lg" className="w-full uppercase md:w-auto" asChild>
                  <Link href={giveInfoUrl}>
                    <Info className="mr-2 h-5 w-5" />
                    {bountyInfo.buttonText}
                  </Link>
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">{bountyInfo.description}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="mb-4 text-xl font-semibold">Bounty Details</h3>
                <RichTextMediaContent
                  html={post.content}
                  evidence={bountyDetails?.evidence || []}
                  thumbnailHover={false}
                  className={PUBLISHED_ARTICLE_PROSE_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Coins className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bounty Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      {bountyAmount ? Number(bountyAmount).toLocaleString() : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="text-lg font-semibold">
                      {[bountyDetails?.location, bountyDetails?.state].filter(Boolean).join(', ') ||
                        'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Type of Crime</p>
                    <p className="text-lg font-semibold">
                      {bountyDetails?.type_of_crime || 'Not specified'}
                    </p>
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

              <div className="border-t pt-6">
                <SocialShare
                  title={post.title}
                  url={`/bounties/${shareSlug}`}
                  description={`${String(post.content || '').replace(/<[^>]*>/g, '').trim().substring(0, 150)}...`}
                  hashtags={['WhistleBlower', 'Nigeria', 'Bounty', bountyDetails?.type_of_crime]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const mostWantedInfo =
    post.category === 'most_wanted' && !isStructuredMostWanted ? getMostWantedInfo(post) : null;

  return (
    <>
      <PageHead title={`Preview: ${post.title} — WhistleBlower.ng`} />
      <PreviewBanner />
      <NewsPostHero post={{ ...post, created_at: heroDate }} />
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

            {isStructuredMostWanted && previewGalleryUrls.length > 0 && (
              <PreviewImageGallery urls={previewGalleryUrls} title="Photo Gallery" />
            )}

            {mostWantedInfo && (
              <div className="rounded-lg border-t border-b border-[#2e2e2e] bg-red-50 py-6 text-center dark:bg-red-950/20">
                <Button size="lg" className="w-full bg-red-600 uppercase hover:bg-red-700 md:w-auto" asChild>
                  <Link
                    href={buildMostWantedSubmitReportHref({
                      newsId: post.id,
                      title: post.title,
                      mostWantedType: mostWantedInfo.type,
                    })}
                  >
                    <Info className="mr-2 h-5 w-5" />
                    {mostWantedInfo.buttonText}
                  </Link>
                </Button>
                <p className="mt-2 text-sm text-muted-foreground">{mostWantedInfo.description}</p>
              </div>
            )}

            {!isStructuredMostWanted && (
              <RichTextMediaContent
                html={post.content}
                evidence={[]}
                thumbnailHover={false}
                className={PUBLISHED_ARTICLE_PROSE_CLASS}
              />
            )}

            <div className="border-t pt-6">
              <SocialShare
                title={post.title}
                url={`/news/post/${shareSlug}`}
                description={`${String(post.content || '').replace(/<[^>]*>/g, '').trim().substring(0, 150)}...`}
                hashtags={['WhistleBlower', 'Nigeria', post.category]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
