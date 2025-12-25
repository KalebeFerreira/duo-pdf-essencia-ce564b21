import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type
 * and custom background color. Only loads profile for authenticated users.
 * 
 * CRITICAL: Uses refs to track applied theme and prevent infinite loops.
 * The theme is only applied ONCE per device change or profile change.
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const { setTheme, theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isMounted, setIsMounted] = useState(false);
  
  // Track what theme we've already applied to prevent loops
  const appliedThemeRef = useRef<string | null>(null);
  const lastDeviceRef = useRef<boolean | null>(null);
  
  // Ensure we only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply device-specific theme ONLY when device or profile preferences change
  useEffect(() => {
    if (!isMounted) return;
    if (!user || !profile) return;

    const deviceTheme = isMobile 
      ? profile?.theme_mobile || 'system'
      : profile?.theme_desktop || 'system';

    // Only apply if:
    // 1. Device type changed (mobile <-> desktop)
    // 2. The theme preference itself changed
    // 3. We haven't applied this exact theme yet
    const deviceChanged = lastDeviceRef.current !== isMobile;
    const themeChanged = appliedThemeRef.current !== deviceTheme;
    
    if (deviceChanged || themeChanged) {
      lastDeviceRef.current = isMobile;
      appliedThemeRef.current = deviceTheme;
      
      // Use requestAnimationFrame to batch with other updates
      requestAnimationFrame(() => {
        setTheme(deviceTheme);
      });
    }
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme, user, profile, isMounted]);

  // Apply custom background color
  useEffect(() => {
    if (!isMounted) return;
    
    const root = document.documentElement;
    
    if (user && profile?.custom_bg_color) {
      root.style.setProperty('--custom-bg-color', profile.custom_bg_color);
      root.classList.add('custom-bg');
    } else {
      root.style.removeProperty('--custom-bg-color');
      root.classList.remove('custom-bg');
    }

    return () => {
      root.style.removeProperty('--custom-bg-color');
      root.classList.remove('custom-bg');
    };
  }, [profile?.custom_bg_color, user, isMounted]);

  return <>{children}</>;
};
