import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Convert a File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 data URL to a Blob
 */
function base64ToBlob(base64: string): Blob {
  // Handle both formats: with or without data URL prefix
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const mimeMatch = base64.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Remove background from an image using AI
 * @param file - The image file to process
 * @returns A Blob with the processed image (transparent background)
 */
export async function removeBackgroundAI(file: File): Promise<Blob> {
  // Validate file size (max 5MB for processing)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen es demasiado grande. Máximo 5MB.');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.');
  }

  console.log('[removeBackgroundAI] Starting background removal for:', file.name);

  // Convert file to base64
  const base64 = await fileToBase64(file);
  console.log('[removeBackgroundAI] Converted to base64, size:', base64.length);

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('remove-image-background', {
    body: { imageBase64: base64 }
  });

  if (error) {
    console.error('[removeBackgroundAI] Edge function error:', error);
    throw new Error(error.message || 'Error al procesar la imagen');
  }

  if (!data?.processedImage) {
    console.error('[removeBackgroundAI] No processed image in response:', data);
    throw new Error('No se pudo procesar la imagen');
  }

  console.log('[removeBackgroundAI] Successfully received processed image');

  // Convert the base64 response back to a Blob
  const processedBlob = base64ToBlob(data.processedImage);
  
  return processedBlob;
}

/**
 * Remove background from an image with user feedback (toasts)
 * @param file - The image file to process
 * @returns A File with transparent background, or the original file if processing fails
 */
export async function removeBackgroundWithFeedback(file: File): Promise<File> {
  try {
    toast.info('Removiendo fondo con IA...', { duration: 10000 });
    
    const processedBlob = await removeBackgroundAI(file);
    
    // Create a new File from the blob
    const processedFile = new File(
      [processedBlob], 
      file.name.replace(/\.[^/.]+$/, '.png'), // Change extension to .png
      { type: 'image/png' }
    );
    
    toast.success('¡Fondo removido correctamente!');
    
    return processedFile;
  } catch (error) {
    console.error('[removeBackgroundWithFeedback] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error al remover fondo: ${errorMessage}. Usando imagen original.`);
    
    // Return original file as fallback
    return file;
  }
}
