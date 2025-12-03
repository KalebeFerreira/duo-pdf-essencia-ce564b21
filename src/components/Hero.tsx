import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-elegant opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Automação com IA Avançada</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Crie Documentos Profissionais com{" "}
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
              Gere PDFs, currículos, ebooks e artes gráficas em segundos. Ferramentas completas de design e automação IA para profissionais e empresas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-secondary shadow-glow hover:shadow-xl transition-all group"
              >
                <Link to="/auth">
                  Começar Grátis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                size="lg"
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all"
              >
                <Link to="/#features">
                  Explorar Recursos
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">4+</div>
                <div className="text-sm text-muted-foreground">Ferramentas IA</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">&lt;30s</div>
                <div className="text-sm text-muted-foreground">Processamento</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">∞</div>
                <div className="text-sm text-muted-foreground">Possibilidades</div>
              </div>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-secondary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImage}
              alt="Essência Duo PDF - Plataforma completa para criação de documentos com IA"
              className="relative rounded-2xl shadow-xl w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    </section>
  );
};

export default Hero;