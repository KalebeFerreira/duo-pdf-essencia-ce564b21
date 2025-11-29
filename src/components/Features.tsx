import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Edit3, Share2, Zap, Shield, Cloud } from "lucide-react";
import featureCatalog from "@/assets/feature-catalog.png";
import featureEdit from "@/assets/feature-edit.png";
import featureShare from "@/assets/feature-share.png";

const Features = () => {
  const features = [
    {
      icon: Wand2,
      image: featureCatalog,
      title: "Automação com IA",
      description: "Gere PDFs, currículos profissionais, ebooks completos e artes gráficas automaticamente com IA avançada.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: Edit3,
      image: featureEdit,
      title: "Editor Completo",
      description: "Editor de designs com templates prontos, manipulação de fotos e ferramentas profissionais de criação.",
      gradient: "from-secondary to-secondary-glow"
    },
    {
      icon: Share2,
      image: featureShare,
      title: "Compartilhamento Simples",
      description: "Baixe ou compartilhe seus documentos instantaneamente. Armazenamento seguro em nuvem com acesso em qualquer lugar.",
      gradient: "from-primary to-secondary"
    },
    {
      icon: Zap,
      title: "Processamento Rápido",
      description: "IA de última geração processa seus documentos em menos de 30 segundos. Qualidade profissional garantida.",
      gradient: "from-primary-glow to-primary"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia de ponta. 100% seguro e conforme LGPD. Privacidade garantida.",
      gradient: "from-secondary-glow to-secondary"
    },
    {
      icon: Cloud,
      title: "Nuvem Integrada",
      description: "Acesse seus documentos de qualquer dispositivo. Sincronização automática e backup em nuvem.",
      gradient: "from-primary to-secondary-glow"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ferramentas Poderosas Para{" "}
            <span className="bg-gradient-secondary bg-clip-text text-transparent">
              Criar Qualquer Documento
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Da criação à publicação: tudo que você precisa em uma única plataforma
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all hover:-translate-y-1 border-border/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  {feature.image && (
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                </div>
                <CardTitle className="text-xl text-foreground group-hover:text-primary transition-smooth">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;