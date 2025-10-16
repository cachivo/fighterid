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

/**
 * Recorta automáticamente los bordes transparentes de una imagen PNG
 * @param file - Archivo de imagen a recortar
 * @returns Nueva imagen recortada sin bordes transparentes
 */
export const trimTransparentBorders = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto del canvas'));
      return;
    }

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      // Crear canvas temporal con imagen original
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // Encontrar el bounding box de píxeles no transparentes
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const alpha = pixels[(y * width + x) * 4 + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Si no hay píxeles no transparentes, devolver el archivo original
      if (minX > maxX || minY > maxY) {
        resolve(file);
        return;
      }

      // Calcular dimensiones del recorte
      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;

      // Crear canvas final con imagen recortada
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.clearRect(0, 0, cropWidth, cropHeight);
      
      // Redibujar solo la parte no transparente
      ctx.drawImage(
        img,
        minX, minY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      // Convertir a blob PNG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al procesar la imagen'));
            return;
          }

          const trimmedFile = new File([blob], file.name, {
            type: 'image/png',
            lastModified: Date.now()
          });

          console.log(`[trimTransparentBorders] Recortado: ${width}x${height} → ${cropWidth}x${cropHeight}`);
          resolve(trimmedFile);
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};