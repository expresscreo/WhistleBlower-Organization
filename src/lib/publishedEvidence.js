import { areSameMediaPath, isImagePath } from '@/lib/mediaUtils';

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
    return bountyPaths;
  }

  const approved = normalizePublishedEvidence(post.published_evidence);
  if (approved.length === 0) {
    return bountyPaths.filter((path) => isImagePath(path));
  }

  return approved.filter((path) => {
    if (!isImagePath(path)) return false;
    if (bountyPaths.length === 0) return true;
    return bountyPaths.some((bountyPath) => areSameMediaPath(bountyPath, path));
  });
};

export const isEvidencePathApproved = (path, approvedPaths = []) =>
  approvedPaths.some((approved) => areSameMediaPath(approved, path));

export const getBountyPhotoGalleryTitle = (count) =>
  count === 1 ? 'Bounty Photo' : 'Bounty Photos';
