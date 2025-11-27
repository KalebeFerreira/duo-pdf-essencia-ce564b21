import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, FileImage } from "lucide-react";
import { usePdfLimit } from "@/hooks/usePdfLimit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PptxGenJS from "pptxgenjs";

interface PdfGeneratorProps {
  onPdfGenerated: () => void;
}

const PdfGenerator = ({ onPdfGenerated }: PdfGeneratorProps) => {
  const { checkLimit } = usePdfLimit();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [savedTopic, setSavedTopic] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um tópico para o PDF.",
        variant: "destructive",
      });
      return;
    }

    // Check limit before generating
    if (!checkLimit()) {
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      let contentToSave = "";
      let isMockMode = false;

      // Try to generate with AI
      try {
        const { data, error } = await supabase.functions.invoke('generate-pdf-content', {
          body: { topic, prompt: prompt || undefined }
        });

        // Verificar erro de créditos esgotados (402)
        if (error) {
          const errorData = (error as any)?.context?.body;
          const errorCode = errorData?.code || errorData?.error;
          
          if (errorCode === 'NO_CREDITS' || errorData?.message?.includes('créditos')) {
            toast({
              title: "💳 Créditos Esgotados",
              description: "Seus créditos do Lovable AI acabaram. Acesse Settings → Workspace → Usage para adicionar créditos. Gerando em modo simulação...",
              variant: "destructive",
            });
            throw error; // Vai cair no modo mock
          }
          
          throw error;
        }
        
        // O conteúdo já vem com as imagens inseridas nos locais apropriados
        contentToSave = data.content;
        setGeneratedContent(data.content);
        setSavedTopic(topic);
      } catch (aiError) {
        // Activate Mock Mode if AI fails
        console.log('AI generation failed, activating Mock Mode:', aiError);
        isMockMode = true;
        
        // Simulate 2 seconds loading
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock content
        const mockContent = `# ${topic}

## Documento Gerado em Modo Simulação

Este é um documento de exemplo criado automaticamente.

### Sobre este Tópico
${prompt || 'Este conteúdo foi gerado no modo simulação enquanto a integração com IA está sendo configurada.'}

### Principais Pontos
- Este é um documento de exemplo
- Conteúdo gerado em modo simulação
- Você pode editar este documento a qualquer momento
- Configure a API Key do Gemini para gerar conteúdo com IA real

---
*Documento criado com Essência Duo PDF - Modo Simulação*`;

        contentToSave = mockContent;
        setGeneratedContent(mockContent);
        setSavedTopic(topic);
      }

      // Save document to database with content (real or mock)
      const { data: { user } } = await supabase.auth.getUser();
      
      // Codificar conteúdo em base64 UTF-8 para armazenamento correto
      const base64Content = btoa(unescape(encodeURIComponent(contentToSave)));
      
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: topic,
          user_id: user?.id,
          file_url: `data:text/plain;base64,${base64Content}`,
          file_size: contentToSave.length,
          template: 'modern',
        } as any);

      if (insertError) throw insertError;

      // Update profile PDFs used count (both monthly and daily)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pdfs_used, pdfs_used_today')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ 
              pdfs_used: (profile.pdfs_used || 0) + 1,
              pdfs_used_today: (profile.pdfs_used_today || 0) + 1
            })
            .eq('id', user.id);
        }
      }

      toast({
        title: isMockMode ? "PDF Gerado (Modo Simulação)!" : "PDF Gerado!",
        description: isMockMode 
          ? "Conteúdo de exemplo criado com sucesso. Configure a API Key do Gemini para gerar conteúdo com IA." 
          : "Seu conteúdo foi gerado com sucesso.",
      });

      // Não resetar mais o formulário para permitir exportações
      // onPdfGenerated();
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Ocorreu um erro ao gerar o conteúdo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedContent || !savedTopic) return;
    setIsExporting(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Título
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(savedTopic, margin, yPosition);
      yPosition += 15;

      // Conteúdo
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      const lines = generatedContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('![')) {
          // Ignorar marcações de imagem
          continue;
        }
        
        const wrappedLines = pdf.splitTextToSize(line || ' ', maxWidth);
        
        if (yPosition + (wrappedLines.length * 7) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(wrappedLines, margin, yPosition);
        yPosition += wrappedLines.length * 7;
      }

      pdf.save(`${savedTopic}.pdf`);
      
      toast({
        title: "PDF Baixado!",
        description: "Seu arquivo PDF foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPNG = async () => {
    if (!generatedContent || !savedTopic) return;
    setIsExporting(true);

    try {
      const element = document.getElementById('content-preview');
      if (!element) throw new Error('Content element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${savedTopic}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: "PNG Baixado!",
        description: "Seu arquivo PNG foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading PNG:', error);
      toast({
        title: "Erro ao baixar PNG",
        description: "Ocorreu um erro ao gerar o arquivo PNG.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJPG = async () => {
    if (!generatedContent || !savedTopic) return;
    setIsExporting(true);

    try {
      const element = document.getElementById('content-preview');
      if (!element) throw new Error('Content element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${savedTopic}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();

      toast({
        title: "JPG Baixado!",
        description: "Seu arquivo JPG foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading JPG:', error);
      toast({
        title: "Erro ao baixar JPG",
        description: "Ocorreu um erro ao gerar o arquivo JPG.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPowerPoint = async () => {
    if (!generatedContent || !savedTopic) return;
    setIsExporting(true);

    try {
      const pptx = new PptxGenJS();
      
      // Slide de título
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: "2E3440" };
      titleSlide.addText(savedTopic, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: "FFFFFF",
        align: "center",
      });

      // Processar conteúdo em slides
      const sections = generatedContent.split('\n').filter(line => line.trim());
      let currentSlide = pptx.addSlide();
      let slideContent: string[] = [];
      let slideTitle = "";

      for (const line of sections) {
        if (line.trim().startsWith('##')) {
          // Nova seção = novo slide
          if (slideContent.length > 0) {
            currentSlide.addText(slideTitle || savedTopic, {
              x: 0.5,
              y: 0.5,
              w: 9,
              h: 0.75,
              fontSize: 28,
              bold: true,
              color: "2E3440",
            });
            
            currentSlide.addText(slideContent.join('\n'), {
              x: 0.5,
              y: 1.5,
              w: 9,
              h: 4,
              fontSize: 14,
              color: "3B4252",
              valign: "top",
            });
          }
          
          slideTitle = line.replace(/^#+\s*/, '');
          slideContent = [];
          currentSlide = pptx.addSlide();
          currentSlide.background = { color: "ECEFF4" };
        } else if (!line.trim().startsWith('![')) {
          slideContent.push(line);
        }
      }

      // Último slide
      if (slideContent.length > 0) {
        currentSlide.addText(slideTitle || savedTopic, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.75,
          fontSize: 28,
          bold: true,
          color: "2E3440",
        });
        
        currentSlide.addText(slideContent.join('\n'), {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4,
          fontSize: 14,
          color: "3B4252",
          valign: "top",
        });
      }

      await pptx.writeFile({ fileName: `${savedTopic}.pptx` });

      toast({
        title: "PowerPoint Baixado!",
        description: "Seu arquivo PowerPoint foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error downloading PowerPoint:', error);
      toast({
        title: "Erro ao baixar PowerPoint",
        description: "Ocorreu um erro ao gerar o arquivo PowerPoint.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewGeneration = () => {
    setGeneratedContent("");
    setSavedTopic("");
    setTopic("");
    setPrompt("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Novo PDF com IA
          </CardTitle>
          <CardDescription>
            Use a inteligência artificial para criar conteúdo profissional automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Tópico do PDF *</Label>
            <Input
              id="topic"
              placeholder="Ex: Estratégias de Marketing Digital"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Instruções Personalizadas (Opcional)</Label>
            <Textarea
              id="prompt"
              placeholder="Adicione instruções específicas sobre o que deseja no conteúdo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Conteúdo...
              </>
            ) : (
              'Gerar PDF com IA'
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Gerado</CardTitle>
            <CardDescription>
              Escolha o formato para exportar seu conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isExporting} className="flex-1 min-w-[200px]">
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Conteúdo
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={downloadPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar como PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPNG}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Baixar como PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadJPG}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Baixar como JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadPowerPoint}>
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar como PowerPoint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                onClick={handleNewGeneration}
                disabled={isExporting}
              >
                Gerar Novo Conteúdo
              </Button>
            </div>

            <div id="content-preview" className="bg-background p-6 rounded-lg border whitespace-pre-wrap text-sm">
              <h1 className="text-2xl font-bold mb-4">{savedTopic}</h1>
              {generatedContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfGenerator;
