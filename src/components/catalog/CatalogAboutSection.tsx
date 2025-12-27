import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Sparkles, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";

interface CatalogAboutSectionProps {
  aboutTitle: string;
  aboutText?: string;
  aboutImage?: string;
  onAboutTitleChange: (title: string) => void;
  onAboutTextChange: (text: string) => void;
  onAboutImageChange: (url: string) => void;
  dragHandleProps?: any;
}

const CatalogAboutSection = ({
  aboutTitle,
  aboutText,
  aboutImage,
  onAboutTitleChange,
  onAboutTextChange,
  onAboutImageChange,
  dragHandleProps,
}: CatalogAboutSectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAboutImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateText = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite um contexto para gerar o texto",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction('generate-catalog-content', {
        body: { type: 'about', prompt: aiPrompt }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onAboutTextChange(data.content);
      toast({
        title: "Sucesso",
        description: "Texto gerado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar texto",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CatalogSectionCard
      title="Sobre"
      icon={<User className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        <div>
          <Label>Título da Seção</Label>
          <Input
            value={aboutTitle}
            onChange={(e) => onAboutTitleChange(e.target.value)}
            placeholder="Ex: Sobre Nós, Quem Somos"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Foto do Profissional/Empresa</Label>
          {aboutImage && (
            <div className="mt-2 mb-3">
              <img
                src={aboutImage}
                alt="Sobre"
                className="w-32 h-32 object-cover rounded-full border"
              />
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Texto Sobre</Label>
          <Textarea
            value={aboutText || ''}
            onChange={(e) => onAboutTextChange(e.target.value)}
            placeholder="Conte sua história, diferenciais e experiência..."
            rows={5}
            className="mt-1"
          />
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gerar com IA
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ex: sou fotógrafa há 10 anos, especializada em casamentos"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleGenerateText}
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
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogAboutSection;
