import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import PricingCard from "@/components/PricingCard";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      
      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Escolha o Plano{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Perfeito
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis e faça upgrade quando precisar de mais recursos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              plan="free"
              title="Grátis"
              price="Grátis"
              description="Perfeito para experimentar"
              features={[
                "10 PDFs por dia",
                "1 automação IA por dia",
                "Conversão básica de fotos",
                "Download de PDFs",
                "Acesso à comunidade",
                "Anúncios"
              ]}
            />

            <PricingCard
              plan="basic"
              title="Básico"
              price="R$ 19,90"
              description="Para uso regular"
              features={[
                "25 PDFs por dia",
                "5 automações IA por dia",
                "Edição avançada",
                "Envio via WhatsApp",
                "Armazenamento expandido",
                "Sem anúncios"
              ]}
              highlighted
            />

            <PricingCard
              plan="complete"
              title="Completo"
              price="R$ 49,90"
              description="Poder ilimitado"
              features={[
                "PDFs ilimitados",
                "Automações ilimitadas",
                "IA para layout e cores",
                "IA para otimização de texto",
                "Suporte prioritário",
                "Recursos exclusivos"
              ]}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;