import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Clock, FileText, ArrowLeft, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Chapter {
  title: string;
  content: string;
}

interface EbookResult {
  title: string;
  description: string;
  chapters: Chapter[];
  model: string;
  processingTime: number;
  timestamp: string;
}

const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
];

const examplePrompts = [
  "Guia completo de produtividade para empreendedores",
  "Como criar hábitos saudáveis em 30 dias",
  "Marketing digital para pequenos negócios",
  "Inteligência emocional no ambiente de trabalho",
  "Finanças pessoais: do básico ao avançado",
];

export default function TestEbookApi() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("pt");
  const [numChapters, setNumChapters] = useState("5");
  const [model, setModel] = useState("gpt-4o-mini");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EbookResult | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt necessário",
        description: "Por favor, descreva o tema do ebook",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ebook-openai', {
        body: { 
          prompt: prompt.trim(),
          language,
          numChapters: parseInt(numChapters),
          model
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setSelectedChapter(0);
      
      toast({
        title: "Ebook gerado com sucesso!",
        description: `Gerado em ${(data.processingTime / 1000).toFixed(1)}s usando ${data.model}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na geração",
        description: error.message || "Falha ao gerar ebook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Teste de Geração de Ebook</h1>
            <p className="text-muted-foreground">Compare a qualidade do texto usando OpenAI GPT-4o-mini</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Configuração
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para gerar o ebook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tema do Ebook</label>
                <Textarea
                  placeholder="Descreva o tema do ebook que deseja gerar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Idioma</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Capítulos</label>
                  <Select value={numChapters} onValueChange={setNumChapters}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} capítulos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (rápido)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (qualidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando com OpenAI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Ebook
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Exemplos de prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setPrompt(example)}
                    >
                      {example.substring(0, 30)}...
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resultado
              </CardTitle>
              {result && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {(result.processingTime / 1000).toFixed(1)}s
                  </span>
                  <Badge variant="secondary">{result.model}</Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum ebook gerado ainda</p>
                  <p className="text-sm">Configure e clique em "Gerar Ebook"</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Gerando conteúdo com OpenAI...</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{result.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.chapters.map((chapter, index) => (
                      <Button
                        key={index}
                        variant={selectedChapter === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedChapter(index)}
                      >
                        Cap. {index + 1}
                      </Button>
                    ))}
                  </div>

                  {result.chapters[selectedChapter] && (
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h4 className="font-medium mb-3">
                        {result.chapters[selectedChapter].title}
                      </h4>
                      <ScrollArea className="h-[300px]">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {result.chapters[selectedChapter].content.split('\n').map((paragraph, i) => (
                            <p key={i} className="mb-3 text-sm leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
