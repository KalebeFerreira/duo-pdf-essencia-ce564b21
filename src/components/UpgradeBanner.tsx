import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Sparkles, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";

const UpgradeBanner = () => {
  const { profile } = useUserProfile();

  // Only show for free users
  if (profile?.plan !== "free") {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 mb-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-primary opacity-10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Desbloqueie Todo o Potencial 🚀
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Faça upgrade e tenha acesso ilimitado a PDFs, automações avançadas com IA e muito mais!
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1 text-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>PDFs ilimitados</span>
            </div>
            <div className="flex items-center gap-1 text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>IA avançada</span>
            </div>
            <div className="flex items-center gap-1 text-foreground">
              <Crown className="w-4 h-4 text-primary" />
              <span>Sem anúncios</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            asChild
            className="bg-gradient-primary shadow-glow hover:shadow-xl transition-all"
          >
            <Link to="/pricing" className="flex items-center gap-2">
              Ver Planos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UpgradeBanner;
