import React from 'react';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  maximizableThumbnailGroupClass,
  maximizableThumbnailOverlayClass,
  maximizableThumbnailIconClass,
} from '@/lib/mediaThumbnailStyles';

export {
  maximizableThumbnailGroupClass,
  maximizableThumbnailOverlayClass,
  maximizableThumbnailIconClass,
};

const MaximizableThumbnailOverlay = ({
  overlayClassName,
  iconRingClassName,
  iconClassName = 'h-5 w-5',
}) => (
  <span
    className={cn(maximizableThumbnailOverlayClass, overlayClassName)}
    aria-hidden
  >
    <span className={cn(maximizableThumbnailIconClass, iconRingClassName)}>
      <Maximize2
        className={cn('text-neutral-900', iconClassName)}
        strokeWidth={2.5}
        aria-hidden
      />
    </span>
  </span>
);

export default MaximizableThumbnailOverlay;
