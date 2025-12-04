import { Card } from "@/components/ui/card";
import { Phone, Mail, Instagram, Facebook, Star } from "lucide-react";
import type { Catalog } from "@/hooks/useCatalogs";

interface CatalogPreviewProps {
  catalog: Partial<Catalog>;
}

const CatalogPreview = ({ catalog }: CatalogPreviewProps) => {
  const {
    title = 'Meu Catálogo',
    cover_image,
    about_title = 'Sobre',
    about_text,
    about_image,
    products = [],
    price_table = [],
    gallery = [],
    testimonials = [],
    contact_whatsapp,
    contact_email,
    contact_instagram,
    contact_facebook,
    theme_primary_color = '#3B82F6',
    theme_secondary_color = '#1E40AF',
    theme_font = 'Inter',
    sections_order = ['cover', 'about', 'products', 'prices', 'gallery', 'testimonials', 'contacts'],
  } = catalog;

  const renderSection = (section: string) => {
    switch (section) {
      case 'cover':
        return (
          <div key="cover" className="relative overflow-hidden rounded-lg mb-6">
            {cover_image ? (
              <div className="relative h-48">
                <img
                  src={cover_image}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <h1
                  className="absolute bottom-4 left-4 text-2xl font-bold text-white"
                  style={{ fontFamily: theme_font }}
                >
                  {title}
                </h1>
              </div>
            ) : (
              <div
                className="h-48 flex items-center justify-center"
                style={{ backgroundColor: theme_primary_color }}
              >
                <h1
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: theme_font }}
                >
                  {title}
                </h1>
              </div>
            )}
          </div>
        );

      case 'about':
        if (!about_text && !about_image) return null;
        return (
          <div key="about" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              {about_title}
            </h2>
            <div className="flex gap-4">
              {about_image && (
                <img
                  src={about_image}
                  alt="Sobre"
                  className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                />
              )}
              <p className="text-sm text-muted-foreground" style={{ fontFamily: theme_font }}>
                {about_text}
              </p>
            </div>
          </div>
        );

      case 'products':
        if (products.length === 0) return null;
        return (
          <div key="products" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              Produtos & Serviços
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-24 object-cover"
                    />
                  )}
                  <div className="p-2">
                    <h3
                      className="font-semibold text-sm"
                      style={{ fontFamily: theme_font }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <p
                      className="font-bold text-sm mt-1"
                      style={{ color: theme_primary_color }}
                    >
                      {product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'prices':
        if (price_table.length === 0) return null;
        return (
          <div key="prices" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              Tabela de Preços
            </h2>
            <div className="border rounded-lg overflow-hidden">
              {price_table.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex justify-between p-3 ${
                    index % 2 === 0 ? 'bg-muted/50' : ''
                  }`}
                >
                  <span className="text-sm" style={{ fontFamily: theme_font }}>
                    {item.service}
                  </span>
                  <span
                    className="font-semibold text-sm"
                    style={{ color: theme_primary_color }}
                  >
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'gallery':
        if (gallery.length === 0) return null;
        return (
          <div key="gallery" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              Galeria
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {gallery.slice(0, 6).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Galeria ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        if (testimonials.length === 0) return null;
        return (
          <div key="testimonials" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              Depoimentos
            </h2>
            <div className="space-y-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (testimonial.rating || 5)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">
                    "{testimonial.text}"
                  </p>
                  <p className="text-xs font-semibold mt-1">— {testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'contacts':
        if (!contact_whatsapp && !contact_email && !contact_instagram && !contact_facebook) return null;
        return (
          <div key="contacts" className="mb-6">
            <h2
              className="text-xl font-bold mb-3"
              style={{ color: theme_primary_color, fontFamily: theme_font }}
            >
              Contato
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {contact_whatsapp && (
                <a
                  href={(() => {
                    let phone = contact_whatsapp.replace(/\D/g, '');
                    if (phone.length <= 11 && !phone.startsWith('55')) {
                      phone = '55' + phone;
                    }
                    return `https://wa.me/${phone}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {contact_email && (
                <a
                  href={`mailto:${contact_email}`}
                  className="flex items-center gap-2 p-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: theme_secondary_color }}
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </a>
              )}
              {contact_instagram && (
                <a
                  href={`https://instagram.com/${contact_instagram.replace('@', '')}`}
                  className="flex items-center gap-2 p-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#E4405F' }}
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              )}
              {contact_facebook && (
                <a
                  href={contact_facebook.includes('http') ? contact_facebook : `https://facebook.com/${contact_facebook}`}
                  className="flex items-center gap-2 p-2 rounded-lg text-white text-sm"
                  style={{ backgroundColor: '#1877F2' }}
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </a>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4 max-w-sm mx-auto" style={{ fontFamily: theme_font }}>
      <div className="text-xs text-muted-foreground text-center mb-2">
        Pré-visualização
      </div>
      {sections_order.map(renderSection)}
    </Card>
  );
};

export default CatalogPreview;
