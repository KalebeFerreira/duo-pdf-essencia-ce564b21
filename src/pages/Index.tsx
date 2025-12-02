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
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                Ideal
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece grátis e escale conforme seu negócio cresce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              plan="free"
              title="Grátis"
              price="Grátis"
              description="Perfeito para experimentar"
              features={[
                "40 PDFs por mês",
                "30 automações por mês",
                "30 artes por mês",
                "10 currículos por mês",
                "Ebooks até 10 páginas",
                "Suporte por email",
              ]}
            />

            <PricingCard
              plan="basic"
              title="Básico"
              price="R$ 34,00"
              description="Para uso regular"
              features={[
                "200 PDFs por mês",
                "300 artes por mês",
                "300 currículos por mês",
                "Ebooks até 30 páginas",
                "IA para geração de conteúdo",
                "Suporte prioritário",
                "Sem marca d'água",
              ]}
              highlighted
            />

            <PricingCard
              plan="complete"
              title="Profissional"
              price="R$ 59,99"
              description="Recursos ilimitados"
              features={[
                "PDFs ilimitados",
                "Artes ilimitadas",
                "Currículos ilimitados",
                "Ebooks ilimitados",
                "Automações ilimitadas",
                "IA avançada para conteúdo",
                "Suporte premium 24/7",
                "API para integrações",
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