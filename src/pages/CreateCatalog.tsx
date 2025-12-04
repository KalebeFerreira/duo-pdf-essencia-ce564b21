import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, FileDown, Loader2, BookOpen, Wand2, Share2, Link2, Check, Image, FileSpreadsheet, Presentation, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from "html2canvas";
import PptxGenJS from "pptxgenjs";
import { useToast } from "@/hooks/use-toast";
import { useCatalog, useCatalogs, type Catalog, type CatalogProduct, type CatalogPriceItem, type CatalogTestimonial } from "@/hooks/useCatalogs";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { jsPDF } from "jspdf";
import { addWatermarkToPdf } from "@/utils/pdfWatermark";
import { supabase } from "@/integrations/supabase/client";

import CatalogCoverSection from "@/components/catalog/CatalogCoverSection";
import CatalogAboutSection from "@/components/catalog/CatalogAboutSection";
import CatalogProductsSection from "@/components/catalog/CatalogProductsSection";
import CatalogPriceTableSection from "@/components/catalog/CatalogPriceTableSection";
import CatalogGallerySection from "@/components/catalog/CatalogGallerySection";
import CatalogTestimonialsSection from "@/components/catalog/CatalogTestimonialsSection";
import CatalogContactsSection from "@/components/catalog/CatalogContactsSection";
import CatalogThemeSection from "@/components/catalog/CatalogThemeSection";
import CatalogPreview from "@/components/catalog/CatalogPreview";
import CatalogAIGenerator from "@/components/catalog/CatalogAIGenerator";
import CatalogTemplateSelector from "@/components/catalog/CatalogTemplateSelector";
import type { CatalogTemplate } from "@/utils/catalogTemplates";

const CreateCatalog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { data: existingCatalog, isLoading: isLoadingCatalog } = useCatalog(id);
  const { createCatalog, updateCatalog, isCreating, isUpdating } = useCatalogs();

  const [catalog, setCatalog] = useState<Partial<Catalog>>({
    title: '',
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
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedTemplateForAI, setSelectedTemplateForAI] = useState<CatalogTemplate | null>(null);

  useEffect(() => {
    if (existingCatalog) {
      setCatalog(existingCatalog);
    }
  }, [existingCatalog]);

  const isFreePlan = profile?.plan === 'free' || !profile?.plan;
  
  const publicLink = id ? `${window.location.origin}/c/${id}` : '';

  const handleTogglePublic = async (checked: boolean) => {
    if (!id) {
      toast({
        title: "Aviso",
        description: "Salve o catálogo primeiro para compartilhar",
        variant: "destructive",
      });
      return;
    }
    
    setCatalog({ ...catalog, is_public: checked });
    
    const { error } = await supabase
      .from('catalogs')
      .update({ is_public: checked })
      .eq('id', id);
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar visibilidade",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: checked ? "Link público ativado!" : "Link público desativado",
      description: checked ? "Qualquer pessoa com o link pode ver seu catálogo" : "O catálogo agora é privado",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "Cole onde quiser compartilhar",
    });
  };

  const handleGenerateAll = async () => {
    if (!catalog.title?.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título para o catálogo primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // Generate about text
      const aboutResponse = await supabase.functions.invoke('generate-catalog-content', {
        body: { type: 'about', prompt: catalog.title }
      });
      
      if (aboutResponse.data?.content) {
        setCatalog(prev => ({ ...prev, about_text: aboutResponse.data.content }));
      }

      // Generate 3 products
      const products: any[] = [];
      for (let i = 0; i < 3; i++) {
        const productResponse = await supabase.functions.invoke('generate-catalog-content', {
          body: { type: 'product', prompt: `${catalog.title} - produto ${i + 1}` }
        });
        
        if (productResponse.data?.content) {
          try {
            const productData = typeof productResponse.data.content === 'string' 
              ? JSON.parse(productResponse.data.content) 
              : productResponse.data.content;
            products.push({
              id: crypto.randomUUID(),
              name: productData.name || '',
              description: productData.description || '',
              price: productData.price || '',
            });
          } catch {}
        }
      }
      if (products.length > 0) {
        setCatalog(prev => ({ ...prev, products }));
      }

      // Generate price table
      const priceResponse = await supabase.functions.invoke('generate-catalog-content', {
        body: { type: 'price_table', prompt: catalog.title }
      });
      
      if (priceResponse.data?.content) {
        try {
          const priceData = typeof priceResponse.data.content === 'string'
            ? JSON.parse(priceResponse.data.content)
            : priceResponse.data.content;
          if (Array.isArray(priceData)) {
            setCatalog(prev => ({ ...prev, price_table: priceData }));
          }
        } catch {}
      }

      // Generate testimonials
      const testimonialResponse = await supabase.functions.invoke('generate-catalog-content', {
        body: { type: 'testimonials', prompt: catalog.title }
      });
      
      if (testimonialResponse.data?.content) {
        try {
          const testimonialData = typeof testimonialResponse.data.content === 'string'
            ? JSON.parse(testimonialResponse.data.content)
            : testimonialResponse.data.content;
          if (Array.isArray(testimonialData)) {
            setCatalog(prev => ({ ...prev, testimonials: testimonialData }));
          }
        } catch {}
      }

      // Generate cover image
      const coverImageResponse = await supabase.functions.invoke('generate-catalog-image', {
        body: { prompt: `capa profissional para catálogo de ${catalog.title}` }
      });
      
      if (coverImageResponse.data?.imageUrl) {
        setCatalog(prev => ({ ...prev, cover_image: coverImageResponse.data.imageUrl }));
      }

      toast({
        title: "Sucesso",
        description: "Conteúdo gerado com sucesso! Revise e ajuste conforme necessário.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar conteúdo",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

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
      setExportFormat(null);
    }
  };

  const handleExportImage = async (format: 'jpg' | 'png') => {
    setIsExporting(true);
    setExportFormat(format);
    try {
      const previewElement = document.getElementById('catalog-preview-container');
      if (!previewElement) {
        throw new Error('Preview não encontrado');
      }

      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `${catalog.title || 'catalogo'}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, format === 'jpg' ? 0.95 : 1);
      link.click();

      toast({
        title: "Sucesso",
        description: `${format.toUpperCase()} exportado com sucesso!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || `Erro ao exportar ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportPowerPoint = async () => {
    setIsExporting(true);
    setExportFormat('pptx');
    try {
      const pptx = new PptxGenJS();
      pptx.author = 'Essência Duo';
      pptx.title = catalog.title || 'Catálogo';

      // Cover slide
      const coverSlide = pptx.addSlide();
      coverSlide.addText(catalog.title || 'Meu Catálogo', {
        x: 0.5,
        y: 2,
        w: '90%',
        fontSize: 44,
        bold: true,
        color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        align: 'center',
      });

      // About slide
      if (catalog.about_text) {
        const aboutSlide = pptx.addSlide();
        aboutSlide.addText(catalog.about_title || 'Sobre', {
          x: 0.5,
          y: 0.5,
          fontSize: 28,
          bold: true,
          color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        });
        aboutSlide.addText(catalog.about_text, {
          x: 0.5,
          y: 1.2,
          w: '90%',
          fontSize: 16,
          color: '333333',
        });
      }

      // Products slide
      if (catalog.products && catalog.products.length > 0) {
        const productsSlide = pptx.addSlide();
        productsSlide.addText('Produtos & Serviços', {
          x: 0.5,
          y: 0.5,
          fontSize: 28,
          bold: true,
          color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        });
        
        catalog.products.forEach((product, i) => {
          productsSlide.addText(`${product.name} - ${product.price}`, {
            x: 0.5,
            y: 1.2 + i * 0.8,
            fontSize: 18,
            bold: true,
          });
          productsSlide.addText(product.description, {
            x: 0.5,
            y: 1.5 + i * 0.8,
            fontSize: 14,
            color: '666666',
          });
        });
      }

      // Price table slide
      if (catalog.price_table && catalog.price_table.length > 0) {
        const priceSlide = pptx.addSlide();
        priceSlide.addText('Tabela de Preços', {
          x: 0.5,
          y: 0.5,
          fontSize: 28,
          bold: true,
          color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        });

        const tableData = catalog.price_table.map((item: any) => [
          { text: item.service, options: { fontSize: 14 } },
          { text: item.price, options: { fontSize: 14, bold: true, color: catalog.theme_primary_color?.replace('#', '') || '3B82F6' } },
        ]);

        priceSlide.addTable(tableData, {
          x: 0.5,
          y: 1.2,
          w: 9,
          colW: [6, 3],
          border: { pt: 1, color: 'CCCCCC' },
        });
      }

      // Testimonials slide
      if (catalog.testimonials && catalog.testimonials.length > 0) {
        const testimonialsSlide = pptx.addSlide();
        testimonialsSlide.addText('Depoimentos', {
          x: 0.5,
          y: 0.5,
          fontSize: 28,
          bold: true,
          color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        });

        catalog.testimonials.forEach((t: any, i: number) => {
          testimonialsSlide.addText(`"${t.text}"`, {
            x: 0.5,
            y: 1.2 + i * 1.2,
            w: '90%',
            fontSize: 14,
            italic: true,
          });
          testimonialsSlide.addText(`— ${t.name}`, {
            x: 0.5,
            y: 1.6 + i * 1.2,
            fontSize: 12,
            bold: true,
          });
        });
      }

      // Contact slide
      if (catalog.contact_whatsapp || catalog.contact_email) {
        const contactSlide = pptx.addSlide();
        contactSlide.addText('Contato', {
          x: 0.5,
          y: 0.5,
          fontSize: 28,
          bold: true,
          color: catalog.theme_primary_color?.replace('#', '') || '3B82F6',
        });
        
        let contactY = 1.2;
        if (catalog.contact_whatsapp) {
          contactSlide.addText(`WhatsApp: ${catalog.contact_whatsapp}`, { x: 0.5, y: contactY, fontSize: 16 });
          contactY += 0.5;
        }
        if (catalog.contact_email) {
          contactSlide.addText(`E-mail: ${catalog.contact_email}`, { x: 0.5, y: contactY, fontSize: 16 });
          contactY += 0.5;
        }
        if (catalog.contact_instagram) {
          contactSlide.addText(`Instagram: ${catalog.contact_instagram}`, { x: 0.5, y: contactY, fontSize: 16 });
          contactY += 0.5;
        }
        if (catalog.contact_facebook) {
          contactSlide.addText(`Facebook: ${catalog.contact_facebook}`, { x: 0.5, y: contactY, fontSize: 16 });
        }
      }

      await pptx.writeFile({ fileName: `${catalog.title || 'catalogo'}.pptx` });

      toast({
        title: "Sucesso",
        description: "PowerPoint exportado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar PowerPoint",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportFormat('xlsx');
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Title
      csvContent += `${catalog.title || 'Catálogo'}\n\n`;
      
      // Products
      if (catalog.products && catalog.products.length > 0) {
        csvContent += "PRODUTOS E SERVIÇOS\n";
        csvContent += "Nome,Preço,Descrição\n";
        catalog.products.forEach((p) => {
          csvContent += `"${p.name}","${p.price}","${p.description}"\n`;
        });
        csvContent += "\n";
      }
      
      // Price table
      if (catalog.price_table && catalog.price_table.length > 0) {
        csvContent += "TABELA DE PREÇOS\n";
        csvContent += "Serviço,Preço\n";
        catalog.price_table.forEach((item: any) => {
          csvContent += `"${item.service}","${item.price}"\n`;
        });
        csvContent += "\n";
      }

      // Testimonials
      if (catalog.testimonials && catalog.testimonials.length > 0) {
        csvContent += "DEPOIMENTOS\n";
        csvContent += "Nome,Depoimento,Avaliação\n";
        catalog.testimonials.forEach((t: any) => {
          csvContent += `"${t.name}","${t.text}","${t.rating || 5} estrelas"\n`;
        });
        csvContent += "\n";
      }

      // Contacts
      csvContent += "CONTATOS\n";
      if (catalog.contact_whatsapp) csvContent += `WhatsApp,"${catalog.contact_whatsapp}"\n`;
      if (catalog.contact_email) csvContent += `E-mail,"${catalog.contact_email}"\n`;
      if (catalog.contact_instagram) csvContent += `Instagram,"${catalog.contact_instagram}"\n`;
      if (catalog.contact_facebook) csvContent += `Facebook,"${catalog.contact_facebook}"\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${catalog.title || 'catalogo'}.csv`);
      link.click();

      toast({
        title: "Sucesso",
        description: "Excel (CSV) exportado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao exportar Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportFormat(null);
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
              <Link to="/catalogs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Meus Catálogos
              </Link>
            </Button>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Catálogo Digital
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleGenerateAll}
                disabled={isGeneratingAll || !catalog.title?.trim()}
              >
                {isGeneratingAll ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                Gerar Tudo
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4 mr-2" />
                    )}
                    Exportar
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportImage('jpg')}>
                    <Image className="w-4 h-4 mr-2" />
                    JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportImage('png')}>
                    <Image className="w-4 h-4 mr-2" />
                    PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPowerPoint}>
                    <Presentation className="w-4 h-4 mr-2" />
                    PowerPoint
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Excel (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {/* Template Selector - Only show for new catalogs without content */}
            {!id && !catalog.title && (
              <CatalogTemplateSelector
                onApplyTemplate={(templateCatalog) => {
                  setCatalog({ ...catalog, ...templateCatalog });
                  toast({
                    title: "Template aplicado!",
                    description: "Você pode editar todos os campos conforme necessário.",
                  });
                }}
                onSelectForAI={(template) => {
                  setSelectedTemplateForAI(template);
                  setShowAIGenerator(true);
                }}
              />
            )}

            {/* AI Generator - Show when selected from template or for new catalogs */}
            {!id && (showAIGenerator || catalog.title) && (
              <CatalogAIGenerator 
                onGenerate={(generatedCatalog) => {
                  setCatalog({ ...catalog, ...generatedCatalog });
                  setShowAIGenerator(false);
                }}
                initialTemplate={selectedTemplateForAI || undefined}
              />
            )}

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
            {/* Share Section */}
            {id && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Share2 className="w-5 h-5" />
                    <CardTitle className="text-base">Compartilhar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="public-toggle" className="text-sm">Link Público</Label>
                    <Switch
                      id="public-toggle"
                      checked={catalog.is_public || false}
                      onCheckedChange={handleTogglePublic}
                    />
                  </div>
                  {catalog.is_public && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={publicLink}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyLink}
                        >
                          {linkCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(publicLink, '_blank')}
                      >
                        Ver Catálogo Público
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <CatalogThemeSection
              primaryColor={catalog.theme_primary_color || '#3B82F6'}
              secondaryColor={catalog.theme_secondary_color || '#1E40AF'}
              font={catalog.theme_font || 'Inter'}
              onPrimaryColorChange={(theme_primary_color) => setCatalog({ ...catalog, theme_primary_color })}
              onSecondaryColorChange={(theme_secondary_color) => setCatalog({ ...catalog, theme_secondary_color })}
              onFontChange={(theme_font) => setCatalog({ ...catalog, theme_font })}
            />

            <div className="sticky top-24" id="catalog-preview-container">
              <CatalogPreview catalog={catalog} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateCatalog;
