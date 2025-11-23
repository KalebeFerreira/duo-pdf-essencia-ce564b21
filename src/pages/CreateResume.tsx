import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, FileText, Sparkles, Upload, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const templates = [
  { id: "modern", name: "Moderno", description: "Design limpo e contemporâneo" },
  { id: "classic", name: "Clássico", description: "Formato tradicional e profissional" },
  { id: "creative", name: "Criativo", description: "Visual inovador e chamativo" },
  { id: "minimal", name: "Minimalista", description: "Simples e direto ao ponto" },
];

export default function CreateResume() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [template, setTemplate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploadingPhoto(true);
    setPhotoFile(file);

    try {
      // Upload para o storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resume-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('resume-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
      
      toast({
        title: "Foto carregada!",
        description: "Sua foto foi adicionada ao currículo.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto:", error);
      toast({
        title: "Erro ao carregar foto",
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
            photoUrl: photoUrl || undefined
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

      // Salvar no banco de dados com a URL da foto
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: user?.id,
          title: `Currículo ${selectedTemplate?.name} - ${formData.fullName}`,
          file_url: `data:text/plain;base64,${base64Content}`,
          file_size: resumeContent.length,
          photo_url: photoUrl || null,
        });

      if (insertError) throw insertError;

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
        description: "Seu currículo foi gerado com IA e está disponível no dashboard.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao gerar currículo:", error);
      
      // Tratamento específico de erros
      let errorMessage = "Tente novamente mais tarde.";
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Limite de uso atingido. Aguarde alguns instantes.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "Créditos de IA esgotados. Adicione créditos para continuar.";
      }
      
      toast({
        title: "Erro ao gerar currículo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Criar Currículo</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Seleção de Template */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Escolha seu Template
                </CardTitle>
                <CardDescription>Selecione o estilo que melhor representa você</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {templates.map((t) => (
                    <Card
                      key={t.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        template === t.id ? "border-primary border-2 bg-accent" : ""
                      }`}
                      onClick={() => setTemplate(t.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">{t.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                            onChange={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG ou WEBP. Máximo 5MB.
                          </p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemovePhoto}
                          disabled={isUploadingPhoto}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remover Foto
                        </Button>
                      )}
                      {isUploadingPhoto && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Carregando...
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
              <CardContent className="pt-6">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
