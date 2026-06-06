import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scrollLock';
import MaximizableThumbnailOverlay, { maximizableThumbnailGroupClass } from '@/components/media/MaximizableThumbnailOverlay';

const LIGHTBOX_Z = 'z-[10050]';
const LIGHTBOX_DURATION_MS = 380;

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

const MaximizableImage = ({
  src,
  alt = 'Image',
  wrapperClassName,
  imageClassName,
  ariaLabel,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [originRect, setOriginRect] = useState(null);
  const closeTimerRef = useRef(null);
  const expandFrameRef = useRef(null);
  const thumbRef = useRef(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeLightbox = useCallback(() => {
    clearCloseTimer();
    const rect = thumbRef.current?.getBoundingClientRect();
    if (rect) setOriginRect(rect);
    setIsExpanded(false);
    closeTimerRef.current = window.setTimeout(() => {
      setLightboxOpen(false);
      setOriginRect(null);
      closeTimerRef.current = null;
    }, LIGHTBOX_DURATION_MS);
  }, [clearCloseTimer]);

  const openLightbox = useCallback(
    (event) => {
      clearCloseTimer();
      const rect = event.currentTarget.getBoundingClientRect();
      setOriginRect(rect);
      setIsExpanded(false);
      setLightboxOpen(true);
    },
    [clearCloseTimer]
  );

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
    if (!lightboxOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeLightbox, lightboxOpen]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (!src) return null;

  const lightbox =
    lightboxOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`${LIGHTBOX_Z} fixed inset-0`}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? `View ${alt}`}
          >
            <button
              type="button"
              className={cn(
                'absolute inset-0 touch-none bg-black/45 backdrop-blur-md backdrop-saturate-150 transition-opacity duration-300',
                isExpanded ? 'opacity-100' : 'opacity-0'
              )}
              aria-label="Close image"
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

            <div
              className="pointer-events-none fixed left-1/2 top-1/2 z-[10051] flex flex-col items-center justify-center"
              style={{
                transform: getZoomTransform(originRect, isExpanded),
                transition: `transform ${LIGHTBOX_DURATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
              }}
            >
              <img
                src={src}
                alt={alt}
                decoding="async"
                draggable={false}
                className={cn(
                  'object-contain select-none',
                  isExpanded
                    ? 'max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-7rem)] sm:max-w-[calc(100vw-10rem)]'
                    : 'max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-7rem)] sm:max-w-[calc(100vw-10rem)]'
                )}
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        ref={thumbRef}
        className={cn(maximizableThumbnailGroupClass, wrapperClassName)}
        aria-label={ariaLabel ?? `View ${alt}`}
        onClick={openLightbox}
      >
        <img src={src} alt={alt} className={imageClassName} />
        <MaximizableThumbnailOverlay />
      </button>
      {lightbox}
    </>
  );
};

export default MaximizableImage;
