import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";

interface ImageToPdfConverterProps {
  onPdfCreated?: () => void;
}

const ImageToPdfConverter = ({ onPdfCreated }: ImageToPdfConverterProps) => {
  const { user } = useAuth();
  const [images, setImages] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setImages((prev) => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generatePdf = async () => {
    if (images.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma imagem para criar o PDF.",
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

    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const img = images[i];
        const imgData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(img);
        });

        // Load image to get dimensions
        const imgElement = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = imgData;
        });

        // Calculate dimensions to fit page while maintaining aspect ratio
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

      const pdfBlob = pdf.output("blob");
      const pdfContent = await pdf.output("datauristring");

      // Save to database
      if (user) {
        const { error } = await supabase.from("documents").insert({
          user_id: user.id,
          title: title.trim(),
          file_url: pdfContent,
          file_size: pdfBlob.size,
        });

        if (error) throw error;

        // Update profile pdfs_used
        const { data: profile } = await supabase
          .from("profiles")
          .select("pdfs_used")
          .eq("id", user.id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ pdfs_used: (profile.pdfs_used || 0) + 1 })
            .eq("id", user.id);
        }
      }

      toast({
        title: "Sucesso!",
        description: "PDF criado e salvo com sucesso.",
      });

      // Reset form
      setImages([]);
      setTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pdf-title">Título do PDF</Label>
        <Input
          id="pdf-title"
          placeholder="Digite o título do seu PDF..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Imagens</Label>
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
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <Label>Imagens Selecionadas ({images.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <Card key={index} className="relative group">
                <CardContent className="p-2">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{img.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={generatePdf}
        disabled={isGenerating || images.length === 0 || !title.trim()}
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
            Criar PDF ({images.length} {images.length === 1 ? "imagem" : "imagens"})
          </>
        )}
      </Button>
    </div>
  );
};

export default ImageToPdfConverter;
