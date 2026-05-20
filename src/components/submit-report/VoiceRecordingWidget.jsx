'use client';

import VoiceRecorder from '@/views/submit-report/VoiceRecorder';

export default function VoiceRecordingWidget({
  onRecordingComplete,
  disabled = false,
  hasOrganization = true,
}) {
  if (!hasOrganization) {
    return (
      <div
        id="voice-recorder"
        className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
      >
        Select an organization in step 1 before recording a voice note.
      </div>
    );
  }

  return (
    <div id="voice-recorder" className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <VoiceRecorder onRecordingComplete={onRecordingComplete} />
    </div>
  );
}
