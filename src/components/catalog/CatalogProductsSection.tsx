import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Sparkles, Trash2, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";
import type { CatalogProduct } from "@/hooks/useCatalogs";

interface CatalogProductsSectionProps {
  products: CatalogProduct[];
  onProductsChange: (products: CatalogProduct[]) => void;
  dragHandleProps?: any;
}

const CatalogProductsSection = ({
  products,
  onProductsChange,
  dragHandleProps,
}: CatalogProductsSectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");

  const addProduct = () => {
    const newProduct: CatalogProduct = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: "",
    };
    onProductsChange([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<CatalogProduct>) => {
    onProductsChange(
      products.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removeProduct = (id: string) => {
    onProductsChange(products.filter((p) => p.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProduct(id, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateProduct = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição do produto/serviço",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating('new');
    try {
      const { data, error } = await invokeEdgeFunction("generate-catalog-content", {
        body: { type: "product", prompt: aiPrompt },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      let productData;
      try {
        productData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      } catch {
        throw new Error('Erro ao processar resposta da IA');
      }

      const newProduct: CatalogProduct = {
        id: crypto.randomUUID(),
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || '',
      };

      onProductsChange([...products, newProduct]);
      setAiPrompt('');
      toast({
        title: "Sucesso",
        description: "Produto gerado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar produto",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateImage = async (id: string, productName: string) => {
    if (!productName.trim()) {
      toast({
        title: "Erro",
        description: "Adicione um nome ao produto primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(id);
    try {
      const { data, error } = await invokeEdgeFunction("generate-catalog-image", {
        body: { prompt: `${productName}, produto profissional, fundo branco limpo` },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      updateProduct(id, { image: data.imageUrl });
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
      setIsGenerating(null);
    }
  };

  return (
    <CatalogSectionCard
      title="Produtos/Serviços"
      icon={<Package className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* AI Generate Product */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gerar Produto com IA
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ex: serviço de design de logos para empresas"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleGenerateProduct}
              disabled={isGenerating === 'new'}
            >
              {isGenerating === 'new' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Gerar"
              )}
            </Button>
          </div>
        </div>

        {/* Products List */}
        {products.map((product, index) => (
          <div key={product.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-muted-foreground">
                Produto {index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeProduct(product.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, { name: e.target.value })}
                  placeholder="Nome do produto/serviço"
                />
              </div>
              <div>
                <Label>Preço</Label>
                <Input
                  value={product.price}
                  onChange={(e) => updateProduct(product.id, { price: e.target.value })}
                  placeholder="R$ 99,90"
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={product.description}
                onChange={(e) => updateProduct(product.id, { description: e.target.value })}
                placeholder="Descreva o produto/serviço..."
                rows={2}
              />
            </div>

            <div>
              <Label>Imagem</Label>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-lg border mt-1 mb-2"
                />
              )}
              <div className="flex gap-2 mt-1">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(product.id, e)}
                  className="hidden"
                  id={`product-image-${product.id}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`product-image-${product.id}`)?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateImage(product.id, product.name)}
                  disabled={isGenerating === product.id}
                >
                  {isGenerating === product.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addProduct}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto Manualmente
        </Button>
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogProductsSection;
