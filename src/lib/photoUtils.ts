import { supabase } from '@/integrations/supabase/client';
import { removeBackground, loadImage } from './backgroundRemoval';
import { toast } from 'sonner';

export async function uploadFighterAvatar(
  file: File, 
  userId: string, 
  fighterProfileId: string,
  currentAvatarUrl?: string
): Promise<string | null> {
  try {
    // Clean up old avatar if exists
    if (currentAvatarUrl) {
      await cleanupOldAvatar(currentAvatarUrl);
    }

    let processedFile = file;

    // Apply background removal for image files
    if (file.type.startsWith('image/')) {
      try {
        toast.info('Procesando imagen, removiendo fondo...');
        
        // Load image and remove background
        const imageElement = await loadImage(file);
        const processedBlob = await removeBackground(imageElement);
        
        // Convert blob to file
        processedFile = new File([processedBlob], file.name, {
          type: 'image/png',
          lastModified: Date.now()
        });
        
        toast.success('Fondo removido exitosamente');
      } catch (bgError) {
        console.warn('Background removal failed, using original image:', bgError);
        toast.warning('No se pudo remover el fondo, usando imagen original');
        // Continue with original file if background removal fails
      }
    }

    // Upload processed photo
    const photoFileName = `${userId}/photo-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('fighter-photos')
      .upload(photoFileName, processedFile, {
        contentType: processedFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('fighter-photos')
      .getPublicUrl(photoFileName);

    // Update fighter profile with new avatar URL
    const { error: updateError } = await supabase
      .from('fighter_profiles')
      .update({ avatar_url: publicUrl.publicUrl })
      .eq('id', fighterProfileId);

    if (updateError) {
      console.error('Error updating avatar URL:', updateError);
      return null;
    }

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadFighterAvatar:', error);
    return null;
  }
}

async function cleanupOldAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const urlParts = avatarUrl.split('/fighter-photos/');
    if (urlParts.length !== 2) return;
    
    const filePath = urlParts[1];
    
    // Delete old file from storage
    await supabase.storage
      .from('fighter-photos')
      .remove([filePath]);

  } catch (error) {
    console.error('Error cleaning up old avatar:', error);
    // Don't throw, this is cleanup and shouldn't block the main operation
  }
}