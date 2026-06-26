'use client';

import VoiceRecorder from '@/views/submit-report/VoiceRecorder';
import VoiceNoteCard from '@/components/media/VoiceNoteCard';

export default function VoiceRecordingWidget({
  voiceNotes = [],
  onVoiceNoteAdd,
  onVoiceNoteDelete,
  disabled = false,
  hasOrganization = true,
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
    <div id="voice-recorder" className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <VoiceRecorder
        voiceNotes={voiceNotes}
        onVoiceNoteAdd={onVoiceNoteAdd}
        onVoiceNoteDelete={onVoiceNoteDelete}
      />
    </div>
  );
}
