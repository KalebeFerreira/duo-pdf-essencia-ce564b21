import { useEffect, useRef } from 'react';
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
  const shouldApplyProfile = !!user && !!profile;
  
  // Debounce timer ref to prevent rapid theme changes
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastAppliedThemeRef = useRef<string | null>(null);

  // Apply device-specific theme with debounce and change detection
  useEffect(() => {
    if (!shouldApplyProfile) return;

    const deviceTheme = isMobile 
      ? profile?.theme_mobile || 'system'
      : profile?.theme_desktop || 'system';

    // Only apply if theme actually changed
    if (deviceTheme === lastAppliedThemeRef.current) {
      return;
    }

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce theme changes to avoid rapid switching on mobile scroll
    debounceRef.current = setTimeout(() => {
      // Double-check theme still needs to change
      if (deviceTheme !== lastAppliedThemeRef.current) {
        lastAppliedThemeRef.current = deviceTheme;
        setTheme(deviceTheme);
      }
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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
