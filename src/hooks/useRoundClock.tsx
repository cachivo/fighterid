import { useEffect, useState } from 'react';

export function useRoundClock(startsAtISO?: string) {
  const [nowMs, setNow] = useState(0);

  useEffect(() => {
    if (!startsAtISO) {
      setNow(0);
      return;
    }
    
    const startTime = new Date(startsAtISO).getTime();
    const intervalId = setInterval(() => {
      setNow(Date.now() - startTime);
    }, 100); // Actualizar cada 100ms para precisión
    
    return () => clearInterval(intervalId);
  }, [startsAtISO]);

  return { nowMs };
}
