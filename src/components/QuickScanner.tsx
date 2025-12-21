import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, FileText, Loader2, Plus, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePdfLimit } from "@/hooks/usePdfLimit";
import { useUserProfile } from "@/hooks/useUserProfile";
import { addWatermarkToPdf } from "@/utils/pdfWatermark";
import jsPDF from "jspdf";

interface ScannedPage {
  id: string;
  dataUrl: string;
  name: string;
}

interface QuickScannerProps {
  onPdfCreated?: (pdfContent?: string) => void;
}

const QuickScanner = ({ onPdfCreated }: QuickScannerProps) => {
  const { user } = useAuth();
  const { checkLimit, profile: pdfProfile } = usePdfLimit();
  const { profile } = useUserProfile();
  
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoConvert, setAutoConvert] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const batchCameraInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const isFreePlan = !profile?.plan || profile.plan === 'free';

  // Handle file selection (batch support)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione arquivos de imagem válidos.",
        variant: "destructive",
      });
      return;
    }

    imageFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const pageNum = pages.length + index + 1;
        setPages((prev) => [...prev, { 
          id: generateId(), 
          dataUrl, 
          name: `Página ${pageNum}` 
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
    
    toast({
      title: "Imagens adicionadas!",
      description: `${imageFiles.length} imagem(ns) adicionada(s).`,
    });
  };

  // Handle single camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const pageNumber = pages.length + 1;
      
      setPages((prev) => [...prev, { 
        id: generateId(), 
        dataUrl, 
        name: `Página ${pageNumber}` 
      }]);

      toast({
        title: "Página escaneada!",
        description: `Página ${pageNumber} adicionada.`,
      });
    };
    reader.readAsDataURL(file);

    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Handle batch camera capture (multiple photos in sequence)
  const handleBatchCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const pageNum = pages.length + index + 1;
        setPages((prev) => [...prev, { 
          id: generateId(), 
          dataUrl, 
          name: `Página ${pageNum}` 
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (batchCameraInputRef.current) batchCameraInputRef.current.value = "";
    
    if (files.length > 0) {
      toast({
        title: "Fotos capturadas!",
        description: `${files.length} foto(s) adicionada(s).`,
      });
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  };

  const movePage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= pages.length) return;
    
    setPages((prev) => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);
      return newPages;
    });
  };

  const clearAll = () => {
    setPages([]);
    setTitle("");
  };

  const generatePdf = async () => {
    if (pages.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma página para criar o PDF.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um título para o documento.",
        variant: "destructive",
      });
      return;
    }

    const canCreate = await checkLimit();
    if (!canCreate) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de PDFs do seu plano.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        const page = pages[i];
        
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            let imgWidth = img.width;
            let imgHeight = img.height;

            // Scale to fit page
            const widthRatio = maxWidth / imgWidth;
            const heightRatio = maxHeight / imgHeight;
            const ratio = Math.min(widthRatio, heightRatio);

            imgWidth *= ratio;
            imgHeight *= ratio;

            // Center image
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(page.dataUrl, 'JPEG', x, y, imgWidth, imgHeight);
            resolve();
          };
          img.src = page.dataUrl;
        });
      }

      // Add watermark for free plan
      addWatermarkToPdf(pdf, isFreePlan);

      const pdfDataUrl = pdf.output('dataurlstring');

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('documents')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          file_url: pdfDataUrl,
          template: 'scanner',
        });

      if (saveError) throw saveError;

      // Update PDF usage count
      if (user?.id) {
        const currentUsed = pdfProfile?.pdfs_used_today || 0;
        await supabase
          .from('profiles')
          .update({ pdfs_used_today: currentUsed + 1 })
          .eq('id', user.id);
      }

      toast({
        title: "PDF criado com sucesso!",
        description: `"${title}" foi salvo na sua biblioteca.`,
      });

      setPages([]);
      setTitle("");
      
      if (onPdfCreated) {
        onPdfCreated(pdfDataUrl);
      }

    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({
        title: "Erro ao criar PDF",
        description: error.message || "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden inputs for camera/file */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <input
        ref={batchCameraInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleBatchCapture}
      />

      {/* Title input */}
      <div className="space-y-2">
        <Label htmlFor="scan-title">Título do Documento</Label>
        <Input
          id="scan-title"
          placeholder="Ex: Contrato, Documento, Recibo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Action buttons - Mobile optimized */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          className="h-20 flex-col gap-2"
        >
          <Camera className="w-6 h-6" />
          <span className="text-sm">Escanear</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-20 flex-col gap-2"
        >
          <Upload className="w-6 h-6" />
          <span className="text-sm">Galeria</span>
        </Button>
      </div>

      {/* Quick add more button */}
      {pages.length > 0 && (
        <Button
          variant="secondary"
          onClick={() => cameraInputRef.current?.click()}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar mais páginas ({pages.length} adicionada{pages.length > 1 ? 's' : ''})
        </Button>
      )}

      {/* Pages preview */}
      {pages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Páginas ({pages.length})</Label>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {pages.map((page, index) => (
              <Card key={page.id} className="relative group overflow-hidden">
                <CardContent className="p-0">
                  <img
                    src={page.dataUrl}
                    alt={page.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {index > 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                        onClick={() => movePage(index, 'up')}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                    )}
                    {index < pages.length - 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                        onClick={() => movePage(index, 'down')}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white hover:text-red-400 hover:bg-white/20"
                      onClick={() => removePage(page.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                    {index + 1}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Generate PDF button */}
      <Button
        onClick={generatePdf}
        disabled={isGenerating || pages.length === 0 || !title.trim()}
        className="w-full h-12 gap-2"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Criando PDF...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            Criar PDF ({pages.length} página{pages.length !== 1 ? 's' : ''})
          </>
        )}
      </Button>

      {/* Mobile tip */}
      <p className="text-xs text-muted-foreground text-center">
        💡 Dica: Use o botão "Escanear" para capturar documentos com a câmera do seu dispositivo
      </p>
    </div>
  );
};

export default QuickScanner;
