import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Component that automatically applies the correct theme based on device type
 * and custom background color. Only loads profile for authenticated users.
 * 
 * Aguarda montagem completa antes de executar qualquer lógica de tema
 * para evitar erros de hidratação (removeChild/insertBefore).
 */
export const DeviceThemeApplier = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Marca como montado apenas no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Renderiza children imediatamente, sem bloquear
  // A lógica de tema só roda após montagem
  return (
    <>
      {children}
      {isMounted && <ThemeLogic />}
    </>
  );
};

/**
 * Componente separado que executa a lógica de tema apenas após montagem.
 * Isso evita qualquer manipulação do DOM durante a hidratação.
 */
const ThemeLogic = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  // Track applied config to prevent loops
  const appliedConfigRef = useRef<string>('');

  // Apply device-specific theme
  useEffect(() => {
    if (!user || !profile) return;

    const deviceTheme = isMobile 
      ? (profile.theme_mobile || 'system')
      : (profile.theme_desktop || 'system');

    const configKey = `${isMobile ? 'mobile' : 'desktop'}-${deviceTheme}`;
    
    // Só aplica se a config mudou E se o tema resolvido é diferente
    if (configKey !== appliedConfigRef.current) {
      // Verifica se realmente precisa mudar
      const needsChange = deviceTheme === 'system' 
        ? true // system sempre precisa ser aplicado para next-themes resolver
        : deviceTheme !== resolvedTheme;
      
      if (needsChange) {
        appliedConfigRef.current = configKey;
        setTheme(deviceTheme);
      } else {
        // Apenas atualiza o ref para não tentar novamente
        appliedConfigRef.current = configKey;
      }
    }
  }, [isMobile, profile?.theme_mobile, profile?.theme_desktop, setTheme, user, profile, resolvedTheme]);

  // Apply custom background color
  useEffect(() => {
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
  }, [profile?.custom_bg_color, user]);

  return null;
};
