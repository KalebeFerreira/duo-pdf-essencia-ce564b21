import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareQuote, Plus, Sparkles, Trash2, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction } from "@/lib/invokeEdgeFunction";
import CatalogSectionCard from "./CatalogSectionCard";
import type { CatalogTestimonial } from "@/hooks/useCatalogs";

interface CatalogTestimonialsSectionProps {
  testimonials: CatalogTestimonial[];
  onTestimonialsChange: (testimonials: CatalogTestimonial[]) => void;
  businessContext?: string;
  dragHandleProps?: any;
}

const CatalogTestimonialsSection = ({
  testimonials,
  onTestimonialsChange,
  businessContext,
  dragHandleProps,
}: CatalogTestimonialsSectionProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const addTestimonial = () => {
    const newTestimonial: CatalogTestimonial = {
      id: crypto.randomUUID(),
      name: "",
      text: "",
      rating: 5,
    };
    onTestimonialsChange([...testimonials, newTestimonial]);
  };

  const updateTestimonial = (id: string, updates: Partial<CatalogTestimonial>) => {
    onTestimonialsChange(
      testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeTestimonial = (id: string) => {
    onTestimonialsChange(testimonials.filter((t) => t.id !== id));
  };

  const handleGenerateTestimonial = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Digite o contexto do negócio",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await invokeEdgeFunction('generate-catalog-content', {
        body: { 
          type: 'testimonial', 
          prompt: aiPrompt,
          context: businessContext 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      let testimonialData;
      try {
        testimonialData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      } catch {
        throw new Error('Erro ao processar resposta da IA');
      }

      const newTestimonial: CatalogTestimonial = {
        id: crypto.randomUUID(),
        name: testimonialData.name || '',
        text: testimonialData.text || '',
        rating: testimonialData.rating || 5,
      };

      onTestimonialsChange([...testimonials, newTestimonial]);
      setAiPrompt('');
      toast({
        title: "Sucesso",
        description: "Depoimento gerado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar depoimento",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CatalogSectionCard
      title="Depoimentos"
      icon={<MessageSquareQuote className="w-5 h-5" />}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* AI Generate */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Gerar Depoimento com IA
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Ex: serviços de manicure e pedicure"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleGenerateTestimonial}
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

        {/* Testimonials List */}
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 cursor-pointer ${
                      star <= (testimonial.rating || 5)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                    onClick={() => updateTestimonial(testimonial.id, { rating: star })}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTestimonial(testimonial.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <Label>Nome do Cliente</Label>
              <Input
                value={testimonial.name}
                onChange={(e) => updateTestimonial(testimonial.id, { name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div>
              <Label>Depoimento</Label>
              <Textarea
                value={testimonial.text}
                onChange={(e) => updateTestimonial(testimonial.id, { text: e.target.value })}
                placeholder="O que o cliente disse..."
                rows={2}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addTestimonial}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Depoimento
        </Button>
      </div>
    </CatalogSectionCard>
  );
};

export default CatalogTestimonialsSection;
