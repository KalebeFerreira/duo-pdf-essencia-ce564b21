import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface PdfDownloadButtonProps {
  content: string;
  title: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const PdfDownloadButton = ({ content, title, variant = "outline", size = "sm", className = "" }: PdfDownloadButtonProps) => {
  const handleDownload = async () => {
    try {
      // Check if content is already a data URI
      if (content.startsWith("data:application/pdf")) {
        // It's already a PDF, download directly
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
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = content;
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
        pdf.save(`${title}.pdf`);
      } else {
        // It's text content, create PDF from text
        const pdf = new jsPDF();
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
        const lineHeight = 7;
        
        // Add title
        pdf.setFontSize(16);
        pdf.text(title, margin, margin);
        
        // Add content
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(content, pageWidth);
        let y = margin + 15;
        
        lines.forEach((line: string) => {
          if (y > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        });
        
        pdf.save(`${title}.pdf`);
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
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleDownload} className={className}>
      <Download className="w-3 h-3 mr-1" />
      Download
    </Button>
  );
};

export default PdfDownloadButton;
