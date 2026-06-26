export const VOICE_NOTE_DESCRIPTION_MARKER =
  'This report was submitted via an anonymized voice note.';

export function isVoiceNotePath(path) {
  return String(path || '').includes('voice-report');
}

export function findVoiceNotePaths(paths = []) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [];
  return list.filter(isVoiceNotePath).sort((a, b) => String(a).localeCompare(String(b)));
}

export function findVoiceNotePath(paths = []) {
  const voiceNotes = findVoiceNotePaths(paths);
  if (voiceNotes.length) return voiceNotes[0];
  const list = Array.isArray(paths) ? paths.filter(Boolean) : [];
  return list[0] || null;
}

export function splitVoiceNoteDescription(text = '') {
  const value = String(text || '');
  const markerIndex = value.indexOf(VOICE_NOTE_DESCRIPTION_MARKER);

  if (markerIndex === -1) {
    return { intro: value, remainder: '', hasMarker: false };
  }

  const introEnd = markerIndex + VOICE_NOTE_DESCRIPTION_MARKER.length;
  let remainder = value.slice(introEnd);
  if (remainder.startsWith('\r\n')) remainder = remainder.slice(2);
  else if (remainder.startsWith('\n')) remainder = remainder.slice(1);

  return {
    intro: value.slice(0, introEnd),
    remainder,
    hasMarker: true,
  };
}
