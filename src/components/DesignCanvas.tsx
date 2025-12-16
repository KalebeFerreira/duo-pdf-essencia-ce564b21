import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, Image as FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Type, Square, Circle as CircleIcon, Image as ImageIcon, Download, Sparkles, Wand2, FileImage, FileText, FileSpreadsheet, ChevronDown, Loader2 } from "lucide-react";
import { PhotoEditor } from "./PhotoEditor";
import jsPDF from "jspdf";
import { predefinedTemplates } from "@/utils/designTemplates";
import { useAuth } from "@/hooks/useAuth";
import { checkIsFreePlan, addWatermarkToPdf } from "@/utils/pdfWatermark";

interface DesignCanvasProps {
  selectedTemplate: string | null;
}

const DesignCanvas = ({ selectedTemplate }: DesignCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [bleedMargin, setBleedMargin] = useState(3);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isFreePlan, setIsFreePlan] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const currentTemplate = predefinedTemplates.find(t => t.id === selectedTemplate) || predefinedTemplates[0];

  // Check user plan
  useEffect(() => {
    const checkPlan = async () => {
      const freePlan = await checkIsFreePlan(supabase, user?.id);
      setIsFreePlan(freePlan);
    };
    checkPlan();
  }, [user?.id]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scaleFactor = Math.min(800 / currentTemplate.dimensions.width, 600 / currentTemplate.dimensions.height);
    const canvasWidth = currentTemplate.dimensions.width * scaleFactor;
    const canvasHeight = currentTemplate.dimensions.height * scaleFactor;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
    });

    // Add bleed guides
    const bleedRect = new Rect({
      left: bleedMargin * 10 * scaleFactor,
      top: bleedMargin * 10 * scaleFactor,
      width: canvasWidth - bleedMargin * 20 * scaleFactor,
      height: canvasHeight - bleedMargin * 20 * scaleFactor,
      fill: "transparent",
      stroke: "#ff0000",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(bleedRect);

    // Load predefined template objects
    const templateObjects = currentTemplate.objects();
    templateObjects.forEach((obj) => {
      obj.scaleX = scaleFactor;
      obj.scaleY = scaleFactor;
      obj.left = (obj.left || 0) * scaleFactor;
      obj.top = (obj.top || 0) * scaleFactor;
      canvas.add(obj);
    });

    canvas.renderAll();
    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [selectedTemplate, currentTemplate, bleedMargin]);

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new IText("Digite aqui", {
      left: 100,
      top: 100,
      fill: activeColor,
      fontSize: 32,
      fontFamily: "Arial",
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    toast({ title: "Texto adicionado" });
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: activeColor,
      width: 200,
      height: 150,
    });
    fabricCanvas.add(rect);
    toast({ title: "Retângulo adicionado" });
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: activeColor,
      radius: 75,
    });
    fabricCanvas.add(circle);
    toast({ title: "Círculo adicionado" });
  };

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvas) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        addImageToCanvas(imgUrl);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addImageToCanvas = (imgUrl: string) => {
    if (!fabricCanvas) return;
    FabricImage.fromURL(imgUrl).then((img) => {
      img.scaleToWidth(300);
      fabricCanvas.add(img);
      toast({ title: "Imagem adicionada" });
    });
  };

  const openPhotoEditor = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setPhotoFile(file);
        setShowPhotoEditor(true);
      }
    };
    input.click();
  };

  const handlePhotoEditorSave = (blob: Blob) => {
    const imgUrl = URL.createObjectURL(blob);
    addImageToCanvas(imgUrl);
  };

  const generateWithAI = async () => {
    const maxRetries = 3;
    if (!aiPrompt.trim()) {
      toast({ title: "Digite uma descrição", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    const attemptGeneration = async (): Promise<boolean> => {
      try {
        // Get the current session to include the access token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast({
            title: "Sessão expirada",
            description: "Faça login novamente para gerar designs",
            variant: "destructive",
          });
          return true; // Don't retry - need to login
        }

        const { data, error } = await supabase.functions.invoke("generate-design-ai", {
          body: { prompt: aiPrompt, template: selectedTemplate || "flyer" },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // Check for error responses from the edge function (in data or error)
        const errorData = data?.error ? data : (error && typeof error === 'object' && 'error' in error) ? error : null;
        
        if (errorData?.error || errorData?.code) {
          if (errorData.code === "NO_CREDITS") {
            toast({
              title: "Créditos Esgotados",
              description: "Você precisa adicionar créditos na sua conta Lovable para usar a IA. Acesse Settings → Workspace → Usage",
              variant: "destructive",
            });
            return true; // Don't retry for credit issues
          } else if (errorData.code === "RATE_LIMIT") {
            toast({
              title: "Limite Excedido",
              description: "Aguarde alguns instantes antes de tentar novamente",
              variant: "destructive",
            });
            return true; // Don't retry for rate limit
          } else {
            // Other errors - can retry
            return false;
          }
        }

        if (error && !errorData) {
          return false; // Can retry
        }

        if (data?.imageUrl) {
          FabricImage.fromURL(data.imageUrl).then((img) => {
            if (!fabricCanvas) return;
            img.scaleToWidth(fabricCanvas.width! - 40);
            img.set({ left: 20, top: 20 });
            fabricCanvas.add(img);
            toast({ title: "Arte gerada com sucesso!" });
          });
          return true; // Success
        }
        
        return false; // No image, can retry
      } catch (error: any) {
        console.error("Erro ao gerar arte:", error);
        
        // Parse error message for specific codes
        const errorMessage = error.message || String(error);
        if (errorMessage.includes("NO_CREDITS") || errorMessage.includes("Créditos")) {
          toast({
            title: "Créditos Esgotados",
            description: "Você precisa adicionar créditos na sua conta Lovable. Acesse Settings → Workspace → Usage",
            variant: "destructive",
          });
          return true; // Don't retry for credit issues
        } else if (errorMessage.includes("RATE_LIMIT")) {
          toast({
            title: "Limite Excedido",
            description: "Aguarde alguns instantes antes de tentar novamente",
            variant: "destructive",
          });
          return true; // Don't retry for rate limit
        }
        
        return false; // Can retry for other errors
      }
    };

    try {
      let success = await attemptGeneration();
      let currentRetry = 0;
      
      while (!success && currentRetry < maxRetries) {
        currentRetry++;
        const delay = Math.pow(2, currentRetry) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        toast({
          title: `Tentativa ${currentRetry + 1} de ${maxRetries + 1}`,
          description: `Aguardando ${delay / 1000}s antes de tentar novamente...`,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        success = await attemptGeneration();
      }
      
      if (!success) {
        toast({
          title: "Erro ao gerar arte",
          description: `Não foi possível gerar após ${maxRetries + 1} tentativas. Tente novamente mais tarde.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = () => {
    if (!fabricCanvas) return;

    const pdf = new jsPDF({
      orientation: currentTemplate.dimensions.width > currentTemplate.dimensions.height ? "landscape" : "portrait",
      unit: "mm",
      format: [currentTemplate.dimensions.width / 10, currentTemplate.dimensions.height / 10],
    });

    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      0,
      currentTemplate.dimensions.width / 10,
      currentTemplate.dimensions.height / 10
    );

    // Add watermark for free plan users
    addWatermarkToPdf(pdf, isFreePlan);

    pdf.save(`design-${selectedTemplate || "template"}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  };

  const exportToImage = (format: "jpeg" | "png") => {
    if (!fabricCanvas) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: format,
      quality: 1,
      multiplier: 2,
    });

    // Create download link
    const link = document.createElement("a");
    link.download = `design-${selectedTemplate || "template"}.${format === "jpeg" ? "jpg" : "png"}`;
    link.href = dataUrl;
    link.click();

    toast({ title: `${format.toUpperCase()} exportado com sucesso!` });
  };

  const saveToGallery = async () => {
    if (!fabricCanvas) return;

    try {
      const dataUrl = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Try to use Web Share API for mobile
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `design-${selectedTemplate || "template"}.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Design Exportado",
            text: "Minha arte criada no Essência Duo",
          });
          toast({ title: "Imagem compartilhada/salva com sucesso!" });
          return;
        }
      }

      // Fallback: download directly
      const link = document.createElement("a");
      link.download = `design-${selectedTemplate || "template"}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Imagem salva com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro ao salvar imagem", variant: "destructive" });
    }
  };

  const exportToFormat = async (format: "docx" | "xlsx") => {
    if (!fabricCanvas) return;

    setIsExporting(true);
    try {
      const dataUrl = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 2,
      });

      // First convert to PNG blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Upload to convert-file edge function
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke("convert-file", {
          body: {
            file: base64data,
            fileName: `design.png`,
            inputFormat: "png",
            outputFormat: format,
          },
        });

        if (error) throw error;

        if (data?.downloadUrl) {
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.download = `design-${selectedTemplate || "template"}.${format}`;
          link.click();
          toast({ title: `${format.toUpperCase()} exportado com sucesso!` });
        } else if (data?.error) {
          throw new Error(data.error);
        }
        
        setIsExporting(false);
      };
    } catch (error: any) {
      console.error("Erro ao converter:", error);
      toast({ 
        title: "Erro ao exportar", 
        description: error.message || "Não foi possível converter o arquivo",
        variant: "destructive" 
      });
      setIsExporting(false);
    }
  };

  return (
    <>
      <PhotoEditor
        isOpen={showPhotoEditor}
        onClose={() => {
          setShowPhotoEditor(false);
          setPhotoFile(null);
        }}
        imageFile={photoFile}
        onSave={handlePhotoEditorSave}
      />
      
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 mt-6">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ferramentas</CardTitle>
          <CardDescription>
            Template: {currentTemplate.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Cor Ativa</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <Separator />

          {/* Add Elements */}
          <div className="space-y-2">
            <Label>Adicionar Elementos</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={addText}>
                <Type className="w-4 h-4 mr-2" />
                Texto
              </Button>
              <Button variant="outline" size="sm" onClick={addRectangle}>
                <Square className="w-4 h-4 mr-2" />
                Retângulo
              </Button>
              <Button variant="outline" size="sm" onClick={addCircle}>
                <CircleIcon className="w-4 h-4 mr-2" />
                Círculo
              </Button>
              <Button variant="outline" size="sm" onClick={addImage}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagem
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openPhotoEditor}
              className="w-full mt-2"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Editor de Fotos
            </Button>
          </div>

          <Separator />

          {/* Bleed Margin */}
          <div className="space-y-2">
            <Label>Margem de Sangria: {bleedMargin}mm</Label>
            <Slider
              value={[bleedMargin]}
              onValueChange={(value) => setBleedMargin(value[0])}
              min={0}
              max={10}
              step={1}
            />
          </div>

          <Separator />

          {/* AI Generator */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Gerar com IA
            </Label>
            <Textarea
              placeholder="Descreva a arte que deseja gerar..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
            />
            <Button
              className="w-full"
              onClick={generateWithAI}
              disabled={isGenerating}
            >
              {isGenerating ? "Gerando..." : "Gerar Arte"}
            </Button>
          </div>

          <Separator />

          {/* Export */}
          <div className="space-y-2">
            <Label>Exportar Design</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToImage("jpeg")} disabled={isExporting}>
                <FileImage className="w-4 h-4 mr-2" />
                JPG
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToImage("png")} disabled={isExporting}>
                <FileImage className="w-4 h-4 mr-2" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={saveToGallery} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Galeria
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportToFormat("docx")} 
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Word
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportToFormat("xlsx")} 
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Área de Trabalho</CardTitle>
          <CardDescription>
            {currentTemplate.name} - {currentTemplate.dimensions.width / 10}x{currentTemplate.dimensions.height / 10}mm
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default DesignCanvas;
