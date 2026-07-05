import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import AttachmentPreview from '@/views/track-report/AttachmentPreview';
import {
  areSameMediaPath,
  getMediaUrlCandidates,
  isVideoPath,
  partitionEvidence,
  resolveMediaUrl,
} from '@/lib/mediaUtils';
import { getBountyPhotoGalleryTitle } from '@/lib/publishedEvidence';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock';
import { cn, sanitizeFilename } from '@/lib/utils';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Image as ImageIcon,
  Plus,
  Star,
  X,
  Play,
} from 'lucide-react';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';

const getDisplayName = (path, index) => {
  const rawName = String(path || '').split('/').pop() || `image-${index + 1}`;
  const timestampSeparator = rawName.indexOf('-');
  const displayName = timestampSeparator >= 0 ? rawName.substring(timestampSeparator + 1) : rawName;
  return sanitizeFilename(displayName);
};

/** Above sticky navbar (z-[9999]) */
const LIGHTBOX_Z = 'z-[10050]';
const LIGHTBOX_DURATION_MS = 380;
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_SNAP_MS = 280;
const SWIPE_RUBBER_BAND = 0.35;

const navButtonClass =
  'absolute top-1/2 z-[10052] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:pointer-events-none disabled:opacity-30';

const getZoomTransform = (rect, expanded) => {
  if (!rect || typeof window === 'undefined') {
    return 'translate(-50%, -50%) scale(1)';
  }

  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const thumbCenterX = rect.left + rect.width / 2;
  const thumbCenterY = rect.top + rect.height / 2;
  const deltaX = thumbCenterX - viewportCenterX;
  const deltaY = thumbCenterY - viewportCenterY;

  const maxW = Math.min(window.innerWidth - 112, window.innerWidth * 0.92);
  const maxH = window.innerHeight - 96;
  const scaleX = rect.width / maxW;
  const scaleY = rect.height / maxH;
  const collapsedScale = Math.min(Math.max(scaleX, scaleY), 1);

  if (expanded) {
    return 'translate(-50%, -50%) scale(1)';
  }

  return `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(${collapsedScale})`;
};

const EvidenceThumbnailGallery = ({
  paths = [],
  title,
  description,
  featuredPath,
  insertedPaths = [],
  excludePath,
  onSelectFeatured,
  onInsertContent,
  showOtherAttachments = true,
  variant = 'default',
  className = ''
}) => {
  const isEditor = variant === 'editor';
  const [imageUrls, setImageUrls] = useState({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originRect, setOriginRect] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageVisible, setImageVisible] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDragging, setSwipeDragging] = useState(false);
  const [swipeTransitioning, setSwipeTransitioning] = useState(false);
  const closeTimerRef = useRef(null);
  const expandFrameRef = useRef(null);
  const thumbButtonRefs = useRef([]);
  const lightboxTrackRef = useRef(null);
  const swipePendingIndexRef = useRef(null);
  const touchSwipeRef = useRef({ startX: 0, startY: 0, active: false, isHorizontal: false });
  const { images, videos, other } = useMemo(() => partitionEvidence(paths), [paths]);
  const visibleGalleryItems = useMemo(
    () =>
      [...images, ...videos].filter(
        (path) => !excludePath || !areSameMediaPath(path, excludePath)
      ),
    [excludePath, images, videos]
  );

  const galleryCount = visibleGalleryItems.length;
  const displayTitle =
    title === ''
      ? ''
      : title ?? (galleryCount > 0 ? getBountyPhotoGalleryTitle(visibleGalleryItems) : '');
  const activePath = visibleGalleryItems[activeIndex];
  const activeUrl = activePath ? imageUrls[activePath] : null;
  const activeIsVideo = activePath ? isVideoPath(activePath) : false;
  const activeAlt = activePath ? getDisplayName(activePath, activeIndex) : 'Evidence media';

  useEffect(() => {
    let cancelled = false;

    visibleGalleryItems.forEach(async (path) => {
      const url = await resolveMediaUrl(path);
      if (!cancelled && url) {
        setImageUrls((prev) => (prev[path] ? prev : { ...prev, [path]: url }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visibleGalleryItems]);

  const handleImageError = useCallback(async (path, currentUrl) => {
    const candidates = getMediaUrlCandidates(path);
    const fallback = candidates.find((candidate) => candidate !== currentUrl);
    if (!fallback) return;

    setImageUrls((prev) => ({ ...prev, [path]: fallback }));
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const captureThumbRect = useCallback((index) => {
    const el = thumbButtonRefs.current[index];
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const closeLightbox = useCallback(() => {
    clearCloseTimer();
    document.querySelector('[data-evidence-lightbox]')?.querySelectorAll('video').forEach((video) => {
      video.pause();
    });
    const rect = captureThumbRect(activeIndex);
    if (rect) setOriginRect(rect);
    setIsExpanded(false);
    closeTimerRef.current = window.setTimeout(() => {
      setLightboxOpen(false);
      setOriginRect(null);
      closeTimerRef.current = null;
    }, LIGHTBOX_DURATION_MS);
  }, [activeIndex, captureThumbRect, clearCloseTimer]);

  const openLightbox = useCallback((index, event) => {
    clearCloseTimer();
    const rect = event.currentTarget.getBoundingClientRect();
    setOriginRect(rect);
    setActiveIndex(index);
    setImageVisible(true);
    setIsExpanded(false);
    setLightboxOpen(true);
  }, [clearCloseTimer]);

  const goToPrevious = useCallback(() => {
    if (galleryCount <= 1) return;
    setActiveIndex((current) => (current - 1 + galleryCount) % galleryCount);
  }, [galleryCount]);

  const goToNext = useCallback(() => {
    if (galleryCount <= 1) return;
    setActiveIndex((current) => (current + 1) % galleryCount);
  }, [galleryCount]);

  const resetSwipeState = useCallback(() => {
    swipePendingIndexRef.current = null;
    setSwipeOffset(0);
    setSwipeDragging(false);
    setSwipeTransitioning(false);
    touchSwipeRef.current = { startX: 0, startY: 0, active: false, isHorizontal: false };
  }, []);

  const snapSwipeBack = useCallback(() => {
    setSwipeDragging(false);
    setSwipeTransitioning(true);
    setSwipeOffset(0);
  }, []);

  const getSwipeTrackWidth = useCallback(
    () => lightboxTrackRef.current?.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 0),
    []
  );

  const animateSwipeCommit = useCallback(
    (direction) => {
      const width = getSwipeTrackWidth();
      if (!width) return;

      if (direction < 0 && activeIndex < galleryCount - 1) {
        swipePendingIndexRef.current = activeIndex + 1;
        setSwipeDragging(false);
        setSwipeTransitioning(true);
        setSwipeOffset(-width);
        return;
      }

      if (direction > 0 && activeIndex > 0) {
        swipePendingIndexRef.current = activeIndex - 1;
        setSwipeDragging(false);
        setSwipeTransitioning(true);
        setSwipeOffset(width);
        return;
      }

      snapSwipeBack();
    },
    [activeIndex, getSwipeTrackWidth, galleryCount, snapSwipeBack]
  );

  const handleSwipeTouchStart = useCallback(
    (event) => {
      if (galleryCount <= 1 || swipeTransitioning) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchSwipeRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        active: true,
        isHorizontal: false,
      };
    },
    [galleryCount, swipeTransitioning]
  );

  const handleSwipeTouchMove = useCallback(
    (event) => {
      if (!touchSwipeRef.current.active || galleryCount <= 1 || swipeTransitioning) return;

      const touch = event.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchSwipeRef.current.startX;
      const deltaY = touch.clientY - touchSwipeRef.current.startY;

      if (!touchSwipeRef.current.isHorizontal) {
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          touchSwipeRef.current.active = false;
          return;
        }
        touchSwipeRef.current.isHorizontal = true;
      }

      event.preventDefault();

      let offset = deltaX;
      if (activeIndex === 0 && offset > 0) offset *= SWIPE_RUBBER_BAND;
      if (activeIndex === galleryCount - 1 && offset < 0) offset *= SWIPE_RUBBER_BAND;

      setSwipeDragging(true);
      setSwipeOffset(offset);
    },
    [activeIndex, galleryCount, swipeTransitioning]
  );

  const handleSwipeTouchEnd = useCallback(
    (event) => {
      if (!touchSwipeRef.current.active || galleryCount <= 1) return;

      const touch = event.changedTouches[0];
      const wasHorizontal = touchSwipeRef.current.isHorizontal;
      touchSwipeRef.current.active = false;
      touchSwipeRef.current.isHorizontal = false;

      if (!touch || !wasHorizontal) {
        if (swipeOffset !== 0) snapSwipeBack();
        return;
      }

      const deltaX = touch.clientX - touchSwipeRef.current.startX;
      const deltaY = touch.clientY - touchSwipeRef.current.startY;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
        snapSwipeBack();
        return;
      }

      if (deltaX < 0) {
        animateSwipeCommit(-1);
      } else {
        animateSwipeCommit(1);
      }
    },
    [animateSwipeCommit, galleryCount, snapSwipeBack, swipeOffset]
  );

  const handleTrackTransitionEnd = useCallback((event) => {
    if (event.propertyName !== 'transform') return;

    const pendingIndex = swipePendingIndexRef.current;
    if (pendingIndex !== null) {
      swipePendingIndexRef.current = null;
      setSwipeTransitioning(false);
      setActiveIndex(pendingIndex);
      setSwipeOffset(0);
      return;
    }

    setSwipeTransitioning(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) {
      resetSwipeState();
      return undefined;
    }
    if (swipeDragging || swipeTransitioning || swipePendingIndexRef.current !== null) {
      return undefined;
    }
    setImageVisible(false);
    const frame = requestAnimationFrame(() => setImageVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, lightboxOpen, resetSwipeState, swipeDragging, swipeTransitioning]);

  useEffect(() => {
    if (!lightboxOpen) resetSwipeState();
  }, [lightboxOpen, resetSwipeState]);

  useEffect(() => {
    const el = lightboxTrackRef.current;
    if (!el || !lightboxOpen || !isExpanded || galleryCount <= 1) return undefined;

    const onMove = (event) => handleSwipeTouchMove(event);
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, [handleSwipeTouchMove, galleryCount, isExpanded, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    lockBodyScroll();
    expandFrameRef.current = requestAnimationFrame(() => {
      expandFrameRef.current = requestAnimationFrame(() => {
        setIsExpanded(true);
      });
    });

    return () => {
      if (expandFrameRef.current) {
        cancelAnimationFrame(expandFrameRef.current);
      }
      unlockBodyScroll();
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen || galleryCount <= 1) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeLightbox, goToNext, goToPrevious, galleryCount, lightboxOpen]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const isPathInserted = (path) =>
    insertedPaths.some((inserted) => areSameMediaPath(inserted, path));

  const renderLightboxMedia = (path, url, alt, className) => {
    if (isVideoPath(path)) {
      return (
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          className={className}
          onClick={(event) => event.stopPropagation()}
          onError={() => handleImageError(path, url)}
        />
      );
    }

    return (
      <img
        src={url}
        alt={alt}
        decoding="async"
        draggable={false}
        className={className}
        onError={() => handleImageError(path, url)}
      />
    );
  };

  const renderThumbnailMedia = (path, url, displayName, imageClassName) => {
    if (isVideoPath(path)) {
      return (
        <>
          <video
            src={url}
            className={imageClassName}
            muted
            playsInline
            preload="metadata"
            onError={() => handleImageError(path, url)}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-8 w-8 fill-white/90 text-white" />
          </div>
        </>
      );
    }

    return (
      <img
        src={url}
        alt={displayName}
        className={imageClassName}
        onError={() => handleImageError(path, url)}
      />
    );
  };

  if (
    visibleGalleryItems.length === 0 &&
    (!showOtherAttachments || other.length === 0) &&
    !(isEditor && images.length === 0 && videos.length === 0)
  ) {
    return null;
  }

  const lightbox =
    lightboxOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`${LIGHTBOX_Z} fixed inset-0`}
            role="dialog"
            aria-modal="true"
            aria-label="Evidence media gallery"
            data-evidence-lightbox
          >
            <button
              type="button"
              className={cn(
                'absolute inset-0 touch-none bg-black/45 backdrop-blur-md backdrop-saturate-150 transition-opacity duration-300',
                isExpanded ? 'opacity-100' : 'opacity-0'
              )}
              aria-label="Close gallery"
              onClick={closeLightbox}
            />

            <button
              type="button"
              className="absolute right-5 top-5 z-[10052] flex h-11 w-11 items-center justify-center rounded-full border-0 bg-white/15 text-white transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {galleryCount > 1 && (
              <button
                type="button"
                className={`${navButtonClass} left-3 sm:left-6`}
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={2} />
              </button>
            )}

            <div
              className="pointer-events-none fixed left-1/2 top-1/2 z-[10051] flex flex-col items-center justify-center"
              style={{
                transform: getZoomTransform(originRect, isExpanded),
                transition: `transform ${LIGHTBOX_DURATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
              }}
            >
              <div
                className={cn(
                  'relative',
                  isExpanded
                    ? 'h-[100dvh] w-[100vw] sm:h-auto sm:w-auto'
                    : 'max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-7rem)] sm:max-w-[calc(100vw-10rem)]'
                )}
              >
                {isExpanded && galleryCount > 1 && (
                  <div
                    ref={lightboxTrackRef}
                    className="pointer-events-auto absolute inset-0 touch-pan-y overflow-hidden sm:hidden"
                    onTouchStart={handleSwipeTouchStart}
                    onTouchEnd={handleSwipeTouchEnd}
                    onTouchCancel={handleSwipeTouchEnd}
                  >
                    <div
                      className="flex h-full"
                      style={{
                        transform: `translateX(calc(-${activeIndex * 100}% + ${swipeOffset}px))`,
                        transition: swipeDragging
                          ? 'none'
                          : `transform ${SWIPE_SNAP_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
                      }}
                      onTransitionEnd={handleTrackTransitionEnd}
                    >
                      {visibleGalleryItems.map((path, index) => {
                        const url = imageUrls[path];
                        const alt = getDisplayName(path, index);

                        return (
                          <div key={`${path}-${index}`} className="relative h-full w-full flex-shrink-0">
                            {url ? (
                              renderLightboxMedia(
                                path,
                                url,
                                alt,
                                'absolute inset-0 h-full w-full select-none object-contain'
                              )
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-white/70">
                                Media preview is loading...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeUrl ? (
                  renderLightboxMedia(
                    activePath,
                    activeUrl,
                    activeAlt,
                    cn(
                      'object-contain transition-opacity duration-200',
                      isExpanded && galleryCount > 1 && 'hidden sm:block',
                      isExpanded
                        ? 'absolute inset-0 h-full w-full sm:static sm:h-auto sm:w-auto sm:max-h-[calc(100dvh-5rem)] sm:max-w-[calc(100vw-10rem)]'
                        : 'block max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-7rem)] sm:max-w-[calc(100vw-10rem)]',
                      imageVisible ? 'opacity-100' : 'opacity-0',
                      activeIsVideo && 'pointer-events-auto bg-black'
                    )
                  )
                ) : (
                  <div
                    className={cn(
                      'flex h-64 w-64 items-center justify-center text-white/70',
                      isExpanded && galleryCount > 1 && 'hidden sm:flex'
                    )}
                  >
                    Media preview is loading...
                  </div>
                )}

                {galleryCount > 1 && (
                  <p
                    className={cn(
                      'pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm font-medium tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-opacity duration-300 sm:bottom-5',
                      isExpanded ? 'opacity-100' : 'opacity-0'
                    )}
                  >
                    {activeIndex + 1} / {galleryCount}
                  </p>
                )}
              </div>
            </div>

            {galleryCount > 1 && (
              <button
                type="button"
                className={`${navButtonClass} right-3 sm:right-6`}
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={2} />
              </button>
            )}
          </div>,
          document.body
        )
      : null;

  const renderThumbnail = (path, index) => {
    const url = imageUrls[path];
    const displayName = getDisplayName(path, index);
    const isFeatured = featuredPath && areSameMediaPath(path, featuredPath);
    const isInserted = isPathInserted(path);
    const isVideo = isVideoPath(path);

    if (isEditor) {
      return (
        <div
          key={`${path}-${index}`}
          className="group/tile relative overflow-hidden rounded-lg"
        >
          <button
            type="button"
            ref={(el) => {
              thumbButtonRefs.current[index] = el;
            }}
            className={`${maximizableThumbnailGroupClass} aspect-square w-full rounded-lg bg-muted focus:outline-none`}
            aria-label={`Preview ${displayName}`}
            onClick={(event) => openLightbox(index, event)}
          >
            {url ? (
              renderThumbnailMedia(
                path,
                url,
                displayName,
                'h-full w-full object-cover transition-transform duration-200 group-hover/tile:scale-105'
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 animate-pulse" />
              </div>
            )}
            {url && !isVideo && <MaximizableThumbnailOverlay />}
          </button>

          {isFeatured && (
            <span className="pointer-events-none absolute left-1.5 top-1.5 z-20 inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
              <Star className="h-2.5 w-2.5 fill-current" />
              Featured
            </span>
          )}

          {isInserted && (
            <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <FileImage className="h-2.5 w-2.5" />
              Inserted
            </span>
          )}

          {(onSelectFeatured || onInsertContent) && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex gap-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 pt-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/tile:opacity-100">
              {onSelectFeatured && !isVideo && (
                <Button
                  type="button"
                  size="sm"
                  variant={isFeatured ? 'default' : 'secondary'}
                  className="h-7 flex-1 px-2 text-[10px]"
                  title={isFeatured ? 'Current featured image' : 'Set as featured image'}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectFeatured(path, url);
                  }}
                >
                  <Star className={cn('mr-1 h-3 w-3', isFeatured && 'fill-current')} />
                  Featured
                </Button>
              )}
              {onInsertContent && (
                <Button
                  type="button"
                  size="sm"
                  variant={isInserted ? 'default' : 'secondary'}
                  className={cn(
                    'h-7 flex-1 px-2 text-[10px]',
                    isInserted && 'bg-emerald-600 hover:bg-emerald-600/90'
                  )}
                  title={isInserted ? 'Approved for public gallery' : 'Approve for public gallery'}
                  disabled={isInserted}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!isInserted) onInsertContent(path, url);
                  }}
                >
                  <FileImage className="mr-1 h-3 w-3" />
                  {isInserted ? 'Inserted' : 'Insert'}
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={`${path}-${index}`} className="space-y-2">
        <button
          type="button"
          ref={(el) => {
            thumbButtonRefs.current[index] = el;
          }}
          className={`${maximizableThumbnailGroupClass} aspect-square w-full rounded-lg bg-muted focus:outline-none`}
          aria-label={`View ${displayName}`}
          onClick={(event) => openLightbox(index, event)}
        >
          {url ? (
            renderThumbnailMedia(
              path,
              url,
              displayName,
              'h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {url && !isVideoPath(path) && <MaximizableThumbnailOverlay />}
          {isFeatured && (
            <span className="absolute left-2 top-2 z-20 inline-flex items-center rounded-full bg-primary px-2 py-1 text-[10px] font-medium uppercase text-primary-foreground">
              <Check className="mr-1 h-3 w-3" />
              Featured
            </span>
          )}
        </button>

        {(onSelectFeatured || onInsertContent) && (
          <div className="space-y-2">
            {onSelectFeatured && (
              <Button
                type="button"
                variant={isFeatured ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => onSelectFeatured(path, url)}
              >
                <Check className="mr-2 h-4 w-4" />
                {isFeatured ? 'Featured' : 'Use as featured'}
              </Button>
            )}
            {onInsertContent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onInsertContent(path, url)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to content
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {(displayTitle || description) && (
        <div>
          {displayTitle && <h3 className="font-semibold text-xl">{displayTitle}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      {visibleGalleryItems.length > 0 && (
        <div
          className={cn(
            'grid gap-3',
            isEditor ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {visibleGalleryItems.map((path, index) => renderThumbnail(path, index))}
        </div>
      )}

      {isEditor && visibleGalleryItems.length === 0 && images.length === 0 && videos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No photos or videos attached to this bounty.
        </div>
      )}

      {lightbox}

      {showOtherAttachments && other.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {other.map((path, index) => (
            <AttachmentPreview key={`${path}-${index}`} path={path} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceThumbnailGallery;
