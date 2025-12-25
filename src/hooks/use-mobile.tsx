import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize with undefined to avoid hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Use only matchMedia - efficient and avoids resize listener overhead
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Set initial value only after mount
    setIsMobile(mql.matches);
    
    // Handler for media query changes only
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
