import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus, Sparkles, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";
import type { CatalogPriceItem } from "@/hooks/useCatalogs";

interface CatalogPriceTableSectionProps {
  priceTable: CatalogPriceItem[];
  onPriceTableChange: (items: CatalogPriceItem[]) => void;
  businessContext?: string;
  dragHandleProps?: any;
}

const CatalogPriceTableSection = ({
  priceTable,
  onPriceTableChange,
  businessContext,
  dragHandleProps,
}: CatalogPriceTableSectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const addItem = () => {
    const newItem: CatalogPriceItem = {
      id: crypto.randomUUID(),
      service: "",
      price: "",
    };
    onPriceTableChange([...priceTable, newItem]);
  };

  const updateItem = (id: string, updates: Partial<CatalogPriceItem>) => {
    onPriceTableChange(
      priceTable.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    onPriceTableChange(priceTable.filter((item) => item.id !== id));
  };

  const handleGenerateItem = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma descrição do serviço",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction('generate-catalog-content', {
        body: { 
          type: 'price_item', 
          prompt: aiPrompt,
          context: businessContext 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      let itemData;
      try {
        itemData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      } catch {
        throw new Error('Erro ao processar resposta da IA');
      }

      const newItem: CatalogPriceItem = {
        id: crypto.randomUUID(),
        service: itemData.service || '',
        price: itemData.price || '',
        description: itemData.description,
      };

      onPriceTableChange([...priceTable, newItem]);
      setAiPrompt('');
      toast({
        title: "Sucesso",
        description: "Item gerado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar item",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CatalogSectionCard
      title="Tabela de Preços"
      icon={<DollarSign className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* AI Generate Item */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gerar Item com IA
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ex: consultoria de marketing digital"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleGenerateItem}
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

        {/* Price Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Serviço</th>
                <th className="text-left p-3 text-sm font-medium w-32">Preço</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {priceTable.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">
                    <Input
                      value={item.service}
                      onChange={(e) => updateItem(item.id, { service: e.target.value })}
                      placeholder="Nome do serviço"
                      className="border-0 bg-transparent"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.price}
                      onChange={(e) => updateItem(item.id, { price: e.target.value })}
                      placeholder="R$ 0,00"
                      className="border-0 bg-transparent"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogPriceTableSection;
