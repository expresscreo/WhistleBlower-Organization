'use client';

import VoiceNotePlayer from './VoiceNotePlayer';
import { findVoiceNotePaths } from '@/lib/voiceNoteUtils';

export default function VoiceNotePlayerList({ paths = [], resolveUrl, className, showDownload = false }) {
  const voiceNotePaths = findVoiceNotePaths(paths);
  if (!voiceNotePaths.length) return null;

  return (
    <div className={className ?? 'space-y-3'}>
      {voiceNotePaths.map((path) => (
        <VoiceNotePlayer key={path} path={path} resolveUrl={resolveUrl} showDownload={showDownload} />
      ))}
    </div>
  );
}
