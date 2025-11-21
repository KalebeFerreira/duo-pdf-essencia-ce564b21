import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PlanSelectionDialog from "@/components/PlanSelectionDialog";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(loginEmail, loginPassword);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirm) {
      alert("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    const result = await signUp(signupEmail, signupPassword, signupName);
    setIsLoading(false);

    if (result.data?.user) {
      setPendingUserId(result.data.user.id);
      setShowPlanDialog(true);
    }
  };

  const handlePlanSelection = async (plan: "free" | "basic" | "complete") => {
    if (!pendingUserId) return;

    try {
      // Update the user's plan
      await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', pendingUserId);

      setShowPlanDialog(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-foreground hover:text-primary transition-smooth mb-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>Essência Duo PDF</span>
          </Link>
          <p className="text-muted-foreground">Crie PDFs profissionais em segundos</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo de volta!</CardTitle>
                <CardDescription>Entre com sua conta para continuar</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary shadow-glow hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <a href="#" className="text-sm text-primary hover:underline">
                  Esqueceu sua senha?
                </a>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta Grátis</CardTitle>
                <CardDescription>Comece a criar PDFs profissionais agora</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="João Silva"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary shadow-glow hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground text-center">
                Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-smooth">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>

      <PlanSelectionDialog 
        open={showPlanDialog}
        onSelectPlan={handlePlanSelection}
      />
    </div>
  );
};

export default Auth;