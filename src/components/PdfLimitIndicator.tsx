import { usePdfLimit } from "@/hooks/usePdfLimit";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PdfLimitIndicator = () => {
  const { getLimitInfo } = usePdfLimit();
  const { used, limit, remaining, percentage, isUnlimited } = getLimitInfo();

  if (isUnlimited) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">PDFs Ilimitados</h4>
              <p className="text-sm text-muted-foreground">
                Crie quantos PDFs precisar, sem limites!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  return (
    <Card className={`${
      isAtLimit ? 'border-destructive/50 bg-destructive/5' :
      isNearLimit ? 'border-secondary/50 bg-secondary/5' :
      'border-border'
    }`}>
      <CardContent className="py-4 px-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAtLimit ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : isNearLimit ? (
                <AlertCircle className="w-5 h-5 text-secondary" />
              ) : (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
              <h4 className="font-semibold text-foreground">Uso de PDFs Hoje</h4>
            </div>
            <span className="text-sm font-medium text-foreground">
              {used} / {limit}
            </span>
          </div>

          <Progress 
            value={percentage} 
            className={`h-2 ${
              isAtLimit ? '[&>div]:bg-destructive' :
              isNearLimit ? '[&>div]:bg-secondary' :
              '[&>div]:bg-primary'
            }`}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isAtLimit ? (
                'Limite diário atingido'
              ) : (
                `${remaining} PDF${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'}`
              )}
            </p>
            {(isNearLimit || isAtLimit) && (
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">
                  Fazer Upgrade
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfLimitIndicator;
