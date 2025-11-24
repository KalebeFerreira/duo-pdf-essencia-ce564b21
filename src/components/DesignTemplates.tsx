import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CreditCard, ImageIcon } from "lucide-react";

interface DesignTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const templates = [
  {
    id: "flyer",
    name: "Flyer A5",
    description: "148x210mm com margem de 3mm",
    icon: FileText,
    dimensions: { width: 148, height: 210 },
    bleed: 3,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "business-card",
    name: "Cartão de Visita",
    description: "90x50mm com margem de 2mm",
    icon: CreditCard,
    dimensions: { width: 90, height: 50 },
    bleed: 2,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "pamphlet",
    name: "Panfleto A4",
    description: "210x297mm com margem de 3mm",
    icon: ImageIcon,
    dimensions: { width: 210, height: 297 },
    bleed: 3,
    color: "from-orange-500 to-red-500"
  },
];

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
              <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <p>Dimensões: {template.dimensions.width}x{template.dimensions.height}mm</p>
                <p>Sangria: {template.bleed}mm</p>
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
