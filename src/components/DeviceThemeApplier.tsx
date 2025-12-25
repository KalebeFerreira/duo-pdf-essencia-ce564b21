import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type
 * and custom background color. Only loads profile for authenticated users.
 * 
 * Uses refs to track applied theme and prevent infinite loops.
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isMounted, setIsMounted] = useState(false);
  
  // Track applied theme and device to prevent unnecessary updates
  const appliedConfigRef = useRef<string>('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Apply device-specific theme
  useEffect(() => {
    if (!isMounted || !user || !profile) return;

    const deviceTheme = isMobile 
      ? (profile.theme_mobile || 'system')
      : (profile.theme_desktop || 'system');

    // Create a unique key for current config
    const configKey = `${isMobile ? 'mobile' : 'desktop'}-${deviceTheme}`;
    
    // Only apply if config actually changed
    if (configKey !== appliedConfigRef.current) {
      appliedConfigRef.current = configKey;
      setTheme(deviceTheme);
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
