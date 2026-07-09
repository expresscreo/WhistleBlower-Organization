'use client';

import VoiceRecorder from '@/views/submit-report/VoiceRecorder';
import VoiceNoteCard from '@/components/media/VoiceNoteCard';

export const VOICE_RECORDING_SAFETY_NOTICE =
  'For your safety, avoid mentioning personally identifiable information in your recording, such as your name or specific location.';

export default function VoiceRecordingWidget({
  voiceNotes = [],
  onVoiceNoteAdd,
  onVoiceNoteDelete,
  disabled = false,
  hasOrganization = true,
  showSafetyNotice = true,
}) {
  if (!hasOrganization) {
    return (
      <VoiceNoteCard
        id="voice-recorder"
        ariaLabel="Voice note recorder"
        statusLabel="Unavailable"
        statusKey="Ready"
        showAnonymizedBadge={false}
        footer={
          <p className="text-sm text-muted-foreground">
            Select an organization in step 1 before recording a voice note.
          </p>
        }
      >
        <div className="flex h-12 items-center justify-center text-sm text-muted-foreground">
          Organization required
        </div>
      </VoiceNoteCard>
    );
  }

  return (
    <div className="space-y-4">
      <div id="voice-recorder" className={disabled ? 'pointer-events-none opacity-50' : ''}>
        <VoiceRecorder
          voiceNotes={voiceNotes}
          onVoiceNoteAdd={onVoiceNoteAdd}
          onVoiceNoteDelete={onVoiceNoteDelete}
        />
      </div>
      {showSafetyNotice ? (
        <p className="mx-auto max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
          {VOICE_RECORDING_SAFETY_NOTICE}
        </p>
      ) : null}
    </div>
  );
}
