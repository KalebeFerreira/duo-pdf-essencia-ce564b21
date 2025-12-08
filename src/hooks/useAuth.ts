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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        // Handle token expiration
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Fatal error getting session:', error);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    // Safety timeout: if still loading after 5 seconds, stop loading
    const timeout = setTimeout(() => {
      console.log('Auth loading timeout - forcing load complete');
      setLoading(false);
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signUp = async (email: string, password: string, nomeCompleto: string, captchaToken?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      // Build options conditionally
      const signUpOptions: any = {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: nomeCompleto
        },
      };
      
      // Only include captchaToken if provided
      if (captchaToken) {
        signUpOptions.captchaToken = captchaToken;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions
      });

      if (error) {
        // Check if error is CAPTCHA related - try without CAPTCHA
        if (error.message?.includes('captcha') && captchaToken) {
          console.log('CAPTCHA error, trying without CAPTCHA token');
          const { data: retryData, error: retryError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                nome_completo: nomeCompleto
              },
            }
          });
          
          if (retryError) throw retryError;
          
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar o cadastro.",
          });
          
          return { data: retryData, error: null };
        }
        throw error;
      }

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

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) {
        // Check if error is CAPTCHA related - try without CAPTCHA
        if (error.message?.includes('captcha') && captchaToken) {
          console.log('CAPTCHA error, trying without CAPTCHA token');
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) throw retryError;
          
          toast({
            title: "Login realizado!",
            description: "Redirecionando para o dashboard...",
          });
          
          navigate('/dashboard');
          return { data: retryData, error: null };
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
        description: error.message,
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
