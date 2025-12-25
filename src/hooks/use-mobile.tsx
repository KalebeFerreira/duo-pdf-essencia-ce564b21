import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with undefined to avoid hydration mismatch, then set on mount
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Use only matchMedia - more efficient than resize listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Set initial value
    setIsMobile(mql.matches);
    
    // Handler for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mql.addEventListener("change", handleChange);
    
    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  // Return false during SSR/initial render to avoid hydration issues
  return isMobile ?? false;
}
