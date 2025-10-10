import { useEffect, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  children: ReactNode;
  threshold?: number;
}

export function InfiniteScrollContainer({
  onLoadMore,
  hasMore,
  loading,
  children,
  threshold = 300
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, onLoadMore, threshold]);

  return (
    <>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="h-20 flex items-center justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-purple-neon-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Cargando más peleadores...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
