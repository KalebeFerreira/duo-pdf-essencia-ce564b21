import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEbooks, type Ebook } from "@/hooks/useEbooks";
import { Loader2, BookOpen, Sparkles, Download, ArrowLeft, Palette, Globe, History, Save, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";

const colorPalettes = {
  classic: { name: "Clássico", primary: [37, 99, 235], secondary: [243, 244, 246], text: [0, 0, 0] },
  serene: { name: "Sereno", primary: [34, 197, 94], secondary: [254, 252, 232], text: [22, 101, 52] },
  elegant: { name: "Elegante", primary: [147, 51, 234], secondary: [250, 245, 255], text: [88, 28, 135] },
  modern: { name: "Moderno", primary: [100, 116, 139], secondary: [254, 249, 195], text: [30, 41, 59] },
  professional: { name: "Profissional", primary: [30, 58, 138], secondary: [254, 243, 199], text: [30, 41, 59] },
};

const languages = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
}

interface GeneratedEbook {
  title: string;
  description: string;
  chapters: Chapter[];
}

export default function CreateEbook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ebooks, isLoading: loadingEbooks, saveEbook, updateEbook, deleteEbook } = useEbooks();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEbook, setGeneratedEbook] = useState<GeneratedEbook | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("pt");
  const [selectedColorPalette, setSelectedColorPalette] = useState<keyof typeof colorPalettes>("classic");
  const [numPages, setNumPages] = useState<number | "">(10);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  const generateEbook = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt necessário",
        description: "Descreva o ebook que você deseja criar.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      toast({
        title: "Gerando seu ebook...",
        description: "A IA está criando título, capítulos, conteúdo e imagens. Isso pode levar alguns minutos.",
      });

      const { data, error } = await supabase.functions.invoke('generate-complete-ebook', {
        body: { 
          prompt,
          language: selectedLanguage,
          colorPalette: selectedColorPalette,
          numPages: numPages || 10
        }
      });

      // Verificar erro ANTES de lançar exceção
      if (error) {
        console.error('Edge function error:', error);
        
        // Extrair informações do erro
        const errorBody = (error as any)?.context?.body;
        const errorCode = errorBody?.code;
        const errorMessage = errorBody?.message || errorBody?.error;
        
        // Tratar erro de créditos especificamente
        if (errorCode === 'NO_CREDITS' || errorMessage?.includes('créditos') || errorMessage?.includes('credits')) {
          toast({
            title: "💳 Créditos Esgotados",
            description: "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage para adicionar créditos.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        
        // Tratar rate limit
        if (errorCode === 'RATE_LIMIT' || errorMessage?.includes('Rate limit')) {
          toast({
            title: "⏱️ Muitas Requisições",
            description: "Limite temporário atingido. Aguarde alguns instantes e tente novamente.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        
        // Outros erros
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado');
      }

      setGeneratedEbook(data);

      // Salvar automaticamente no banco de dados
      await saveEbook(
        data.title,
        data.description,
        data.chapters,
        selectedLanguage,
        selectedColorPalette
      );

      toast({
        title: "✨ Ebook criado com sucesso!",
        description: `${data.chapters.length} capítulos gerados e salvos no histórico.`,
      });

    } catch (error: any) {
      console.error("Erro ao gerar ebook:", error);
      
      const errorData = error?.context?.body || error;
      const errorCode = errorData?.code;
      const errorMessage = errorData?.message || errorData?.error;
      
      let title = "Erro ao gerar ebook";
      let description = errorMessage || "Tente novamente.";
      
      if (errorCode === 'NO_CREDITS' || error.message?.includes('credits') || error.message?.includes('402')) {
        title = "💳 Créditos Esgotados";
        description = "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage para adicionar créditos.";
      } else if (errorCode === 'RATE_LIMIT' || error.message?.includes('Rate limit') || error.message?.includes('429')) {
        title = "⏱️ Muitas Requisições";
        description = "Limite temporário atingido. Aguarde alguns instantes.";
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

  const downloadPDF = async () => {
    if (!generatedEbook) return;

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      const palette = colorPalettes[selectedColorPalette];

      // Capa
      pdf.setFillColor(palette.primary[0], palette.primary[1], palette.primary[2]);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      
      const titleLines = pdf.splitTextToSize(generatedEbook.title, pageWidth - 2 * margin);
      const titleY = pageHeight / 2 - 20;
      titleLines.forEach((line: string, index: number) => {
        const textWidth = pdf.getTextWidth(line);
        pdf.text(line, (pageWidth - textWidth) / 2, titleY + (index * 12));
      });

      // Descrição na capa
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const descLines = pdf.splitTextToSize(generatedEbook.description, pageWidth - 2 * margin);
      let descY = titleY + (titleLines.length * 12) + 20;
      descLines.forEach((line: string, index: number) => {
        const textWidth = pdf.getTextWidth(line);
        pdf.text(line, (pageWidth - textWidth) / 2, descY + (index * 6));
      });

      // Capítulos
      for (let i = 0; i < generatedEbook.chapters.length; i++) {
        const chapter = generatedEbook.chapters[i];
        pdf.addPage();
        let y = margin;

        // Título do capítulo
        pdf.setTextColor(palette.primary[0], palette.primary[1], palette.primary[2]);
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Capítulo ${i + 1}`, margin, y);
        y += 10;
        
        const chapterTitleLines = pdf.splitTextToSize(chapter.title, pageWidth - 2 * margin);
        chapterTitleLines.forEach((line: string) => {
          pdf.text(line, margin, y);
          y += 8;
        });
        y += 5;

        // Imagem do capítulo
        if (chapter.imageUrl) {
          try {
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 80;
            pdf.addImage(chapter.imageUrl, "PNG", margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
          } catch (e) {
            console.error("Erro ao adicionar imagem:", e);
          }
        }

        // Conteúdo do capítulo
        pdf.setTextColor(palette.text[0], palette.text[1], palette.text[2]);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        
        const contentLines = pdf.splitTextToSize(chapter.content, pageWidth - 2 * margin);
        contentLines.forEach((line: string) => {
          if (y > pageHeight - margin - 10) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 6;
        });
      }

      pdf.save(`${generatedEbook.title}.pdf`);
      
      toast({
        title: "PDF baixado!",
        description: "Seu ebook foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setGeneratedEbook(null);
    setEditingEbook(null);
    setPrompt("");
    setActiveTab("create");
  };

  const loadEbookForEditing = (ebook: Ebook) => {
    setEditingEbook(ebook);
    setGeneratedEbook({
      title: ebook.title,
      description: ebook.description || "",
      chapters: ebook.chapters,
    });
    setSelectedLanguage(ebook.language);
    setSelectedColorPalette(ebook.color_palette as keyof typeof colorPalettes);
    setActiveTab("create");
  };

  const handleSaveEdits = async () => {
    if (!editingEbook || !generatedEbook) return;

    const success = await updateEbook(editingEbook.id, {
      title: generatedEbook.title,
      description: generatedEbook.description,
      chapters: generatedEbook.chapters,
      language: selectedLanguage,
      color_palette: selectedColorPalette,
    });

    if (success) {
      setEditingEbook(null);
      setGeneratedEbook(null);
      setActiveTab("history");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEbook(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Criar Ebook com IA</h1>
                <p className="text-muted-foreground">Descreva sua ideia e a IA cria tudo automaticamente</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "history")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Sparkles className="mr-2 h-4 w-4" />
                Criar Novo
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Meus Ebooks ({ebooks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              {!generatedEbook ? (
                /* Formulário de Geração */
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Descreva seu Ebook
                </CardTitle>
                <CardDescription className="text-base">
                  A IA vai gerar automaticamente: título, descrição, capítulos, conteúdo completo e imagens profissionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Descreva seu Ebook</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Exemplo: Um ebook sobre marketing digital para iniciantes, com dicas práticas de redes sociais, SEO, criação de conteúdo e anúncios pagos. Deve ter foco em estratégias que funcionam em 2024 e exemplos reais de sucesso..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[200px] text-base resize-none"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Seja específico! Quanto mais detalhes, melhor será o resultado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Idioma do Ebook
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isGenerating}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(languages).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numPages" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Número de Páginas (1-100)
                    </Label>
                    <Input
                      id="numPages"
                      type="number"
                      min="1"
                      max="100"
                      value={numPages}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setNumPages("");
                        } else {
                          const num = parseInt(value);
                          if (num >= 1 && num <= 100) {
                            setNumPages(num);
                          }
                        }
                      }}
                      placeholder="Digite de 1 a 100"
                      disabled={isGenerating}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Digite um número entre 1 e 100
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorPalette" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Paleta de Cores
                    </Label>
                    <Select value={selectedColorPalette} onValueChange={(v) => setSelectedColorPalette(v as keyof typeof colorPalettes)} disabled={isGenerating}>
                      <SelectTrigger id="colorPalette">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(colorPalettes).map(([key, palette]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: `rgb(${palette.primary.join(',')})` }}
                              />
                              {palette.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Cores confortáveis para leitura
                    </p>
                  </div>
                </div>

                {/* Preview das Cores */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Prévia das Cores do Ebook
                  </Label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                    {/* Prévia da Capa */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Capa</p>
                      <div 
                        className="aspect-[3/4] rounded-lg shadow-md flex flex-col items-center justify-center p-4 text-center"
                        style={{ 
                          backgroundColor: `rgb(${colorPalettes[selectedColorPalette].primary.join(',')})`,
                          color: 'white'
                        }}
                      >
                        <div className="text-sm font-bold mb-2">Título do Ebook</div>
                        <div className="text-xs opacity-90">Descrição curta do conteúdo</div>
                      </div>
                    </div>

                    {/* Prévia da Página Interna */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Página Interna</p>
                      <div 
                        className="aspect-[3/4] rounded-lg shadow-md p-3 space-y-2"
                        style={{ 
                          backgroundColor: `rgb(${colorPalettes[selectedColorPalette].secondary.join(',')})`,
                        }}
                      >
                        <div 
                          className="text-xs font-bold"
                          style={{ color: `rgb(${colorPalettes[selectedColorPalette].primary.join(',')})` }}
                        >
                          Capítulo 1
                        </div>
                        <div className="space-y-1">
                          <div 
                            className="h-1 rounded"
                            style={{ 
                              backgroundColor: `rgb(${colorPalettes[selectedColorPalette].text.join(',')})`,
                              opacity: 0.7,
                              width: '100%'
                            }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ 
                              backgroundColor: `rgb(${colorPalettes[selectedColorPalette].text.join(',')})`,
                              opacity: 0.7,
                              width: '90%'
                            }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ 
                              backgroundColor: `rgb(${colorPalettes[selectedColorPalette].text.join(',')})`,
                              opacity: 0.7,
                              width: '95%'
                            }}
                          />
                          <div 
                            className="h-1 rounded"
                            style={{ 
                              backgroundColor: `rgb(${colorPalettes[selectedColorPalette].text.join(',')})`,
                              opacity: 0.7,
                              width: '85%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta é uma prévia de como seu ebook ficará com as cores selecionadas
                  </p>
                </div>

                {isGenerating && (
                  <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Gerando seu ebook...</span>
                    </div>
                    <Progress value={33} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Criando estrutura, capítulos e imagens. Isso pode levar alguns minutos.
                    </p>
                  </div>
                )}

                <Button
                  onClick={generateEbook}
                  disabled={isGenerating || !prompt.trim()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando... (aguarde alguns minutos)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Gerar Ebook Completo com IA
                    </>
                  )}
                </Button>

                <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/10">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    O que será gerado automaticamente:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>✨ Título profissional e otimizado</li>
                    <li>📝 Descrição completa e envolvente</li>
                    <li>📚 5-8 capítulos estruturados</li>
                    <li>📄 Conteúdo de 500-800 palavras por capítulo</li>
                    <li>🖼️ Imagens realistas para cada capítulo</li>
                  </ul>
                </div>
              </CardContent>
                </Card>
              ) : (
                /* Preview do Ebook Gerado */
            <div className="space-y-6">
              {/* Informações do Ebook */}
              <Card className="border-2 border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{generatedEbook.title}</CardTitle>
                      <CardDescription className="text-base">{generatedEbook.description}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetForm}>
                      Criar Novo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📚 {generatedEbook.chapters.length} capítulos</span>
                    <span>•</span>
                    <span>
                      📄 {generatedEbook.chapters.reduce((acc, ch) => acc + ch.content.split(' ').length, 0).toLocaleString()} palavras
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={downloadPDF} size="lg" className="flex-1">
                      <Download className="mr-2 h-5 w-5" />
                      Baixar PDF
                    </Button>
                    {editingEbook && (
                      <Button onClick={handleSaveEdits} size="lg" variant="outline" className="flex-1">
                        <Save className="mr-2 h-5 w-5" />
                        Salvar Alterações
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Capítulos */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Capítulos Gerados</h2>
                {generatedEbook.chapters.map((chapter, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Capítulo {index + 1}: {chapter.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {chapter.imageUrl && (
                        <img
                          src={chapter.imageUrl}
                          alt={chapter.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                        {chapter.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.content.split(' ').length} palavras
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {loadingEbooks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ebooks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum ebook salvo</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie seu primeiro ebook e ele aparecerá aqui.
                    </p>
                    <Button onClick={() => setActiveTab("create")}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Criar Ebook
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {ebooks.map((ebook) => (
                    <Card key={ebook.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-1">{ebook.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {ebook.description}
                            </CardDescription>
                            <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                              <span>📚 {ebook.chapters.length} capítulos</span>
                              <span>•</span>
                              <span>🌐 {languages[ebook.language as keyof typeof languages]}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: `rgb(${colorPalettes[ebook.color_palette as keyof typeof colorPalettes].primary.join(',')})`,
                                  }}
                                />
                                {colorPalettes[ebook.color_palette as keyof typeof colorPalettes].name}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Criado em {new Date(ebook.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadEbookForEditing(ebook)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir ebook?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O ebook "{ebook.title}" será
                                    permanentemente excluído.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(ebook.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}