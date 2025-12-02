import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  created_at: string;
  commission_expires_at: string;
}

interface Commission {
  id: string;
  referral_id: string;
  referrer_id: string;
  payment_amount: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'expired';
  payment_date: string | null;
  pix_key: string | null;
  created_at: string;
}

// Gerar código único de 8 caracteres
const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useReferral = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreatingCode, setIsCreatingCode] = useState(false);

  // Buscar código de indicação do usuário
  const { data: referralCode, isLoading: isLoadingCode, refetch: refetchCode } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as ReferralCode | null;
    },
    enabled: !!user?.id,
  });

  // Criar código de indicação se não existir
  useEffect(() => {
    const createCodeIfNeeded = async () => {
      if (!user?.id || isLoadingCode || referralCode || isCreatingCode) return;
      
      setIsCreatingCode(true);
      try {
        const newCode = generateUniqueCode();
        const { error } = await supabase
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code: newCode,
          });
        
        if (!error) {
          await refetchCode();
        } else {
          console.error('Erro ao criar código de indicação:', error);
        }
      } catch (err) {
        console.error('Erro ao criar código de indicação:', err);
      } finally {
        setIsCreatingCode(false);
      }
    };

    createCodeIfNeeded();
  }, [user?.id, isLoadingCode, referralCode, isCreatingCode, refetchCode]);

  // Buscar indicações feitas pelo usuário
  const { data: referrals, isLoading: isLoadingReferrals } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!user?.id,
  });

  // Buscar comissões do usuário
  const { data: commissions, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['commissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!user?.id,
  });

  // Buscar chave PIX do profile
  const { data: pixKey } = useQuery({
    queryKey: ['pix-key', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.pix_key || null;
    },
    enabled: !!user?.id,
  });

  // Atualizar chave PIX
  const updatePixKey = useMutation({
    mutationFn: async (newPixKey: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('profiles')
        .update({ pix_key: newPixKey })
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-key', user?.id] });
    },
  });

  // Calcular totais
  const totalPending = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const totalPaid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const totalReferrals = referrals?.length || 0;

  // Gerar link de indicação
  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode.code}` : null;

  return {
    referralCode,
    referralLink,
    referrals,
    commissions,
    pixKey,
    totalPending,
    totalPaid,
    totalReferrals,
    isLoading: isLoadingCode || isLoadingReferrals || isLoadingCommissions || isCreatingCode,
    updatePixKey: updatePixKey.mutate,
    isUpdatingPixKey: updatePixKey.isPending,
  };
};
