import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import { Check } from "lucide-react";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Planos e{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Preços
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para suas necessidades. Comece grátis e faça upgrade a qualquer momento.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Comparison Table */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Compare os Planos
            </h2>
            
            <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-4 px-6 text-left text-foreground font-semibold">Recurso</th>
                      <th className="py-4 px-6 text-center text-foreground font-semibold">Grátis</th>
                      <th className="py-4 px-6 text-center text-foreground font-semibold bg-primary/5">Básico</th>
                      <th className="py-4 px-6 text-center text-foreground font-semibold">Completo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">PDFs por dia</td>
                      <td className="py-4 px-6 text-center text-foreground">10</td>
                      <td className="py-4 px-6 text-center text-foreground bg-primary/5">25</td>
                      <td className="py-4 px-6 text-center text-foreground">Ilimitado</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Automações IA por dia</td>
                      <td className="py-4 px-6 text-center text-foreground">1</td>
                      <td className="py-4 px-6 text-center text-foreground bg-primary/5">5</td>
                      <td className="py-4 px-6 text-center text-foreground">Ilimitado</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Conversão de imagens</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                      <td className="py-4 px-6 text-center bg-primary/5"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Edição avançada</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                      <td className="py-4 px-6 text-center bg-primary/5"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Envio via WhatsApp</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                      <td className="py-4 px-6 text-center bg-primary/5"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">IA para layout e cores</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                      <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">—</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Sem anúncios</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                      <td className="py-4 px-6 text-center bg-primary/5"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 text-muted-foreground">Suporte prioritário</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                      <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">—</td>
                      <td className="py-4 px-6 text-center"><Check className="w-5 h-5 text-primary mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Perguntas Frequentes
            </h2>
            
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Posso mudar de plano a qualquer momento?
                </h3>
                <p className="text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças são refletidas imediatamente.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  O que acontece se eu exceder meu limite de PDFs?
                </h3>
                <p className="text-muted-foreground">
                  Você será notificado quando estiver próximo do limite. Para continuar criando PDFs, você pode fazer upgrade do seu plano.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Como funciona a automação com IA?
                </h3>
                <p className="text-muted-foreground">
                  A IA analisa suas solicitações e gera automaticamente conteúdo de PDF formatado e profissional, economizando seu tempo.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Há reembolso disponível?
                </h3>
                <p className="text-muted-foreground">
                  Oferecemos garantia de reembolso de 7 dias para todos os planos pagos. Se não ficar satisfeito, basta entrar em contato.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
