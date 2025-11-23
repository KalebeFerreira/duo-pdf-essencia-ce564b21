import jsPDF from "jspdf";

export interface PdfTemplateConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    lightText: string;
  };
  fonts: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
  };
  layout: "single-column" | "two-column" | "header-sidebar";
}

const templateConfigs: Record<string, PdfTemplateConfig> = {
  modern: {
    colors: {
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#3b82f6",
      text: "#1f2937",
      lightText: "#6b7280",
    },
    fonts: { title: 24, subtitle: 14, body: 11, small: 9 },
    layout: "single-column",
  },
  classic: {
    colors: {
      primary: "#1f2937",
      secondary: "#374151",
      accent: "#4b5563",
      text: "#111827",
      lightText: "#6b7280",
    },
    fonts: { title: 22, subtitle: 13, body: 10, small: 9 },
    layout: "two-column",
  },
  creative: {
    colors: {
      primary: "#7c3aed",
      secondary: "#a855f7",
      accent: "#c084fc",
      text: "#1f2937",
      lightText: "#6b7280",
    },
    fonts: { title: 26, subtitle: 15, body: 11, small: 9 },
    layout: "header-sidebar",
  },
  minimal: {
    colors: {
      primary: "#0891b2",
      secondary: "#06b6d4",
      accent: "#22d3ee",
      text: "#0f172a",
      lightText: "#64748b",
    },
    fonts: { title: 20, subtitle: 12, body: 10, small: 8 },
    layout: "single-column",
  },
  executive: {
    colors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#334155",
      text: "#0f172a",
      lightText: "#475569",
    },
    fonts: { title: 22, subtitle: 13, body: 10, small: 9 },
    layout: "two-column",
  },
  tech: {
    colors: {
      primary: "#059669",
      secondary: "#10b981",
      accent: "#34d399",
      text: "#1f2937",
      lightText: "#6b7280",
    },
    fonts: { title: 24, subtitle: 14, body: 11, small: 9 },
    layout: "header-sidebar",
  },
};

export function applyTemplate(
  pdf: jsPDF,
  template: string,
  content: string,
  title: string,
  photoUrl?: string,
  signatureUrl?: string
): jsPDF {
  const config = templateConfigs[template] || templateConfigs.modern;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  if (config.layout === "single-column") {
    return applySingleColumnLayout(pdf, config, content, title, photoUrl, signatureUrl);
  } else if (config.layout === "two-column") {
    return applyTwoColumnLayout(pdf, config, content, title, photoUrl, signatureUrl);
  } else {
    return applyHeaderSidebarLayout(pdf, config, content, title, photoUrl, signatureUrl);
  }
}

function applySingleColumnLayout(
  pdf: jsPDF,
  config: PdfTemplateConfig,
  content: string,
  title: string,
  photoUrl?: string,
  signatureUrl?: string
): jsPDF {
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = margin;

  // Header colorido
  pdf.setFillColor(config.colors.primary);
  pdf.rect(0, 0, pageWidth, 40, "F");

  // Foto
  if (photoUrl) {
    const photoSize = 25;
    const photoX = margin;
    pdf.setFillColor(255, 255, 255);
    pdf.circle(photoX + photoSize / 2, y + 15, photoSize / 2, "F");
    try {
      pdf.addImage(photoUrl, "JPEG", photoX, y + 2.5, photoSize, photoSize);
    } catch (e) {
      console.error("Error adding photo:", e);
    }
  }

  // Título no header
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.fonts.title);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, photoUrl ? margin + 35 : margin, y + 15);

  y = 50;
  pdf.setTextColor(config.colors.text);

  // Conteúdo com suporte a imagens
  pdf.setFontSize(config.fonts.body);
  pdf.setFont("helvetica", "normal");
  
  // Processar conteúdo e extrair imagens
  const imageRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
  let processedContent = content;
  const extractedImages: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    extractedImages.push(match[1]);
    processedContent = processedContent.replace(match[0], '');
  }
  
  const lines = pdf.splitTextToSize(processedContent, pageWidth - 2 * margin);
  
  lines.forEach((line: string) => {
    if (y > pdf.internal.pageSize.getHeight() - margin - 40) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 6;
  });
  
  // Adicionar imagens extraídas
  if (extractedImages.length > 0) {
    y += 10;
    extractedImages.forEach((imgData, index) => {
      if (y > pdf.internal.pageSize.getHeight() - margin - 80) {
        pdf.addPage();
        y = margin;
      }
      
      try {
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = 60;
        pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch (e) {
        console.error("Error adding image:", e);
      }
    });
  }

  // Adicionar assinatura no final
  if (signatureUrl) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const signatureY = pageHeight - margin - 30;
    
    if (y > signatureY - 10) {
      pdf.addPage();
      y = margin;
    }
    
    try {
      pdf.addImage(signatureUrl, "PNG", margin, signatureY, 50, 20);
    } catch (e) {
      console.error("Error adding signature:", e);
    }
  }

  return pdf;
}

function applyTwoColumnLayout(
  pdf: jsPDF,
  config: PdfTemplateConfig,
  content: string,
  title: string,
  photoUrl?: string,
  signatureUrl?: string
): jsPDF {
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const leftColumnWidth = 65;
  const rightColumnWidth = pageWidth - leftColumnWidth - margin * 2;
  let y = margin;

  // Sidebar esquerda
  pdf.setFillColor(config.colors.secondary);
  pdf.rect(0, 0, leftColumnWidth, pdf.internal.pageSize.getHeight(), "F");

  // Foto na sidebar
  if (photoUrl) {
    const photoSize = 40;
    const photoX = (leftColumnWidth - photoSize) / 2;
    pdf.setFillColor(255, 255, 255);
    pdf.circle(photoX + photoSize / 2, y + photoSize / 2, photoSize / 2, "F");
    try {
      pdf.addImage(photoUrl, "JPEG", photoX, y, photoSize, photoSize);
    } catch (e) {
      console.error("Error adding photo:", e);
    }
    y += photoSize + 10;
  }

  // Nome na sidebar
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.fonts.subtitle);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(title, leftColumnWidth - 10);
  titleLines.forEach((line: string) => {
    pdf.text(line, 5, y);
    y += 7;
  });

  // Conteúdo na coluna direita com suporte a imagens
  y = margin;
  pdf.setTextColor(config.colors.text);
  pdf.setFontSize(config.fonts.body);
  pdf.setFont("helvetica", "normal");
  
  // Processar conteúdo e extrair imagens
  const imageRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
  let processedContent = content;
  const extractedImages: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    extractedImages.push(match[1]);
    processedContent = processedContent.replace(match[0], '');
  }
  
  const lines = pdf.splitTextToSize(processedContent, rightColumnWidth - 10);
  lines.forEach((line: string) => {
    if (y > pdf.internal.pageSize.getHeight() - margin - 40) {
      pdf.addPage();
      pdf.setFillColor(config.colors.secondary);
      pdf.rect(0, 0, leftColumnWidth, pdf.internal.pageSize.getHeight(), "F");
      y = margin;
    }
    pdf.text(line, leftColumnWidth + 10, y);
    y += 6;
  });
  
  // Adicionar imagens extraídas
  if (extractedImages.length > 0) {
    y += 10;
    extractedImages.forEach((imgData, index) => {
      if (y > pdf.internal.pageSize.getHeight() - margin - 80) {
        pdf.addPage();
        pdf.setFillColor(config.colors.secondary);
        pdf.rect(0, 0, leftColumnWidth, pdf.internal.pageSize.getHeight(), "F");
        y = margin;
      }
      
      try {
        const imgWidth = rightColumnWidth - 20;
        const imgHeight = 50;
        pdf.addImage(imgData, "PNG", leftColumnWidth + 10, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch (e) {
        console.error("Error adding image:", e);
      }
    });
  }

  // Adicionar assinatura no final
  if (signatureUrl) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const signatureY = pageHeight - margin - 30;
    
    if (y > signatureY - 10) {
      pdf.addPage();
      pdf.setFillColor(config.colors.secondary);
      pdf.rect(0, 0, leftColumnWidth, pdf.internal.pageSize.getHeight(), "F");
      y = margin;
    }
    
    try {
      pdf.addImage(signatureUrl, "PNG", leftColumnWidth + 10, signatureY, 50, 20);
    } catch (e) {
      console.error("Error adding signature:", e);
    }
  }

  return pdf;
}

function applyHeaderSidebarLayout(
  pdf: jsPDF,
  config: PdfTemplateConfig,
  content: string,
  title: string,
  photoUrl?: string,
  signatureUrl?: string
): jsPDF {
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = margin;

  // Header com gradiente visual
  pdf.setFillColor(config.colors.primary);
  pdf.rect(0, 0, pageWidth, 50, "F");
  
  pdf.setFillColor(config.colors.accent);
  pdf.rect(0, 45, pageWidth, 5, "F");

  // Foto no header
  if (photoUrl) {
    const photoSize = 30;
    const photoX = margin;
    pdf.setFillColor(255, 255, 255);
    pdf.circle(photoX + photoSize / 2, y + 10, photoSize / 2 + 1, "F");
    try {
      pdf.addImage(photoUrl, "JPEG", photoX, y, photoSize, photoSize);
    } catch (e) {
      console.error("Error adding photo:", e);
    }
  }

  // Título
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.fonts.title);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, photoUrl ? margin + 40 : margin, y + 18);

  y = 60;
  pdf.setTextColor(config.colors.text);

  // Linha decorativa
  pdf.setDrawColor(config.colors.accent);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Conteúdo com suporte a imagens
  pdf.setFontSize(config.fonts.body);
  pdf.setFont("helvetica", "normal");
  
  // Processar conteúdo e extrair imagens
  const imageRegex = /!\[.*?\]\((data:image\/[^)]+)\)/g;
  let processedContent = content;
  const extractedImages: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    extractedImages.push(match[1]);
    processedContent = processedContent.replace(match[0], '');
  }
  
  const lines = pdf.splitTextToSize(processedContent, pageWidth - 2 * margin);
  
  lines.forEach((line: string) => {
    if (y > pdf.internal.pageSize.getHeight() - margin - 40) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 6;
  });
  
  // Adicionar imagens extraídas
  if (extractedImages.length > 0) {
    y += 10;
    extractedImages.forEach((imgData, index) => {
      if (y > pdf.internal.pageSize.getHeight() - margin - 80) {
        pdf.addPage();
        y = margin;
      }
      
      try {
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = 60;
        pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch (e) {
        console.error("Error adding image:", e);
      }
    });
  }

  // Adicionar assinatura no final
  if (signatureUrl) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const signatureY = pageHeight - margin - 30;
    
    if (y > signatureY - 10) {
      pdf.addPage();
      y = margin;
    }
    
    try {
      pdf.addImage(signatureUrl, "PNG", margin, signatureY, 50, 20);
    } catch (e) {
      console.error("Error adding signature:", e);
    }
  }

  return pdf;
}
