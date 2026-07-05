import { areSameMediaPath, isGalleryMediaPath, isImagePath, isVideoPath } from '@/lib/mediaUtils';

/** Normalize published_evidence from DB (array or JSON string). */
export const normalizePublishedEvidence = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Evidence paths to show on the published post.
 * Uses editor-approved list when present; falls back to full bounty evidence for legacy posts.
 */
export const getEvidencePathsForPublishedPost = (post, bountyEvidence = []) => {
  const bountyPaths = Array.isArray(bountyEvidence) ? bountyEvidence.filter(Boolean) : [];

  if (post?.published_evidence === undefined || post?.published_evidence === null) {
    return bountyPaths.filter((path) => isGalleryMediaPath(path));
  }

  const approved = normalizePublishedEvidence(post.published_evidence);
  if (approved.length === 0) {
    return bountyPaths.filter((path) => isGalleryMediaPath(path));
  }

  return approved.filter((path) => isGalleryMediaPath(path));
};

export const isEvidencePathApproved = (path, approvedPaths = []) =>
  approvedPaths.some((approved) => areSameMediaPath(approved, path));

export const getBountyPhotoGalleryTitle = (paths = []) => {
  const list = Array.isArray(paths) ? paths : [];
  const imageCount = list.filter((path) => isImagePath(path)).length;
  const videoCount = list.filter((path) => isVideoPath(path)).length;
  const total = list.length;

  if (imageCount && videoCount) {
    return total === 1 ? 'More Photo & Video' : 'More Photos & Videos';
  }
  if (videoCount) {
    return total === 1 ? 'More Video' : 'More Videos';
  }
  return total === 1 ? 'More Photo' : 'More Photos';
};

/** Gallery paths for public bounty posts — includes featured image when present. */
export const getBountyGalleryDisplayPaths = (post, bountyEvidence = []) => {
  const paths = getEvidencePathsForPublishedPost(post, bountyEvidence);
  const featured = post?.featured_image;
  if (!featured || !isGalleryMediaPath(featured)) return paths;
  if (paths.some((path) => areSameMediaPath(path, featured))) return paths;
  return [featured, ...paths];
};
