import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Zap, LogOut, Settings, Download, Eye, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import PdfGenerator from "@/components/PdfGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const handlePdfGenerated = () => {
    // Refresh profile data after PDF generation
    window.location.reload();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
  };

  // FUNÇÕES ADICIONADAS PARA RESTAURAR A INTERATIVIDADE
  const handleQuickAction = (action: string) => {
    toast({
      title: `Ação "${action}" Clicada!`,
      description: "A funcionalidade de navegação/ação será implementada na próxima fase (Mock).",
    });
  };

  const handlePdfAction = (action: string, pdfName: string) => {
    toast({
      title: `${action} PDF: ${pdfName}`,
      description: `Ação de ${action} em ${pdfName} executada com sucesso (Mock).`,
      duration: 3000,
    });
  };
  // FIM DAS FUNÇÕES MOCK

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="bg-background border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const pdfsUsed = profile.pdfs_used || 0;
  const pdfsLimit = profile.pdfs_limit || 5;
  const automationsUsed = profile.automations_used || 0;

  // Mock data for PDF library
  const recentPDFs = [
    {
      id: 1,
      name: "Catálogo de Produtos 2024",
      type: "Catálogo",
      date: "15 Nov 2024",
      size: "2.4 MB",
      pages: 12,
    },
    {
      id: 2,
      name: "Orçamento - Cliente ABC",
      type: "Orçamento",
      date: "14 Nov 2024",
      size: "856 KB",
      pages: 3,
    },
    {
      id: 3,
      name: "Cardápio Restaurante",
      type: "Cardápio",
      date: "10 Nov 2024",
      size: "1.8 MB",
      pages: 8,
    },
    {
      id: 4,
      name: "Portfólio Profissional",
      type: "Portfólio",
      date: "05 Nov 2024",
      size: "5.2 MB",
      pages: 24,
    },
  ];

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
              {/* ADICIONADO onClick */}
              <Button variant="ghost" size="icon" onClick={() => handleQuickAction("Configurações")}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
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
            Bem-vindo, {profile.nome_completo || "Usuário"}! 👋
          </h1>
          <p className="text-muted-foreground">Pronto para criar seus PDFs profissionais?</p>
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
                {pdfsLimit - pdfsUsed} PDFs restantes • Plano: {profile.plan || "free"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Automações Hoje</CardDescription>
              <CardTitle className="text-3xl">{automationsUsed}/1</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(automationsUsed / 1) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{1 - automationsUsed} automação restante</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary text-primary-foreground border-0">
            <CardHeader className="pb-3">
              <CardDescription className="text-primary-foreground/80">Plano Atual</CardDescription>
              <CardTitle className="text-3xl">Grátis</CardTitle>
            </CardHeader>
            <CardContent>
              {/* ADICIONADO asChild E LINK para navegação */}
              <Button asChild variant="secondary" className="w-full bg-white/90 hover:bg-white text-primary">
                <Link to="/#pricing">Fazer Upgrade</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* ADICIONADO onClick */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => handleQuickAction("Criar PDF")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Criar PDF</CardTitle>
              <CardDescription>Faça upload de fotos ou textos e converta em PDF profissional</CardDescription>
            </CardHeader>
          </Card>

          {/* ADICIONADO onClick */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => handleQuickAction("Automação com IA")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Zap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle>Automação com IA</CardTitle>
              <CardDescription>Crie catálogos, cardápios ou orçamentos automaticamente</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* AI PDF Generator */}
        <div className="mb-8">
          <PdfGenerator onPdfGenerated={handlePdfGenerated} />
        </div>

        {/* PDF Library */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Biblioteca de PDFs</CardTitle>
                <CardDescription>Seus documentos criados recentemente</CardDescription>
              </div>
              {/* ADICIONADO onClick */}
              <Button variant="outline" size="sm" onClick={() => handleQuickAction("Ver Todos PDF")}>
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentPDFs.map((pdf) => (
                <Card key={pdf.id} className="group hover:shadow-md transition-all hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {/* ADICIONADO onClick */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePdfAction("Mais Ações", pdf.name)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{pdf.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium">{pdf.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Páginas:</span>
                        <span className="font-medium">{pdf.pages}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span className="font-medium">{pdf.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">{pdf.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {/* ADICIONADO onClick */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handlePdfAction("Ver", pdf.name)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      {/* ADICIONADO onClick */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handlePdfAction("Baixar", pdf.name)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
