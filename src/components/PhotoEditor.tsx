import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crop, Sun, Filter, RotateCw, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  onSave: (editedBlob: Blob) => void;
}

const filters = [
  { name: "Normal", value: "none" },
  { name: "P&B", value: "grayscale(100%)" },
  { name: "Sépia", value: "sepia(100%)" },
  { name: "Vintage", value: "sepia(50%) contrast(120%)" },
  { name: "Frio", value: "hue-rotate(180deg) saturate(120%)" },
  { name: "Quente", value: "hue-rotate(25deg) saturate(130%)" },
];

export const PhotoEditor = ({ isOpen, onClose, imageFile, onSave }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [rotation, setRotation] = useState(0);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!imageFile || !isOpen) return;

    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      drawImage(img);
    };
    img.src = URL.createObjectURL(imageFile);

    return () => {
      if (img.src) URL.revokeObjectURL(img.src);
    };
  }, [imageFile, isOpen]);

  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [brightness, contrast, saturation, selectedFilter, rotation, originalImage]);

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar tamanho do canvas
    const maxWidth = 600;
    const maxHeight = 400;
    let width = img.width;
    let height = img.height;

    // Ajustar para rotação
    if (rotation === 90 || rotation === 270) {
      [width, height] = [height, width];
    }

    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    canvas.width = width * scale;
    canvas.height = height * scale;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Salvar contexto
    ctx.save();

    // Aplicar rotação
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Aplicar filtros CSS
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${selectedFilter}`;

    // Desenhar imagem
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    // Restaurar contexto
    ctx.restore();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSelectedFilter("none");
    setRotation(0);
    setCropMode(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob);
            toast({
              title: "Foto editada!",
              description: "Suas alterações foram aplicadas com sucesso.",
            });
            onClose();
          }
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error saving edited photo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor de Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canvas Preview */}
          <div className="flex justify-center items-center bg-muted rounded-lg p-4 min-h-[400px]">
            <canvas
              ref={canvasRef}
              className="max-w-full border border-border rounded shadow-lg"
            />
          </div>

          {/* Editor Controls */}
          <Tabs defaultValue="adjust" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="adjust" className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Ajustes
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </TabsTrigger>
              <TabsTrigger value="transform" className="flex items-center gap-2">
                <Crop className="w-4 h-4" />
                Transformar
              </TabsTrigger>
            </TabsList>

            {/* Ajustes */}
            <TabsContent value="adjust" className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Brilho: {brightness}%</Label>
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Contraste: {contrast}%</Label>
                <Slider
                  value={[contrast]}
                  onValueChange={(value) => setContrast(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Saturação: {saturation}%</Label>
                <Slider
                  value={[saturation]}
                  onValueChange={(value) => setSaturation(value[0])}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Filtros */}
            <TabsContent value="filters" className="pt-4">
              <div className="grid grid-cols-3 gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`relative p-4 rounded-lg border-2 transition-all hover:border-primary ${
                      selectedFilter === filter.value
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <div className="text-sm font-medium">{filter.name}</div>
                    {selectedFilter === filter.value && (
                      <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Transformar */}
            <TabsContent value="transform" className="space-y-4 pt-4">
              <Button
                onClick={handleRotate}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Girar 90° ({rotation}°)
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
