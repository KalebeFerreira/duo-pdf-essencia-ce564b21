import { useUserProfile } from './useUserProfile';
import { toast } from '@/hooks/use-toast';

export const useAutomationLimit = () => {
  const { profile } = useUserProfile();

  const checkLimit = (): boolean => {
    if (!profile) return false;

    const usedToday = profile.automations_used_today || 0;
    const dailyLimit = profile.daily_automations_limit || 1;
    const remaining = dailyLimit - usedToday;

    // Check if limit is reached
    if (usedToday >= dailyLimit && dailyLimit !== 999999) {
      toast({
        title: "Limite Diário Atingido",
        description: "Você atingiu o limite de automações para hoje. Faça upgrade do seu plano para continuar.",
        variant: "destructive",
      });
      return false;
    }

    // Warn when close to limit (1 remaining) - only for non-unlimited plans
    if (remaining === 1 && dailyLimit !== 999999) {
      toast({
        title: "Atenção!",
        description: "Você tem apenas 1 automação restante hoje.",
        variant: "default",
      });
    }

    return true;
  };

  const getLimitInfo = () => {
    if (!profile) {
      return {
        used: 0,
        limit: 1,
        remaining: 1,
        percentage: 0,
        isUnlimited: false,
      };
    }

    const used = profile.automations_used_today || 0;
    const limit = profile.daily_automations_limit || 1;
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
