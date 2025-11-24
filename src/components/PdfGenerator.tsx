import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";
import { usePdfLimit } from "@/hooks/usePdfLimit";

interface PdfGeneratorProps {
  onPdfGenerated: () => void;
}

const PdfGenerator = ({ onPdfGenerated }: PdfGeneratorProps) => {
  const { checkLimit } = usePdfLimit();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

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

      onPdfGenerated();
      setTopic("");
      setPrompt("");
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
              Este é o conteúdo gerado pela IA. Você pode copiá-lo ou fazer o download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
              {generatedContent}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PdfGenerator;
