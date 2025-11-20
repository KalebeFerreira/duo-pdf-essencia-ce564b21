import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, AlertCircle, Infinity } from "lucide-react";
import { useAutomationLimit } from "@/hooks/useAutomationLimit";

const AutomationLimitIndicator = () => {
  const { getLimitInfo } = useAutomationLimit();
  const { used, limit, remaining, percentage, isUnlimited } = getLimitInfo();

  if (isUnlimited) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Infinity className="w-5 h-5" />
            Automações Ilimitadas
          </CardTitle>
          <CardDescription>
            Você pode criar quantas automações quiser!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  return (
    <Card className={isAtLimit ? "border-destructive" : isNearLimit ? "border-warning" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAtLimit ? (
            <AlertCircle className="w-5 h-5 text-destructive" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          Uso de Automações
        </CardTitle>
        <CardDescription>
          Seu uso diário de automações com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usadas hoje</span>
            <span className="font-medium">
              {used} / {limit}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {isAtLimit ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive font-medium">
              Limite diário atingido
            </p>
            <Button asChild size="sm" className="w-full">
              <Link to="/pricing">
                Fazer Upgrade
              </Link>
            </Button>
          </div>
        ) : isNearLimit ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {remaining} automação restante hoje
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/pricing">
                Ver Planos
              </Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {remaining} automações restantes hoje
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomationLimitIndicator;
