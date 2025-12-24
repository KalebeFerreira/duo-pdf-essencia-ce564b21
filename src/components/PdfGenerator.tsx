import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, FileImage, List, CheckCircle2, XCircle } from "lucide-react";
import { usePdfLimit } from "@/hooks/usePdfLimit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { addWatermarkToPdf, checkIsFreePlan } from "@/utils/pdfWatermark";
import { useAuth } from "@/hooks/useAuth";

interface PdfGeneratorProps {
  onPdfGenerated: (pdfContent?: string) => void;
}

interface BatchResult {
  topic: string;
  content: string;
  status: 'success' | 'error';
  error?: string;
}

const PdfGenerator = ({ onPdfGenerated }: PdfGeneratorProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { checkLimit, getLimitInfo } = usePdfLimit();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("pt");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [savedTopic, setSavedTopic] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  // Batch generation states
  const [batchTopics, setBatchTopics] = useState("");
  const [batchPrompt, setBatchPrompt] = useState("");
  const [batchLanguage, setBatchLanguage] = useState("pt");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

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
          body: { topic, prompt: prompt || undefined, language }
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      // Codificar conteúdo em base64 UTF-8 para armazenamento correto
      const base64Content = btoa(unescape(encodeURIComponent(contentToSave)));
      
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: topic,
          user_id: authUser?.id,
          file_url: `data:text/plain;base64,${base64Content}`,
          file_size: contentToSave.length,
        });

      if (insertError) throw insertError;

      // Update profile PDFs used count (both monthly and daily)
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pdfs_used, pdfs_used_today')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ 
              pdfs_used: (profile.pdfs_used || 0) + 1,
              pdfs_used_today: (profile.pdfs_used_today || 0) + 1
            })
            .eq('id', authUser.id);
        }

        // Força re-fetch no dashboard/listas (sem refresh)
        queryClient.invalidateQueries({ queryKey: ['documents', authUser.id] });
        queryClient.invalidateQueries({ queryKey: ['profile', authUser.id] });
      }

      toast({
        title: isMockMode ? "PDF Gerado (Modo Simulação)!" : "PDF Gerado!",
        description: isMockMode 
          ? "Conteúdo de exemplo criado com sucesso. Configure a API Key do Gemini para gerar conteúdo com IA." 
          : "Seu conteúdo foi gerado com sucesso.",
      });

      // Criar PDF e passar para o callback para permitir conversões
      try {
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(topic, margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        
        const lines = contentToSave.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('![')) continue;
          
          const wrappedLines = pdf.splitTextToSize(line || ' ', maxWidth);
          
          if (yPosition + (wrappedLines.length * 7) > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.text(wrappedLines, margin, yPosition);
          yPosition += wrappedLines.length * 7;
        }

        const pdfDataUri = pdf.output('datauristring');
        onPdfGenerated(pdfDataUri);
      } catch (pdfError) {
        console.error('Error creating PDF for callback:', pdfError);
        onPdfGenerated();
      }
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
      // Verificar se é plano gratuito
      const isFreePlan = await checkIsFreePlan(supabase, user?.id);
      
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

      // Adicionar marca d'água para plano gratuito
      addWatermarkToPdf(pdf, isFreePlan);

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

  const generateSinglePdfContent = async (singleTopic: string, customPrompt?: string, lang?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-content', {
        body: { topic: singleTopic, prompt: customPrompt || undefined, language: lang || 'pt' }
      });

      if (error) {
        const errorData = (error as any)?.context?.body;
        const errorCode = errorData?.code || errorData?.error;
        
        if (errorCode === 'NO_CREDITS' || errorData?.message?.includes('créditos')) {
          throw new Error('Créditos esgotados');
        }
        throw error;
      }
      
      return data.content;
    } catch (error: any) {
      console.error('Error generating content:', error);
      throw error;
    }
  };

  const handleBatchGenerate = async () => {
    const topicsList = batchTopics.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    
    if (topicsList.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira ao menos um tópico (um por linha).",
        variant: "destructive",
      });
      return;
    }

    const limitInfo = getLimitInfo();
    if (topicsList.length > limitInfo.remaining) {
      toast({
        title: "Limite Insuficiente",
        description: `Você tem apenas ${limitInfo.remaining} PDF${limitInfo.remaining === 1 ? '' : 's'} restante${limitInfo.remaining === 1 ? '' : 's'}, mas tentou gerar ${topicsList.length}.`,
        variant: "destructive",
      });
      return;
    }

    setIsBatchGenerating(true);
    setBatchResults([]);
    setBatchProgress(0);
    setCurrentBatchIndex(0);

    const results: BatchResult[] = [];
    const { data: { user } } = await supabase.auth.getUser();

    for (let i = 0; i < topicsList.length; i++) {
      const currentTopic = topicsList[i];
      setCurrentBatchIndex(i + 1);
      
      try {
        toast({
          title: `Gerando ${i + 1}/${topicsList.length}`,
          description: `Processando: ${currentTopic}`,
        });

        const content = await generateSinglePdfContent(currentTopic, batchPrompt || undefined, batchLanguage);
        
        // Save to database
        const base64Content = btoa(unescape(encodeURIComponent(content)));
        const { error: insertError } = await supabase
          .from('documents')
          .insert({
            title: currentTopic,
            user_id: user?.id,
            file_url: `data:text/plain;base64,${base64Content}`,
            file_size: content.length,
          });

        if (insertError) throw insertError;

        // Update usage
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

        results.push({ topic: currentTopic, content, status: 'success' });
      } catch (error: any) {
        results.push({ 
          topic: currentTopic, 
          content: '', 
          status: 'error',
          error: error.message || 'Erro ao gerar conteúdo'
        });
      }

      setBatchResults([...results]);
      setBatchProgress(((i + 1) / topicsList.length) * 100);
    }

    setIsBatchGenerating(false);
    
    const successCount = results.filter(r => r.status === 'success').length;
    toast({
      title: "Geração em Lote Concluída!",
      description: `${successCount} de ${topicsList.length} PDFs gerados com sucesso.`,
    });
  };

  const downloadBatchAsZip = async () => {
    if (batchResults.length === 0) return;
    
    setIsExporting(true);
    try {
      // Verificar se é plano gratuito
      const isFreePlan = await checkIsFreePlan(supabase, user?.id);
      
      const zip = new JSZip();
      
      for (const result of batchResults) {
        if (result.status === 'success' && result.content) {
          const pdf = new jsPDF();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const margin = 20;
          const maxWidth = pageWidth - (margin * 2);
          let yPosition = margin;

          // Título
          pdf.setFontSize(18);
          pdf.setFont("helvetica", "bold");
          pdf.text(result.topic, margin, yPosition);
          yPosition += 15;

          // Conteúdo
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          
          const lines = result.content.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('![')) continue;
            
            const wrappedLines = pdf.splitTextToSize(line || ' ', maxWidth);
            
            if (yPosition + (wrappedLines.length * 7) > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            
            pdf.text(wrappedLines, margin, yPosition);
            yPosition += wrappedLines.length * 7;
          }

          // Adicionar marca d'água para plano gratuito
          addWatermarkToPdf(pdf, isFreePlan);

          const pdfBlob = pdf.output('blob');
          zip.file(`${result.topic}.pdf`, pdfBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'pdfs-gerados.zip';
      link.click();

      toast({
        title: "ZIP Baixado!",
        description: "Todos os PDFs foram compactados e baixados com sucesso.",
      });
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast({
        title: "Erro ao criar ZIP",
        description: "Ocorreu um erro ao compactar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar PDF com IA
          </CardTitle>
          <CardDescription>
            Escolha entre gerar um único PDF ou múltiplos PDFs em lote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="gap-2">
                <FileText className="w-4 h-4" />
                PDF Único
              </TabsTrigger>
              <TabsTrigger value="batch" className="gap-2">
                <List className="w-4 h-4" />
                Geração em Lote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
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
            <Label htmlFor="language">Idioma de Geração</Label>
            <Select value={language} onValueChange={setLanguage} disabled={isGenerating}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">Inglês</SelectItem>
                <SelectItem value="es">Espanhol</SelectItem>
                <SelectItem value="fr">Francês</SelectItem>
                <SelectItem value="de">Alemão</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
              </SelectContent>
            </Select>
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
            </TabsContent>

            <TabsContent value="batch" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="batch-topics">Lista de Tópicos *</Label>
                <Textarea
                  id="batch-topics"
                  placeholder="Insira um tópico por linha. Exemplo:&#10;Estratégias de Marketing Digital&#10;Gestão de Projetos Ágeis&#10;Inteligência Artificial no Varejo"
                  value={batchTopics}
                  onChange={(e) => setBatchTopics(e.target.value)}
                  disabled={isBatchGenerating}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {batchTopics.split('\n').filter(t => t.trim()).length} tópico(s) na lista
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-language">Idioma de Geração</Label>
                <Select value={batchLanguage} onValueChange={setBatchLanguage} disabled={isBatchGenerating}>
                  <SelectTrigger id="batch-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                    <SelectItem value="es">Espanhol</SelectItem>
                    <SelectItem value="fr">Francês</SelectItem>
                    <SelectItem value="de">Alemão</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-prompt">Instruções Globais (Opcional)</Label>
                <Textarea
                  id="batch-prompt"
                  placeholder="Instruções que serão aplicadas a todos os PDFs..."
                  value={batchPrompt}
                  onChange={(e) => setBatchPrompt(e.target.value)}
                  disabled={isBatchGenerating}
                  rows={3}
                />
              </div>

              {isBatchGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Gerando PDF {currentBatchIndex} de {batchTopics.split('\n').filter(t => t.trim()).length}
                    </span>
                    <span className="font-medium">{Math.round(batchProgress)}%</span>
                  </div>
                  <Progress value={batchProgress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleBatchGenerate} 
                disabled={isBatchGenerating || batchTopics.split('\n').filter(t => t.trim()).length === 0}
                className="w-full"
              >
                {isBatchGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando {currentBatchIndex} de {batchTopics.split('\n').filter(t => t.trim()).length}...
                  </>
                ) : (
                  'Gerar Todos os PDFs'
                )}
              </Button>

              {batchResults.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Resultados da Geração</h3>
                    <Button 
                      onClick={downloadBatchAsZip}
                      disabled={isExporting || batchResults.filter(r => r.status === 'success').length === 0}
                      variant="outline"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Todos (ZIP)
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {batchResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.status === 'success' 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                            : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.status === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{result.topic}</p>
                            {result.error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{result.error}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
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

            <div id="content-preview" className="bg-background p-6 rounded-lg border text-sm">
              <h1 className="text-2xl font-bold mb-4">{savedTopic}</h1>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {generatedContent.split('\n').map((line, idx) => {
                  // Renderizar imagens
                  const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                  if (imageMatch) {
                    return (
                      <div key={idx} className="my-4">
                        <img 
                          src={imageMatch[2]} 
                          alt={imageMatch[1] || 'Imagem gerada'} 
                          className="max-w-full h-auto rounded-lg shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  }
                  
                  // Renderizar títulos
                  if (line.startsWith('# ')) {
                    return <h1 key={idx} className="text-2xl font-bold mt-6 mb-3">{line.substring(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={idx} className="text-xl font-bold mt-5 mb-2">{line.substring(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
                  }
                  
                  // Renderizar separadores
                  if (line.trim() === '---') {
                    return <hr key={idx} className="my-6 border-border" />;
                  }
                  
                  // Renderizar listas
                  if (line.trim().startsWith('- ')) {
                    return <li key={idx} className="ml-4">{line.substring(2)}</li>;
                  }
                  
                  // Renderizar parágrafos normais
                  if (line.trim()) {
                    return <p key={idx} className="mb-2 leading-relaxed">{line}</p>;
                  }
                  
                  // Linha vazia
                  return <div key={idx} className="h-2" />;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfGenerator;
