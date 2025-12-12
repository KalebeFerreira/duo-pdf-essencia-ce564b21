import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Upload, X, FileText, Camera, Image as ImageIcon, ScanText, Loader2, Copy, Check, Download, Trash2, Eye, FolderOpen, Sliders, RotateCw, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePdfLimit } from "@/hooks/usePdfLimit";
import { useDocuments } from "@/hooks/useDocuments";
import { useUserProfile } from "@/hooks/useUserProfile";
import PdfViewModal from "@/components/PdfViewModal";
import { addWatermarkToPdf } from "@/utils/pdfWatermark";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface ScannedPage {
  id: string;
  dataUrl: string;
  name: string;
  extractedText?: string;
  filters?: ImageFilters;
}

interface DocumentScannerProps {
  onPdfCreated?: () => void;
}

const MONTHLY_SCAN_LIMIT_FREE = 10;

const DocumentScanner = ({ onPdfCreated }: DocumentScannerProps) => {
  const { user } = useAuth();
  const { checkLimit } = usePdfLimit();
  const { documents, isLoading: isLoadingDocs, deleteDocument } = useDocuments();
  const { profile } = useUserProfile();
  
  // Check if user is on free plan
  const isFreePlan = !profile?.plan || profile.plan === 'free';
  
  // Count scanned documents this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const scannedThisMonth = documents?.filter(doc => {
    const docDate = new Date(doc.created_at || '');
    return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear;
  }).length || 0;
  
  const remainingScans = Math.max(0, MONTHLY_SCAN_LIMIT_FREE - scannedThisMonth);
  const hasReachedLimit = isFreePlan && scannedThisMonth >= MONTHLY_SCAN_LIMIT_FREE;
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrPageId, setOcrPageId] = useState<string | null>(null);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ title: string; content: string } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempFilters, setTempFilters] = useState<ImageFilters>({ brightness: 100, contrast: 100, saturation: 100 });
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Export all extracted text as TXT
  const exportAllTextAsTxt = () => {
    const pagesWithText = pages.filter(p => p.extractedText);
    
    if (pagesWithText.length === 0) {
      toast({
        title: "Nenhum texto para exportar",
        description: "Extraia o texto de pelo menos uma página primeiro usando o botão OCR.",
        variant: "destructive",
      });
      return;
    }

    const allText = pagesWithText
      .map((page, index) => `--- Página ${index + 1}: ${page.name} ---\n\n${page.extractedText}`)
      .join('\n\n\n');

    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'documento'}_texto_extraido.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Texto exportado!",
      description: `${pagesWithText.length} página(s) exportada(s) como TXT.`,
    });
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      deleteDocument(docId);
      toast({
        title: "Documento excluído",
        description: "O documento foi removido com sucesso.",
      });
    }
  };

  const defaultFilters: ImageFilters = { brightness: 100, contrast: 100, saturation: 100 };

  const openFilterEditor = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setTempFilters(page.filters || defaultFilters);
      setEditingPageId(pageId);
    }
  };

  const applyFiltersToImage = useCallback((dataUrl: string, filters: ImageFilters): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Apply CSS filters
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = dataUrl;
    });
  }, []);

  const saveFilters = async () => {
    if (!editingPageId) return;

    const page = pages.find(p => p.id === editingPageId);
    if (!page) return;

    // Get original image (without filters applied)
    const originalDataUrl = page.dataUrl;
    
    // Apply filters and get new data URL
    const filteredDataUrl = await applyFiltersToImage(originalDataUrl, tempFilters);

    setPages(prev => prev.map(p => 
      p.id === editingPageId 
        ? { ...p, dataUrl: filteredDataUrl, filters: tempFilters }
        : p
    ));

    setEditingPageId(null);
    toast({
      title: "Filtros aplicados!",
      description: "A imagem foi atualizada com os novos ajustes.",
    });
  };

  const resetFilters = () => {
    setTempFilters(defaultFilters);
  };

  const getEditingPage = () => pages.find(p => p.id === editingPageId);

  const extractTextFromPage = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    // If already extracted, just show it
    if (page.extractedText) {
      setOcrText(page.extractedText);
      setOcrPageId(pageId);
      setOcrDialogOpen(true);
      return;
    }

    setIsExtractingOcr(true);
    setOcrPageId(pageId);

    try {
      const { data, error } = await supabase.functions.invoke('extract-text-ocr', {
        body: { imageDataUrl: page.dataUrl, language: 'pt' }
      });

      if (error) throw error;

      const extractedText = data?.text || '';
      
      // Save to page state
      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, extractedText } : p
      ));

      setOcrText(extractedText);
      setOcrDialogOpen(true);

      toast({
        title: "Texto Extraído!",
        description: extractedText.length > 0 
          ? `${extractedText.split(' ').length} palavras detectadas.`
          : "Nenhum texto detectado na imagem.",
      });

    } catch (error: any) {
      console.error('OCR extraction error:', error);
      toast({
        title: "Erro no OCR",
        description: error.message || "Não foi possível extrair o texto da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingOcr(false);
    }
  };

  const [isExtractingAll, setIsExtractingAll] = useState(false);

  const extractTextFromAllPages = async () => {
    const pagesToExtract = pages.filter(p => !p.extractedText);
    
    if (pagesToExtract.length === 0 && pages.length > 0) {
      toast({
        title: "Texto já extraído",
        description: "Todas as páginas já tiveram seu texto extraído.",
      });
      return;
    }

    if (pages.length === 0) {
      toast({
        title: "Nenhuma página",
        description: "Adicione páginas antes de extrair o texto.",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingAll(true);

    try {
      let extractedCount = 0;
      
      for (const page of pagesToExtract) {
        try {
          const { data, error } = await supabase.functions.invoke('extract-text-ocr', {
            body: { imageDataUrl: page.dataUrl, language: 'pt' }
          });

          if (error) throw error;

          const extractedText = data?.text || '';
          
          setPages(prev => prev.map(p => 
            p.id === page.id ? { ...p, extractedText } : p
          ));

          if (extractedText.length > 0) {
            extractedCount++;
          }
        } catch (pageError) {
          console.error(`OCR error for page ${page.name}:`, pageError);
        }
      }

      toast({
        title: "Extração concluída!",
        description: `Texto extraído de ${extractedCount} de ${pagesToExtract.length} página(s).`,
      });

    } catch (error: any) {
      console.error('Batch OCR extraction error:', error);
      toast({
        title: "Erro na extração",
        description: error.message || "Ocorreu um erro ao extrair o texto.",
        variant: "destructive",
      });
    } finally {
      setIsExtractingAll(false);
    }
  };

  const copyOcrText = async () => {
    try {
      await navigator.clipboard.writeText(ocrText);
      setCopiedOcr(true);
      setTimeout(() => setCopiedOcr(false), 2000);
      toast({
        title: "Copiado!",
        description: "Texto copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast({
        title: "Aviso",
        description: "Apenas arquivos de imagem são permitidos.",
        variant: "destructive",
      });
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPages((prev) => [...prev, { id: generateId(), dataUrl, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle camera capture using native input - works reliably on all mobile devices
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
        name: `Página ${pageNumber} (Escaneada)` 
      }]);

      toast({
        title: "Página capturada!",
        description: `Página ${pageNumber} adicionada ao documento.`,
      });
    };
    reader.readAsDataURL(file);

    // Reset input to allow capturing the same image again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    
    setPages((prev) => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);
      return newPages;
    });
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
        description: "Por favor, insira um título para o PDF.",
        variant: "destructive",
      });
      return;
    }

    // Check monthly limit for free plan
    if (hasReachedLimit) {
      toast({
        title: "Limite Mensal Atingido",
        description: "Você atingiu o limite de 10 documentos escaneados por mês. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!checkLimit()) {
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = pages[i].dataUrl;

        const imgElement = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = imgData;
        });

        const imgRatio = imgElement.width / imgElement.height;
        const pageRatio = pageWidth / pageHeight;

        let width = pageWidth;
        let height = pageHeight;

        if (imgRatio > pageRatio) {
          height = width / imgRatio;
        } else {
          width = height * imgRatio;
        }

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        pdf.addImage(imgData, "JPEG", x, y, width, height);
      }

      // Add watermark for free plan users
      addWatermarkToPdf(pdf, isFreePlan);

      const pdfBlob = pdf.output("blob");
      const pdfContent = await pdf.output("datauristring");

      if (user) {
        const { error } = await supabase.from("documents").insert({
          user_id: user.id,
          title: title.trim(),
          file_url: pdfContent,
          file_size: pdfBlob.size,
        });

        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("pdfs_used, pdfs_used_today")
          .eq("id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ 
              pdfs_used: (profile.pdfs_used || 0) + 1,
              pdfs_used_today: (profile.pdfs_used_today || 0) + 1
            })
            .eq("id", user.id);
        }
      }

      toast({
        title: "Sucesso!",
        description: "PDF criado e salvo com sucesso.",
      });

      setPages([]);
      setTitle("");

      onPdfCreated?.();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      {/* Limite indicator for free plan */}
      {isFreePlan && (
        <Card className={`border ${hasReachedLimit ? 'border-destructive bg-destructive/5' : 'border-amber-500/50 bg-amber-500/5'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {hasReachedLimit ? (
                  <Lock className="w-5 h-5 text-destructive" />
                ) : (
                  <FileText className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {hasReachedLimit 
                      ? "Limite Mensal Atingido" 
                      : `${remainingScans} de ${MONTHLY_SCAN_LIMIT_FREE} escaneamentos restantes`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasReachedLimit 
                      ? "Faça upgrade para continuar escaneando documentos"
                      : "Plano gratuito - PDFs incluem marca d'água 'Essência Duo'"
                    }
                  </p>
                </div>
              </div>
              <Link to="/pricing">
                <Button size="sm" variant={hasReachedLimit ? "default" : "outline"}>
                  {hasReachedLimit ? "Fazer Upgrade" : "Ver Planos"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="pdf-title">Título do Documento</Label>
        <Input
          id="pdf-title"
          placeholder="Digite o título do seu documento..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={hasReachedLimit}
        />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Upload de Imagens
          </TabsTrigger>
          <TabsTrigger value="camera" className="gap-2">
            <Camera className="w-4 h-4" />
            Usar Câmera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Clique para fazer upload de imagens ou arraste e solte aqui
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, JPEG ou WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </TabsContent>

        <TabsContent value="camera" className="mt-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Toque no botão para abrir a câmera do seu dispositivo e tirar uma foto do documento
            </p>
            <Button onClick={openCamera}>
              <Camera className="w-4 h-4 mr-2" />
              Tirar Foto
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-4">
              A câmera traseira será usada automaticamente para escanear documentos
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {pages.length > 0 && (
        <div className="space-y-2">
          <Label>Páginas do Documento ({pages.length})</Label>
          <p className="text-xs text-muted-foreground">
            Arraste para reordenar as páginas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pages.map((page, index) => (
              <Card key={page.id} className="relative group">
                <CardContent className="p-2">
                  <div className="absolute top-1 left-1 z-10 flex gap-1">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </span>
                    {page.extractedText && (
                      <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded" title="Texto extraído">
                        <ScanText className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <img
                    src={page.dataUrl}
                    alt={`Página ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  {/* Actions always visible on mobile, hover on desktop */}
                  <div className="absolute top-1 right-1 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openFilterEditor(page.id)}
                      title="Ajustar imagem"
                    >
                      <Sliders className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => extractTextFromPage(page.id)}
                      disabled={isExtractingOcr && ocrPageId === page.id}
                      title="Extrair texto (OCR)"
                    >
                      {isExtractingOcr && ocrPageId === page.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ScanText className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePage(index, index - 1)}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePage(index, index + 1)}
                      disabled={index === pages.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removePage(page.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{page.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={extractTextFromAllPages}
            disabled={isExtractingAll}
            variant="secondary"
            className="flex-1"
          >
            {isExtractingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extraindo...
              </>
            ) : (
              <>
                <ScanText className="w-4 h-4 mr-2" />
                Extrair Texto de Todas
              </>
            )}
          </Button>
          
          {pages.some(p => p.extractedText) && (
            <Button
              onClick={exportAllTextAsTxt}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Texto (TXT)
            </Button>
          )}
        </div>
      )}

      <Button
        onClick={generatePdf}
        disabled={isGenerating || pages.length === 0 || !title.trim()}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <FileText className="w-5 h-5 mr-2 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 mr-2" />
            Criar PDF ({pages.length} {pages.length === 1 ? "página" : "páginas"})
          </>
        )}
      </Button>

      {/* Saved Documents Section */}
      {user && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="w-5 h-5" />
              Documentos Salvos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents && documents.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.title || 'Sem título'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at || '').toLocaleDateString('pt-BR')}
                            {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewingDocument({ title: doc.title || '', content: doc.file_url || '' })}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum documento salvo ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* OCR Dialog */}
      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanText className="w-5 h-5" />
              Texto Extraído (OCR)
            </DialogTitle>
            <DialogDescription>
              Texto reconhecido na imagem usando inteligência artificial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={copyOcrText}
                disabled={!ocrText}
              >
                {copiedOcr ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Texto
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Nenhum texto detectado..."
              className="min-h-[300px] font-mono text-sm"
              readOnly={false}
            />
            <p className="text-xs text-muted-foreground">
              {ocrText ? `${ocrText.split(/\s+/).filter(Boolean).length} palavras detectadas` : "Nenhum texto detectado"}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF View Modal */}
      {viewingDocument && (
        <PdfViewModal
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          document={{
            id: 'preview',
            title: viewingDocument.title,
            content: viewingDocument.content,
            created_at: new Date().toISOString(),
          }}
        />
      )}

      {/* Image Filter Editor Dialog */}
      <Dialog open={!!editingPageId} onOpenChange={(open) => !open && setEditingPageId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Ajustar Imagem
            </DialogTitle>
            <DialogDescription>
              Ajuste o brilho, contraste e saturação da imagem escaneada.
            </DialogDescription>
          </DialogHeader>
          
          {editingPageId && getEditingPage() && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={getEditingPage()?.dataUrl}
                  alt="Preview"
                  className="max-h-[300px] object-contain"
                  style={{
                    filter: `brightness(${tempFilters.brightness}%) contrast(${tempFilters.contrast}%) saturate(${tempFilters.saturation}%)`
                  }}
                />
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Brilho</Label>
                    <span className="text-sm text-muted-foreground">{tempFilters.brightness}%</span>
                  </div>
                  <Slider
                    value={[tempFilters.brightness]}
                    onValueChange={([value]) => setTempFilters(prev => ({ ...prev, brightness: value }))}
                    min={50}
                    max={150}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Contraste</Label>
                    <span className="text-sm text-muted-foreground">{tempFilters.contrast}%</span>
                  </div>
                  <Slider
                    value={[tempFilters.contrast]}
                    onValueChange={([value]) => setTempFilters(prev => ({ ...prev, contrast: value }))}
                    min={50}
                    max={150}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Saturação</Label>
                    <span className="text-sm text-muted-foreground">{tempFilters.saturation}%</span>
                  </div>
                  <Slider
                    value={[tempFilters.saturation]}
                    onValueChange={([value]) => setTempFilters(prev => ({ ...prev, saturation: value }))}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetFilters}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingPageId(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveFilters}>
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentScanner;
