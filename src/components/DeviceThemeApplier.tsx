import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type
 * and custom background color. Only loads profile for authenticated users.
 * Optimized to avoid excessive re-renders on mobile.
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure we only run client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply device-specific theme only when different from current
  useEffect(() => {
    if (!isMounted) return;
    if (!user || !profile) return;

    const deviceTheme = isMobile 
      ? profile?.theme_mobile || 'system'
      : profile?.theme_desktop || 'system';

    // Only apply if theme is actually different from resolved theme
    if (deviceTheme !== resolvedTheme) {
      setTheme(deviceTheme);
    }
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme, resolvedTheme, user, profile, isMounted]);

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
