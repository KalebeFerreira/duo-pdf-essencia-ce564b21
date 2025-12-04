import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LayoutTemplate, Sparkles, Check, Zap } from "lucide-react";
import { CATALOG_TEMPLATES, type CatalogTemplate } from "@/utils/catalogTemplates";
import type { Catalog } from "@/hooks/useCatalogs";

interface CatalogTemplateSelectorProps {
  onApplyTemplate: (catalog: Partial<Catalog>) => void;
  onSelectForAI: (template: CatalogTemplate) => void;
}

const CatalogTemplateSelector = ({ onApplyTemplate, onSelectForAI }: CatalogTemplateSelectorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CatalogTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleTemplateClick = (template: CatalogTemplate) => {
    setSelectedTemplate(template);
    setShowDialog(true);
  };

  const handleApplyInstant = () => {
    if (selectedTemplate) {
      onApplyTemplate({
        ...selectedTemplate.catalog,
        title: selectedTemplate.catalog.title || selectedTemplate.name,
      });
      setShowDialog(false);
    }
  };

  const handleGenerateWithAI = () => {
    if (selectedTemplate) {
      onSelectForAI(selectedTemplate);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Templates Prontos
                <Badge variant="secondary" className="text-xs">Novo!</Badge>
              </CardTitle>
              <CardDescription>
                Escolha uma categoria e comece com um catálogo pré-montado
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATALOG_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="p-3 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left hover:scale-105 hover:shadow-md bg-background"
              >
                <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center mb-2`}>
                  <template.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  <div className={`w-8 h-8 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}>
                    <selectedTemplate.icon className="w-4 h-4 text-white" />
                  </div>
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Como você deseja criar seu catálogo?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <button
              onClick={handleApplyInstant}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:bg-primary/5"
            >
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  Aplicar Instantâneo
                  <Badge variant="secondary" className="text-xs">Rápido</Badge>
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Aplica o template completo com textos e preços pré-definidos. Você pode editar tudo depois.
                </p>
              </div>
              <Check className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>

            <button
              onClick={handleGenerateWithAI}
              className="flex items-start gap-4 p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:bg-primary/5"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  Personalizar com IA
                  <Badge variant="outline" className="text-xs">Recomendado</Badge>
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Informe o nome do seu negócio e seus serviços. A IA gera textos e imagens exclusivos.
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CatalogTemplateSelector;
