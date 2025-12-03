import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, FileDown, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCatalog, useCatalogs, type Catalog, type CatalogProduct, type CatalogPriceItem, type CatalogTestimonial } from "@/hooks/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { jsPDF } from "jspdf";
import { addWatermarkToPdf } from "@/utils/pdfWatermark";

import CatalogCoverSection from "@/components/catalog/CatalogCoverSection";
import CatalogAboutSection from "@/components/catalog/CatalogAboutSection";
import CatalogProductsSection from "@/components/catalog/CatalogProductsSection";
import CatalogPriceTableSection from "@/components/catalog/CatalogPriceTableSection";
import CatalogGallerySection from "@/components/catalog/CatalogGallerySection";
import CatalogTestimonialsSection from "@/components/catalog/CatalogTestimonialsSection";
import CatalogContactsSection from "@/components/catalog/CatalogContactsSection";
import CatalogThemeSection from "@/components/catalog/CatalogThemeSection";
import CatalogPreview from "@/components/catalog/CatalogPreview";

const CreateCatalog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { data: existingCatalog, isLoading: isLoadingCatalog } = useCatalog(id);
  const { createCatalog, updateCatalog, isCreating, isUpdating } = useCatalogs();

  const [catalog, setCatalog] = useState<Partial<Catalog>>({
    title: 'Meu Catálogo',
    about_title: 'Sobre',
    products: [],
    price_table: [],
    gallery: [],
    testimonials: [],
    theme_primary_color: '#3B82F6',
    theme_secondary_color: '#1E40AF',
    theme_font: 'Inter',
    sections_order: ['cover', 'about', 'products', 'prices', 'gallery', 'testimonials', 'contacts'],
  });

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (existingCatalog) {
      setCatalog(existingCatalog);
    }
  }, [existingCatalog]);

  const isFreePlan = profile?.plan === 'free' || !profile?.plan;

  const handleSave = () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar",
        variant: "destructive",
      });
      return;
    }

    if (id && existingCatalog) {
      updateCatalog(
        { id, ...catalog },
        {
          onSuccess: () => {
            toast({
              title: "Sucesso",
              description: "Catálogo salvo com sucesso!",
            });
          },
          onError: (error: any) => {
            toast({
              title: "Erro",
              description: error.message || "Erro ao salvar catálogo",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createCatalog(catalog, {
        onSuccess: (newCatalog: any) => {
          toast({
            title: "Sucesso",
            description: "Catálogo criado com sucesso!",
          });
          navigate(`/catalog/${newCatalog.id}`);
        },
        onError: (error: any) => {
          toast({
            title: "Erro",
            description: error.message || "Erro ao criar catálogo",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      // Helper function to add new page if needed
      const checkNewPage = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Cover Page
      if (catalog.cover_image) {
        try {
          pdf.addImage(catalog.cover_image, 'JPEG', 0, 0, pageWidth, pageHeight / 2);
        } catch (e) {
          pdf.setFillColor(catalog.theme_primary_color || '#3B82F6');
          pdf.rect(0, 0, pageWidth, pageHeight / 2, 'F');
        }
      } else {
        pdf.setFillColor(catalog.theme_primary_color || '#3B82F6');
        pdf.rect(0, 0, pageWidth, pageHeight / 2, 'F');
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.text(catalog.title || 'Meu Catálogo', pageWidth / 2, pageHeight / 4, { align: 'center' });

      // Add content below cover
      y = pageHeight / 2 + 20;

      // About Section
      if (catalog.about_text) {
        pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
        pdf.setFontSize(18);
        pdf.text(catalog.about_title || 'Sobre', margin, y);
        y += 10;

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(10);
        const aboutLines = pdf.splitTextToSize(catalog.about_text, pageWidth - margin * 2);
        pdf.text(aboutLines, margin, y);
        y += aboutLines.length * 5 + 15;
      }

      // Products Section
      if (catalog.products && catalog.products.length > 0) {
        checkNewPage(30);
        pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
        pdf.setFontSize(18);
        pdf.text('Produtos & Serviços', margin, y);
        y += 10;

        for (const product of catalog.products) {
          checkNewPage(40);

          if (product.image) {
            try {
              pdf.addImage(product.image, 'JPEG', margin, y, 30, 30);
            } catch (e) {}
          }

          const textX = product.image ? margin + 35 : margin;
          pdf.setTextColor(30, 30, 30);
          pdf.setFontSize(12);
          pdf.text(product.name, textX, y + 5);

          pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
          pdf.setFontSize(11);
          pdf.text(product.price, textX, y + 12);

          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(9);
          const descLines = pdf.splitTextToSize(product.description, pageWidth - textX - margin);
          pdf.text(descLines.slice(0, 2), textX, y + 18);

          y += 40;
        }
      }

      // Price Table
      if (catalog.price_table && catalog.price_table.length > 0) {
        checkNewPage(30);
        pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
        pdf.setFontSize(18);
        pdf.text('Tabela de Preços', margin, y);
        y += 10;

        for (const item of catalog.price_table) {
          checkNewPage(10);
          pdf.setTextColor(30, 30, 30);
          pdf.setFontSize(10);
          pdf.text(item.service, margin, y);
          pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
          pdf.text(item.price, pageWidth - margin, y, { align: 'right' });
          y += 8;
        }
        y += 10;
      }

      // Testimonials
      if (catalog.testimonials && catalog.testimonials.length > 0) {
        checkNewPage(30);
        pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
        pdf.setFontSize(18);
        pdf.text('Depoimentos', margin, y);
        y += 10;

        for (const testimonial of catalog.testimonials) {
          checkNewPage(25);
          pdf.setTextColor(80, 80, 80);
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'italic');
          const testimonialLines = pdf.splitTextToSize(`"${testimonial.text}"`, pageWidth - margin * 2);
          pdf.text(testimonialLines, margin, y);
          y += testimonialLines.length * 5;

          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(30, 30, 30);
          pdf.text(`— ${testimonial.name}`, margin, y);
          pdf.setFont(undefined, 'normal');
          y += 12;
        }
      }

      // Contacts
      if (catalog.contact_whatsapp || catalog.contact_email || catalog.contact_instagram) {
        checkNewPage(40);
        pdf.setTextColor(catalog.theme_primary_color || '#3B82F6');
        pdf.setFontSize(18);
        pdf.text('Contato', margin, y);
        y += 10;

        pdf.setTextColor(60, 60, 60);
        pdf.setFontSize(10);
        if (catalog.contact_whatsapp) {
          pdf.text(`WhatsApp: ${catalog.contact_whatsapp}`, margin, y);
          y += 6;
        }
        if (catalog.contact_email) {
          pdf.text(`E-mail: ${catalog.contact_email}`, margin, y);
          y += 6;
        }
        if (catalog.contact_instagram) {
          pdf.text(`Instagram: ${catalog.contact_instagram}`, margin, y);
          y += 6;
        }
        if (catalog.contact_facebook) {
          pdf.text(`Facebook: ${catalog.contact_facebook}`, margin, y);
        }
      }

      // Add watermark for free plan
      if (isFreePlan) {
        addWatermarkToPdf(pdf, true);
      }

      pdf.save(`${catalog.title || 'catalogo'}.pdf`);

      toast({
        title: "Sucesso",
        description: "PDF exportado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingCatalog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Catálogo Digital
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Exportar PDF
              </Button>
              <Button onClick={handleSave} disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <CatalogCoverSection
              title={catalog.title || ''}
              coverImage={catalog.cover_image}
              onTitleChange={(title) => setCatalog({ ...catalog, title })}
              onCoverImageChange={(cover_image) => setCatalog({ ...catalog, cover_image })}
            />

            <CatalogAboutSection
              aboutTitle={catalog.about_title || 'Sobre'}
              aboutText={catalog.about_text}
              aboutImage={catalog.about_image}
              onAboutTitleChange={(about_title) => setCatalog({ ...catalog, about_title })}
              onAboutTextChange={(about_text) => setCatalog({ ...catalog, about_text })}
              onAboutImageChange={(about_image) => setCatalog({ ...catalog, about_image })}
            />

            <CatalogProductsSection
              products={(catalog.products as CatalogProduct[]) || []}
              onProductsChange={(products) => setCatalog({ ...catalog, products })}
            />

            <CatalogPriceTableSection
              priceTable={(catalog.price_table as CatalogPriceItem[]) || []}
              onPriceTableChange={(price_table) => setCatalog({ ...catalog, price_table })}
              businessContext={catalog.title}
            />

            <CatalogGallerySection
              gallery={(catalog.gallery as string[]) || []}
              onGalleryChange={(gallery) => setCatalog({ ...catalog, gallery })}
            />

            <CatalogTestimonialsSection
              testimonials={(catalog.testimonials as CatalogTestimonial[]) || []}
              onTestimonialsChange={(testimonials) => setCatalog({ ...catalog, testimonials })}
              businessContext={catalog.title}
            />

            <CatalogContactsSection
              whatsapp={catalog.contact_whatsapp}
              email={catalog.contact_email}
              instagram={catalog.contact_instagram}
              facebook={catalog.contact_facebook}
              onWhatsappChange={(contact_whatsapp) => setCatalog({ ...catalog, contact_whatsapp })}
              onEmailChange={(contact_email) => setCatalog({ ...catalog, contact_email })}
              onInstagramChange={(contact_instagram) => setCatalog({ ...catalog, contact_instagram })}
              onFacebookChange={(contact_facebook) => setCatalog({ ...catalog, contact_facebook })}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <CatalogThemeSection
              primaryColor={catalog.theme_primary_color || '#3B82F6'}
              secondaryColor={catalog.theme_secondary_color || '#1E40AF'}
              font={catalog.theme_font || 'Inter'}
              onPrimaryColorChange={(theme_primary_color) => setCatalog({ ...catalog, theme_primary_color })}
              onSecondaryColorChange={(theme_secondary_color) => setCatalog({ ...catalog, theme_secondary_color })}
              onFontChange={(theme_font) => setCatalog({ ...catalog, theme_font })}
            />

            <div className="sticky top-24">
              <CatalogPreview catalog={catalog} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCatalog;
