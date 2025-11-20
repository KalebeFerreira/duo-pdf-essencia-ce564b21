import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Image as ImageIcon, Sparkles } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";
import PdfGenerator from "@/components/PdfGenerator";

const CreatePdf = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [activeTab, setActiveTab] = useState("images");

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

  const handlePdfGenerated = () => {
    toast({
      title: "PDF Criado!",
      description: "Seu PDF foi criado com sucesso. Você pode encontrá-lo na biblioteca do dashboard.",
    });
    navigate("/dashboard");
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePdf;
