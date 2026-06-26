'use client';

import { cn } from '@/lib/utils';
import { WAVEFORM } from './voiceNoteUi';

export default function VoiceNoteWaveform({
  progress = 0,
  showSkeleton = false,
  isPlaying = false,
  isReady = false,
  onSeek,
  onKeyDown,
  className,
  ariaLabel = 'Voice note progress',
  currentTime = 0,
  duration = 0,
}) {
  return (
    <div
      role={onSeek ? 'slider' : 'presentation'}
      tabIndex={onSeek && isReady ? 0 : -1}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration) || 0}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={
        duration > 0 ? `${currentTime}s of ${duration}s` : undefined
      }
      aria-disabled={!isReady}
      onKeyDown={onKeyDown}
      onClick={
        onSeek
          ? (event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onSeek(event.clientX, rect);
            }
          : undefined
      }
      className={cn(
        'flex h-12 items-center gap-[2px] px-1',
        onSeek && isReady ? 'cursor-pointer' : 'cursor-default',
        className
      )}
    >
      {WAVEFORM.map((height, index) => {
        const barProgress = (index / WAVEFORM.length) * 100;
        const isActive = barProgress <= progress;
        return (
          <span
            key={index}
            className={cn(
              'w-[3px] min-w-[2px] flex-1 rounded-full transition-all duration-150',
              showSkeleton && 'animate-pulse bg-muted-foreground/20',
              !showSkeleton && isActive && 'bg-primary',
              !showSkeleton && !isActive && 'bg-muted-foreground/20',
              isPlaying && isActive && 'opacity-100',
              !isPlaying && !showSkeleton && isActive && 'opacity-80'
            )}
            style={{
              height: `${Math.max(6, Math.round(height * 44))}px`,
              animationDelay: showSkeleton ? `${index * 40}ms` : undefined,
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
