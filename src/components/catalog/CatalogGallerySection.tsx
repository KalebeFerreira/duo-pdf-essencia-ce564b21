import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Images, Plus, Sparkles, Trash2, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";

interface CatalogGallerySectionProps {
  gallery: string[];
  onGalleryChange: (images: string[]) => void;
  dragHandleProps?: any;
}

const CatalogGallerySection = ({
  gallery,
  onGalleryChange,
  dragHandleProps,
}: CatalogGallerySectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          onGalleryChange([...gallery, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    onGalleryChange(gallery.filter((_, i) => i !== index));
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição para a imagem",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction("generate-catalog-image", {
        body: { prompt: imagePrompt },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      onGalleryChange([...gallery, data.imageUrl]);
      setImagePrompt('');
      toast({
        title: "Sucesso",
        description: "Imagem gerada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar imagem",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CatalogSectionCard
      title="Galeria de Imagens"
      icon={<Images className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* Upload */}
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
            id="gallery-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('gallery-upload')?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Enviar Imagens
          </Button>
        </div>

        {/* AI Generate */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gerar Imagem com IA
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ex: ambiente elegante de salão de beleza"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleGenerateImage}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Gerar"
              )}
            </Button>
          </div>
        </div>

        {/* Gallery Grid */}
        {gallery.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {gallery.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma imagem na galeria
          </p>
        )}
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogGallerySection;
