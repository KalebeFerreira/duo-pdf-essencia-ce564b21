import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Zap, LogOut, Settings, Download, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useDocuments } from "@/hooks/useDocuments";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PdfGenerator from "@/components/PdfGenerator";
import PdfViewer from "@/components/PdfViewer";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { documents, isLoading: documentsLoading, deleteDocument } = useDocuments();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; content: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

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

  const handleViewDocument = (doc: any) => {
    setSelectedDoc({
      title: doc.title || 'Documento sem título',
      content: doc.file_url || 'Conteúdo não disponível'
    });
    setViewerOpen(true);
  };

  const handleDownloadDocument = (doc: any) => {
    // Create a blob and download
    const blob = new Blob([doc.file_url || ''], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'documento'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: `O documento "${doc.title}" está sendo baixado.`,
    });
  };

  const handleDeleteClick = (doc: any) => {
    setDocToDelete({ id: doc.id, title: doc.title || 'Documento sem título' });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      toast({
        title: "Documento excluído",
        description: `O documento "${docToDelete.title}" foi excluído com sucesso.`,
      });
      setDeleteDialogOpen(false);
      setDocToDelete(null);
    }
  };

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

  // Get recent PDFs from database with full document data
  const recentPDFs = documents?.slice(0, 4) || [];

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
          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 group">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Upload className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle>Criar PDF</CardTitle>
              <CardDescription>Faça upload de fotos ou textos e converta em PDF profissional</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-all hover:-translate-y-1 group">
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
              <Button variant="outline" size="sm">
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
                {recentPDFs.map((doc) => (
                <Card key={doc.id} className="group hover:shadow-md transition-all hover:border-primary/50">
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
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(doc)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                      {doc.title || 'Documento sem título'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium">PDF</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span className="font-medium">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                          {new Date(doc.created_at || '').toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modals */}
      {selectedDoc && (
        <PdfViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={selectedDoc.title}
          content={selectedDoc.content}
        />
      )}
      
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={docToDelete?.title || ''}
      />
    </div>
  );
};

export default Dashboard;
