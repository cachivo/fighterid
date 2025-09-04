export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export interface ImageResizeResult {
  file: File;
  originalSize: number;
  newSize: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
}

export const resizeImage = async (
  file: File,
  options: ImageResizeOptions = {}
): Promise<ImageResizeResult> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto del canvas'));
      return;
    }

    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      let targetWidth = maxWidth;
      let targetHeight = maxHeight;

      if (maintainAspectRatio) {
        const aspectRatio = originalWidth / originalHeight;
        
        if (originalWidth > originalHeight) {
          targetHeight = Math.round(targetWidth / aspectRatio);
        } else {
          targetWidth = Math.round(targetHeight * aspectRatio);
        }

        // Ensure we don't exceed maximum dimensions
        if (targetWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth / aspectRatio);
        }
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = Math.round(maxHeight * aspectRatio);
        }
      }

      // Don't upscale images
      if (targetWidth > originalWidth || targetHeight > originalHeight) {
        targetWidth = originalWidth;
        targetHeight = originalHeight;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Use better image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al procesar la imagen'));
            return;
          }

          const mimeType = format === 'png' ? 'image/png' : 
                          format === 'webp' ? 'image/webp' : 'image/jpeg';
          
          const resizedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now()
          });

          resolve({
            file: resizedFile,
            originalSize: file.size,
            newSize: blob.size,
            originalDimensions: { width: originalWidth, height: originalHeight },
            newDimensions: { width: targetWidth, height: targetHeight }
          });
        },
        format === 'png' ? 'image/png' : 
        format === 'webp' ? 'image/webp' : 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};