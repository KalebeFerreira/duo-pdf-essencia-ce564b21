import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles } from "lucide-react";
import DesignCanvas from "@/components/DesignCanvas";
import DesignTemplates from "@/components/DesignTemplates";

const CreateDesign = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("templates");

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    setActiveTab("editor");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Editor de Artes</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <CardTitle>Crie Artes Profissionais</CardTitle>
            </div>
            <CardDescription>
              Escolha um template ou use IA para gerar designs automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-4">
                <DesignTemplates onSelectTemplate={handleTemplateSelect} />
              </TabsContent>

              <TabsContent value="editor" className="space-y-4">
                <DesignCanvas selectedTemplate={selectedTemplate} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateDesign;
