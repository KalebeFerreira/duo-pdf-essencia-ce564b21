import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ImageIcon, Loader2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TestImageApi = () => {
  const { session, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const examplePrompts = [
    "Um logotipo minimalista para uma cafeteria moderna",
    "Banner promocional de verão com cores vibrantes",
    "Cartão de visita elegante para advogado",
    "Flyer de festa com tema neon",
    "Ilustração de um gato astronauta no espaço",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Digite uma descrição para gerar a imagem.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    const startTime = Date.now();

    try {
      if (authLoading || !session?.access_token) {
        toast({
          title: "Não autenticado",
          description: "Aguarde a sessão carregar (ou faça login novamente).",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('generate-design-ai', {
        body: { prompt, template: 'flyer' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Imagem gerada!",
          description: `Tempo de resposta: ${((endTime - startTime) / 1000).toFixed(2)}s`,
        });
      } else {
        throw new Error("Nenhuma imagem retornada");
      }
    } catch (err: any) {
      console.error("Erro ao gerar imagem:", err);
      setError(err.message || "Erro desconhecido");
      toast({
        title: "Erro na geração",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `imagem-gerada-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Teste da API de Imagens</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                <CardTitle>Gerador de Imagens IA</CardTitle>
              </div>
              <CardDescription>
                Teste a API Lovable AI (Gemini) para geração de imagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Prompt</label>
                <Textarea
                  placeholder="Descreva a imagem que você quer gerar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Exemplos de prompts:</label>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(example)}
                      className="text-xs"
                    >
                      {example.substring(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>

              {responseTime && (
                <p className="text-sm text-muted-foreground text-center">
                  Tempo de resposta: {(responseTime / 1000).toFixed(2)}s
                </p>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">Erro:</p>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                A imagem gerada aparecerá aqui
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Gerando imagem...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Isso pode levar alguns segundos
                    </p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="space-y-4">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={generatedImage} 
                      alt="Imagem gerada" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setGeneratedImage(null);
                        setResponseTime(null);
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma imagem gerada</p>
                    <p className="text-xs mt-1">Digite um prompt e clique em "Gerar"</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Informações da API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Modelo</p>
                <p className="text-muted-foreground">google/gemini-2.5-flash-image-preview</p>
              </div>
              <div>
                <p className="font-medium">Gateway</p>
                <p className="text-muted-foreground">Lovable AI Gateway</p>
              </div>
              <div>
                <p className="font-medium">Edge Function</p>
                <p className="text-muted-foreground">generate-design-ai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TestImageApi;
