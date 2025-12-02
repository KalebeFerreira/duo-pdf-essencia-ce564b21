import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2, Crown, Sparkles, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PRICE_IDS = {
  basic: 'price_1SZsVdF2249riykhHHEgbX9Y',
  professional: 'price_1SZsW3F2249riykhGncbvAuR',
};

export const SubscriptionCard = () => {
  const { plan, subscribed, subscription_end, isLoading, createCheckout, openCustomerPortal } = useSubscription();

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
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
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
    <Card className="p-6">
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
        {subscribed && <Badge>Ativo</Badge>}
      </div>

      <ul className="space-y-2 mb-6">
        {currentPlan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        {plan === 'free' && (
          <>
            <Button
              onClick={() => handleUpgrade(PRICE_IDS.basic)}
              className="w-full bg-gradient-primary"
            >
              Upgrade para Básico - R$ 34/mês
            </Button>
            <Button
              onClick={() => handleUpgrade(PRICE_IDS.professional)}
              variant="outline"
              className="w-full"
            >
              Upgrade para Profissional - R$ 59,99/mês
            </Button>
          </>
        )}

        {plan === 'basic' && (
          <>
            <Button
              onClick={() => handleUpgrade(PRICE_IDS.professional)}
              className="w-full bg-gradient-primary"
            >
              Upgrade para Profissional - R$ 59,99/mês
            </Button>
            {subscribed && (
              <Button
                onClick={handleManage}
                variant="outline"
                className="w-full"
              >
                Gerenciar Assinatura
              </Button>
            )}
          </>
        )}

        {plan === 'professional' && subscribed && (
          <Button
            onClick={handleManage}
            variant="outline"
            className="w-full"
          >
            Gerenciar Assinatura
          </Button>
        )}
      </div>
    </Card>
  );
};
