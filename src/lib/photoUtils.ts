import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Upload a fighter avatar image
 * - Uses fighterId for folder path (works for both admin and user uploads)
 * - Admins can upload to any fighter's folder via storage policies
 * - Users can upload to their own folder (auth.uid() match)
 */
export async function uploadFighterAvatar(
  file: File, 
  userId: string, // For backwards compatibility - can be the uploading user's ID or fighter's user_id
  fighterProfileId: string,
  currentAvatarUrl?: string
): Promise<string | null> {
  console.log('uploadFighterAvatar called with:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    userId,
    fighterProfileId,
    hasCurrentAvatar: !!currentAvatarUrl
  });

  try {
    // Input validation
    if (!file) {
      console.error('No file provided');
      toast.error('Error: No se proporcionó archivo');
      return null;
    }

    if (!fighterProfileId) {
      console.error('No fighterProfileId provided');
      toast.error('Error: ID de perfil de peleador no válido');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error('File too large:', file.size);
      toast.error('Error: El archivo es demasiado grande (máximo 10MB)');
      return null;
    }

    // Clean up old avatar if exists
    if (currentAvatarUrl) {
      console.log('Cleaning up old avatar:', currentAvatarUrl);
      await cleanupOldAvatar(currentAvatarUrl);
    }

    let processedFile = file;

    // Optimize image directly without background removal
    if (file.type.startsWith('image/')) {
      try {
        toast.info('Optimizando imagen...');
        
        const { resizeImage } = await import('./imageUtils');
        const optimized = await resizeImage(file, {
          maxWidth: 1024,      // 1024x1024 para peleadores
          maxHeight: 1024,
          quality: 0.95,       // Muy alta calidad para profesionales
          format: 'webp',      // WebP para mejor compresión
          maintainAspectRatio: true
        });

        processedFile = optimized.file;
        
        toast.success('Imagen optimizada correctamente');
      } catch (error) {
        console.warn('Image optimization failed, using original image:', error);
        toast.warning('No se pudo optimizar la imagen, usando imagen original');
        // Continue with original file if optimization fails
      }
    }

    // Get current authenticated user to determine folder strategy
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      console.error('No authenticated user');
      toast.error('Error: Usuario no autenticado');
      return null;
    }

    // Check if current user is admin
    const { data: appUser } = await supabase
      .from('app_user')
      .select('is_admin')
      .eq('auth_user_id', currentUser.id)
      .single();

    const isAdmin = appUser?.is_admin === true;

    // Use fighterId-based folder for admins (covered by admin storage policy)
    // Use auth.uid()-based folder for regular users (covered by user storage policy)
    const folderPath = isAdmin 
      ? `fighters/${fighterProfileId}` 
      : `${currentUser.id}`;
    
    const photoFileName = `${folderPath}/photo-${Date.now()}.webp`;
    console.log('Starting upload to storage:', photoFileName, { isAdmin });
    
    const { error: uploadError } = await supabase.storage
      .from('fighter-photos')
      .upload(photoFileName, processedFile, {
        contentType: processedFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      toast.error(`Error subiendo foto: ${uploadError.message}`);
      return null;
    }

    console.log('Photo uploaded successfully to storage');

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('fighter-photos')
      .getPublicUrl(photoFileName);

    console.log('Generated public URL:', publicUrl.publicUrl);

    // Update fighter profile with new avatar URL
    const { error: updateError } = await supabase
      .from('fighter_profiles')
      .update({ avatar_url: publicUrl.publicUrl })
      .eq('id', fighterProfileId);

    if (updateError) {
      console.error('Error updating avatar URL:', updateError);
      toast.error(`Error actualizando perfil: ${updateError.message}`);
      return null;
    }

    console.log('Fighter profile updated successfully with new avatar URL');
    toast.success('Avatar actualizado correctamente');
    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadFighterAvatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error procesando avatar: ${errorMessage}`);
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
