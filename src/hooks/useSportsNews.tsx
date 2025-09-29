import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SportsNews {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string | null;
  source: string;
  category: string;
  published_at: string;
  is_featured: boolean;
  created_at: string;
}

export function useSportsNews(category?: string) {
  const { data: news, isLoading, error, refetch } = useQuery({
    queryKey: ['sports-news', category],
    queryFn: async () => {
      let query = supabase
        .from('sports_news')
        .select('*')
        .order('published_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      return data as SportsNews[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const featuredNews = news?.filter(item => item.is_featured) || [];
  const regularNews = news?.filter(item => !item.is_featured) || [];

  return { 
    news: news || [], 
    featuredNews, 
    regularNews, 
    isLoading, 
    error,
    refetch
  };
}