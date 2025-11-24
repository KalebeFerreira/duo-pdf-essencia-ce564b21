import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Circle, IText, Image as FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Type, Square, Circle as CircleIcon, Image as ImageIcon, Download, Sparkles, Palette } from "lucide-react";
import jsPDF from "jspdf";

interface DesignCanvasProps {
  selectedTemplate: string | null;
}

const templates = {
  flyer: { width: 1748, height: 2480, bleed: 35, name: "Flyer A5" },
  "business-card": { width: 1063, height: 591, bleed: 24, name: "Cartão de Visita" },
  pamphlet: { width: 2480, height: 3508, bleed: 35, name: "Panfleto A4" },
};

const DesignCanvas = ({ selectedTemplate }: DesignCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [bleedMargin, setBleedMargin] = useState(3);

  const currentTemplate = selectedTemplate ? templates[selectedTemplate as keyof typeof templates] : templates.flyer;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: Math.min(800, currentTemplate.width / 2),
      height: Math.min(600, currentTemplate.height / 2),
      backgroundColor: "#ffffff",
    });

    // Add bleed guides
    const bleedRect = new Rect({
      left: bleedMargin * 10,
      top: bleedMargin * 10,
      width: canvas.width! - bleedMargin * 20,
      height: canvas.height! - bleedMargin * 20,
      fill: "transparent",
      stroke: "#ff0000",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });
    canvas.add(bleedRect);

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
        FabricImage.fromURL(imgUrl).then((img) => {
          img.scaleToWidth(300);
          fabricCanvas.add(img);
          toast({ title: "Imagem adicionada" });
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Digite uma descrição", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-design-ai", {
        body: { prompt: aiPrompt, template: selectedTemplate || "flyer" },
      });

      if (error) throw error;

      if (data.imageUrl) {
        FabricImage.fromURL(data.imageUrl).then((img) => {
          if (!fabricCanvas) return;
          img.scaleToWidth(fabricCanvas.width! - 40);
          img.set({ left: 20, top: 20 });
          fabricCanvas.add(img);
          toast({ title: "Arte gerada com sucesso!" });
        });
      }
    } catch (error: any) {
      console.error("Erro ao gerar arte:", error);
      toast({
        title: "Erro ao gerar arte",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = () => {
    if (!fabricCanvas) return;

    const pdf = new jsPDF({
      orientation: currentTemplate.width > currentTemplate.height ? "landscape" : "portrait",
      unit: "mm",
      format: [currentTemplate.width / 10, currentTemplate.height / 10],
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
      currentTemplate.width / 10,
      currentTemplate.height / 10
    );

    pdf.save(`design-${selectedTemplate || "flyer"}.pdf`);
    toast({ title: "PDF exportado com sucesso!" });
  };

  return (
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
          <Button className="w-full" onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {/* Canvas Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Área de Trabalho</CardTitle>
          <CardDescription>
            Dimensões: {currentTemplate.width / 10}x{currentTemplate.height / 10}mm
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignCanvas;
