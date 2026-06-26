'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Mic, StopCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { anonymizeVoiceBlob } from '@/lib/voiceAnonymizer';
import VoiceNoteCard from '@/components/media/VoiceNoteCard';
import VoiceNoteWaveform from '@/components/media/VoiceNoteWaveform';
import VoiceNotePlayer from '@/components/media/VoiceNotePlayer';
import { FieldError } from '@/components/ui/form-feedback';
import { formatTime } from '@/components/media/voiceNoteUi';

const createVoiceNote = (blob) => {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    blob,
    url: URL.createObjectURL(blob),
    fileName: `voice-report-${Date.now()}.wav`,
    audioFormat: 'wav',
  };
};

const VoiceRecorder = ({
  voiceNotes = [],
  onVoiceNoteAdd,
  onVoiceNoteDelete,
}) => {
  const [recorderState, setRecorderState] = useState('idle');
  const [recorderError, setRecorderError] = useState('');
  const [processProgress, setProcessProgress] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAdditionalRecorder, setShowAdditionalRecorder] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const autoStartPendingRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const startRecordingTimer = useCallback(() => {
    clearRecordingTimer();
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  }, [clearRecordingTimer]);

  const resetRecorder = useCallback(() => {
    setRecorderState('idle');
    setProcessProgress(0);
    setRecordingSeconds(0);
    autoStartPendingRef.current = false;
  }, []);

  const startRecording = useCallback(async () => {
    setRecorderState('initializing');
    setRecorderError('');
    setProcessProgress(0);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stopStream();
        clearRecordingTimer();
        const recordedType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const rawBlob = new Blob(audioChunks, { type: recordedType });
        setRecorderState('processing');
        setProcessProgress(0);

        try {
          const { blob } = await anonymizeVoiceBlob(rawBlob, {
            onProgress: (p) => setProcessProgress(Math.round(p * 100)),
          });
          onVoiceNoteAdd?.(createVoiceNote(blob));
          resetRecorder();
          setShowAdditionalRecorder(false);
        } catch (error) {
          console.error('Voice anonymization failed:', error);
          setRecorderError(
            'We could not anonymize your recording, so it was discarded for your safety. Please record again.'
          );
          setRecorderState('error');
        }
      };

      mediaRecorderRef.current.start();
      startRecordingTimer();
      setRecorderState('recording');
    } catch (error) {
      console.error('Audio initialization error:', error);
      stopStream();
      clearRecordingTimer();
      setRecorderError(
        'Please allow microphone access. If you\'ve already allowed it, try refreshing the page.'
      );
      setRecorderState('error');
    }
  }, [
    clearRecordingTimer,
    onVoiceNoteAdd,
    resetRecorder,
    startRecordingTimer,
    stopStream,
  ]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecorderState('processing');
  };

  const handleRecordMore = () => {
    setRecorderError('');
    autoStartPendingRef.current = true;
    setShowAdditionalRecorder(true);
  };

  const isFirstRecorder = voiceNotes.length === 0;
  const showRecorderCard =
    isFirstRecorder || showAdditionalRecorder || recorderState !== 'idle';
  const showRecordMoreButton =
    voiceNotes.length > 0 &&
    !showAdditionalRecorder &&
    recorderState === 'idle';

  useEffect(() => {
    if (autoStartPendingRef.current && showAdditionalRecorder && recorderState === 'idle') {
      autoStartPendingRef.current = false;
      startRecording();
    }
  }, [showAdditionalRecorder, recorderState, startRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopStream();
      clearRecordingTimer();
    };
  }, [stopStream, clearRecordingTimer]);

  const statusConfig = (() => {
    switch (recorderState) {
      case 'initializing':
        return { key: 'Loading', label: 'Initializing', detail: null };
      case 'recording':
        return {
          key: 'Recording',
          label: 'Recording',
          detail: formatTime(recordingSeconds),
        };
      case 'processing':
        return {
          key: 'Processing',
          label: 'Anonymizing',
          detail: `${processProgress}%`,
        };
      case 'error':
        return { key: 'Ready', label: 'Ready to record', detail: null };
      default:
        return { key: 'Ready', label: 'Ready to record', detail: null };
    }
  })();

  const renderRecordButton = () => {
    if (recorderState === 'initializing' || recorderState === 'processing') {
      return (
        <div
          className="relative flex h-14 w-14 shrink-0 cursor-not-allowed items-center justify-center border-2 border-border bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      );
    }

    if (recorderState === 'recording') {
      return (
        <button
          type="button"
          onClick={stopRecording}
          aria-label="Stop recording"
          className={cn(
            'relative flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-all',
            'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2'
          )}
        >
          <StopCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={startRecording}
        aria-label="Start recording voice note"
        className={cn(
          'relative flex h-14 w-14 shrink-0 items-center justify-center border-2 transition-all',
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        )}
      >
        <Mic className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  };

  const renderRecorderFooter = () => {
    if (recorderState === 'recording') {
      return (
        <p className="text-sm text-muted-foreground">
          Speak clearly, then tap stop when finished. Avoid names or other identifying details.
        </p>
      );
    }

    if (recorderState === 'processing') {
      return (
        <p className="text-sm text-muted-foreground">
          Transforming on your device. The original voice is discarded before upload.
        </p>
      );
    }

    if (isFirstRecorder) {
      return (
        <p className="text-sm text-muted-foreground">
          Tap the microphone to record. Your voice is transformed on this device before anything is
          uploaded.
        </p>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {voiceNotes.map((note) => (
        <VoiceNotePlayer
          key={note.id}
          src={note.url}
          rightAction={
            <button
              type="button"
              onClick={() => onVoiceNoteDelete?.(note.id)}
              aria-label="Delete voice note"
              className={cn(
                'relative flex h-14 w-14 items-center justify-center border-2 transition-all',
                'border-destructive/40 bg-destructive/[0.06] text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2'
              )}
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
      ))}

      {showRecordMoreButton ? (
        <button
          type="button"
          onClick={handleRecordMore}
          className="inline-flex w-full items-center justify-center gap-2 border border-primary/30 bg-primary/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary/[0.1]"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Record more voicenote
        </button>
      ) : null}

      {showRecorderCard ? (
        <VoiceNoteCard
          id={isFirstRecorder ? 'voice-recorder' : undefined}
          ariaLabel="Voice note recorder"
          statusLabel={statusConfig.label}
          statusDetail={statusConfig.detail}
          statusKey={statusConfig.key}
          footer={renderRecorderFooter()}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {renderRecordButton()}
            <div className="min-w-0 flex-1">
              <VoiceNoteWaveform
                progress={recorderState === 'recording' ? ((recordingSeconds % 8) / 8) * 100 : 0}
                showSkeleton={
                  recorderState === 'initializing' ||
                  recorderState === 'processing' ||
                  recorderState === 'recording'
                }
                isPlaying={recorderState === 'recording'}
                isReady={recorderState === 'recording'}
                ariaLabel={
                  recorderState === 'recording' ? 'Recording waveform' : 'Voice recorder waveform'
                }
              />
            </div>
          </div>

          {recorderError ? (
            <div className="mt-3 border border-destructive/20 bg-destructive/[0.04] p-3">
              <FieldError message={recorderError} className="text-left" />
            </div>
          ) : null}
        </VoiceNoteCard>
      ) : null}

      <div className="flex items-start gap-2 border border-border/80 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          For your safety, avoid mentioning personally identifiable information in your recording,
          such as your name or specific location.
        </span>
      </div>
    </div>
  );
};

export default VoiceRecorder;
