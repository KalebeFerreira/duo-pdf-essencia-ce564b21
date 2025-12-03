import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from './use-mobile';
import { useUserProfile } from './useUserProfile';

export const useDeviceTheme = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { profile } = useUserProfile();

  useEffect(() => {
    if (!profile) return;

    const deviceTheme = isMobile 
      ? profile.theme_mobile || 'system'
      : profile.theme_desktop || 'system';

    if (deviceTheme !== 'system') {
      setTheme(deviceTheme);
    } else {
      setTheme('system');
    }
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme]);

  return {
    currentTheme: resolvedTheme,
    isMobile,
    mobileTheme: profile?.theme_mobile || 'system',
    desktopTheme: profile?.theme_desktop || 'system',
  };
};
