import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient - simplified */}
      <div className="absolute inset-0 bg-gradient-elegant opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Automação com IA Avançada</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Crie Documentos Profissionais com{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
              Gere <span className="font-semibold text-foreground">Catálogos Digitais</span>, PDFs, currículos, ebooks e artes gráficas em segundos. Ferramentas completas de design e automação IA para profissionais e empresas.
            </p>
            
            {/* Feature Pills - CSS only animations */}
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { label: "📚 Catálogo Digital", primary: true },
                { label: "PDFs com IA" },
                { label: "Currículos" },
                { label: "Ebooks" },
                { label: "Artes Gráficas" }
              ].map((pill) => (
                <div
                  key={pill.label}
                  className={`inline-flex items-center gap-2 transition-transform hover:scale-105 ${
                    pill.primary 
                      ? "px-4 py-2 bg-primary/10 rounded-full border border-primary/20" 
                      : "px-3 py-1.5 bg-muted rounded-full"
                  }`}
                >
                  <span className={`${pill.primary ? "text-sm font-bold text-primary" : "text-xs font-medium text-muted-foreground"}`}>
                    {pill.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                asChild 
                size="lg"
                className="bg-gradient-primary shadow-glow hover:shadow-xl transition-all group"
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
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Link to="/#features">
                  Explorar Recursos
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              {[
                { value: "4+", label: "Ferramentas IA" },
                { value: "<30s", label: "Processamento" },
                { value: "∞", label: "Possibilidades" }
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Image - simplified */}
          <div className="relative animate-fade-in animation-delay-200">
            <div className="absolute -inset-4 bg-gradient-primary opacity-10 blur-2xl rounded-full hidden sm:block" />
            <img
              src={heroImage}
              alt="Essência-duo - Plataforma completa para criação de documentos com IA"
              className="relative rounded-2xl shadow-xl w-full h-auto hover:scale-[1.02] transition-transform duration-300"
              loading="eager"
            />
          </div>
        </div>
      </div>
      
      {/* Decorative Elements - hidden on mobile for performance */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/5 rounded-full blur-2xl hidden md:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/5 rounded-full blur-2xl hidden md:block" />
    </section>
  );
};

export default Hero;
