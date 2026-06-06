import { resolveMediaUrl } from '@/lib/mediaUtils';
import {
  buildMostWantedContentSnippet,
  buildMostWantedHeadline,
  ensureMostWantedReportReference,
  suggestMostWantedTitle,
} from '@/lib/mostWantedUtils';

async function readFileAsDataUrl(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(reader.error || new Error('Could not read file for preview.'));
    reader.readAsDataURL(file);
  });
}

function parseBountyAmount(value) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function buildNewsPreviewPayload({
  currentItem,
  editorHtml,
  featuredImageUrl,
  featuredImageFile,
  pendingGalleryFiles = [],
  publishedEvidencePaths,
  bountyDetails,
}) {
  const isMostWanted = currentItem.category === 'most_wanted';
  let title = currentItem.title;
  let content = editorHtml ?? currentItem.content ?? '';
  let mostWantedDetails = currentItem.most_wanted_details;

  if (isMostWanted) {
    mostWantedDetails = ensureMostWantedReportReference(currentItem.most_wanted_details);
    title =
      buildMostWantedHeadline(mostWantedDetails) ||
      suggestMostWantedTitle(mostWantedDetails) ||
      currentItem.title;
    content = buildMostWantedContentSnippet(title, mostWantedDetails);
  }

  let resolvedFeaturedUrl = featuredImageUrl || null;
  if (featuredImageFile) {
    resolvedFeaturedUrl = await readFileAsDataUrl(featuredImageFile);
  } else if (!resolvedFeaturedUrl && currentItem.featured_image) {
    resolvedFeaturedUrl = await resolveMediaUrl(currentItem.featured_image);
  }

  const previewGalleryDataUrls = [];
  for (const file of pendingGalleryFiles) {
    if (!file?.type?.startsWith('image/')) continue;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl) previewGalleryDataUrls.push(dataUrl);
    } catch (error) {
      console.warn('Preview gallery image skipped:', error);
    }
  }

  return {
    post: {
      id: currentItem.id || 'preview',
      title: String(title || '').trim(),
      content: content || '',
      category: currentItem.category || 'news',
      featured_image: currentItem.featured_image || null,
      featured_image_url: resolvedFeaturedUrl,
      bounty_amount: parseBountyAmount(currentItem.bounty_amount),
      bounty_id: currentItem.bounty_id || null,
      published_evidence: Array.isArray(publishedEvidencePaths) ? publishedEvidencePaths : [],
      preview_gallery_data_urls: previewGalleryDataUrls,
      most_wanted_details: mostWantedDetails,
      created_at: new Date().toISOString(),
    },
    bountyDetails: bountyDetails ?? null,
  };
}

export function validateNewsPreviewPayload(payload) {
  if (!payload?.post?.title?.trim()) {
    if (payload?.post?.category === 'most_wanted') {
      return 'Add enough Most Wanted details before previewing.';
    }
    return 'Add a title before previewing.';
  }
  return null;
}
