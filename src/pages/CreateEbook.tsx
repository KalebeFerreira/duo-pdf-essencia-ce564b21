import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, BookOpen, Sparkles, Download, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";

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
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEbook, setGeneratedEbook] = useState<GeneratedEbook | null>(null);

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
        body: { prompt }
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

      toast({
        title: "✨ Ebook criado com sucesso!",
        description: `${data.chapters.length} capítulos gerados com conteúdo e imagens.`,
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

      // Capa
      pdf.setFillColor(37, 99, 235);
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
        pdf.setTextColor(37, 99, 235);
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
        pdf.setTextColor(0, 0, 0);
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
    setPrompt("");
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
                  <Textarea
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
                  <Button onClick={downloadPDF} size="lg" className="w-full mt-4">
                    <Download className="mr-2 h-5 w-5" />
                    Baixar Ebook em PDF
                  </Button>
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
        </div>
      </div>
    </div>
  );
}