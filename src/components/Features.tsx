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
      description: "Crie catálogos, cardápios e orçamentos automaticamente com layouts profissionais em menos de 30 segundos.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: Edit3,
      image: featureEdit,
      title: "Edição Completa",
      description: "Edite, corte, rotacione e ajuste brilho/contraste. Combine múltiplas fotos e textos em um único PDF.",
      gradient: "from-secondary to-secondary-glow"
    },
    {
      icon: Share2,
      image: featureShare,
      title: "Compartilhamento Rápido",
      description: "Envie seus PDFs diretamente pelo WhatsApp ou faça download. Armazenamento seguro em nuvem.",
      gradient: "from-primary to-secondary"
    },
    {
      icon: Zap,
      title: "Ultra Rápido",
      description: "Processamento instantâneo. Converta múltiplas imagens em PDF profissional em segundos.",
      gradient: "from-primary-glow to-primary"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Seus documentos são criptografados e protegidos. Conforme LGPD. Privacidade garantida.",
      gradient: "from-secondary-glow to-secondary"
    },
    {
      icon: Cloud,
      title: "Sempre Disponível",
      description: "Acesse seus PDFs de qualquer lugar, em qualquer dispositivo. Sincronização automática.",
      gradient: "from-primary to-secondary-glow"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tudo que Você Precisa Para{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Criar PDFs
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas poderosas e intuitivas para transformar suas ideias em documentos profissionais
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