import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionPlan = 'free' | 'basic' | 'professional';

interface SubscriptionStatus {
  subscribed: boolean;
  plan: SubscriptionPlan;
  product_id: string | null;
  subscription_end: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    plan: 'free',
    product_id: null,
    subscription_end: null,
    isLoading: true,
    error: null,
  });

  const checkSubscription = async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        plan: 'free',
        product_id: null,
        subscription_end: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Force refresh session to ensure we have a valid JWT before calling edge function
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        // Session expired or invalid, reset to free plan without error
        setStatus({
          subscribed: false,
          plan: 'free',
          product_id: null,
          subscription_end: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        // Handle 401 errors gracefully - session may have expired
        if (error.message?.includes('401') || error.message?.includes('JWT')) {
          // Try to refresh the session
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            // Session truly expired, reset to defaults
            setStatus({
              subscribed: false,
              plan: 'free',
              product_id: null,
              subscription_end: null,
              isLoading: false,
              error: null,
            });
            return;
          }
          // Retry after refresh
          const { data: retryData, error: retryError } = await supabase.functions.invoke('check-subscription');
          if (retryError) throw retryError;
          
          setStatus({
            subscribed: retryData.subscribed,
            plan: retryData.plan,
            product_id: retryData.product_id,
            subscription_end: retryData.subscription_end,
            isLoading: false,
            error: null,
          });
          return;
        }
        throw error;
      }

      setStatus({
        subscribed: data.subscribed,
        plan: data.plan,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      }));
    }
  };

  const createCheckout = async (priceId: string) => {
    if (!user) {
      throw new Error('Você precisa estar logado para assinar um plano');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();

    // Check subscription every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    ...status,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
