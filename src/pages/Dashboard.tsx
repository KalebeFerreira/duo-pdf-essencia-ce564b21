import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Upload, FileText, Zap, LogOut, Settings, Download, Eye, MoreVertical, Edit, Trash2, User, BookOpen, Palette } from "lucide-react";
import MobileQuickActions from "@/components/MobileQuickActions";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import PdfGenerator from "@/components/PdfGenerator";
import PdfViewModal from "@/components/PdfViewModal";
import PdfEditDialog from "@/components/PdfEditDialog";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import PdfLimitIndicator from "@/components/PdfLimitIndicator";
import UpgradeBanner from "@/components/UpgradeBanner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { documents, isLoading: documentsLoading, deleteDocument, updateDocument } = useDocuments();
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handlePdfGenerated = () => {
    // Refresh profile data after PDF generation
    window.location.reload();
  };

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('No user detected, redirecting to auth');
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
  };

  const handleQuickAction = (action: string) => {
    toast({
      title: `Ação "${action}" Clicada!`,
      description: "A funcionalidade de navegação/ação será implementada na próxima fase (Mock).",
    });
  };

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setViewModalOpen(true);
  };

  const handleEditDocument = (doc: any) => {
    setSelectedDocument(doc);
    setEditDialogOpen(true);
  };

  const handleDeleteDocument = (doc: any) => {
    setSelectedDocument(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedDocument) {
      await deleteDocument(selectedDocument.id);
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    }
  };

  const handleSaveEdit = async (id: string, title: string, content: string) => {
    await updateDocument({ id, title, content });
  };

  if (authLoading || profileLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="bg-background border-b border-border h-14 sm:h-16 flex items-center px-3 sm:px-4 gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-32 sm:w-48" />
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              <Skeleton className="h-10 w-48 sm:w-64 mb-8" />
              <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
                <Skeleton className="h-32 sm:h-40" />
                <Skeleton className="h-32 sm:h-40" />
                <Skeleton className="h-32 sm:h-40" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const pdfsUsed = profile.pdfs_used || 0;
  const pdfsLimit = profile.pdfs_limit || 5;
  const automationsUsed = profile.automations_used || 0;

  // Get recent PDFs from database
  const recentPDFs = documents?.slice(0, 4).map(doc => ({
    ...doc,
    name: doc.title || 'Documento sem título',
    type: 'PDF',
    date: new Date(doc.created_at || '').toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    size: doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '-',
    pages: '-',
    content: doc.file_url || '',
    photo_url: doc.photo_url || undefined,
    signature_url: (doc as any).signature_url || undefined,
    template: (doc as any).template || 'modern',
  })) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader title="Dashboard" onLogout={handleLogout} />

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Upgrade Banner for Free Users */}
        <UpgradeBanner />
        
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

        {/* PDF Limit Indicator */}
        <div className="mb-8">
          <PdfLimitIndicator />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/create-pdf")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Criar PDF</CardTitle>
              <CardDescription>Faça upload de fotos ou textos e converta em PDF profissional</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/create-resume")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle>Criar Currículo</CardTitle>
              <CardDescription>Gere currículos profissionais com templates e IA</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/create-ebook")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Criar Ebook</CardTitle>
              <CardDescription>Crie ebooks completos com imagens IA para cada capítulo</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/create-design")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Editor de Artes</CardTitle>
              <CardDescription>Crie flyers, cartões e panfletos com IA e templates</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
            onClick={() => navigate("/automations")}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-secondary-foreground" />
              </div>
              <CardTitle>Automação com IA</CardTitle>
              <CardDescription>Use a IA Gemini para qualquer tarefa que precisar</CardDescription>
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
            {documentsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : recentPDFs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum documento gerado ainda</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use o gerador de PDFs acima para criar seu primeiro documento
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentPDFs.map((pdf) => (
                <Card key={pdf.id} className="group hover:shadow-md transition-all hover:border-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(pdf)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Documento
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <div>
                              <Download className="w-4 h-4 mr-2" />
                              <PdfDownloadButton
                                content={pdf.content}
                                title={pdf.name}
                                photoUrl={pdf.photo_url}
                                signatureUrl={pdf.signature_url}
                                template={pdf.template}
                                variant="ghost"
                                size="sm"
                                className="p-0 h-auto hover:bg-transparent"
                              />
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDocument(pdf)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDocument(pdf)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handleViewDocument(pdf)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <PdfDownloadButton
                        content={pdf.content}
                        title={pdf.name}
                        photoUrl={pdf.photo_url}
                        signatureUrl={pdf.signature_url}
                        template={pdf.template}
                        size="sm"
                        className="flex-1 h-8"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals and Dialogs */}
        <PdfViewModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          document={selectedDocument}
        />

        <PdfEditDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleSaveEdit}
          document={selectedDocument}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o documento "{selectedDocument?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      
      {/* Mobile Quick Actions FAB */}
      <MobileQuickActions />
    </div>
  </div>
</SidebarProvider>
  );
};

export default Dashboard;
