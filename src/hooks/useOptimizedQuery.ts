import { useQuery, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { getNetworkStatus } from "./useNetworkStatus";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

// Network-aware query wrapper
export function useOptimizedQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, string[]>, "queryKey" | "queryFn">
) {
  const { isSlow, saveData } = getNetworkStatus();

  return useQuery<T, Error, T, string[]>({
    queryKey: key,
    queryFn,
    staleTime: isSlow ? 10 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: isSlow ? 20 * 60 * 1000 : 10 * 60 * 1000,
    refetchOnWindowFocus: !saveData,
    refetchOnReconnect: true,
    retry: isSlow ? 1 : 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    ...options,
  });
}

// Prefetch on hover for navigation links
export function usePrefetchOnHover() {
  const queryClient = useQueryClient();

  const prefetchFighter = useCallback(
    (fighterId: string) => {
      queryClient.prefetchQuery({
        queryKey: ["fighter", fighterId],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("fighter_profiles")
            .select("*")
            .eq("id", fighterId)
            .single();
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { prefetchFighter };
}
