import { useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { toast } from '@/hooks/use-toast';

export const usePdfLimit = () => {
  const { profile } = useUserProfile();

  const checkLimit = (): boolean => {
    if (!profile) return false;

    const usedToday = profile.pdfs_used_today || 0;
    const dailyLimit = profile.daily_pdfs_limit || 10;
    const remaining = dailyLimit - usedToday;

    // Check if limit is reached
    if (usedToday >= dailyLimit) {
      toast({
        title: "Limite Diário Atingido",
        description: "Você atingiu o limite de PDFs para hoje. Faça upgrade do seu plano para continuar.",
        variant: "destructive",
      });
      return false;
    }

    // Warn when close to limit (2 remaining or less)
    if (remaining <= 2 && remaining > 0) {
      toast({
        title: "Atenção!",
        description: `Você tem apenas ${remaining} PDF${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'} hoje.`,
        variant: "default",
      });
    }

    return true;
  };

  const getLimitInfo = () => {
    if (!profile) {
      return {
        used: 0,
        limit: 10,
        remaining: 10,
        percentage: 0,
      };
    }

    const used = profile.pdfs_used_today || 0;
    const limit = profile.daily_pdfs_limit || 10;
    const remaining = Math.max(0, limit - used);
    const percentage = (used / limit) * 100;

    return {
      used,
      limit: limit === 999999 ? Infinity : limit,
      remaining: limit === 999999 ? Infinity : remaining,
      percentage: limit === 999999 ? 0 : percentage,
      isUnlimited: limit === 999999,
    };
  };

  return {
    checkLimit,
    getLimitInfo,
    profile,
  };
};
