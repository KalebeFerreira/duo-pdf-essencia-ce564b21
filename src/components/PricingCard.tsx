import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingCardProps {
  plan: "free" | "basic" | "complete";
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PricingCard = ({ plan, title, price, description, features, highlighted }: PricingCardProps) => {
  const icons = {
    free: Zap,
    basic: Sparkles,
    complete: Crown
  };

  const Icon = icons[plan];

  return (
    <Card 
      className={`relative overflow-hidden transition-all hover:-translate-y-2 ${
        highlighted 
          ? "border-2 border-primary shadow-glow scale-105" 
          : "border-border hover:shadow-lg"
      }`}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
      )}
      
      {highlighted && (
        <div className="absolute -top-3 -right-3 bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold rotate-12 shadow-md">
          Mais Popular
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
        
        <div className="mt-6">
          <div className="text-4xl font-bold text-foreground">{price}</div>
          {price !== "Grátis" && <div className="text-sm text-muted-foreground mt-1">por mês</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
              highlighted ? "bg-primary" : "bg-muted"
            }`}>
              <Check className={`w-3 h-3 ${highlighted ? "text-primary-foreground" : "text-foreground"}`} />
            </div>
            <span className="text-sm text-muted-foreground">{feature}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <Button 
          asChild 
          className={`w-full ${
            highlighted 
              ? "bg-gradient-primary shadow-glow hover:shadow-xl" 
              : "bg-muted hover:bg-muted/80 text-foreground"
          } transition-all`}
          size="lg"
        >
          <Link to="/auth">
            {plan === "free" ? "Começar Grátis" : "Assinar Agora"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;