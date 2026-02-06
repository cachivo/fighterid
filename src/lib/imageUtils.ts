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

/**
 * Detecta si el dispositivo es móvil basándose en el ancho de pantalla
 */
export const isMobileDevice = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

/**
 * Obtiene opciones de resize optimizadas según el dispositivo
 */
export const getMobileOptimizedOptions = (customOptions: ImageResizeOptions = {}): ImageResizeOptions => {
  const isMobile = isMobileDevice();
  
  const defaults: ImageResizeOptions = isMobile 
    ? { maxWidth: 600, maxHeight: 600, quality: 0.7, format: 'jpeg' }
    : { maxWidth: 800, maxHeight: 800, quality: 0.85, format: 'jpeg' };
  
  return { ...defaults, ...customOptions };
};

/**
 * Redimensiona una imagen de manera eficiente
 */
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

          // Revoke object URL to prevent memory leak
          URL.revokeObjectURL(img.src);

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
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Redimensiona imagen optimizada para móviles usando requestIdleCallback
 * para no bloquear el hilo principal de la UI
 */
export const resizeImageForMobile = async (
  file: File,
  options: ImageResizeOptions = {}
): Promise<ImageResizeResult> => {
  const optimizedOptions = getMobileOptimizedOptions(options);
  
  return new Promise((resolve, reject) => {
    const processImage = () => resizeImage(file, optimizedOptions);
    
    // Use requestIdleCallback to avoid blocking UI on mobile devices
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        () => {
          processImage().then(resolve).catch(reject);
        },
        { timeout: 5000 } // Max wait 5s before forcing execution
      );
    } else {
      // Fallback for Safari and older browsers
      setTimeout(() => {
        processImage().then(resolve).catch(reject);
      }, 0);
    }
  });
};

/**
 * Redimensiona imagen con callback de progreso para UI feedback
 */
export const resizeImageWithProgress = async (
  file: File,
  options: ImageResizeOptions = {},
  onProgress?: (stage: string, percent: number) => void
): Promise<ImageResizeResult> => {
  onProgress?.('Cargando imagen...', 10);
  
  const optimizedOptions = getMobileOptimizedOptions(options);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto del canvas'));
      return;
    }

    img.onload = () => {
      onProgress?.('Procesando...', 40);
      
      const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.85,
        format = 'jpeg',
        maintainAspectRatio = true
      } = optimizedOptions;

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

        if (targetWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth / aspectRatio);
        }
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = Math.round(maxHeight * aspectRatio);
        }
      }

      if (targetWidth > originalWidth || targetHeight > originalHeight) {
        targetWidth = originalWidth;
        targetHeight = originalHeight;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      onProgress?.('Redimensionando...', 60);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      onProgress?.('Comprimiendo...', 80);
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

          URL.revokeObjectURL(img.src);
          onProgress?.('¡Listo!', 100);

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
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };

    onProgress?.('Leyendo archivo...', 20);
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
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(img.src);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al obtener dimensiones'));
    };
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
        URL.revokeObjectURL(img.src);
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

          URL.revokeObjectURL(img.src);
          console.log(`[trimTransparentBorders] Recortado: ${width}x${height} → ${cropWidth}x${cropHeight}`);
          resolve(trimmedFile);
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };

    img.src = URL.createObjectURL(file);
  });
};
