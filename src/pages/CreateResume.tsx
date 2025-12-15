import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileText, Sparkles, Upload, X, Edit, Eye } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import MobileQuickActions from "@/components/MobileQuickActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhotoEditor } from "@/components/PhotoEditor";
import { SignaturePad } from "@/components/SignaturePad";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PdfViewModal from "@/components/PdfViewModal";

const templates = [
  { id: "modern", name: "Moderno" },
  { id: "classic", name: "Clássico" },
  { id: "creative", name: "Criativo" },
  { id: "minimal", name: "Minimalista" },
  { id: "executive", name: "Executivo" },
  { id: "tech", name: "Tech" },
];

export default function CreateResume() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [template, setTemplate] = useState("modern");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempPhotoFile, setTempPhotoFile] = useState<File | null>(null);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [generatedResume, setGeneratedResume] = useState<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    photo_url?: string;
  } | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "",
    summary: "",
    experience: "",
    education: "",
    skills: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A foto deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Abrir editor com a imagem
    setTempPhotoFile(file);
    setIsEditorOpen(true);
  };

  const handlePhotoEdited = async (editedBlob: Blob) => {
    if (!user) return;
    
    setIsUploadingPhoto(true);

    try {
      // Converter blob para file
      const editedFile = new File([editedBlob], "edited-photo.jpg", { type: "image/jpeg" });
      
      // Upload para o storage
      const fileExt = "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resume-photos')
        .upload(fileName, editedFile);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('resume-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
      setPhotoFile(editedFile);
      
      toast({
        title: "Foto editada e salva!",
        description: "Suas alterações foram aplicadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar foto editada:", error);
      toast({
        title: "Erro ao salvar foto",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoFile(null);
  };

  const handleEditPhoto = () => {
    if (photoFile) {
      setTempPhotoFile(photoFile);
      setIsEditorOpen(true);
    }
  };

  const handleGenerate = async () => {
    if (!template) {
      toast({
        title: "Selecione um template",
        description: "Por favor, escolha um template antes de gerar o currículo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fullName || !formData.profession) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome completo e profissão são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Gerar currículo com Lovable AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-resume', {
        body: { 
          formData: {
            ...formData,
            photoUrl: photoUrl || undefined,
            signatureUrl: signatureUrl || undefined
          },
          template 
        }
      });

      if (aiError) {
        console.error('AI generation error:', aiError);
        throw aiError;
      }

      const resumeContent = aiData?.content || 'Erro ao gerar conteúdo';
      const selectedTemplate = templates.find(t => t.id === template);

      // Converter texto UTF-8 para Base64 corretamente
      const base64Content = btoa(unescape(encodeURIComponent(resumeContent)));

      // Salvar no banco de dados com a URL da foto, template e assinatura
      const { data: insertedDoc, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: user?.id,
          title: `Currículo ${selectedTemplate?.name} - ${formData.fullName}`,
          file_url: `data:text/plain;base64,${base64Content}`,
          file_size: resumeContent.length,
          photo_url: photoUrl || null,
          template: template,
          signature_url: signatureUrl || null,
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Salvar currículo gerado para visualização
      setGeneratedResume({
        id: insertedDoc?.id || '',
        title: `Currículo ${selectedTemplate?.name} - ${formData.fullName}`,
        content: resumeContent,
        created_at: new Date().toISOString(),
        photo_url: photoUrl || undefined,
      });

      // Atualizar contadores do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("pdfs_used_today, pdfs_used")
        .eq("id", user?.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            pdfs_used_today: (profile.pdfs_used_today || 0) + 1,
            pdfs_used: (profile.pdfs_used || 0) + 1,
          })
          .eq("id", user?.id);
      }

      toast({
        title: "✨ Currículo profissional criado!",
        description: "Clique em 'Ver Currículo' para visualizar.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar currículo:", error);
      
      // Extrair informação do erro da edge function
      const errorData = error?.context?.body || error;
      const errorCode = errorData?.code;
      const errorMessage = errorData?.message || errorData?.error;
      
      let title = "Erro ao gerar currículo";
      let description = errorMessage || "Tente novamente mais tarde.";
      
      // Tratamento específico de erros
      if (errorCode === 'NO_CREDITS' || error.message?.includes('credits') || error.message?.includes('402')) {
        title = "💳 Créditos Esgotados";
        description = "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage para adicionar mais créditos e continuar gerando conteúdo.";
      } else if (errorCode === 'RATE_LIMIT' || error.message?.includes('Rate limit') || error.message?.includes('429')) {
        title = "⏱️ Muitas Requisições";
        description = "Limite temporário atingido. Aguarde alguns instantes e tente novamente.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader 
            title="Criar Currículo" 
            icon={<FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />} 
          />

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-6 md:grid-cols-2">
            {/* Seleção de Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Escolha seu Template
                </CardTitle>
                <CardDescription>Selecione o estilo visual do seu currículo</CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="template">Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Assinatura Digital */}
            <SignaturePad 
              onSignatureChange={setSignatureUrl}
              currentSignature={signatureUrl}
            />

            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload de Foto */}
                <div>
                  <Label>Foto Profissional (Opcional)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={photoUrl} alt={formData.fullName} />
                      <AvatarFallback className="text-2xl">
                        {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FT'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      {!photoUrl ? (
                        <div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
                            disabled={isUploadingPhoto}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG ou WEBP. Máximo 5MB.
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditPhoto}
                            disabled={isUploadingPhoto}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Foto
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                            disabled={isUploadingPhoto}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      )}
                      {isUploadingPhoto && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processando...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="profession">Profissão *</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange("profession", e.target.value)}
                    placeholder="Ex: Desenvolvedor Full Stack"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="summary">Resumo Profissional</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange("summary", e.target.value)}
                    placeholder="Breve descrição da sua trajetória"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experiência</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    placeholder="Liste suas experiências profissionais"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Formação e Habilidades */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Formação e Habilidades</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="education">Formação Acadêmica</Label>
                  <Textarea
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    placeholder="Cursos, graduações e certificações"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="skills">Habilidades</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange("skills", e.target.value)}
                    placeholder="Suas principais competências"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botão de Gerar */}
            <Card className="md:col-span-2">
              <CardContent className="pt-6 space-y-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Currículo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Currículo com IA
                    </>
                  )}
                </Button>
                
                {generatedResume && (
                  <Button
                    onClick={() => setIsViewModalOpen(true)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Currículo Gerado
                  </Button>
                )}
              </CardContent>
            </Card>
              </div>
            </div>
          </main>

          {/* Mobile Quick Actions */}
          <MobileQuickActions />
        </div>
      </div>

      {/* Photo Editor Modal */}
      <PhotoEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageFile={tempPhotoFile}
        onSave={handlePhotoEdited}
      />

      {/* View Resume Modal */}
      <PdfViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        document={generatedResume}
      />
    </SidebarProvider>
  );
}
