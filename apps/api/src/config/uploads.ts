import path from 'node:path';

export const uploadRoot = path.resolve(process.cwd(), 'uploads');
export const avatarsDir = path.join(uploadRoot, 'avatars');
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME_TYPES = ['image/webp'];

export function buildAvatarPath(userId: string) {
  return path.join(avatarsDir, `${userId}.webp`);
}

export function buildAvatarUrl(userId: string) {
  return `/files/avatars/${userId}.webp`;
}
