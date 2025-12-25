import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SessionExpiredProps {
  message?: string;
}

export function SessionExpired({ message = "Sua sessão expirou ou você não está logado." }: SessionExpiredProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Sessão Expirada
          </h1>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        <Button onClick={() => navigate("/auth")} className="gap-2">
          <LogIn className="w-4 h-4" />
          Ir para Login
        </Button>
      </div>
    </div>
  );
}
