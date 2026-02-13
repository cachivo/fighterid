import { useRef, useEffect, useState, useCallback } from "react";

// Intersection Observer hook for lazy loading
export function useInView(options?: IntersectionObserverInit & { triggerOnce?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const { triggerOnce = true, ...observerOptions } = options || {};

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { rootMargin: "50px", threshold: 0.1, ...observerOptions }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [triggerOnce]);

  return { ref, isInView };
}

// Debounced value for search inputs
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Throttled callback for scroll/resize handlers
export function useThrottledCallback<T extends (...args: any[]) => void>(callback: T, delay: number = 100) {
  const lastCall = useRef(0);
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
}
