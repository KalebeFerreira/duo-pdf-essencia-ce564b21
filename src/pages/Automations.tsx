import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import AutomationGenerator from "@/components/AutomationGenerator";
import AutomationLimitIndicator from "@/components/AutomationLimitIndicator";

const Automations = () => {
  const navigate = useNavigate();

  const handleAutomationGenerated = () => {
    toast({
      title: "Sucesso!",
      description: "Sua automação foi processada.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Automações com IA</h1>
          <p className="text-muted-foreground">
            Use a inteligência artificial para automatizar qualquer tarefa
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <AutomationGenerator onAutomationGenerated={handleAutomationGenerated} />
          </div>
          <div>
            <AutomationLimitIndicator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automations;
