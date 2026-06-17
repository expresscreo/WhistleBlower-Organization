export function getAttachmentDisplayName(fileUrl) {
  if (!fileUrl) return 'Unknown file';

  const raw = String(fileUrl).split('/').pop() || 'attachment';
  const decoded = decodeURIComponent(raw);

  const uuidPrefix = decoded.match(
    /^(?:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-|\d+-)(.+)$/i,
  );
  if (uuidPrefix?.[1]) return uuidPrefix[1];

  const dashIndex = decoded.indexOf('-');
  if (dashIndex > 0 && /^\d+$/.test(decoded.slice(0, dashIndex))) {
    return decoded.slice(dashIndex + 1);
  }

  return decoded;
}

export function getAttachmentPreviewType(fileOrPath) {
  const path = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.file_url || '';
  const mime = fileOrPath?.file_type || '';

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';

  const lower = path.toLowerCase();
  if (/\.(avif|gif|jpe?g|png|webp)(\?.*)?$/.test(lower)) return 'image';
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(lower)) return 'video';
  if (/\.(mp3|wav|m4a|aac)(\?.*)?$/.test(lower)) return 'audio';
  if (/\.pdf(\?.*)?$/.test(lower)) return 'pdf';

  return null;
}

export function getAttachmentTypeLabel(type) {
  const labels = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    pdf: 'PDF',
  };
  return labels[type] || 'File';
}
