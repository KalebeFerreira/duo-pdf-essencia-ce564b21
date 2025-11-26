import { useState } from "react";
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
        description: "A IA está criando conteúdo conciso com múltiplas imagens. Isso leva cerca de 40-70 segundos.",
      });

      const { data, error } = await supabase.functions.invoke('generate-complete-ebook', {
        body: { 
          prompt,
          language: selectedLanguage,
          colorPalette: selectedColorPalette,
          numPages: numPages || 10
        },
        timeout: 300000
      });

      if (error) {
        console.error('Edge function error:', error);
        
        const errorBody = (error as any)?.context?.body;
        const errorCode = errorBody?.code;
        const errorMessage = errorBody?.message || errorBody?.error || error.message || '';
        
        if (errorCode === 'NO_CREDITS' || errorMessage?.includes('créditos') || errorMessage?.includes('credits')) {
          toast({
            title: "💳 Créditos Esgotados",
            description: "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage para adicionar créditos.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        
        if (errorCode === 'RATE_LIMIT' || errorMessage?.includes('Rate limit') || errorMessage?.includes('429')) {
          toast({
            title: "⏱️ Muitas Requisições",
            description: "Limite temporário atingido. Aguarde alguns instantes e tente novamente.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        
        if (errorMessage?.includes('timeout') || errorMessage?.includes('fetch') || errorMessage?.includes('FunctionsFetchError')) {
          toast({
            title: "⏰ Tempo Esgotado",
            description: "A geração está demorando muito. Tente com menos páginas ou aguarde e tente novamente.",
            variant: "destructive",
          });
          setIsGenerating(false);
          return;
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado');
      }

      setGeneratedEbook(data);

      await saveEbook(
        data.title,
        data.description,
        data.chapters,
        selectedLanguage,
        selectedColorPalette
      );

      const imageCount = data.chapters.filter((ch: Chapter) => ch.imageUrl).length;
      toast({
        title: "✨ Ebook criado com sucesso!",
        description: `${data.chapters.length} capítulos gerados com ${imageCount} imagens realistas e salvos no histórico.`,
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
      const maxWidth = pageWidth - (margin * 2);

      // Capa
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      const titleLines = pdf.splitTextToSize(generatedEbook.title, maxWidth);
      pdf.text(titleLines, pageWidth / 2, 40, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      if (generatedEbook.description) {
        const descLines = pdf.splitTextToSize(generatedEbook.description, maxWidth);
        pdf.text(descLines, pageWidth / 2, 60, { align: 'center' });
      }

      // Capítulos com imagens
      for (const chapter of generatedEbook.chapters) {
        pdf.addPage();
        let yPos = margin;

        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        const chapterTitle = pdf.splitTextToSize(chapter.title, maxWidth);
        pdf.text(chapterTitle, margin, yPos);
        yPos += (chapterTitle.length * 10) + 10;

        // Adicionar imagem se existir
        if (chapter.imageUrl) {
          try {
            const imgWidth = maxWidth;
            const imgHeight = 80;
            if (yPos + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.addImage(chapter.imageUrl, 'JPEG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 10;
          } catch (err) {
            console.log('Erro ao adicionar imagem:', err);
          }
        }

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        const contentLines = pdf.splitTextToSize(chapter.content, maxWidth);
        
        for (const line of contentLines) {
          if (yPos > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(line, margin, yPos);
          yPos += 7;
        }
      }

      pdf.save(`${generatedEbook.title}.pdf`);
      toast({
        title: "PDF baixado com sucesso!",
        description: "Seu ebook com imagens foi salvo.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-center mb-8">
          <BookOpen className="w-8 h-8 mr-3 text-primary" />
          <h1 className="text-4xl font-bold">Criar Ebook com IA</h1>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "history")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Criar Novo
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico ({ebooks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Configure seu Ebook
                </CardTitle>
                <CardDescription>
                  A IA vai gerar conteúdo conciso e múltiplas imagens realistas para seu ebook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!generatedEbook ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Descreva o ebook que deseja criar</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Ex: Um guia completo sobre marketing digital para iniciantes..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Idioma
                        </Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
                        <Label htmlFor="palette" className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Paleta de Cores
                        </Label>
                        <Select value={selectedColorPalette} onValueChange={(v) => setSelectedColorPalette(v as keyof typeof colorPalettes)}>
                          <SelectTrigger id="palette">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(colorPalettes).map(([key, { name }]) => (
                              <SelectItem key={key} value={key}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numPages">Número de Capítulos</Label>
                        <Input
                          id="numPages"
                          type="number"
                          min="2"
                          max="15"
                          value={numPages}
                          onChange={(e) => setNumPages(e.target.value === "" ? "" : parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={generateEbook}
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando Ebook...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Ebook com IA
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">{generatedEbook.title}</h2>
                      <div className="flex gap-2">
                        {editingEbook && (
                          <Button onClick={handleSaveEdits} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                          </Button>
                        )}
                        <Button onClick={downloadPDF} size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </Button>
                        <Button onClick={resetForm} variant="outline" size="sm">
                          Criar Novo
                        </Button>
                      </div>
                    </div>

                    <p className="text-muted-foreground">{generatedEbook.description}</p>

                    <div className="space-y-4">
                      {generatedEbook.chapters.map((chapter, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Edit className="w-4 h-4" />
                              Capítulo {index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`title-${index}`}>Título do Capítulo</Label>
                              <Input
                                id={`title-${index}`}
                                value={chapter.title}
                                onChange={(e) => {
                                  const updatedChapters = [...generatedEbook.chapters];
                                  updatedChapters[index] = { ...updatedChapters[index], title: e.target.value };
                                  setGeneratedEbook({ ...generatedEbook, chapters: updatedChapters });
                                }}
                                className="font-semibold"
                              />
                            </div>
                            
                            {chapter.imageUrl && (
                              <div className="mb-4">
                                <img 
                                  src={chapter.imageUrl} 
                                  alt={chapter.title}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <Label htmlFor={`content-${index}`}>Conteúdo do Capítulo</Label>
                              <Textarea
                                id={`content-${index}`}
                                value={chapter.content}
                                onChange={(e) => {
                                  const updatedChapters = [...generatedEbook.chapters];
                                  updatedChapters[index] = { ...updatedChapters[index], content: e.target.value };
                                  setGeneratedEbook({ ...generatedEbook, chapters: updatedChapters });
                                }}
                                rows={8}
                                className="resize-y"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Seus Ebooks</CardTitle>
                <CardDescription>
                  Ebooks salvos e prontos para download
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEbooks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : ebooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum ebook criado ainda
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {ebooks.map((ebook) => (
                      <Card key={ebook.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{ebook.title}</CardTitle>
                              {ebook.description && (
                                <CardDescription className="line-clamp-2">
                                  {ebook.description}
                                </CardDescription>
                              )}
                              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{ebook.chapters.length} capítulos</span>
                                <span>•</span>
                                <span>{languages[ebook.language as keyof typeof languages]}</span>
                                <span>•</span>
                                <span>{new Date(ebook.created_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadEbookForEditing(ebook)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este ebook? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(ebook.id)}>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}