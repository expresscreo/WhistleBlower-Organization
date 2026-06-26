# Mobile Voice Note Implementation Guide

This document describes how voice note recording and playback were fixed for **mobile browsers** (iOS Safari, Android Chrome). It was written after validating the fix in the Business Whistleblower app and is intended to be applied to the Organization Whistleblower app.

---

## Summary

| Area | Symptom on mobile | Fix |
|------|-------------------|-----|
| **Post-record preview** | Anonymizing completes, status shows "Loading", spinner never stops | Stop gating UI on `<audio>` `canplay` events; enable play when URL is ready |
| **Playback tap** | Play button appears but audio silent / fails | Call `audio.load()` inside the user tap, then `audio.play()` |
| **Local dev on phone** | Mic error, no permission prompt | Use HTTPS (deploy, ngrok, or mkcert) — not `http://192.168.x.x` |
| **Track / admin playback** | Same infinite spinner for signed URLs | Same `VoiceNotePlayer` fix applies to blob **and** remote URLs |

The **primary code change** is in `VoiceNotePlayer.jsx`. `VoiceRecorder.jsx` and `voiceAnonymizer.js` already match between apps and did not need changes for this bug.

---

## User flow (unchanged)

```
Tap mic → getUserMedia → MediaRecorder
  → Stop → anonymizeVoiceBlob() (on-device, main thread)
  → createVoiceNote(blob) → VoiceNotePlayer(src=blob URL)
  → User taps Play → load() + play()
```

Organization app files:

- `src/views/submit-report/VoiceRecorder.jsx` — record + anonymize
- `src/lib/voiceAnonymizer.js` — client-side DSP
- `src/components/media/VoiceNotePlayer.jsx` — preview + playback (**fix here**)
- `src/components/media/VoiceNotePlayerList.jsx` — track/admin lists

---

## Root cause: infinite "Loading" spinner

### What users saw

1. Record voice note on mobile (Chrome or Safari).
2. "Recording" → "Anonymizing" (with progress) — **works correctly**.
3. Preview card appears with **ANONYMIZED** badge.
4. Status stuck on **"Loading"** with spinner; duration sometimes shows `0:00 / 0:04`.
5. Play button never appears.

Anonymization **did finish**. The bug was in the **preview player**, not the recorder.

### Why it happened

`VoiceNotePlayer` treated the player as "ready" only when a hidden `<audio>` element fired readiness events:

```javascript
// ❌ Old pattern (breaks on mobile)
onCanPlay={() => setIsReady(true)}
onLoadedMetadata={() => {
  setDuration(audio.duration);
  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    setIsReady(true);
  }
}}

const showSkeleton = loading || (audioUrl && !isReady && !error);
```

On mobile browsers:

- Hidden (`sr-only`) `<audio>` elements often **never fire `canplay`** for blob URLs or deferred remote sources.
- `loadedmetadata` may fire (duration appears as `0:04`) but **`isReady` stays false**.
- `showSkeleton` stays true → spinner forever.

This is expected mobile behavior: browsers defer loading hidden media until playback is requested inside a **user gesture**.

---

## Fix: `VoiceNotePlayer.jsx`

### Design principle

> **Ready = we have a URL to play, not = the audio element has buffered.**

Media events (`loadedmetadata`, `durationchange`, `canplay`) are used only to **update duration/time display**, not to enable controls.

### Step-by-step changes

#### 1. Replace `isReady` gating with `playbackReady`

```javascript
const isLocalPreview = Boolean(src?.startsWith('blob:'));

// Mobile: don't wait for canplay on hidden audio
const playbackReady = Boolean(audioUrl) && !error;
```

Remove the `isReady` state entirely (or stop using it for UI gating).

#### 2. Simplify status text

```javascript
const statusSubtext = (() => {
  if (loading) return 'Loading';
  if (isPlaying) return 'Playing';
  if (playbackReady && currentTime > 0) return 'Pause';
  if (playbackReady) return 'Ready';
  return 'Loading';
})();
```

Do **not** use `(audioUrl && !isReady && !error)` in status logic.

#### 3. Spinner only while resolving URL

```javascript
// ❌ Old
const showSkeleton = loading || (audioUrl && !isReady && !error);

// ✅ New
const showSkeleton = loading;
```

For Organization app:

- `loading === true` only while `resolveUrl(path)` or `resolveMediaUrl(path)` is in flight.
- For submit preview (`src` blob URL), `loading` is set false immediately in `loadAudio`.

#### 4. Duration sync helper (display only)

```javascript
const syncDuration = useCallback((audio) => {
  if (!audio) return;
  const nextDuration = audio.duration;
  if (Number.isFinite(nextDuration) && nextDuration > 0) {
    setDuration(nextDuration);
  }
}, []);
```

#### 5. Play inside user gesture with explicit `load()`

```javascript
const togglePlayPause = async () => {
  const audio = audioRef.current;
  if (!audio || !playbackReady) return;

  if (isPlaying) {
    audio.pause();
    setIsPlaying(false);
    return;
  }

  try {
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
```

#### 6. Audio element attributes and handlers

```jsx
<audio
  ref={audioRef}
  src={audioUrl}
  preload={isLocalPreview ? 'auto' : 'metadata'}
  playsInline
  className="sr-only"
  onCanPlay={() => syncDuration(audioRef.current)}
  onLoadedData={() => syncDuration(audioRef.current)}
  onDurationChange={() => syncDuration(audioRef.current)}
  onLoadedMetadata={() => syncDuration(audioRef.current)}
  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
  onError={() => {
    setError('Unable to load your voice recording. Please try again.');
    setIsPlaying(false);
  }}
  onEnded={() => { /* reset currentTime, isPlaying */ }}
  onPause={() => setIsPlaying(false)}
  onPlay={() => setIsPlaying(true)}
/>
```

Key additions:

- `playsInline` — required for iOS inline playback
- `preload="auto"` for blob previews, `"metadata"` for remote signed URLs
- `onDurationChange` — iOS sometimes updates duration after metadata

#### 7. Wire controls to `playbackReady`

```javascript
disabled={!playbackReady || showSkeleton}

className={cn(
  playbackReady && !showSkeleton
    ? 'border-primary bg-primary ...'
    : 'cursor-not-allowed border-border bg-muted ...'
)}

<VoiceNoteWaveform isReady={playbackReady} ... />
```

#### 8. Remove "Preparing audio…" fallback

If you had a block that showed while `!isReady && !showSkeleton`, remove it. With the new model, the play button is available as soon as the URL exists.

---

## Organization-specific notes

Organization `VoiceNotePlayer` resolves audio differently from Business:

| | Organization | Business |
|---|-------------|----------|
| Submit preview | `src={note.url}` (blob) | `src={note.url}` (blob) |
| Track / admin | `path` + `resolveUrl(path)` | `voiceNote.id` → `get-voice-note-url` edge function |

The mobile fix is **identical** for both code paths because both end up with an `audioUrl` string. Apply all changes in:

```
src/components/media/VoiceNotePlayer.jsx
```

No changes required to:

- `VoiceNotePlayerList.jsx`
- `VoiceRecorder.jsx` (for this specific spinner bug)
- `voiceAnonymizer.js`

---

## Optional hardening (recommended follow-ups)

These were **not** required to fix the spinner but improve mobile reliability.

### A. Secure context check before recording

Mic access requires HTTPS (or localhost on the same device). LAN IP over HTTP fails **without a permission prompt**.

In `VoiceRecorder.startRecording`, before `getUserMedia`:

```javascript
if (!window.isSecureContext) {
  setRecorderError(
    'Voice recording requires a secure connection (HTTPS). Please use the live site or an HTTPS dev tunnel.'
  );
  setRecorderState('error');
  return;
}

if (!navigator.mediaDevices?.getUserMedia) {
  setRecorderError('Audio recording is not supported in this browser.');
  setRecorderState('error');
  return;
}
```

### B. MediaRecorder timeslice (iOS empty blob)

Some iOS versions buffer poorly without a timeslice:

```javascript
// Instead of: mediaRecorder.start()
mediaRecorder.start(250); // emit chunks every 250ms
```

### C. Minimum recording length

Reject blobs under ~0.5s before anonymization to avoid empty decode errors.

---

## Files to modify (checklist)

- [ ] `src/components/media/VoiceNotePlayer.jsx` — **required** (this guide)
- [ ] `src/views/submit-report/VoiceRecorder.jsx` — optional secure-context + timeslice
- [ ] Deploy frontend after changes (edge functions unchanged for this fix)

---

## Testing checklist

Test on **real devices** over **HTTPS** (production or ngrok), not `http://192.168.x.x`.

### Submit flow (VoiceRecorder + blob preview)

- [ ] Tap mic → permission prompt appears (HTTPS only)
- [ ] Record 3–5 seconds → Stop
- [ ] "Anonymizing" shows progress, then completes
- [ ] Preview card shows **Ready** and **Play** (not infinite Loading)
- [ ] Tap Play → audio plays
- [ ] Delete note → record again ("Record more voicenote")
- [ ] Submit report with 2+ voice notes

### Track report (signed URL via `resolveUrl`)

- [ ] Open submitted voice report on mobile
- [ ] Each voice note player shows Play (not Loading)
- [ ] Playback works after tap

### Admin report details

- [ ] Same as track report for `VoiceNotePlayerList`

### Browsers

- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Android Chrome

---

## Reference: full fixed player pattern

Below is the core logic to mirror in Organization's `VoiceNotePlayer.jsx`. Adapt prop names (`path`, `resolveUrl`, `src`) but keep the readiness model.

```javascript
const isLocalPreview = Boolean(src?.startsWith('blob:'));
const playbackReady = Boolean(audioUrl) && !error;

const showSkeleton = loading;

const syncDuration = useCallback((audio) => {
  if (!audio) return;
  const d = audio.duration;
  if (Number.isFinite(d) && d > 0) setDuration(d);
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
```

---

## Deployment

1. Apply `VoiceNotePlayer.jsx` changes.
2. Build and deploy the **frontend** (Vercel / your host).
3. Hard-refresh on mobile or clear site data (cached JS bundles can mask the fix).
4. No edge function redeploy needed for this specific fix.

---

## Related docs

- `docs/SUBMIT_REPORT_PAGE_IMPLEMENTATION_PROMPT.md` — full submit flow
- Business app reference: `the-business-whistleblower/src/components/VoiceNotePlayer.jsx` (fixed version)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-26 | Initial mobile playback fix documented after validation on iOS Safari + Android Chrome |
