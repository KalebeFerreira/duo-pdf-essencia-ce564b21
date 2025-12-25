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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import PptxGenJS from "pptxgenjs";
import html2canvas from "html2canvas";
import { addWatermarkToPdf, checkIsFreePlan } from "@/utils/pdfWatermark";

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
  const { user, session, loading: authLoading } = useAuth();
  const { ebooks, isLoading: loadingEbooks, saveEbook, updateEbook, deleteEbook } = useEbooks();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEbook, setGeneratedEbook] = useState<GeneratedEbook | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("pt");
  const [selectedColorPalette, setSelectedColorPalette] = useState<keyof typeof colorPalettes>("classic");
  const [numPages, setNumPages] = useState<number | "">(10);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [improvingChapterIndex, setImprovingChapterIndex] = useState<number | null>(null);
  const [improvedContent, setImprovedContent] = useState<string>("");
  const [showImprovedDialog, setShowImprovedDialog] = useState(false);
  const [currentImprovingIndex, setCurrentImprovingIndex] = useState<number | null>(null);

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
      if (authLoading || !session?.access_token) {
        toast({
          title: "Sessão não pronta",
          description: "Aguarde a sessão carregar (ou faça login novamente) para gerar ebooks.",
          variant: "destructive",
        });
        return;
      }

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
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
      // Verificar se é plano gratuito
      const isFreePlan = await checkIsFreePlan(supabase, user?.id);
      
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

      // Adicionar marca d'água para plano gratuito
      addWatermarkToPdf(pdf, isFreePlan);

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

  const downloadPowerPoint = async () => {
    if (!generatedEbook) return;

    try {
      // Verificar se é plano gratuito
      const isFreePlan = await checkIsFreePlan(supabase, user?.id);
      
      const pptx = new PptxGenJS();
      const palette = colorPalettes[selectedColorPalette];

      // Capa
      const coverSlide = pptx.addSlide();
      coverSlide.background = { color: `${palette.primary[0].toString(16).padStart(2, '0')}${palette.primary[1].toString(16).padStart(2, '0')}${palette.primary[2].toString(16).padStart(2, '0')}` };
      coverSlide.addText(generatedEbook.title, {
        x: 0.5,
        y: 2,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
      });
      if (generatedEbook.description) {
        coverSlide.addText(generatedEbook.description, {
          x: 1,
          y: 4,
          w: 8,
          h: 1,
          fontSize: 18,
          color: 'FFFFFF',
          align: 'center',
        });
      }
      
      // Marca d'água na capa para plano gratuito
      if (isFreePlan) {
        coverSlide.addText("Essência Duo", {
          x: 0,
          y: 5.2,
          w: 10,
          h: 0.3,
          fontSize: 10,
          color: 'FFFFFF',
          align: 'center',
        });
      }

      // Capítulos
      for (const chapter of generatedEbook.chapters) {
        const slide = pptx.addSlide();
        slide.background = { color: `${palette.secondary[0].toString(16).padStart(2, '0')}${palette.secondary[1].toString(16).padStart(2, '0')}${palette.secondary[2].toString(16).padStart(2, '0')}` };
        
        slide.addText(chapter.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: `${palette.text[0].toString(16).padStart(2, '0')}${palette.text[1].toString(16).padStart(2, '0')}${palette.text[2].toString(16).padStart(2, '0')}`,
        });

        if (chapter.imageUrl) {
          slide.addImage({
            data: chapter.imageUrl,
            x: 0.5,
            y: 1.5,
            w: 4,
            h: 3,
          });
          slide.addText(chapter.content, {
            x: 5,
            y: 1.5,
            w: 4.5,
            h: 4,
            fontSize: 14,
            color: `${palette.text[0].toString(16).padStart(2, '0')}${palette.text[1].toString(16).padStart(2, '0')}${palette.text[2].toString(16).padStart(2, '0')}`,
            valign: 'top',
          });
        } else {
          slide.addText(chapter.content, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 4,
            fontSize: 16,
            color: `${palette.text[0].toString(16).padStart(2, '0')}${palette.text[1].toString(16).padStart(2, '0')}${palette.text[2].toString(16).padStart(2, '0')}`,
            valign: 'top',
          });
        }
        
        // Marca d'água em cada slide para plano gratuito
        if (isFreePlan) {
          slide.addText("Essência Duo", {
            x: 0,
            y: 5.2,
            w: 10,
            h: 0.3,
            fontSize: 10,
            color: '999999',
            align: 'center',
          });
        }
      }

      await pptx.writeFile({ fileName: `${generatedEbook.title}.pptx` });
      toast({
        title: "PowerPoint baixado com sucesso!",
        description: "Seu ebook em formato de apresentação foi salvo.",
      });
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      toast({
        title: "Erro ao gerar PowerPoint",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const downloadImages = async () => {
    if (!generatedEbook) return;

    try {
      // Verificar se é plano gratuito
      const isFreePlan = await checkIsFreePlan(supabase, user?.id);
      
      toast({
        title: "Gerando imagens...",
        description: "Convertendo páginas em imagens PNG.",
      });

      for (let i = 0; i < generatedEbook.chapters.length; i++) {
        const chapter = generatedEbook.chapters[i];
        const element = document.createElement('div');
        element.style.width = '1920px';
        element.style.padding = '60px';
        element.style.backgroundColor = 'white';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.position = 'relative';

        const titleEl = document.createElement('h1');
        titleEl.textContent = chapter.title;
        titleEl.style.fontSize = '48px';
        titleEl.style.fontWeight = 'bold';
        titleEl.style.marginBottom = '30px';
        element.appendChild(titleEl);

        if (chapter.imageUrl) {
          const imgEl = document.createElement('img');
          imgEl.src = chapter.imageUrl;
          imgEl.style.width = '100%';
          imgEl.style.maxHeight = '600px';
          imgEl.style.objectFit = 'cover';
          imgEl.style.marginBottom = '30px';
          imgEl.style.borderRadius = '12px';
          element.appendChild(imgEl);
        }

        const contentEl = document.createElement('p');
        contentEl.textContent = chapter.content;
        contentEl.style.fontSize = '24px';
        contentEl.style.lineHeight = '1.6';
        contentEl.style.whiteSpace = 'pre-wrap';
        element.appendChild(contentEl);

        // Marca d'água para plano gratuito
        if (isFreePlan) {
          const watermarkEl = document.createElement('div');
          watermarkEl.textContent = 'Essência Duo';
          watermarkEl.style.position = 'absolute';
          watermarkEl.style.bottom = '20px';
          watermarkEl.style.left = '0';
          watermarkEl.style.right = '0';
          watermarkEl.style.textAlign = 'center';
          watermarkEl.style.fontSize = '18px';
          watermarkEl.style.color = '#999999';
          element.appendChild(watermarkEl);
        }

        document.body.appendChild(element);

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: 'white',
        });

        document.body.removeChild(element);

        const link = document.createElement('a');
        link.download = `${generatedEbook.title} - ${i + 1}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }

      toast({
        title: "Imagens baixadas com sucesso!",
        description: `${generatedEbook.chapters.length} páginas foram convertidas em PNG.`,
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Erro ao gerar imagens",
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

  const improveChapter = async (chapterIndex: number) => {
    if (!generatedEbook) return;

    const chapter = generatedEbook.chapters[chapterIndex];
    setImprovingChapterIndex(chapterIndex);
    setCurrentImprovingIndex(chapterIndex);

    try {
      toast({
        title: "Melhorando capítulo...",
        description: "A IA está analisando e aprimorando o texto.",
      });

      const { data, error } = await supabase.functions.invoke('improve-chapter', {
        body: { 
          title: chapter.title,
          content: chapter.content,
          language: selectedLanguage,
          ebookTheme: generatedEbook.description || generatedEbook.title
        }
      });

      if (error) {
        console.error('Improvement error:', error);
        const errorBody = (error as any)?.context?.body;
        const errorCode = errorBody?.code;
        
        if (errorCode === 'NO_CREDITS') {
          toast({
            title: "💳 Créditos Esgotados",
            description: "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage.",
            variant: "destructive",
          });
          setImprovingChapterIndex(null);
          return;
        }
        throw error;
      }

      if (!data?.improvedContent) {
        throw new Error('Nenhum conteúdo melhorado retornado');
      }

      setImprovedContent(data.improvedContent);
      setShowImprovedDialog(true);

    } catch (error: any) {
      console.error("Erro ao melhorar capítulo:", error);
      toast({
        title: "Erro ao melhorar capítulo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
      setCurrentImprovingIndex(null);
    } finally {
      setImprovingChapterIndex(null);
    }
  };

  const applyImprovement = () => {
    if (!generatedEbook || currentImprovingIndex === null) return;

    const updatedChapters = [...generatedEbook.chapters];
    updatedChapters[currentImprovingIndex] = { 
      ...updatedChapters[currentImprovingIndex], 
      content: improvedContent 
    };
    setGeneratedEbook({ ...generatedEbook, chapters: updatedChapters });
    setShowImprovedDialog(false);
    setImprovedContent("");
    setCurrentImprovingIndex(null);

    toast({
      title: "✨ Capítulo melhorado!",
      description: "As melhorias foram aplicadas com sucesso.",
    });
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
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border mt-2">
                          <span className="text-xs text-muted-foreground">Preview:</span>
                          <div 
                            className="w-8 h-8 rounded-md border-2 border-white shadow-sm"
                            style={{ backgroundColor: `rgb(${colorPalettes[selectedColorPalette].primary.join(',')})` }}
                            title="Cor Primária"
                          />
                          <div 
                            className="w-8 h-8 rounded-md border-2 border-white shadow-sm"
                            style={{ backgroundColor: `rgb(${colorPalettes[selectedColorPalette].secondary.join(',')})` }}
                            title="Cor Secundária"
                          />
                          <div 
                            className="w-8 h-8 rounded-md border-2 border-white shadow-sm"
                            style={{ backgroundColor: `rgb(${colorPalettes[selectedColorPalette].text.join(',')})` }}
                            title="Cor do Texto"
                          />
                        </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Exportar
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={downloadPDF}>
                              <Download className="w-4 h-4 mr-2" />
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadPowerPoint}>
                              <Download className="w-4 h-4 mr-2" />
                              Baixar PowerPoint
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadImages}>
                              <Download className="w-4 h-4 mr-2" />
                              Baixar Imagens PNG
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                            <CardTitle className="text-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Capítulo {index + 1}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => improveChapter(index)}
                                disabled={improvingChapterIndex === index}
                              >
                                {improvingChapterIndex === index ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Melhorando...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    Melhorar com IA
                                  </>
                                )}
                              </Button>
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

        <Dialog open={showImprovedDialog} onOpenChange={setShowImprovedDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>✨ Texto Melhorado pela IA</DialogTitle>
              <DialogDescription>
                Compare e decida se deseja aplicar as melhorias sugeridas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Texto Original:
                </Label>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm whitespace-pre-wrap">
                    {currentImprovingIndex !== null && generatedEbook?.chapters[currentImprovingIndex]?.content}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-primary">
                  Texto Melhorado:
                </Label>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm whitespace-pre-wrap">
                    {improvedContent}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImprovedDialog(false);
                  setImprovedContent("");
                  setCurrentImprovingIndex(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={applyImprovement}>
                <Sparkles className="w-4 h-4 mr-2" />
                Aplicar Melhorias
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}