import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CreditCard, ImageIcon, Sparkles, Calendar, UtensilsCrossed } from "lucide-react";
import { predefinedTemplates } from "@/utils/designTemplates";

interface DesignTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const templateIcons: Record<string, any> = {
  "flyer-modern": Sparkles,
  "business-card-elegant": CreditCard,
  "pamphlet-promo": ImageIcon,
  "flyer-event": Calendar,
  "business-card-minimal": CreditCard,
  "pamphlet-restaurant": UtensilsCrossed,
};

const templateColors: Record<string, string> = {
  "flyer-modern": "from-indigo-500 to-purple-500",
  "business-card-elegant": "from-slate-700 to-slate-900",
  "pamphlet-promo": "from-pink-500 to-purple-500",
  "flyer-event": "from-purple-600 to-violet-700",
  "business-card-minimal": "from-cyan-500 to-blue-500",
  "pamphlet-restaurant": "from-red-600 to-orange-500",
};

const templates = predefinedTemplates.map((template) => ({
  id: template.id,
  name: template.name,
  description: template.description,
  icon: templateIcons[template.id] || FileText,
  dimensions: template.dimensions,
  bleed: template.bleed,
  color: templateColors[template.id] || "from-blue-500 to-cyan-500",
}));

const DesignTemplates = ({ onSelectTemplate }: DesignTemplatesProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {templates.map((template) => {
        const Icon = template.icon;
        return (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
          >
            <CardHeader>
              <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Design pronto para editar
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => onSelectTemplate(template.id)}
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DesignTemplates;
