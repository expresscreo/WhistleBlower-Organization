'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/mediaUtils';
import { FieldError } from '@/components/ui/form-feedback';
import VoiceNoteCard from './VoiceNoteCard';
import VoiceNoteWaveform from './VoiceNoteWaveform';
import { formatTime } from './voiceNoteUi';

export default function VoiceNotePlayer({
  path,
  src,
  className,
  resolveUrl,
  embedded = false,
  rightAction = null,
}) {
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(src || null);
  const [loading, setLoading] = useState(!src && !!path);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const statusSubtext = (() => {
    if (loading || (audioUrl && !isReady && !error)) return 'Loading';
    if (isPlaying) return 'Playing';
    if (isReady && !isPlaying && currentTime > 0) return 'Pause';
    if (isReady) return 'Ready';
    return 'Loading';
  })();

  const loadAudio = useCallback(async () => {
    if (src) {
      setAudioUrl(src);
      setLoading(false);
      setError('');
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setIsReady(false);
      return;
    }

    if (!path) {
      setLoading(false);
      setError('Voice recording not found.');
      return;
    }

    setLoading(true);
    setError('');
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsReady(false);

    try {
      const data = resolveUrl ? await resolveUrl(path) : null;
      const url =
        typeof data === 'string'
          ? data
          : data?.signedUrl || (resolveUrl ? null : await resolveMediaUrl(path));
      if (!url) {
        throw new Error('Could not resolve voice recording URL.');
      }
      setAudioUrl(url);
    } catch {
      setError('Unable to load your voice recording. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [path, resolveUrl, src]);

  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError('Playback failed. Please try again.');
      setIsPlaying(false);
    }
  };

  const handleSeek = (clientX, rect) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isReady) return;

    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const handleWaveformKeyDown = (event) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isReady) return;

    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      audio.currentTime = Math.min(audio.currentTime + step, duration);
      setCurrentTime(audio.currentTime);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      audio.currentTime = Math.max(audio.currentTime - step, 0);
      setCurrentTime(audio.currentTime);
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      togglePlayPause();
    }
  };

  const showSkeleton = loading || (audioUrl && !isReady && !error);
  const showControls = !loading && !error;

  const statusDetail =
    !loading && !error && (isReady || duration > 0) ? (
      <>
        <span className={cn(isPlaying && 'text-foreground')}>
          {formatTime(currentTime)}
        </span>
        <span className="text-muted-foreground/60"> / </span>
        <span>{formatTime(duration)}</span>
      </>
    ) : null;

  const controls = (
    <>
      {error ? (
        <div className="space-y-3 border border-destructive/20 bg-destructive/[0.04] p-4">
          <FieldError message={error} className="text-left" />
          {!src ? (
            <button
              type="button"
              onClick={loadAudio}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry loading
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={!isReady || showSkeleton}
            aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
            className={cn(
              'relative flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isReady && !showSkeleton
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'cursor-not-allowed border-border bg-muted text-muted-foreground'
            )}
          >
            {showSkeleton ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <VoiceNoteWaveform
              progress={progress}
              showSkeleton={showSkeleton}
              isPlaying={isPlaying}
              isReady={isReady}
              onSeek={handleSeek}
              onKeyDown={handleWaveformKeyDown}
              currentTime={currentTime}
              duration={duration}
            />
          </div>
          {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
        </div>
      )}

      {showControls && !isReady && !showSkeleton ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Preparing audio…
        </p>
      ) : null}

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          className="sr-only"
          onCanPlay={() => setIsReady(true)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            setDuration(audioRef.current?.duration || 0);
            if (
              audioRef.current &&
              audioRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
              setIsReady(true);
            }
          }}
          onError={() => {
            setError('Unable to load your voice recording. Please try again.');
            setIsReady(false);
            setIsPlaying(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      ) : null}
    </>
  );

  if (embedded) {
    return <div className={className}>{controls}</div>;
  }

  return (
    <VoiceNoteCard
      className={className}
      ariaLabel="Anonymized voice note playback"
      statusLabel={statusSubtext}
      statusDetail={statusDetail}
      statusKey={statusSubtext}
    >
      {controls}
    </VoiceNoteCard>
  );
}
