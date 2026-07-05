'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FieldError } from '@/components/ui/form-feedback';
import { sanitizeFilename } from '@/lib/utils';
import MaximizableThumbnailOverlay, {
  maximizableThumbnailGroupClass,
} from '@/components/media/MaximizableThumbnailOverlay';
import { getLocalFileUrl } from '@/lib/fileUtils';
import { isVideoPath } from '@/lib/mediaUtils';
import { resolveMediaUrl } from '@/lib/mediaUtils';

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const isAcceptedGalleryFile = (file) =>
  file?.type?.startsWith('image/') || file?.type?.startsWith('video/');

const isFileWithinSizeLimit = (file) => {
  if (file.type?.startsWith('video/')) return file.size <= MAX_VIDEO_BYTES;
  if (file.type?.startsWith('image/')) return file.size <= MAX_IMAGE_BYTES;
  return false;
};

export default function MediaStep({
  featuredImageUrl,
  onFeaturedFileSelect,
  onFeaturedRemove,
  galleryPaths = [],
  onGalleryPathsChange,
  pendingGalleryFiles = [],
  onPendingGalleryFilesChange,
  fieldErrors = {},
}) {
  const featuredInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState({});
  const [resolvedGalleryUrls, setResolvedGalleryUrls] = useState({});

  useEffect(() => {
    const next = {};
    pendingGalleryFiles.forEach((file, index) => {
      if (isAcceptedGalleryFile(file)) {
        next[`pending-${index}`] = URL.createObjectURL(file);
      }
    });
    setGalleryPreviewUrls(next);
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingGalleryFiles]);

  useEffect(() => {
    let cancelled = false;
    galleryPaths.forEach(async (path) => {
      const url = await resolveMediaUrl(path);
      if (!cancelled && url) {
        setResolvedGalleryUrls((prev) => ({ ...prev, [path]: url }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [galleryPaths]);

  const handleGalleryPick = (e) => {
    const picked = Array.from(e.target.files || []).filter(isAcceptedGalleryFile);
    e.target.value = '';
    if (picked.some((file) => !isFileWithinSizeLimit(file))) return;
    onPendingGalleryFilesChange([...pendingGalleryFiles, ...picked]);
  };

  const removeGalleryPath = (path) => {
    onGalleryPathsChange(galleryPaths.filter((p) => p !== path));
  };

  const removePendingFile = (index) => {
    onPendingGalleryFilesChange(pendingGalleryFiles.filter((_, i) => i !== index));
  };

  const ThumbnailTile = ({ src, alt, onRemove, badge, isVideo = false }) => (
    <div className="relative">
      <div className={`${maximizableThumbnailGroupClass} relative aspect-square rounded-lg bg-muted`}>
        {isVideo ? (
          <>
            <video src={src} className="h-full w-full rounded-lg object-cover" muted playsInline preload="metadata" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-7 w-7 fill-white/90 text-white" />
            </div>
          </>
        ) : (
          <>
            <img src={src} alt={alt} className="h-full w-full rounded-lg object-cover" />
            <MaximizableThumbnailOverlay />
          </>
        )}
      </div>
      {badge && (
        <span className="pointer-events-none absolute left-1 top-1 z-10 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-primary-foreground">
          {badge}
        </span>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-1 top-1 z-10 h-7 w-7"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Photos & videos</Label>
        <p className="text-xs text-muted-foreground">
          Featured image is required. Add more photos or videos for the public gallery.
        </p>
        <input
          ref={featuredInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          id="mw-featured-image"
          onChange={onFeaturedFileSelect}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleGalleryPick}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => featuredInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {featuredImageUrl ? 'Replace featured' : 'Add featured image'}
          </Button>
          <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Add more photos & videos
          </Button>
        </div>
        <FieldError message={fieldErrors.featured_image} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featuredImageUrl && (
            <ThumbnailTile
              src={featuredImageUrl}
              alt="Featured"
              badge="Featured"
              onRemove={onFeaturedRemove}
            />
          )}
          {galleryPaths.map((path) => {
            const url = resolvedGalleryUrls[path] || getLocalFileUrl(path);
            return (
              <ThumbnailTile
                key={path}
                src={url}
                alt=""
                isVideo={isVideoPath(path)}
                onRemove={() => removeGalleryPath(path)}
              />
            );
          })}
          {pendingGalleryFiles.map((file, index) =>
            galleryPreviewUrls[`pending-${index}`] ? (
              <ThumbnailTile
                key={`pending-${file.name}-${index}`}
                src={galleryPreviewUrls[`pending-${index}`]}
                alt={sanitizeFilename(file.name)}
                isVideo={file.type?.startsWith('video/')}
                onRemove={() => removePendingFile(index)}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
