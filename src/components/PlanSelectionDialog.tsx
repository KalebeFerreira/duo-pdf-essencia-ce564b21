import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Zap, Sparkles, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

interface PlanSelectionDialogProps {
  open: boolean;
  onSelectPlan: (plan: "free" | "basic" | "complete") => void;
}

const PRICE_IDS = {
  basic_monthly: 'price_1SZsmBF2249riykhMgcfH0a2',
  basic_yearly: 'price_1SZspYF2249riykhVdqLChv6',
  professional_monthly: 'price_1SZsmUF2249riykhwm1siLIS',
  professional_yearly: 'price_1SZspmF2249riykh9kMoOJfW',
};

const PlanSelectionDialog = ({ open, onSelectPlan }: PlanSelectionDialogProps) => {
  const { createCheckout } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = async (planId: string, priceId?: string) => {
    if (planId === 'free') {
      onSelectPlan('free');
    } else if (priceId) {
      try {
        await createCheckout(priceId);
        toast({
          title: "Redirecionando...",
          description: "Você está sendo redirecionado para o checkout.",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível iniciar o checkout. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const plans = [
    {
      id: "free" as const,
      name: "Grátis",
      icon: Zap,
      monthlyPrice: "R$ 0",
      yearlyPrice: "R$ 0",
      features: ["40 PDFs/mês", "30 automações/mês", "30 artes/mês", "10 currículos/mês", "Ebooks até 10 páginas"],
      color: "from-muted to-muted-foreground/20"
    },
    {
      id: "basic" as const,
      name: "Básico",
      icon: Sparkles,
      monthlyPrice: "R$ 34,00",
      yearlyPrice: "R$ 346,80",
      features: ["200 PDFs/mês", "300 artes/mês", "300 currículos/mês", "Ebooks até 30 páginas", "IA para conteúdo"],
      color: "from-primary to-primary-glow",
      recommended: true
    },
    {
      id: "complete" as const,
      name: "Profissional",
      icon: Crown,
      monthlyPrice: "R$ 59,99",
      yearlyPrice: "R$ 611,90",
      features: ["Recursos ilimitados", "IA avançada", "API", "Suporte 24/7"],
      color: "from-secondary to-secondary-glow"
    }
  ];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl text-center">
            Escolha seu plano 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Você pode mudar de plano a qualquer momento nas configurações
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 mt-4">
          <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>Mensal</span>
          <Switch
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          />
          <span className={`text-sm ${billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
            Anual <Badge variant="secondary" className="ml-1 text-xs">-15%</Badge>
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const priceId = plan.id === 'basic' 
              ? (billingPeriod === 'monthly' ? PRICE_IDS.basic_monthly : PRICE_IDS.basic_yearly)
              : plan.id === 'complete' 
                ? (billingPeriod === 'monthly' ? PRICE_IDS.professional_monthly : PRICE_IDS.professional_yearly)
                : undefined;
            return (
              <Card 
                key={plan.id}
                className={`relative p-6 hover:shadow-lg transition-all ${
                  plan.recommended ? "border-2 border-primary" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                    Recomendado
                  </div>
                )}

                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-center mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-center mb-1">
                  {billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                </div>
                {plan.id !== "free" && (
                  <div className="text-xs text-muted-foreground text-center mb-4">
                    {billingPeriod === 'monthly' ? 'por mês' : 'por ano'}
                  </div>
                )}

                <ul className="space-y-2 mb-6 min-h-[120px]">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id, priceId)}
                  className={`w-full ${
                    plan.recommended 
                      ? "bg-gradient-primary shadow-glow" 
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {plan.id === "free" ? "Começar Grátis" : "Selecionar"}
                </Button>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanSelectionDialog;
