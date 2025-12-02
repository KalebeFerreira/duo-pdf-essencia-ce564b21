import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { applyTemplate } from "@/utils/pdfTemplates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface PdfDownloadButtonProps {
  content: string;
  title: string;
  photoUrl?: string;
  signatureUrl?: string;
  template?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const PdfDownloadButton = ({ content, title, photoUrl, signatureUrl, template = "modern", variant = "outline", size = "sm", className = "" }: PdfDownloadButtonProps) => {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Verificar se é plano gratuito
      let isFreePlan = true;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        isFreePlan = !profile?.plan || profile.plan === 'free';
      }

      // Decodificar conteúdo se estiver em base64
      let decodedContent = content;
      if (content.startsWith("data:text/plain;base64,")) {
        try {
          const base64Content = content.replace('data:text/plain;base64,', '');
          decodedContent = decodeURIComponent(escape(atob(base64Content)));
        } catch (e) {
          console.error('Error decoding base64:', e);
        }
      }

      // Check if content is already a PDF data URI
      if (content.startsWith("data:application/pdf")) {
        const link = document.createElement("a");
        link.href = content;
        link.download = `${title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (content.startsWith("data:image/")) {
        // It's an image, create PDF from it
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = content;
        });

        const imgRatio = imgElement.width / imgElement.height;
        const pageRatio = pageWidth / pageHeight;

        let width = pageWidth;
        let height = pageHeight;

        if (imgRatio > pageRatio) {
          height = width / imgRatio;
        } else {
          width = height * imgRatio;
        }

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        pdf.addImage(content, "JPEG", x, y, width, height);
        
        // Adicionar marca d'água se for plano gratuito
        if (isFreePlan) {
          pdf.setFontSize(10);
          pdf.setTextColor(150, 150, 150);
          const watermarkText = "Criado com Essência Duo PDF - essenciaduopdf.com";
          const textWidth = pdf.getTextWidth(watermarkText);
          pdf.text(watermarkText, (pageWidth - textWidth) / 2, pageHeight - 10);
        }
        
        pdf.save(`${title}.pdf`);
      } else {
        // It's text content, create PDF from text with template
        const pdf = new jsPDF();
        
        // Aplicar template visual ao PDF com marca d'água para plano gratuito
        const styledPdf = applyTemplate(pdf, template, decodedContent, title, photoUrl, signatureUrl, isFreePlan);
        
        styledPdf.save(`${title}.pdf`);
      }

      toast({
        title: "Download Iniciado",
        description: "Seu PDF está sendo baixado.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Erro no Download",
        description: "Ocorreu um erro ao baixar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownload} className={className} disabled={isDownloading}>
      <Download className="w-3 h-3 mr-1" />
      {isDownloading ? "..." : "Download"}
    </Button>
  );
};

export default PdfDownloadButton;
