import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Zap, LogOut, Settings } from "lucide-react";

const Dashboard = () => {
  const [pdfsUsed] = useState(2);
  const [pdfsLimit] = useState(5);
  const [automationsUsed] = useState(0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>Essência Duo PDF</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground">
            Pronto para criar seus PDFs profissionais?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>PDFs Este Mês</CardDescription>
              <CardTitle className="text-3xl">
                {pdfsUsed}/{pdfsLimit}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(pdfsUsed / pdfsLimit) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {pdfsLimit - pdfsUsed} PDFs restantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Automações Hoje</CardDescription>
              <CardTitle className="text-3xl">
                {automationsUsed}/1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(automationsUsed / 1) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {1 - automationsUsed} automação restante
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary text-primary-foreground border-0">
            <CardHeader className="pb-3">
              <CardDescription className="text-primary-foreground/80">
                Plano Atual
              </CardDescription>
              <CardTitle className="text-3xl">Grátis</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full bg-white/90 hover:bg-white text-primary"
              >
                Fazer Upgrade
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Criar PDF</CardTitle>
              <CardDescription>
                Faça upload de fotos ou textos e converta em PDF profissional
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Zap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle>Automação com IA</CardTitle>
              <CardDescription>
                Crie catálogos, cardápios ou orçamentos automaticamente
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Recentes</CardTitle>
            <CardDescription>Seus PDFs criados recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento ainda</p>
              <p className="text-sm">Comece criando seu primeiro PDF!</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;