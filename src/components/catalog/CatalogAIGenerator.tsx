import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, Trash2, Scissors, Palette, Dumbbell, Utensils, Camera, Wrench, GraduationCap, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Catalog, CatalogProduct, CatalogPriceItem, CatalogTestimonial } from "@/hooks/useCatalogs";

interface ServiceInput {
  id: string;
  name: string;
  price: string;
}

interface CatalogAIGeneratorProps {
  onGenerate: (catalog: Partial<Catalog>) => void;
}

const TEMPLATES = [
  { 
    id: 'barbearia', 
    name: 'Barbearia', 
    icon: Scissors,
    color: 'bg-amber-500',
    description: 'Cortes, barbas e tratamentos masculinos',
    services: [
      { name: 'Corte Masculino', price: 'R$ 45,00' },
      { name: 'Barba', price: 'R$ 35,00' },
      { name: 'Corte + Barba', price: 'R$ 70,00' },
      { name: 'Degradê', price: 'R$ 50,00' },
    ]
  },
  { 
    id: 'salao', 
    name: 'Salão de Beleza', 
    icon: Palette,
    color: 'bg-pink-500',
    description: 'Cortes, coloração e tratamentos capilares',
    services: [
      { name: 'Corte Feminino', price: 'R$ 80,00' },
      { name: 'Escova', price: 'R$ 50,00' },
      { name: 'Coloração', price: 'R$ 150,00' },
      { name: 'Progressiva', price: 'R$ 250,00' },
    ]
  },
  { 
    id: 'academia', 
    name: 'Academia/Personal', 
    icon: Dumbbell,
    color: 'bg-green-500',
    description: 'Planos de treino e acompanhamento',
    services: [
      { name: 'Plano Mensal', price: 'R$ 99,00' },
      { name: 'Plano Trimestral', price: 'R$ 249,00' },
      { name: 'Personal (hora)', price: 'R$ 80,00' },
      { name: 'Avaliação Física', price: 'R$ 50,00' },
    ]
  },
  { 
    id: 'restaurante', 
    name: 'Restaurante/Delivery', 
    icon: Utensils,
    color: 'bg-orange-500',
    description: 'Cardápio e pratos especiais',
    services: [
      { name: 'Prato Executivo', price: 'R$ 25,00' },
      { name: 'Porção', price: 'R$ 35,00' },
      { name: 'Sobremesa', price: 'R$ 15,00' },
      { name: 'Bebidas', price: 'R$ 8,00' },
    ]
  },
  { 
    id: 'fotografia', 
    name: 'Fotografia', 
    icon: Camera,
    color: 'bg-purple-500',
    description: 'Ensaios, eventos e produtos',
    services: [
      { name: 'Ensaio Individual', price: 'R$ 350,00' },
      { name: 'Cobertura de Evento', price: 'R$ 800,00' },
      { name: 'Fotos de Produto', price: 'R$ 150,00' },
      { name: 'Edição Avançada', price: 'R$ 50,00' },
    ]
  },
  { 
    id: 'manutencao', 
    name: 'Serviços Gerais', 
    icon: Wrench,
    color: 'bg-blue-500',
    description: 'Manutenção, reparos e instalações',
    services: [
      { name: 'Visita Técnica', price: 'R$ 80,00' },
      { name: 'Instalação', price: 'R$ 120,00' },
      { name: 'Reparo Simples', price: 'R$ 100,00' },
      { name: 'Manutenção Preventiva', price: 'R$ 150,00' },
    ]
  },
  { 
    id: 'cursos', 
    name: 'Cursos/Aulas', 
    icon: GraduationCap,
    color: 'bg-indigo-500',
    description: 'Aulas particulares e cursos',
    services: [
      { name: 'Aula Avulsa', price: 'R$ 60,00' },
      { name: 'Pacote 4 Aulas', price: 'R$ 200,00' },
      { name: 'Curso Completo', price: 'R$ 500,00' },
      { name: 'Mentoria', price: 'R$ 150,00' },
    ]
  },
  { 
    id: 'estetica', 
    name: 'Estética/Spa', 
    icon: Heart,
    color: 'bg-rose-500',
    description: 'Tratamentos estéticos e bem-estar',
    services: [
      { name: 'Limpeza de Pele', price: 'R$ 120,00' },
      { name: 'Massagem Relaxante', price: 'R$ 100,00' },
      { name: 'Design de Sobrancelhas', price: 'R$ 40,00' },
      { name: 'Depilação', price: 'R$ 60,00' },
    ]
  },
];

const CatalogAIGenerator = ({ onGenerate }: CatalogAIGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [services, setServices] = useState<ServiceInput[]>([
    { id: crypto.randomUUID(), name: '', price: '' }
  ]);

  const addService = () => {
    setServices([...services, { id: crypto.randomUUID(), name: '', price: '' }]);
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const updateService = (id: string, field: 'name' | 'price', value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setBusinessName(template.name);
      setBusinessDescription(template.description);
      setServices(template.services.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        price: s.price
      })));
    }
  };

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome do seu negócio",
        variant: "destructive",
      });
      return;
    }

    const validServices = services.filter(s => s.name.trim() && s.price.trim());
    if (validServices.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um serviço com nome e preço",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const servicesText = validServices.map(s => `${s.name}: ${s.price}`).join(', ');
      const context = `${businessName} - ${businessDescription || 'negócio profissional'}. Serviços: ${servicesText}`;

      // Generate about text
      const aboutResponse = await supabase.functions.invoke('generate-catalog-content', {
        body: { type: 'about', prompt: context }
      });

      // Generate products from services
      const products: CatalogProduct[] = [];
      for (const service of validServices) {
        const productResponse = await supabase.functions.invoke('generate-catalog-content', {
          body: { type: 'product', prompt: `${businessName} - ${service.name}` }
        });
        
        let productData: any = {};
        if (productResponse.data?.content) {
          try {
            let contentStr = productResponse.data.content;
            // Remove markdown code blocks if present
            if (typeof contentStr === 'string') {
              contentStr = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            }
            productData = typeof contentStr === 'string' 
              ? JSON.parse(contentStr) 
              : contentStr;
          } catch (e) {
            console.error('Error parsing product:', e);
          }
        }

        // Generate image for product
        const imageResponse = await supabase.functions.invoke('generate-catalog-image', {
          body: { prompt: `${service.name} ${businessName}, profissional, alta qualidade` }
        });

        products.push({
          id: crypto.randomUUID(),
          name: service.name,
          description: productData.description || `Serviço profissional de ${service.name}`,
          price: service.price,
          image: imageResponse.data?.imageUrl || undefined,
        });
      }

      // Generate price table
      const priceTable: CatalogPriceItem[] = validServices.map(s => ({
        id: crypto.randomUUID(),
        service: s.name,
        price: s.price,
      }));

      // Generate testimonials
      const testimonialsResponse = await supabase.functions.invoke('generate-catalog-content', {
        body: { type: 'testimonials', prompt: context }
      });

      let testimonials: CatalogTestimonial[] = [];
      if (testimonialsResponse.data?.content) {
        try {
          let contentStr = testimonialsResponse.data.content;
          // Remove markdown code blocks if present
          if (typeof contentStr === 'string') {
            contentStr = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          }
          const testimonialData = typeof contentStr === 'string'
            ? JSON.parse(contentStr)
            : contentStr;
          if (Array.isArray(testimonialData)) {
            testimonials = testimonialData.map((t: any) => ({
              id: crypto.randomUUID(),
              name: t.name || 'Cliente',
              text: t.text || t.depoimento || 'Excelente serviço!'
            }));
          }
        } catch (e) {
          console.error('Error parsing testimonials:', e);
          // Fallback testimonials
          testimonials = [
            { id: crypto.randomUUID(), name: 'Cliente Satisfeito', text: `Excelente experiência com ${businessName}! Recomendo muito.` },
            { id: crypto.randomUUID(), name: 'Maria Silva', text: 'Atendimento impecável e resultado perfeito. Voltarei sempre!' },
            { id: crypto.randomUUID(), name: 'João Santos', text: 'Profissionalismo e qualidade. Superou minhas expectativas!' }
          ];
        }
      } else {
        // Fallback if no response
        testimonials = [
          { id: crypto.randomUUID(), name: 'Cliente Satisfeito', text: `Excelente experiência com ${businessName}! Recomendo muito.` },
          { id: crypto.randomUUID(), name: 'Maria Silva', text: 'Atendimento impecável e resultado perfeito. Voltarei sempre!' }
        ];
      }

      // Generate cover image
      const coverResponse = await supabase.functions.invoke('generate-catalog-image', {
        body: { prompt: `capa profissional elegante para catálogo de ${businessName}, ${businessDescription || 'negócio profissional'}` }
      });

      // Generate gallery images
      const gallery: string[] = [];
      const galleryPrompts = [
        `ambiente profissional de ${businessName}`,
        `detalhes do trabalho em ${businessName}`,
      ];
      
      for (const prompt of galleryPrompts) {
        const galleryResponse = await supabase.functions.invoke('generate-catalog-image', {
          body: { prompt }
        });
        if (galleryResponse.data?.imageUrl) {
          gallery.push(galleryResponse.data.imageUrl);
        }
      }

      // Get theme colors based on template
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      let primaryColor = '#3B82F6';
      let secondaryColor = '#1E40AF';
      
      if (template) {
        const colorMap: Record<string, { primary: string; secondary: string }> = {
          'barbearia': { primary: '#D97706', secondary: '#92400E' },
          'salao': { primary: '#EC4899', secondary: '#BE185D' },
          'academia': { primary: '#10B981', secondary: '#047857' },
          'restaurante': { primary: '#F97316', secondary: '#C2410C' },
          'fotografia': { primary: '#8B5CF6', secondary: '#6D28D9' },
          'manutencao': { primary: '#3B82F6', secondary: '#1D4ED8' },
          'cursos': { primary: '#6366F1', secondary: '#4338CA' },
          'estetica': { primary: '#F43F5E', secondary: '#BE123C' },
        };
        const colors = colorMap[template.id];
        if (colors) {
          primaryColor = colors.primary;
          secondaryColor = colors.secondary;
        }
      }

      const generatedCatalog: Partial<Catalog> = {
        title: businessName,
        about_title: 'Sobre Nós',
        about_text: aboutResponse.data?.content || `Bem-vindo ao ${businessName}! Oferecemos serviços de alta qualidade.`,
        cover_image: coverResponse.data?.imageUrl,
        products,
        price_table: priceTable,
        testimonials,
        gallery,
        theme_primary_color: primaryColor,
        theme_secondary_color: secondaryColor,
        theme_font: 'Inter',
      };

      onGenerate(generatedCatalog);
      
      toast({
        title: "Catálogo gerado com sucesso!",
        description: "Revise e ajuste conforme necessário antes de salvar.",
      });

    } catch (error: any) {
      console.error('Error generating catalog:', error);
      toast({
        title: "Erro ao gerar catálogo",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Gerar Catálogo com IA
              <Badge variant="secondary" className="text-xs">Automático</Badge>
            </CardTitle>
            <CardDescription>
              Escolha um template ou personalize. A IA gera tudo: textos, imagens e layout!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Templates */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Templates Prontos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template.id)}
                className={`p-3 rounded-xl border-2 transition-all text-left hover:scale-105 ${
                  selectedTemplate === template.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`w-8 h-8 ${template.color} rounded-lg flex items-center justify-center mb-2`}>
                  <template.icon className="w-4 h-4 text-white" />
                </div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome do Negócio *</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Barbearia do João"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Input
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Ex: Cortes modernos e clássicos"
              className="mt-1"
            />
          </div>
        </div>

        {/* Services */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Seus Serviços e Preços *</Label>
          <div className="space-y-2">
            {services.map((service, index) => (
              <div key={service.id} className="flex gap-2">
                <Input
                  value={service.name}
                  onChange={(e) => updateService(service.id, 'name', e.target.value)}
                  placeholder="Nome do serviço"
                  className="flex-1"
                />
                <Input
                  value={service.price}
                  onChange={(e) => updateService(service.id, 'price', e.target.value)}
                  placeholder="R$ 00,00"
                  className="w-32"
                />
                {services.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeService(service.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addService}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Serviço
          </Button>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gerando catálogo completo...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Gerar Catálogo Completo com IA
            </>
          )}
        </Button>

        {isGenerating && (
          <p className="text-sm text-muted-foreground text-center">
            Isso pode levar alguns segundos. Estamos criando textos, imagens e layout personalizado...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CatalogAIGenerator;
