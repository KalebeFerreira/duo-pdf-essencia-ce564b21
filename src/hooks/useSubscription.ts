import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
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

async function fetchSubscription(): Promise<SubscriptionResponse> {
  const { data, error } = await invokeEdgeFunction<{
    subscribed?: boolean;
    plan?: string;
    product_id?: string | null;
    subscription_end?: string | null;
  }>("check-subscription");

  if (error) throw error;

  return {
    subscribed: data?.subscribed ?? false,
    plan: (data?.plan ?? "free") as SubscriptionPlan,
    product_id: data?.product_id ?? null,
    subscription_end: data?.subscription_end ?? null,
  };
}

export const useSubscription = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: () => fetchSubscription(),
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
      if (!user) {
        throw new Error("Você precisa estar logado para assinar um plano");
      }

      const { data, error } = await invokeEdgeFunction<{ url?: string }>("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    },
    [user]
  );

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      throw new Error("Você precisa estar logado para gerenciar sua assinatura");
    }

    const { data, error } = await invokeEdgeFunction<{ url?: string }>("customer-portal");

    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, [user]);

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
