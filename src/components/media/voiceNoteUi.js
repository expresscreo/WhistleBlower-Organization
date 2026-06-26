export const WAVEFORM = [
  0.28, 0.42, 0.55, 0.72, 0.48, 0.88, 0.62, 0.38, 0.66, 0.92, 0.54, 0.76,
  0.44, 0.84, 0.58, 0.34, 0.7, 0.5, 0.82, 0.46, 0.64, 0.9, 0.52, 0.74,
  0.4, 0.68, 0.86, 0.56, 0.36, 0.6, 0.78, 0.48,
];

export const STATUS_DOT = {
  Loading: 'bg-amber-500 animate-pulse',
  Ready: 'bg-muted-foreground/50',
  Recording: 'bg-red-500 animate-pulse',
  Processing: 'bg-amber-500 animate-pulse',
  Playing: 'bg-emerald-500 animate-pulse',
  Pause: 'bg-primary',
  Attached: 'bg-emerald-500',
};

export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
