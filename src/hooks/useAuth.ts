import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let didResolve = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = (nextSession: Session | null) => {
      didResolve = true;
      if (timeoutId) clearTimeout(timeoutId);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      console.log('Auth state changed:', event, nextSession ? 'Session exists' : 'No session');

      // Se não há sessão, mantém estado limpo
      if (event === 'SIGNED_OUT' || !nextSession) {
        finish(null);
        return;
      }

      finish(nextSession);
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: nextSession }, error }) => {
        if (error) {
          console.error('Error getting session:', error);
          finish(null);
          return;
        }
        finish(nextSession);
      })
      .catch((error) => {
        console.error('Fatal error getting session:', error);
        finish(null);
      });

    // Safety timeout (evita travar a UI), mas só se nada resolveu ainda
    timeoutId = setTimeout(() => {
      if (didResolve) return;
      console.warn('Auth init timeout - continuing without session');
      finish(null);
    }, 15000);

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome_completo: nomeCompleto
          },
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar o cadastro.",
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Tratamento específico para email não confirmado
        if (error.message.includes('Email not confirmed') || error.code === 'email_not_confirmed') {
          toast({
            title: "Email não confirmado",
            description: "Verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.",
            variant: "destructive",
          });
          return { data: null, error };
        }
        throw error;
      }

      toast({
        title: "Login realizado!",
        description: "Redirecionando para o dashboard...",
      });

      navigate('/dashboard');
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
