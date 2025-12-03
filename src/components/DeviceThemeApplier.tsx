import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type.
 * Should be rendered inside a component tree that has access to QueryClient.
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (!profile) return;

    const deviceTheme = isMobile 
      ? profile.theme_mobile || 'system'
      : profile.theme_desktop || 'system';

    setTheme(deviceTheme);
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme, profile]);

  return <>{children}</>;
};
