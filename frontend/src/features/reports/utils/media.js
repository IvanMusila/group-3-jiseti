import { API_ORIGIN } from '../../../lib/api';

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

export function resolveMediaUrl(path = '') {
  if (!path) return null;
  if (ABSOLUTE_URL_REGEX.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
}

export function describeMediaType(mime = '') {
  if (!mime) return 'file';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return mime.split('/')[0] || 'file';
}
