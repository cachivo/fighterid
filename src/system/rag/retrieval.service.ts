import { supabase } from '@/integrations/supabase/client';

/**
 * Búsqueda vectorial en knowledge_embeddings.
 * Solo accesible para admin / super_admin (la RPC valida).
 *
 * El query embedding debe generarse server-side primero (otra edge function
 * o pipeline). Para el MVP de hooks no exponemos UI directa.
 */
export async function retrieveRelevantContext(params: {
  queryEmbedding: number[];
  fighterProfileId?: string | null;
  matchCount?: number;
}) {
  const { data, error } = await supabase.rpc('match_knowledge_embeddings' as any, {
    query_embedding: params.queryEmbedding as unknown as string,
    p_fighter_profile_id: params.fighterProfileId ?? null,
    match_count: params.matchCount ?? 5,
  });
  if (error) throw error;
  return data ?? [];
}
