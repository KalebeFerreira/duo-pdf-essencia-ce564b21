import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogProduct, CatalogPriceItem, CatalogTestimonial } from "@/hooks/useCatalogs";

interface PublicCatalogData {
  id: string;
  title: string;
  cover_image: string | null;
  about_title: string | null;
  about_text: string | null;
  about_image: string | null;
  products: unknown;
  price_table: unknown;
  gallery: unknown;
  testimonials: unknown;
  contact_whatsapp: string | null;
  contact_email: string | null;
  contact_instagram: string | null;
  contact_facebook: string | null;
  theme_primary_color: string | null;
  theme_secondary_color: string | null;
  theme_font: string | null;
  is_public: boolean;
}

const PublicCatalog = () => {
  const { id } = useParams();

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['public-catalog', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogs')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single();
      
      if (error) throw error;
      return data as PublicCatalogData;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Catálogo não encontrado</h1>
          <p className="text-muted-foreground">Este catálogo não existe ou não está disponível publicamente.</p>
        </div>
      </div>
    );
  }

  const products = (catalog.products || []) as CatalogProduct[];
  const priceTable = (catalog.price_table || []) as CatalogPriceItem[];
  const testimonials = (catalog.testimonials || []) as CatalogTestimonial[];
  const gallery = (catalog.gallery || []) as string[];

  const primaryColor = catalog.theme_primary_color || '#3B82F6';
  const secondaryColor = catalog.theme_secondary_color || '#1E40AF';

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: catalog.theme_font || 'Inter' }}>
      {/* Cover Section */}
      <section 
        className="relative h-[60vh] flex items-center justify-center"
        style={{ 
          background: catalog.cover_image 
            ? `url(${catalog.cover_image}) center/cover no-repeat` 
            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <h1 className="relative z-10 text-4xl md:text-6xl font-bold text-white text-center px-4">
          {catalog.title}
        </h1>
      </section>

      {/* About Section */}
      {catalog.about_text && (
        <section className="py-16 px-4 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6" style={{ color: primaryColor }}>
            {catalog.about_title || 'Sobre'}
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {catalog.about_image && (
              <img 
                src={catalog.about_image} 
                alt="Sobre" 
                className="w-full md:w-1/3 h-64 object-cover rounded-xl"
              />
            )}
            <p className="text-muted-foreground leading-relaxed flex-1">
              {catalog.about_text}
            </p>
          </div>
        </section>
      )}

      {/* Products Section */}
      {products.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: primaryColor }}>
              Produtos & Serviços
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-background rounded-xl shadow-lg overflow-hidden">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold mb-3" style={{ color: primaryColor }}>
                      {product.price}
                    </p>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Price Table Section */}
      {priceTable.length > 0 && (
        <section className="py-16 px-4 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: primaryColor }}>
            Tabela de Preços
          </h2>
          <div className="bg-background rounded-xl shadow-lg overflow-hidden">
            {priceTable.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-4 ${index !== priceTable.length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="font-medium">{item.service}</span>
                <span className="font-bold" style={{ color: primaryColor }}>{item.price}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: primaryColor }}>
              Galeria
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 px-4 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center" style={{ color: primaryColor }}>
            Depoimentos
          </h2>
          <div className="grid gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-muted/50 rounded-xl p-6">
                <p className="text-lg italic text-muted-foreground mb-4">"{testimonial.text}"</p>
                <p className="font-semibold" style={{ color: primaryColor }}>— {testimonial.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact Section */}
      {(catalog.contact_whatsapp || catalog.contact_email || catalog.contact_instagram || catalog.contact_facebook) && (
        <section 
          className="py-16 px-4 text-white"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Entre em Contato</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {catalog.contact_whatsapp && (
                <Button 
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    let phone = catalog.contact_whatsapp!.replace(/\D/g, '');
                    // Add Brazil country code if not present
                    if (phone.length <= 11 && !phone.startsWith('55')) {
                      phone = '55' + phone;
                    }
                    window.open(`https://wa.me/${phone}`, '_blank');
                  }}
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </Button>
              )}
              {catalog.contact_email && (
                <Button 
                  variant="secondary"
                  className="gap-2"
                  onClick={() => window.location.href = `mailto:${catalog.contact_email}`}
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </Button>
              )}
              {catalog.contact_instagram && (
                <Button 
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    const username = catalog.contact_instagram!.replace('@', '').replace('https://instagram.com/', '').replace('https://www.instagram.com/', '');
                    window.open(`https://instagram.com/${username}`, '_blank');
                  }}
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Button>
              )}
              {catalog.contact_facebook && (
                <Button 
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    let fbUrl = catalog.contact_facebook!;
                    if (!fbUrl.startsWith('http')) {
                      fbUrl = `https://facebook.com/${fbUrl.replace('facebook.com/', '')}`;
                    }
                    window.open(fbUrl, '_blank');
                  }}
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm bg-muted/30">
        Criado com Essência Duo PDF
      </footer>
    </div>
  );
};

export default PublicCatalog;
