import { useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type
 * and custom background color. Only loads profile for authenticated users.
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Only fetch profile if user is authenticated
  const { profile } = useUserProfile();
  const shouldApplyProfile = !!user && !!profile;

  // Apply device-specific theme
  useEffect(() => {
    if (!shouldApplyProfile) return;

    const deviceTheme = isMobile 
      ? profile?.theme_mobile || 'system'
      : profile?.theme_desktop || 'system';

    setTheme(deviceTheme);
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme, shouldApplyProfile]);

  // Apply custom background color
  useEffect(() => {
    const root = document.documentElement;
    
    if (shouldApplyProfile && profile?.custom_bg_color) {
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
  }, [profile?.custom_bg_color, shouldApplyProfile]);

  return <>{children}</>;
};
