import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        delay: 0.4
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-elegant opacity-5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full border border-secondary/20"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">Automação com IA Avançada</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
            >
              Crie Documentos Profissionais com{" "}
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground max-w-xl"
            >
              Gere <span className="font-semibold text-foreground">Catálogos Digitais</span>, PDFs, currículos, ebooks e artes gráficas em segundos. Ferramentas completas de design e automação IA para profissionais e empresas.
            </motion.p>
            
            {/* Feature Pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 pt-2">
              {[
                { label: "📚 Catálogo Digital", primary: true },
                { label: "PDFs com IA" },
                { label: "Currículos" },
                { label: "Ebooks" },
                { label: "Artes Gráficas" }
              ].map((pill, i) => (
                <motion.div
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center gap-2 ${
                    pill.primary 
                      ? "px-4 py-2 bg-primary/10 rounded-full border border-primary/20" 
                      : "px-3 py-1.5 bg-muted rounded-full"
                  }`}
                >
                  <span className={`${pill.primary ? "text-sm font-bold text-primary" : "text-xs font-medium text-muted-foreground"}`}>
                    {pill.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
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
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-center gap-8 pt-4">
              {[
                { value: "4+", label: "Ferramentas IA" },
                { value: "<30s", label: "Processamento" },
                { value: "∞", label: "Possibilidades" }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Image */}
          <motion.div 
            className="relative"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="absolute -inset-4 bg-gradient-secondary opacity-20 blur-3xl rounded-full"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.img
              src={heroImage}
              alt="Essência-duo - Plataforma completa para criação de documentos com IA"
              className="relative rounded-2xl shadow-xl w-full h-auto"
              loading="eager"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <motion.div 
        className="absolute top-1/4 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{ 
          x: [0, -30, 0],
          y: [0, 20, 0]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </section>
  );
};

export default Hero;
