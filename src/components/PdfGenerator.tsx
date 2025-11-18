import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";

interface PdfGeneratorProps {
  onPdfGenerated: () => void;
}

const PdfGenerator = ({ onPdfGenerated }: PdfGeneratorProps) => {
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

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-content', {
        body: { topic, prompt: prompt || undefined }
      });

      if (error) throw error;

      setGeneratedContent(data.content);

      // Save document to database
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title: topic,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (insertError) throw insertError;

      // Update profile PDFs used count
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pdfs_used')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ pdfs_used: (profile.pdfs_used || 0) + 1 })
            .eq('id', user.id);
        }
      }

      toast({
        title: "PDF Gerado!",
        description: "Seu conteúdo foi gerado com sucesso.",
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
