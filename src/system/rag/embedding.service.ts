import { supabase } from '@/integrations/supabase/client';

/**
 * Cliente del edge function `session-embed`.
 * Genera un embedding via Lovable AI Gateway y lo persiste en knowledge_embeddings.
 *
 * Reglas:
 * - NUNCA llamar con content vacío.
 * - El edge function valida auth y rate limits.
 */
export async function generateEmbedding(input: {
  source_type: 'work_update' | 'license_audit' | 'profile_change';
  source_id: string;
  fighter_profile_id?: string | null;
  content: string;
}): Promise<{ id: string } | null> {
  if (!input.content?.trim()) return null;

  try {
    const { data, error } = await supabase.functions.invoke('session-embed', {
      body: input,
    });
    if (error) {
      console.warn('[embedding.service] invoke error', error.message);
      return null;
    }
    return data as { id: string };
  } catch (e) {
    console.warn('[embedding.service] exception', e);
    return null;
  }
}
