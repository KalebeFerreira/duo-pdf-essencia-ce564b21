import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useReferral } from "@/hooks/useReferral";
import { toast } from "@/hooks/use-toast";
import { Copy, Users, DollarSign, Clock, CheckCircle, Gift, Loader2 } from "lucide-react";

export const ReferralCard = () => {
  const { 
    referralLink, 
    referrals, 
    commissions, 
    pixKey, 
    totalPending, 
    totalPaid, 
    totalReferrals,
    isLoading,
    updatePixKey,
    isUpdatingPixKey 
  } = useReferral();
  
  const [newPixKey, setNewPixKey] = useState(pixKey || '');

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copiado!",
        description: "Compartilhe com seus amigos e ganhe 10% de comissão.",
      });
    }
  };

  const handleSavePixKey = () => {
    if (!newPixKey.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma chave PIX válida.",
        variant: "destructive",
      });
      return;
    }
    updatePixKey(newPixKey, {
      onSuccess: () => {
        toast({
          title: "Chave PIX salva!",
          description: "Suas comissões serão enviadas para esta chave.",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Não foi possível salvar a chave PIX.",
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Programa de Indicação
        </CardTitle>
        <CardDescription>
          Indique amigos e ganhe 10% de comissão em todos os pagamentos por 12 meses!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Indicações</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">R$ {totalPaid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Recebido</p>
          </div>
        </div>

        <Separator />

        {/* Link de indicação */}
        <div className="space-y-2">
          <Label>Seu link de indicação</Label>
          <div className="flex gap-2">
            <Input 
              value={referralLink || 'Carregando...'} 
              readOnly 
              className="bg-muted/50"
            />
            <Button onClick={copyLink} variant="outline" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Quando alguém se cadastrar usando seu link e assinar um plano, você ganha 10% do valor!
          </p>
        </div>

        <Separator />

        {/* Chave PIX */}
        <div className="space-y-2">
          <Label>Chave PIX para receber comissões</Label>
          <div className="flex gap-2">
            <Input 
              value={newPixKey} 
              onChange={(e) => setNewPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <Button 
              onClick={handleSavePixKey} 
              disabled={isUpdatingPixKey}
              variant="outline"
            >
              {isUpdatingPixKey ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Lista de comissões recentes */}
        {commissions && commissions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Comissões recentes</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commissions.slice(0, 5).map((commission) => (
                  <div 
                    key={commission.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">
                          R$ {commission.commission_amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={commission.status === 'paid' ? 'default' : 'secondary'}
                      className={commission.status === 'paid' ? 'bg-green-500' : ''}
                    >
                      {commission.status === 'pending' ? 'Pendente' : 
                       commission.status === 'paid' ? 'Pago' : 'Expirado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info */}
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-primary font-medium">💡 Como funciona?</p>
          <ul className="text-xs text-muted-foreground mt-2 space-y-1">
            <li>• Compartilhe seu link com amigos</li>
            <li>• Quando eles assinarem, você ganha 10% do valor</li>
            <li>• Comissão válida por 12 meses após a indicação</li>
            <li>• Pagamentos feitos via PIX manualmente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
