import { supabase } from "@/integrations/supabase/client";

type InvokeOptions<TBody> = {
  body?: TBody;
  headers?: Record<string, string>;
  /** tenta refresh 1x se der 401/JWT */
  retryOnAuthError?: boolean;
  /** faz refresh preventivo quando o token está para expirar (segundos) */
  refreshSkewSeconds?: number;
};

function isAuthError(error: any): boolean {
  const msg = String(error?.message ?? "");
  const ctxStatus = (error as any)?.context?.status;
  const ctxBody = (error as any)?.context?.body;
  const bodyMsg = typeof ctxBody === "string" ? ctxBody : JSON.stringify(ctxBody ?? {});

  return (
    ctxStatus === 401 ||
    msg.includes("401") ||
    msg.toLowerCase().includes("jwt") ||
    bodyMsg.includes("Invalid JWT") ||
    bodyMsg.includes("401")
  );
}

async function getFreshAccessToken(refreshSkewSeconds: number): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;

  // se está perto de expirar, faz refresh antes de chamar a função
  if (session?.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at - now <= refreshSkewSeconds) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session ?? session;
    }
  }

  return session?.access_token ?? null;
}

export async function invokeEdgeFunction<TResponse = any, TBody = any>(
  functionName: string,
  options: InvokeOptions<TBody> = {}
): Promise<{ data: TResponse | null; error: any | null; accessTokenUsed: string | null }>{
  const retryOnAuthError = options.retryOnAuthError ?? true;
  const refreshSkewSeconds = options.refreshSkewSeconds ?? 60;

  const token = await getFreshAccessToken(refreshSkewSeconds);

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const first = await supabase.functions.invoke<TResponse>(functionName, {
    body: options.body as any,
    headers,
  });

  if (!first.error || !retryOnAuthError || !isAuthError(first.error)) {
    return { ...first, accessTokenUsed: token };
  }

  // 2ª tentativa: força refresh e repete
  const { data: refreshed } = await supabase.auth.refreshSession();
  const token2 = refreshed.session?.access_token;

  if (!token2) {
    return { ...first, accessTokenUsed: token };
  }

  const second = await supabase.functions.invoke<TResponse>(functionName, {
    body: options.body as any,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token2}`,
    },
  });

  return { ...second, accessTokenUsed: token2 };
}
