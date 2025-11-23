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
import { Loader2, BookOpen, Plus, Trash2, Image as ImageIcon, Sparkles, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";

interface Chapter {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export default function CreateEbook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [ebookTitle, setEbookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: "1", title: "", content: "" }
  ]);

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: "",
      content: ""
    };
    setChapters([...chapters, newChapter]);
  };

  const removeChapter = (id: string) => {
    if (chapters.length === 1) {
      toast({
        title: "Erro",
        description: "O ebook precisa ter pelo menos um capítulo.",
        variant: "destructive",
      });
      return;
    }
    setChapters(chapters.filter(ch => ch.id !== id));
  };

  const updateChapter = (id: string, field: keyof Chapter, value: string) => {
    setChapters(chapters.map(ch => 
      ch.id === id ? { ...ch, [field]: value } : ch
    ));
  };

  const generateChapterContent = async (chapterId: string, chapterTitle: string) => {
    if (!chapterTitle.trim()) {
      toast({
        title: "Título necessário",
        description: "Digite um título para o capítulo antes de gerar o conteúdo.",
        variant: "destructive",
      });
      return;
    }

    setChapters(chapters.map(ch => 
      ch.id === chapterId ? { ...ch, isGenerating: true } : ch
    ));

    try {
      const { data, error } = await supabase.functions.invoke('generate-ebook-chapter', {
        body: { 
          ebookTitle,
          chapterTitle,
          ebookDescription: description
        }
      });

      if (error) throw error;

      setChapters(chapters.map(ch => 
        ch.id === chapterId 
          ? { 
              ...ch, 
              content: data.content,
              imageUrl: data.imageUrl,
              isGenerating: false 
            } 
          : ch
      ));

      toast({
        title: "Capítulo gerado!",
        description: "Conteúdo e imagem criados com IA.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar capítulo:", error);
      toast({
        title: "Erro ao gerar capítulo",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
      setChapters(chapters.map(ch => 
        ch.id === chapterId ? { ...ch, isGenerating: false } : ch
      ));
    }
  };

  const generateAllChapters = async () => {
    if (!ebookTitle.trim()) {
      toast({
        title: "Título necessário",
        description: "Digite o título do ebook antes de gerar.",
        variant: "destructive",
      });
      return;
    }

    const emptyChapters = chapters.filter(ch => !ch.title.trim());
    if (emptyChapters.length > 0) {
      toast({
        title: "Títulos necessários",
        description: "Preencha os títulos de todos os capítulos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const totalChapters = chapters.length;
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      await generateChapterContent(chapter.id, chapter.title);
      setGenerationProgress(((i + 1) / totalChapters) * 100);
    }

    setIsGenerating(false);
    toast({
      title: "Ebook completo!",
      description: "Todos os capítulos foram gerados com sucesso.",
    });
  };

  const downloadEbook = async () => {
    if (!ebookTitle.trim()) {
      toast({
        title: "Título necessário",
        description: "Digite o título do ebook.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Capa do ebook
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      
      const titleLines = pdf.splitTextToSize(ebookTitle, pageWidth - 2 * margin);
      const titleY = pageHeight / 2 - 20;
      titleLines.forEach((line: string) => {
        const textWidth = pdf.getTextWidth(line);
        pdf.text(line, (pageWidth - textWidth) / 2, titleY);
      });

      if (author) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Por ${author}`, pageWidth / 2, titleY + 40, { align: "center" });
      }

      // Capítulos
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        pdf.addPage();
        y = margin;

        // Título do capítulo
        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Capítulo ${i + 1}: ${chapter.title}`, margin, y);
        y += 15;

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
          if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 6;
        });
      }

      pdf.save(`${ebookTitle}.pdf`);

      // Salvar no banco de dados
      const pdfBase64 = pdf.output('datauristring');
      await supabase.from("documents").insert({
        user_id: user?.id,
        title: ebookTitle,
        file_url: pdfBase64,
        file_size: pdfBase64.length,
        template: 'ebook',
      } as any);

      toast({
        title: "Ebook baixado!",
        description: "Seu ebook foi salvo e está pronto.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar ebook:", error);
      toast({
        title: "Erro ao gerar ebook",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Criar Ebook Profissional</h1>
          </div>

          {/* Informações do Ebook */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações do Ebook</CardTitle>
              <CardDescription>Configure os detalhes principais do seu ebook</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Ebook *</Label>
                <Input
                  id="title"
                  value={ebookTitle}
                  onChange={(e) => setEbookTitle(e.target.value)}
                  placeholder="Ex: Guia Completo de Marketing Digital"
                />
              </div>
              <div>
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição do ebook para ajudar a IA a gerar conteúdo mais relevante"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Capítulos */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Capítulos</CardTitle>
                  <CardDescription>Organize o conteúdo do seu ebook em capítulos</CardDescription>
                </div>
                <Badge variant="secondary">{chapters.length} capítulos</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {chapters.map((chapter, index) => (
                <Card key={chapter.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Capítulo {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChapter(chapter.id)}
                        disabled={chapters.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título do Capítulo</Label>
                      <div className="flex gap-2">
                        <Input
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, "title", e.target.value)}
                          placeholder="Ex: Introdução ao Marketing Digital"
                        />
                        <Button
                          onClick={() => generateChapterContent(chapter.id, chapter.title)}
                          disabled={chapter.isGenerating || !chapter.title.trim()}
                          variant="outline"
                        >
                          {chapter.isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {chapter.imageUrl && (
                      <div className="relative">
                        <Label className="flex items-center gap-2 mb-2">
                          <ImageIcon className="w-4 h-4" />
                          Imagem do Capítulo
                        </Label>
                        <img 
                          src={chapter.imageUrl} 
                          alt={chapter.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={chapter.content}
                        onChange={(e) => updateChapter(chapter.id, "content", e.target.value)}
                        placeholder="O conteúdo será gerado automaticamente pela IA..."
                        rows={6}
                        disabled={chapter.isGenerating}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addChapter}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Capítulo
              </Button>
            </CardContent>
          </Card>

          {/* Progresso */}
          {isGenerating && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Gerando capítulos...</span>
                    <span>{Math.round(generationProgress)}%</span>
                  </div>
                  <Progress value={generationProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  onClick={generateAllChapters}
                  disabled={isGenerating || !ebookTitle.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Todos os Capítulos
                    </>
                  )}
                </Button>
                <Button
                  onClick={downloadEbook}
                  disabled={isGenerating || chapters.every(ch => !ch.content)}
                  variant="outline"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Ebook
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
