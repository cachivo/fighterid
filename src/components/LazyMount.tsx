import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazyMountProps {
  children: ReactNode;
  /** Pre-mount margin in px before the element enters the viewport. */
  rootMargin?: string;
  /** Min height while unmounted, prevents layout shift. */
  placeholderMinHeight?: number | string;
  /** Render immediately if true (e.g. for SSR/print). */
  eager?: boolean;
}

/**
 * Renders children only once the placeholder enters (or nears) the viewport.
 * Used to defer expensive sections — data fetching, realtime subscriptions,
 * heavy DOM — on the landing page so low-end devices see a fast first paint.
 */
export function LazyMount({
  children,
  rootMargin = '200px',
  placeholderMinHeight = 400,
  eager = false,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(eager);

  useEffect(() => {
    if (mounted) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [mounted, rootMargin]);

  if (mounted) return <>{children}</>;
  return <div ref={ref} style={{ minHeight: placeholderMinHeight }} aria-hidden="true" />;
}

export default LazyMount;
