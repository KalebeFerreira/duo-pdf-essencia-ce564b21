import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Image as ImageIcon, Sparkles, FileType, Download, Loader2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";
import PdfGenerator from "@/components/PdfGenerator";
import { supabase } from "@/integrations/supabase/client";

const CreatePdf = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState("images");
  const [generatedPdfContent, setGeneratedPdfContent] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleTabChange = (value: string) => {
    if (value === "ai" && profile?.plan === "free") {
      toast({
        title: "Recurso Premium",
        description: "A automação com IA está disponível apenas nos planos pagos. Faça upgrade para acessar.",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(value);
  };

  const handlePdfGenerated = (pdfContent?: string) => {
    if (pdfContent) {
      setGeneratedPdfContent(pdfContent);
    }
    toast({
      title: "PDF Criado!",
      description: "Seu PDF foi criado com sucesso. Você pode encontrá-lo na biblioteca do dashboard.",
    });
  };

  const handleConvertPdf = async (format: string) => {
    if (!generatedPdfContent) {
      toast({
        title: "Erro",
        description: "Nenhum PDF gerado para converter.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-file', {
        body: {
          fileName: `documento.pdf`,
          fileBase64: generatedPdfContent.split(',')[1] || generatedPdfContent,
          inputFormat: 'pdf',
          outputFormat: format,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Não foi possível converter o arquivo.");

      if (data?.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.outputFileName || `documento.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Conversão concluída!",
          description: `PDF convertido para ${format.toUpperCase()} com sucesso.`,
        });
      } else {
        throw new Error("Conversão concluída, mas nenhum link de download foi retornado.");
      }

    } catch (error: any) {
      console.error('Conversion error:', error);
      toast({
        title: "Erro na conversão",
        description: error.message || "Não foi possível converter o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar Novo PDF</h1>
          <p className="text-muted-foreground">
            Escolha como deseja criar seu PDF: a partir de imagens ou com automação por IA
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Método de Criação</CardTitle>
            <CardDescription>Selecione o método que melhor atende suas necessidades</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Converter Imagens
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2" disabled={profile?.plan === "free"}>
                  <Sparkles className="w-4 h-4" />
                  Automação com IA
                  {profile?.plan === "free" && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      Premium
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="mt-6">
                <ImageToPdfConverter onPdfCreated={handlePdfGenerated} />
              </TabsContent>

              <TabsContent value="ai" className="mt-6">
                {profile?.plan !== "free" ? (
                  <PdfGenerator onPdfGenerated={handlePdfGenerated} />
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Recurso Premium</h3>
                    <p className="text-muted-foreground mb-4">
                      A automação com IA está disponível apenas nos planos pagos.
                    </p>
                    <Button onClick={() => navigate("/#pricing")}>Ver Planos</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Conversion Options */}
            {generatedPdfContent && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileType className="w-5 h-5" />
                  Converter PDF para outros formatos
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleConvertPdf('docx')}
                    disabled={isConverting}
                  >
                    {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Word (.docx)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleConvertPdf('xlsx')}
                    disabled={isConverting}
                  >
                    {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleConvertPdf('pptx')}
                    disabled={isConverting}
                  >
                    {isConverting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    PowerPoint (.pptx)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePdf;
