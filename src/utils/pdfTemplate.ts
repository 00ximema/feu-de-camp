import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Couleurs du thème Feu de Camp
export const PDF_COLORS = {
  primary: { r: 230, g: 126, b: 34 },      // Orange feu de camp
  primaryDark: { r: 196, g: 92, b: 0 },    // Orange foncé
  background: { r: 255, g: 250, b: 245 },  // Fond crème léger
  backgroundLight: { r: 254, g: 243, b: 226 }, // Fond orange très léger
  text: { r: 51, g: 51, b: 51 },           // Texte principal
  textLight: { r: 100, g: 100, b: 100 },   // Texte secondaire
  white: { r: 255, g: 255, b: 255 },
  border: { r: 240, g: 201, b: 160 }       // Bordure orange clair
};

export interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  sessionName?: string;
}

/**
 * Crée un en-tête uniforme pour tous les PDF
 */
export const createPdfHeader = (
  pdf: jsPDF, 
  options: PdfHeaderOptions
): number => {
  const pageWidth = pdf.internal.pageSize.width;
  const { title, subtitle, showDate = true, sessionName } = options;

  // Fond dégradé subtil en haut
  pdf.setFillColor(PDF_COLORS.background.r, PDF_COLORS.background.g, PDF_COLORS.background.b);
  pdf.rect(0, 0, pageWidth, 35, 'F');

  // Ligne décorative orange en haut
  pdf.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
  pdf.rect(0, 0, pageWidth, 4, 'F');

  // Titre principal
  pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, 15, 18);

  // Sous-titre ou nom de session
  let yPosition = 26;
  if (subtitle || sessionName) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
    pdf.text(subtitle || `Session: ${sessionName}`, 15, yPosition);
  }

  // Date de génération
  if (showDate) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
    const dateText = `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`;
    pdf.text(dateText, pageWidth - 15, 18, { align: 'right' });
  }

  // Icône Feu de Camp (texte simple au lieu d'emoji)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
  pdf.text('Feu de Camp', pageWidth - 40, 26);

  // Ligne de séparation
  pdf.setDrawColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
  pdf.setLineWidth(0.5);
  pdf.line(15, 33, pageWidth - 15, 33);

  return 45; // Retourne la position Y après l'en-tête
};

/**
 * Ajoute un pied de page uniforme à toutes les pages du PDF
 */
export const addPdfFooter = (pdf: jsPDF): void => {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Ligne de séparation
    pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
    pdf.setLineWidth(0.3);
    pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    // Texte de pied de page
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Nom de l'application à gauche
    pdf.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
    pdf.text('Feu de Camp', 15, pageHeight - 8);

    // Numéro de page à droite
    pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
    pdf.text(`Page ${i}/${pageCount}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
  }
};

/**
 * Ajoute une section avec titre dans le PDF
 */
export const addPdfSection = (
  pdf: jsPDF,
  title: string,
  yPosition: number
): number => {
  const pageWidth = pdf.internal.pageSize.width;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
  pdf.text(title, 15, yPosition);

  // Ligne sous le titre
  pdf.setDrawColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
  pdf.setLineWidth(0.3);
  pdf.line(15, yPosition + 2, pageWidth - 15, yPosition + 2);

  return yPosition + 10;
};

/**
 * Vérifie si on a besoin d'une nouvelle page
 */
export const checkNewPage = (
  pdf: jsPDF,
  currentY: number,
  neededHeight: number,
  margin: number = 20
): number => {
  const pageHeight = pdf.internal.pageSize.height;
  
  if (currentY + neededHeight > pageHeight - margin) {
    pdf.addPage();
    return 20; // Nouvelle position Y en haut de la nouvelle page
  }
  
  return currentY;
};

/**
 * Ajoute du texte avec retour à la ligne automatique
 */
export const addWrappedText = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 10
): number => {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + (lines.length * fontSize * 0.4);
};

/**
 * Crée un PDF avec le template standard
 */
export const createStandardPdf = (options: PdfHeaderOptions): { pdf: jsPDF; startY: number } => {
  const pdf = new jsPDF();
  const startY = createPdfHeader(pdf, options);
  return { pdf, startY };
};
