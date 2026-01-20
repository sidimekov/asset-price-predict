export const MAX_AVATAR_SIZE_MB = 5;
export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

export async function resizeImageToSquare(
  file: File,
  size = 256,
): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(file);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }

  const minSide = Math.min(img.width, img.height);
  const sx = (img.width - minSide) / 2;
  const sy = (img.height - minSide) / 2;

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

  URL.revokeObjectURL(url);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.9);
  });
}
