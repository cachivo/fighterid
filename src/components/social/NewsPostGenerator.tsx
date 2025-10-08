import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsPostGeneratorProps {
  userId?: string;
  userType?: 'fighter' | 'fan' | 'admin';
}

export function NewsPostGenerator({ userId, userType = 'fan' }: NewsPostGeneratorProps) {
  const { toast } = useToast();

  // ✅ ELIMINADO: processExistingNews (causaba notificaciones spam)
  // ✅ ELIMINADO: realtime listener de sports_news (duplicaba llamadas)
  // ✅ ELIMINADO: createSmartSocialPost del cliente (ahora solo por admin)

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