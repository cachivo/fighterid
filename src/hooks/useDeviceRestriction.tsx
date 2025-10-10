import { useEffect, useState } from 'react';

export function useDeviceRestriction() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && 
                       window.innerWidth >= 768;
      const hasTouchScreen = 'ontouchstart' in window || 
                            navigator.maxTouchPoints > 0;
      
      // Solo permitir si NO es móvil Y NO tiene touchscreen
      setIsDesktop(!isMobile && !isTablet && !hasTouchScreen);
      setIsChecking(false);
    };

    checkDevice();
  }, []);

  return { isDesktop, isChecking };
}
