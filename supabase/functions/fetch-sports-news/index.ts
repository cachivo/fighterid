import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // For now, we'll create some demo news to show the functionality
    // In production, you'd integrate with NewsAPI or similar service
    const demoNews = [
      {
        title: "UFC 300: Pereira vs. Hill Results and Highlights",
        description: "Alex Pereira successfully defends his light heavyweight title against Jamahal Hill in a stunning performance at UFC 300.",
        url: "https://www.ufc.com/news/ufc-300-results",
        image_url: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=200&fit=crop",
        source: "UFC News",
        category: "mma",
        published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        is_featured: true
      },
      {
        title: "Canelo vs. Munguia: Fight Week Preparations Underway",
        description: "Saul 'Canelo' Alvarez prepares for his upcoming bout against Jaime Munguia in what promises to be an explosive matchup.",
        url: "https://www.boxingscene.com/canelo-munguia-news",
        image_url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop",
        source: "Boxing Scene",
        category: "boxing",
        published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        is_featured: false
      },
      {
        title: "ONE Championship Announces New Muay Thai Tournament",
        description: "ONE Championship reveals plans for a new Muay Thai grand prix featuring eight of the world's best fighters.",
        url: "https://www.onefc.com/news/muay-thai-tournament",
        image_url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=200&fit=crop",
        source: "ONE FC",
        category: "muay_thai",
        published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        is_featured: false
      },
      {
        title: "PFL Season 2025: New Weight Classes and Format Changes",
        description: "Professional Fighters League announces significant changes for the 2025 season, including new weight divisions and tournament structure.",
        url: "https://www.pflmma.com/news/2025-changes",
        image_url: "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=400&h=200&fit=crop",
        source: "PFL MMA",
        category: "mma",
        published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        is_featured: false
      },
      {
        title: "Gervonta Davis Training Camp: Road to Next Fight",
        description: "Tank Davis showcases his preparation and training regimen as he gears up for his highly anticipated return to the ring.",
        url: "https://www.boxingnews24.com/gervonta-davis-training",
        image_url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=200&fit=crop",
        source: "Boxing News 24",
        category: "boxing",
        published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        is_featured: true
      }
    ];

    // Remove old news (older than 24 hours)
    await supabase
      .from('sports_news')
      .delete()
      .lt('published_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Insert new news, avoiding duplicates
    for (const newsItem of demoNews) {
      const { data: existing } = await supabase
        .from('sports_news')
        .select('id')
        .eq('url', newsItem.url)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('sports_news')
          .insert([newsItem]);
        
        if (error) {
          console.error('Error inserting news item:', error);
        }
      }
    }

    console.log(`✅ Sports news updated successfully - ${demoNews.length} items processed`);

    return new Response(JSON.stringify({ 
      success: true,
      processed: demoNews.length,
      message: 'Sports news updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-sports-news function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});