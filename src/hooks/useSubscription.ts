import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionPlan = "free" | "basic" | "professional";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: SubscriptionPlan;
  product_id: string | null;
  subscription_end: string | null;
  isLoading: boolean;
  error: string | null;
}

type SubscriptionResponse = Omit<SubscriptionStatus, "isLoading" | "error">;

const DEFAULT_STATUS: SubscriptionResponse = {
  subscribed: false,
  plan: "free",
  product_id: null,
  subscription_end: null,
};

async function fetchSubscription(accessToken: string | null | undefined): Promise<SubscriptionResponse> {
  if (!accessToken) return DEFAULT_STATUS;

  const { data, error } = await supabase.functions.invoke("check-subscription", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!error) {
    return {
      subscribed: data?.subscribed ?? false,
      plan: (data?.plan ?? "free") as SubscriptionPlan,
      product_id: data?.product_id ?? null,
      subscription_end: data?.subscription_end ?? null,
    };
  }

  // Sessão pode ter expirado: tenta refresh uma vez e repete
  if (error.message?.includes("401") || error.message?.includes("JWT")) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session?.access_token) return DEFAULT_STATUS;

    const { data: retryData, error: retryError } = await supabase.functions.invoke("check-subscription", {
      headers: {
        Authorization: `Bearer ${refreshData.session.access_token}`,
      },
    });

    if (retryError) throw retryError;

    return {
      subscribed: retryData?.subscribed ?? false,
      plan: (retryData?.plan ?? "free") as SubscriptionPlan,
      product_id: retryData?.product_id ?? null,
      subscription_end: retryData?.subscription_end ?? null,
    };
  }

  throw error;
}

export const useSubscription = () => {
  const { user, session } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: () => fetchSubscription(session?.access_token),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const checkSubscription = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const createCheckout = useCallback(
    async (priceId: string) => {
      if (!user || !session?.access_token) {
        throw new Error("Você precisa estar logado para assinar um plano");
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    },
    [user, session?.access_token]
  );

  const openCustomerPortal = useCallback(async () => {
    if (!user || !session?.access_token) {
      throw new Error("Você precisa estar logado para gerenciar sua assinatura");
    }

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, [user, session?.access_token]);

  const computed = useMemo<SubscriptionStatus>(() => {
    if (!user) {
      return {
        ...DEFAULT_STATUS,
        isLoading: false,
        error: null,
      };
    }

    return {
      ...DEFAULT_STATUS,
      ...(query.data ?? {}),
      isLoading: query.isLoading || query.isFetching,
      error: query.error instanceof Error ? query.error.message : null,
    };
  }, [user, query.data, query.error, query.isFetching, query.isLoading]);

  return {
    ...computed,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
