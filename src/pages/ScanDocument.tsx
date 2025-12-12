import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ScanLine } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import DocumentScanner from "@/components/DocumentScanner";

const ScanDocument = () => {
  const navigate = useNavigate();

  const handlePdfGenerated = () => {
    toast({
      title: "Documento Escaneado!",
      description: "Seu PDF foi criado com sucesso. Você pode encontrá-lo na biblioteca do dashboard.",
    });
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
          <div className="flex items-center gap-3 mb-2">
            <ScanLine className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Escanear Documento</h1>
          </div>
          <p className="text-muted-foreground">
            Use a câmera do seu dispositivo ou faça upload de imagens para criar um PDF com múltiplas páginas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scanner de Documentos</CardTitle>
            <CardDescription>
              Capture páginas com a câmera ou faça upload de imagens existentes. Você pode reordenar as páginas antes de gerar o PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentScanner onPdfCreated={handlePdfGenerated} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ScanDocument;
