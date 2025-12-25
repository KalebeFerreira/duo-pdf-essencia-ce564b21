import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile.
 * Uses matchMedia for efficient detection without resize listener overhead.
 * 
 * Returns a stable value to prevent re-render loops.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Calculate initial value synchronously
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Handler for media query changes only
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    // Sync with current state if different (for SSR hydration)
    if (mql.matches !== isMobile) {
      setIsMobile(mql.matches);
    }
    
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []); // Empty dependency array - only run once on mount

  return isMobile;
}
