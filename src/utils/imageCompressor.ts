export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_COMPRESSED_IMAGE_BYTES = 150 * 1024; // 150 KB limit to protect localStorage

/**
 * Validates and compresses an uploaded image file into a compact, persistent Data URL (JPEG).
 * Enforces allowed image types (JPEG, PNG, WebP) and maximum compressed size (150KB).
 * Resizes the image to a max dimension of 640px and compresses to prevent storage exhaustion.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 640,
  quality = 0.7
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // 1. Strict MIME type & extension validation
  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(fileType as any);
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);

  if (!hasValidMime && !hasValidExt) {
    throw new Error(
      'Unsupported photo format. Please upload a JPEG, PNG, or WebP image.'
    );
  }

  // 2. Read and compress via Canvas
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // 3. Post-compression size verification
  // Data URL structure: 'data:image/jpeg;base64,...'
  const commaIndex = dataUrl.indexOf(',');
  const base64Data = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const approxBytes = Math.round((base64Data.length * 3) / 4);

  if (approxBytes > MAX_COMPRESSED_IMAGE_BYTES) {
    throw new Error(
      `Compressed image size (${Math.round(approxBytes / 1024)}KB) exceeds the 150KB limit. Please choose a smaller photo.`
    );
  }

  return dataUrl;
}
