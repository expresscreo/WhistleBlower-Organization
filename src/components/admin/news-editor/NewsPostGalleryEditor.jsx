'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MaximizableThumbnailOverlay, {
  maximizableThumbnailGroupClass,
} from '@/components/media/MaximizableThumbnailOverlay';
import { getLocalFileUrl } from '@/lib/fileUtils';
import { isVideoPath, resolveMediaUrl } from '@/lib/mediaUtils';
import { sanitizeFilename } from '@/lib/utils';

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function isAcceptedGalleryFile(file) {
  return file?.type?.startsWith('image/') || file?.type?.startsWith('video/');
}

function isFileWithinSizeLimit(file) {
  if (file.type?.startsWith('video/')) return file.size <= MAX_VIDEO_BYTES;
  if (file.type?.startsWith('image/')) return file.size <= MAX_IMAGE_BYTES;
  return false;
}

function ThumbnailTile({ path, src, alt, isVideo, onRemove }) {
  return (
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
}

export default function NewsPostGalleryEditor({
  galleryPaths = [],
  onGalleryPathsChange,
  pendingGalleryFiles = [],
  onPendingGalleryFilesChange,
  description = 'Optional — add extra photos and videos shown at the bottom of the public post.',
}) {
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

  return (
    <div className="space-y-3">
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleGalleryPick}
      />
      <Button type="button" variant="outline" onClick={() => galleryInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Add more photos & videos
      </Button>

      {(galleryPaths.length > 0 || pendingGalleryFiles.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {galleryPaths.map((path) => {
            const url = resolvedGalleryUrls[path] || getLocalFileUrl(path);
            return (
              <ThumbnailTile
                key={path}
                path={path}
                src={url}
                alt=""
                isVideo={isVideoPath(path)}
                onRemove={() => onGalleryPathsChange(galleryPaths.filter((p) => p !== path))}
              />
            );
          })}
          {pendingGalleryFiles.map((file, index) =>
            galleryPreviewUrls[`pending-${index}`] ? (
              <ThumbnailTile
                key={`pending-${file.name}-${index}`}
                path={file.name}
                src={galleryPreviewUrls[`pending-${index}`]}
                alt={sanitizeFilename(file.name)}
                isVideo={file.type?.startsWith('video/')}
                onRemove={() =>
                  onPendingGalleryFilesChange(pendingGalleryFiles.filter((_, i) => i !== index))
                }
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
