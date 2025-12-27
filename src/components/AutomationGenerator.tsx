import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import { toast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";
import { useAutomationLimit } from "@/hooks/useAutomationLimit";
import { useAuth } from "@/hooks/useAuth";

interface AutomationGeneratorProps {
  onAutomationGenerated: () => void;
}

const AutomationGenerator = ({ onAutomationGenerated }: AutomationGeneratorProps) => {
  const { checkLimit } = useAutomationLimit();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o que você deseja que a IA faça.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sessão não encontrada",
        description: "Faça login novamente para usar a automação.",
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
      const { data, error } = await invokeEdgeFunction("generate-automation", {
        body: { prompt },
      });

      if (error) throw error;

      setGeneratedContent(data.content);

      // Update profile automations used count (both total and daily)
      const { data: profile } = await supabase
        .from("profiles")
        .select("automations_used, automations_used_today")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            automations_used: (profile.automations_used || 0) + 1,
            automations_used_today: (profile.automations_used_today || 0) + 1,
          })
          .eq("id", user.id);
      }

      toast({
        title: "Automação Gerada!",
        description: "Sua automação foi processada com sucesso.",
      });

      onAutomationGenerated();
      setPrompt("");
    } catch (error: any) {
      console.error("Error generating automation:", error);
      toast({
        title: "Erro ao processar automação",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
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
            <Zap className="w-5 h-5" />
            Automação com IA
          </CardTitle>
          <CardDescription>
            Peça o que quiser para a inteligência artificial fazer por você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">O que você deseja automatizar? *</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Crie uma lista de ideias de posts para redes sociais sobre tecnologia, ou resuma este texto, ou gere um plano de estudos, etc..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={6}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Executar Automação'
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Automação</CardTitle>
            <CardDescription>
              Este é o resultado gerado pela IA.
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

export default AutomationGenerator;
