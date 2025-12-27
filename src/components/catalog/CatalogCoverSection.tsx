import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Image, Sparkles, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";

interface CatalogCoverSectionProps {
  title: string;
  coverImage?: string;
  onTitleChange: (title: string) => void;
  onCoverImageChange: (url: string) => void;
  dragHandleProps?: any;
}

const CatalogCoverSection = ({
  title,
  coverImage,
  onTitleChange,
  onCoverImageChange,
  dragHandleProps,
}: CatalogCoverSectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCoverImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      const { data, error } = await invokeEdgeFunction('generate-catalog-image', {
        body: { prompt: imagePrompt }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onCoverImageChange(data.imageUrl);
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
      title="Capa"
      icon={<Image className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        <div>
          <Label>Título do Catálogo</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder=""
            className="mt-1"
          />
        </div>

        <div>
          <Label>Imagem de Capa</Label>
          {coverImage && (
            <div className="mt-2 mb-3">
              <img
                src={coverImage}
                alt="Capa"
                className="w-full max-w-xs h-40 object-cover rounded-lg border"
              />
            </div>
          )}
          
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('cover-upload')?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Enviar Imagem
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Ex: capa elegante para catálogo de joias"
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
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogCoverSection;
