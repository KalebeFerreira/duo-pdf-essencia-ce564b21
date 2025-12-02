import jsPDF from "jspdf";

/**
 * Adiciona marca d'água do Essência Duo em todas as páginas do PDF
 * Apenas para usuários do plano gratuito
 */
export const addWatermarkToPdf = (pdf: jsPDF, isFreePlan: boolean) => {
  if (!isFreePlan) return;
  
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Configurar fonte e opacidade para marca d'água
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150); // Cinza claro
    
    // Texto da marca d'água no rodapé
    const watermarkText = "Criado com Essência Duo PDF - essenciaduopdf.com";
    const textWidth = pdf.getTextWidth(watermarkText);
    
    // Posição centralizada no rodapé
    const xPosition = (pageWidth - textWidth) / 2;
    const yPosition = pageHeight - 10;
    
    pdf.text(watermarkText, xPosition, yPosition);
    
    // Resetar cor do texto para preto
    pdf.setTextColor(0, 0, 0);
  }
};

/**
 * Verifica se o usuário está no plano gratuito
 */
export const checkIsFreePlan = async (supabase: any, userId: string | undefined): Promise<boolean> => {
  if (!userId) return true;
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    
    return !profile?.plan || profile.plan === 'free';
  } catch {
    return true;
  }
};
