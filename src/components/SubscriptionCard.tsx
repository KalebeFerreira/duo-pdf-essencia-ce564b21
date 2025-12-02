import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2, Crown, Sparkles, Zap, CreditCard, XCircle, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PRICE_IDS = {
  basic_monthly: 'price_1SZsmBF2249riykhMgcfH0a2',
  basic_yearly: 'price_1SZspYF2249riykhVdqLChv6',
  professional_monthly: 'price_1SZsmUF2249riykhwm1siLIS',
  professional_yearly: 'price_1SZspmF2249riykh9kMoOJfW',
};

export const SubscriptionCard = () => {
  const { plan, subscribed, subscription_end, isLoading, createCheckout, openCustomerPortal } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isManaging, setIsManaging] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    try {
      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleManage = async () => {
    setIsManaging(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const planConfig = {
    free: {
      name: "Plano Grátis",
      icon: Zap,
      color: "from-muted to-muted-foreground/20",
      features: ["40 PDFs/mês", "30 automações/mês", "30 artes/mês", "10 currículos/mês", "Ebooks até 10 páginas"],
    },
    basic: {
      name: "Plano Básico",
      icon: Sparkles,
      color: "from-primary to-primary-glow",
      features: ["200 PDFs/mês", "300 artes/mês", "300 currículos/mês", "Ebooks até 30 páginas"],
    },
    professional: {
      name: "Plano Profissional",
      icon: Crown,
      color: "from-secondary to-secondary-glow",
      features: ["Recursos ilimitados", "Suporte prioritário"],
    },
  };

  const currentPlan = planConfig[plan];
  const Icon = currentPlan.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentPlan.color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{currentPlan.name}</h3>
            {subscribed && subscription_end && (
              <p className="text-sm text-muted-foreground">
                Renova em: {new Date(subscription_end).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        {subscribed && <Badge className="bg-green-500 text-white">Ativo</Badge>}
      </div>

      <ul className="space-y-2 mb-6">
        {currentPlan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Seção para usuários do plano gratuito */}
      {plan === 'free' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-2 bg-muted/50 rounded-lg">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>Mensal</span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm ${billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Anual <Badge variant="secondary" className="ml-1 text-xs">-15%</Badge>
            </span>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
              🎉 1 mês grátis em todos os planos pagos!
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={() => handleUpgrade(billingPeriod === 'monthly' ? PRICE_IDS.basic_monthly : PRICE_IDS.basic_yearly)}
              className="w-full bg-gradient-primary"
            >
              Upgrade para Básico - {billingPeriod === 'monthly' ? 'R$ 34/mês' : 'R$ 346,80/ano'}
            </Button>
            <Button
              onClick={() => handleUpgrade(billingPeriod === 'monthly' ? PRICE_IDS.professional_monthly : PRICE_IDS.professional_yearly)}
              variant="outline"
              className="w-full"
            >
              Upgrade para Profissional - {billingPeriod === 'monthly' ? 'R$ 59,99/mês' : 'R$ 611,90/ano'}
            </Button>
          </div>
        </div>
      )}

      {/* Seção para usuários com plano básico */}
      {plan === 'basic' && (
        <div className="space-y-4">
          <Button
            onClick={() => handleUpgrade(PRICE_IDS.professional_monthly)}
            className="w-full bg-gradient-primary"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade para Profissional - R$ 59,99/mês
          </Button>
          
          {subscribed && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Gerenciar Assinatura</h4>
                
                <Button
                  onClick={handleManage}
                  disabled={isManaging}
                  variant="outline"
                  className="w-full"
                >
                  {isManaging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Alterar Forma de Pagamento
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>

                <Button
                  onClick={handleManage}
                  disabled={isManaging}
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  {isManaging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Cancelar Assinatura
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Você será redirecionado para o portal seguro do Stripe.
              </p>
            </>
          )}
        </div>
      )}

      {/* Seção para usuários com plano profissional */}
      {plan === 'professional' && subscribed && (
        <div className="space-y-4">
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">Gerenciar Assinatura</h4>
            
            <Button
              onClick={handleManage}
              disabled={isManaging}
              variant="outline"
              className="w-full"
            >
              {isManaging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Alterar Forma de Pagamento
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>

            <Button
              onClick={handleManage}
              disabled={isManaging}
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {isManaging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancelar Assinatura
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Você será redirecionado para o portal seguro do Stripe.
          </p>
        </div>
      )}
    </div>
  );
};
