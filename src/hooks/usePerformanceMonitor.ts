import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
}

export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    const logMetric = (name: string, value: number) => {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}${name === 'CLS' ? '' : 'ms'}`);
    };

    try {
      // FCP
      const fcpObs = new PerformanceObserver((list) => {
        const fcp = list.getEntries().find((e) => e.name === 'first-contentful-paint');
        if (fcp) { metricsRef.current.fcp = fcp.startTime; logMetric('FCP', fcp.startTime); }
      });
      fcpObs.observe({ entryTypes: ['paint'] });

      // LCP
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        metricsRef.current.lcp = last.startTime;
        logMetric('LCP', last.startTime);
      });
      lcpObs.observe({ entryTypes: ['largest-contentful-paint'] });

      // CLS
      let clsValue = 0;
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) clsValue += (entry as any).value;
        }
        metricsRef.current.cls = clsValue;
        logMetric('CLS', clsValue);
      });
      clsObs.observe({ entryTypes: ['layout-shift'] });

      // FID
      const fidObs = new PerformanceObserver((list) => {
        const first = list.getEntries()[0] as any;
        if (first) {
          const fid = first.processingStart - first.startTime;
          metricsRef.current.fid = fid;
          logMetric('FID', fid);
        }
      });
      fidObs.observe({ entryTypes: ['first-input'] });

      // TTFB
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        const ttfb = nav.responseStart - nav.startTime;
        metricsRef.current.ttfb = ttfb;
        logMetric('TTFB', ttfb);
      }
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }, []);

  const getMetrics = useCallback(() => metricsRef.current, []);
  return { getMetrics };
}

export function useRenderTime(componentName: string) {
  const startTime = useRef(performance.now());
  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    if (renderTime > 16) {
      console.warn(`[Render] ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  });
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => fn(...args), delay); };
}

export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => { if (!inThrottle) { fn(...args); inThrottle = true; setTimeout(() => (inThrottle = false), limit); } };
}
