 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 
 export interface RankingOrganization {
   id: string;
   code: string;
   name: string;
   short_name: string;
   discipline: string;
   allowed_levels: string[];
   description: string | null;
   logo_url: string | null;
   is_active: boolean;
 }
 
 export function useRankingOrganizations() {
   return useQuery({
     queryKey: ['ranking-organizations'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('ranking_organizations')
         .select('*')
         .eq('is_active', true)
         .order('discipline', { ascending: true });
 
       if (error) throw error;
       return data as RankingOrganization[];
     },
     staleTime: 30 * 60 * 1000, // 30 minutes
   });
 }
 
 export function useOrganizationsByDiscipline(discipline: 'MMA' | 'Boxeo') {
   const { data: organizations, ...rest } = useRankingOrganizations();
   
   const filtered = organizations?.filter(org => org.discipline === discipline) || [];
   
   return {
     organizations: filtered,
     ...rest,
   };
 }