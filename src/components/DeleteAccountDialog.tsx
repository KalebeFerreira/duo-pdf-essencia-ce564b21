import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
  userEmail: string;
  onSignOut: () => void;
}

type Step = 'choice' | 'confirm-email' | 'final-confirm';

export const DeleteAccountDialog = ({ userEmail, onSignOut }: DeleteAccountDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('choice');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const resetDialog = () => {
    setStep('choice');
    setEmailConfirmation('');
    setIsDeleting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  };

  const handleLogoutChoice = () => {
    setOpen(false);
    resetDialog();
    onSignOut();
  };

  const handleDeleteChoice = () => {
    setStep('confirm-email');
  };

  const handleEmailConfirm = () => {
    if (emailConfirmation.toLowerCase() !== userEmail.toLowerCase()) {
      toast({
        title: "Email incorreto",
        description: "O email digitado não corresponde ao da sua conta.",
        variant: "destructive",
      });
      return;
    }
    setStep('final-confirm');
  };

  const handleFinalDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Delete user data from all tables
      const userId = user.id;

      // Delete from profiles
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Delete from documents
      await supabase.from('documents').delete().eq('user_id', userId);
      
      // Delete from ebooks
      await supabase.from('ebooks').delete().eq('user_id', userId);
      
      // Delete from catalogs
      await supabase.from('catalogs').delete().eq('user_id', userId);

      // Delete referral codes
      await supabase.from('referral_codes').delete().eq('user_id', userId);

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Conta deletada",
        description: "Sua conta e todos os dados foram removidos permanentemente.",
        variant: "destructive",
      });

      setOpen(false);
      resetDialog();
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro ao deletar conta",
        description: error.message || "Ocorreu um erro ao tentar deletar sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">Deletar Conta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === 'choice' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                O que você deseja fazer?
              </DialogTitle>
              <DialogDescription>
                Escolha uma das opções abaixo:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={handleLogoutChoice}
              >
                <LogOut className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Sair da Conta</div>
                  <div className="text-sm text-muted-foreground">
                    Fazer logout e manter seus dados
                  </div>
                </div>
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 h-auto py-4"
                onClick={handleDeleteChoice}
              >
                <Trash2 className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Deletar Permanentemente</div>
                  <div className="text-sm opacity-90">
                    Excluir conta e todos os dados
                  </div>
                </div>
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm-email' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirme sua identidade
              </DialogTitle>
              <DialogDescription>
                Para continuar com a exclusão, digite seu email para confirmar:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Esta ação é irreversível! Todos os seus PDFs, ebooks, catálogos e dados serão permanentemente excluídos.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-confirm">Digite seu email: <span className="font-mono text-muted-foreground">{userEmail}</span></Label>
                <Input
                  id="email-confirm"
                  type="email"
                  value={emailConfirmation}
                  onChange={(e) => setEmailConfirmation(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep('choice')}>
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleEmailConfirm}
                disabled={!emailConfirmation}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'final-confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Última confirmação
              </DialogTitle>
              <DialogDescription>
                Você tem CERTEZA ABSOLUTA que deseja excluir sua conta?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 space-y-2">
                <p className="font-semibold text-destructive">
                  Esta é sua última chance de cancelar!
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Todos os seus PDFs serão excluídos</li>
                  <li>• Todos os seus ebooks serão excluídos</li>
                  <li>• Todos os seus catálogos serão excluídos</li>
                  <li>• Seus currículos e designs serão perdidos</li>
                  <li>• Sua assinatura será cancelada</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('confirm-email')}>
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleFinalDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deletando...' : 'Sim, deletar minha conta'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
