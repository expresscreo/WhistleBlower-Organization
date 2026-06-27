'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Loader2, Pause, Play, RotateCcw } from 'lucide-react';
import { cn, sanitizeFilename } from '@/lib/utils';
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
  showDownload = false,
}) {
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(src || null);
  const [loading, setLoading] = useState(!src && !!path);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const isLocalPreview = Boolean(src?.startsWith('blob:'));
  // Mobile browsers (iOS Safari, Android Chrome) frequently never fire
  // canplay/loadedmetadata for hidden or blob-backed <audio> elements, which
  // would leave the UI stuck on a spinner forever. So we treat the player as
  // ready as soon as we have a resolved URL and let the user's tap drive the
  // actual load()+play() — which also satisfies mobile autoplay gesture rules.
  const playbackReady = Boolean(audioUrl) && !error;

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  const statusSubtext = (() => {
    if (loading) return 'Loading';
    if (isPlaying) return 'Playing';
    if (playbackReady && currentTime > 0) return 'Pause';
    if (playbackReady) return 'Ready';
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

  const syncDuration = useCallback((audio) => {
    if (!audio) return;
    const nextDuration = audio.duration;
    if (Number.isFinite(nextDuration) && nextDuration > 0) {
      setDuration(nextDuration);
    }
  }, []);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !playbackReady) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      // Force a load within the user gesture — mobile browsers often won't
      // fetch a hidden/blob audio source until playback is explicitly requested.
      if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        audio.load();
      }
      await audio.play();
      setIsPlaying(true);
    } catch {
      setError('Playback failed. Please try again.');
      setIsPlaying(false);
    }
  };

  const handleSeek = (clientX, rect) => {
    const audio = audioRef.current;
    if (!audio || !duration || !playbackReady) return;

    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const handleWaveformKeyDown = (event) => {
    const audio = audioRef.current;
    if (!audio || !duration || !playbackReady) return;

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

  const getDownloadFilename = () => {
    if (!path) return 'voice-note.wav';
    const rawFileName = path.split('/').pop();
    return rawFileName
      ? sanitizeFilename(rawFileName.substring(rawFileName.indexOf('-') + 1))
      : 'voice-note.wav';
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let downloadUrl = audioUrl;
      if (!downloadUrl && path) {
        const data = resolveUrl ? await resolveUrl(path) : null;
        downloadUrl =
          typeof data === 'string'
            ? data
            : data?.signedUrl || (resolveUrl ? null : await resolveMediaUrl(path));
      }
      if (!downloadUrl) return;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = getDownloadFilename();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError('Unable to download your voice recording. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const showSkeleton = loading;
  const showControls = !loading && !error;

  const statusDetail =
    !loading && !error && playbackReady ? (
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
            disabled={!playbackReady || showSkeleton}
            aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
            className={cn(
              'relative flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              playbackReady && !showSkeleton
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
              isReady={playbackReady}
              onSeek={handleSeek}
              onKeyDown={handleWaveformKeyDown}
              currentTime={currentTime}
              duration={duration}
            />
          </div>
          {rightAction ? (
            <div className="shrink-0">{rightAction}</div>
          ) : showDownload ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={!playbackReady || downloading || showSkeleton}
              aria-label="Download voice note"
              className={cn(
                'relative flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                playbackReady && !downloading && !showSkeleton
                  ? 'border-border bg-background text-foreground hover:border-primary hover:text-primary active:scale-95'
                  : 'cursor-not-allowed border-border bg-muted text-muted-foreground'
              )}
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      )}

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload={isLocalPreview ? 'auto' : 'metadata'}
          playsInline
          className="sr-only"
          onCanPlay={() => syncDuration(audioRef.current)}
          onLoadedData={() => syncDuration(audioRef.current)}
          onDurationChange={() => syncDuration(audioRef.current)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => syncDuration(audioRef.current)}
          onError={() => {
            setError('Unable to load your voice recording. Please try again.');
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
