import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Crown, Sparkles, Zap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";

const PRICE_IDS = {
  basic_monthly: 'price_1SZsmBF2249riykhMgcfH0a2',
  basic_yearly: 'price_1SZspYF2249riykhVdqLChv6',
  professional_monthly: 'price_1SZsmUF2249riykhwm1siLIS',
  professional_yearly: 'price_1SZspmF2249riykh9kMoOJfW',
};

interface PricingCardProps {
  plan: "free" | "basic" | "complete";
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PricingCard = ({ plan, title, price, description, features, highlighted }: PricingCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const icons = {
    free: Zap,
    basic: Sparkles,
    complete: Crown
  };

  const Icon = icons[plan];

  const getPriceId = () => {
    if (plan === 'basic') {
      return billingPeriod === 'monthly' ? PRICE_IDS.basic_monthly : PRICE_IDS.basic_yearly;
    }
    if (plan === 'complete') {
      return billingPeriod === 'monthly' ? PRICE_IDS.professional_monthly : PRICE_IDS.professional_yearly;
    }
    return null;
  };

  const getDisplayPrice = () => {
    if (plan === 'free') return 'Grátis';
    if (plan === 'basic') {
      return billingPeriod === 'monthly' ? 'R$ 34,00' : 'R$ 346,80';
    }
    if (plan === 'complete') {
      return billingPeriod === 'monthly' ? 'R$ 59,99' : 'R$ 611,90';
    }
    return price;
  };

  const handleClick = async () => {
    if (plan === 'free') {
      if (!user) {
        navigate('/auth');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para assinar um plano.",
      });
      navigate('/auth');
      return;
    }

    const priceId = getPriceId();
    if (!priceId) return;

    setIsLoading(true);
    try {
      await createCheckout(priceId);
      toast({
        title: "Redirecionando...",
        description: "Você será redirecionado para o checkout do Stripe.",
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:-translate-y-2 ${
        highlighted 
          ? "border-2 border-secondary shadow-glow scale-105" 
          : "border-border hover:shadow-lg"
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-secondary" />
      )}
      
      {highlighted && (
        <div className="absolute -top-3 -right-3 bg-gradient-secondary text-secondary-foreground px-4 py-1 rounded-full text-xs font-bold rotate-12 shadow-md">
          Mais Popular
        </div>
      )}

      {plan !== 'free' && (
        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          1 mês grátis!
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${
          plan === "free" ? "from-muted to-muted-foreground/20" :
          plan === "basic" ? "from-primary to-primary-glow" :
          "from-secondary to-secondary-glow"
        } flex items-center justify-center shadow-md`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
        
        {plan !== 'free' && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`text-xs ${billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>Mensal</span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-xs ${billingPeriod === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="text-xs">-15%</Badge>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <div className="text-4xl font-bold text-foreground">{getDisplayPrice()}</div>
          {plan !== 'free' && (
            <div className="text-sm text-muted-foreground mt-1">
              {billingPeriod === 'monthly' ? 'por mês' : 'por ano'}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
              highlighted ? "bg-secondary" : "bg-muted"
            }`}>
              <Check className={`w-3 h-3 ${highlighted ? "text-secondary-foreground" : "text-foreground"}`} />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full ${
            highlighted 
              ? "bg-gradient-secondary shadow-glow hover:shadow-xl" 
              : "bg-muted hover:bg-muted/80 text-foreground"
          } transition-all`}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            plan === "free" ? "Começar Grátis" : "Assinar Agora"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
