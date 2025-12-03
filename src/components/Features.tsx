import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  User, 
  BookOpen, 
  Palette, 
  ShoppingBag, 
  Wand2, 
  Download, 
  Languages, 
  Layers, 
  Users, 
  Zap, 
  Shield 
} from "lucide-react";
import featureCatalog from "@/assets/feature-catalog.png";
import featureEdit from "@/assets/feature-edit.png";
import featureShare from "@/assets/feature-share.png";

const Features = () => {
  const features = [
    {
      icon: FileText,
      image: featureCatalog,
      title: "Geração de PDFs com IA",
      description: "Crie PDFs profissionais com imagens geradas por IA, geração em lote de múltiplos documentos e seleção de idiomas.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: User,
      image: featureEdit,
      title: "Criação de Currículos",
      description: "Gere currículos profissionais com editor de fotos integrado, assinatura digital e remoção de fundo automática por IA.",
      gradient: "from-secondary to-secondary-glow"
    },
    {
      icon: BookOpen,
      title: "Geração de Ebooks",
      description: "Crie ebooks completos com paletas de cores personalizadas, capítulos editáveis e melhoria de texto com IA.",
      gradient: "from-primary to-secondary"
    },
    {
      icon: Palette,
      image: featureShare,
      title: "Editor de Artes",
      description: "Editor visual com templates prontos (Flyer, Cartão de Visita, Panfleto), canvas interativo e exportação para impressão.",
      gradient: "from-primary-glow to-primary"
    },
    {
      icon: ShoppingBag,
      title: "Catálogos Digitais",
      description: "Crie catálogos profissionais com geração automática por IA, seções customizáveis e compartilhamento via link público.",
      gradient: "from-secondary-glow to-secondary"
    },
    {
      icon: Wand2,
      title: "Automações com IA",
      description: "Insira prompts personalizados e deixe a IA gerar qualquer conteúdo. Flexibilidade total para criar o que precisar.",
      gradient: "from-primary to-secondary-glow"
    },
    {
      icon: Download,
      title: "Multi-Formatos de Exportação",
      description: "Exporte seus documentos em PDF, PowerPoint (PPTX) e imagens (PNG/JPG). Todos prontos para uso profissional.",
      gradient: "from-secondary to-primary"
    },
    {
      icon: Languages,
      title: "Suporte Multi-Idiomas",
      description: "Gere conteúdo em Português, Inglês, Espanhol, Francês, Alemão e Italiano. IA ajusta automaticamente o idioma.",
      gradient: "from-primary-glow to-secondary-glow"
    },
    {
      icon: Layers,
      title: "Geração em Lote",
      description: "Gere múltiplos PDFs de uma só vez. Insira vários tópicos e receba todos em um arquivo ZIP organizado.",
      gradient: "from-secondary to-secondary-glow"
    },
    {
      icon: Users,
      title: "Programa de Afiliados",
      description: "Indique amigos e ganhe 10% de comissão recorrente por 12 meses em cada assinatura. Pagamento via PIX.",
      gradient: "from-primary to-primary-glow"
    },
    {
      icon: Zap,
      title: "Processamento Rápido",
      description: "IA de última geração processa seus documentos em menos de 30 segundos. Qualidade profissional garantida.",
      gradient: "from-secondary-glow to-primary"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com criptografia de ponta. 100% seguro e conforme LGPD. Privacidade garantida.",
      gradient: "from-primary to-secondary"
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Todas as Ferramentas Que Você{" "}
            <span className="bg-gradient-secondary bg-clip-text text-transparent">
              Precisa em Um Só Lugar
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Da criação à publicação: PDFs, currículos, ebooks, artes e catálogos com IA avançada
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors duration-300">
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
