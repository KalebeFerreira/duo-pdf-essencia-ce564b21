import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isPremium?: boolean;
}

export const templates: Template[] = [
  {
    id: "modern",
    name: "Moderno",
    description: "Design limpo e contemporâneo com seções bem definidas",
    preview: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
    colors: { primary: "#2563eb", secondary: "#1e40af", accent: "#3b82f6" },
  },
  {
    id: "classic",
    name: "Clássico",
    description: "Formato tradicional e profissional com layout em duas colunas",
    preview: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
    colors: { primary: "#1f2937", secondary: "#374151", accent: "#4b5563" },
  },
  {
    id: "creative",
    name: "Criativo",
    description: "Visual inovador e chamativo com elementos coloridos",
    preview: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    colors: { primary: "#7c3aed", secondary: "#a855f7", accent: "#c084fc" },
    isPremium: true,
  },
  {
    id: "minimal",
    name: "Minimalista",
    description: "Simples e direto ao ponto com foco no conteúdo",
    preview: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
    colors: { primary: "#0891b2", secondary: "#06b6d4", accent: "#22d3ee" },
  },
  {
    id: "executive",
    name: "Executivo",
    description: "Elegante e sofisticado para cargos de liderança",
    preview: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    colors: { primary: "#0f172a", secondary: "#1e293b", accent: "#334155" },
    isPremium: true,
  },
  {
    id: "tech",
    name: "Tech",
    description: "Design moderno para profissionais de tecnologia",
    preview: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    colors: { primary: "#059669", secondary: "#10b981", accent: "#34d399" },
  },
];

interface TemplateGalleryProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateGallery({ selectedTemplate, onSelectTemplate }: TemplateGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg relative ${
            selectedTemplate === template.id ? "border-primary border-2 ring-2 ring-primary/20" : ""
          }`}
          onClick={() => onSelectTemplate(template.id)}
        >
          <CardContent className="p-0">
            {/* Preview do template */}
            <div
              className="h-40 rounded-t-lg relative overflow-hidden"
              style={{ background: template.preview }}
            >
              {/* Simulação de documento */}
              <div className="absolute inset-4 bg-white rounded shadow-lg p-3 space-y-2">
                {/* Header com foto */}
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-foreground/80 rounded w-3/4" />
                    <div className="h-1.5 bg-muted-foreground/60 rounded w-1/2" />
                  </div>
                </div>
                {/* Conteúdo */}
                <div className="space-y-1">
                  <div className="h-1 bg-muted rounded w-full" />
                  <div className="h-1 bg-muted rounded w-5/6" />
                  <div className="h-1 bg-muted rounded w-4/6" />
                </div>
                <div className="space-y-1">
                  <div className="h-1 bg-muted rounded w-full" />
                  <div className="h-1 bg-muted rounded w-3/4" />
                </div>
              </div>

              {/* Badge Premium */}
              {template.isPremium && (
                <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}

              {/* Ícone de selecionado */}
              {selectedTemplate === template.id && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Informações do template */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {template.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
