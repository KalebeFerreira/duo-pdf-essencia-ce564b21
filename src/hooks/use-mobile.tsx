import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile.
 * Uses matchMedia for efficient detection without resize listener overhead.
 * 
 * CRITICAL: Returns a stable value to prevent re-render loops.
 * Initial value is calculated synchronously if window is available.
 */
export function useIsMobile() {
  // Calculate initial value synchronously if possible to avoid flicker
  const getInitialValue = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  };

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitialValue);
  
  // Use ref to track if we've done initial setup
  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    // Skip if already initialized with correct value
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Update only if different from initial
    if (mql.matches !== isMobile) {
      setIsMobile(mql.matches);
    }
    
    // Handler for media query changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mql.addEventListener("change", handleChange);
    
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, [isMobile]);

  return isMobile;
}
