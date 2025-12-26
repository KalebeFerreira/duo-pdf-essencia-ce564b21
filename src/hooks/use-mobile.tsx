import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if the current viewport is mobile.
 * Uses matchMedia for efficient detection without resize listener overhead.
 * 
 * Returns a stable value to prevent re-render loops.
 */
export function useIsMobile(): boolean {
  // Sempre inicia como false para evitar mismatch de hidratação SSR/CSR
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Sincroniza com o valor real apenas no cliente
    setIsMobile(mql.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
