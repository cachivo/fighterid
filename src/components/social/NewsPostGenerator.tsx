import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsPostGeneratorProps {
  userId?: string;
  userType?: 'fighter' | 'fan' | 'admin';
}

export function NewsPostGenerator({ userId, userType = 'fan' }: NewsPostGeneratorProps) {
  const { toast } = useToast();

  // Process existing recent news on mount
  useEffect(() => {
    const processExistingNews = async () => {
      try {
        // Get recent news from last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        const { data: recentNews, error } = await supabase
          .from('sports_news')
          .select('*')
          .gte('published_at', oneDayAgo.toISOString())
          .order('published_at', { ascending: false });

        if (error) throw error;

        if (recentNews && recentNews.length > 0) {
          // Process each news item
          for (const newsItem of recentNews) {
            // Check if post already exists
            const { data: existingPost } = await supabase
              .from('social_posts')
              .select('id')
              .eq('post_type', 'news')
              .ilike('content', `%${newsItem.title}%`)
              .single();

            if (!existingPost) {
              const shouldPost = await shouldCreatePostForUser(newsItem, userType);
              if (shouldPost) {
                await createSmartSocialPost(newsItem, userType);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing existing news:', error);
      }
    };

    processExistingNews();
  }, [userType]);

  // Listen for real-time news updates
  useEffect(() => {
    const channel = supabase
      .channel('news-social-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sports_news'
        },
        async (payload) => {
          const newsItem = payload.new;
          const shouldPost = await shouldCreatePostForUser(newsItem, userType);
          
          if (shouldPost) {
            await createSmartSocialPost(newsItem, userType);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType]);

  const shouldCreatePostForUser = async (newsItem: any, userType: string) => {
    // Always post featured news
    if (newsItem.is_featured) return true;
    
    // Smart criteria based on category - post all boxing and mma news
    if (newsItem.category === 'mma' || newsItem.category === 'boxing') {
      return true;
    }
    
    // Additional keywords for other categories
    const keywords = {
      fighter: ['championship', 'title', 'ranking', 'license', 'tournament'],
      fan: ['knockout', 'highlight', 'result', 'fight', 'match'],
      admin: ['regulation', 'safety', 'commission', 'policy']
    };

    const userKeywords = keywords[userType as keyof typeof keywords] || keywords.fan;
    const titleLower = newsItem.title.toLowerCase();
    
    return userKeywords.some(keyword => titleLower.includes(keyword));
  };

  const createSmartSocialPost = async (newsItem: any, userType: string) => {
    try {
      // Create cleaner post templates with better link formatting
      const postTemplates = {
        fighter: `🥊 ATENCIÓN LUCHADORES

${newsItem.title}

${newsItem.description || ''}

Esta información podría impactar tu carrera. ¿Qué opinas?

📰 Fuente: ${newsItem.source}
🔗 Leer artículo completo: ${newsItem.url}

#Fighters #${newsItem.category} #CombateSports`,

        fan: `🔥 ÚLTIMA HORA EN ${newsItem.category.toUpperCase()}

${newsItem.title}

${newsItem.description || ''}

💬 ¿Qué te parece? ¡Comenta tu opinión!

📰 Fuente: ${newsItem.source}
🔗 Leer más: ${newsItem.url}

#${newsItem.category} #CombateSports #MMA #Boxing`,

        admin: `📢 ACTUALIZACIÓN IMPORTANTE

${newsItem.title}

${newsItem.description || ''}

Información relevante para la comunidad de combate.

📰 Fuente: ${newsItem.source}
🔗 Enlace: ${newsItem.url}

#News #${newsItem.category} #Update`
      };

      const content = postTemplates[userType as keyof typeof postTemplates] || postTemplates.fan;

      const { error } = await supabase
        .from('social_posts')
        .insert([{
          author_id: '00000000-0000-0000-0000-000000000000', // System/Bot ID
          author_type: 'admin',
          content,
          media_urls: newsItem.image_url ? [newsItem.image_url] : [],
          post_type: 'news',
          featured: newsItem.is_featured,
          active: true
        }]);

      if (!error) {
        toast({
          title: "Nueva publicación",
          description: "Se ha agregado una nueva noticia al feed social",
        });
      }
    } catch (error) {
      console.error('Error creating smart social post:', error);
    }
  };

  // Auto-trigger news fetching every 30 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await supabase.functions.invoke('fetch-sports-news');
      } catch (error) {
        console.error('Error auto-fetching news:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return null; // This is a background component
}