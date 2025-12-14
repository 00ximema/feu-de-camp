import jsPDF from 'jspdf';
import { createPdfHeader, addPdfFooter, addPdfSection, checkNewPage, PDF_COLORS } from './pdfTemplate';

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  telephone: string;
  email: string;
  role: string;
  diplomes: string[];
  notes: string;
  createdAt: string;
}

export const exportTeamToPDF = (team: TeamMember[]) => {
  try {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    
    // En-tête uniforme
    let yPosition = createPdfHeader(pdf, {
      title: 'Liste de l\'Équipe',
      subtitle: `${team.length} membre${team.length > 1 ? 's' : ''} enregistré${team.length > 1 ? 's' : ''}`
    });
    
    team.forEach((member, index) => {
      // Vérifier si on a besoin d'une nouvelle page
      yPosition = checkNewPage(pdf, yPosition, 50);
      
      // Titre du membre
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
      pdf.text(`${index + 1}. ${member.prenom} ${member.nom}`, 15, yPosition);
      yPosition += 7;
      
      // Informations principales
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      pdf.text(`Rôle: ${member.role}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Âge: ${member.age} ans`, 20, yPosition);
      yPosition += 5;
      
      if (member.telephone) {
        pdf.text(`Téléphone: ${member.telephone}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.email) {
        pdf.text(`Email: ${member.email}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.diplomes.length > 0) {
        pdf.text(`Diplômes: ${member.diplomes.join(', ')}`, 20, yPosition);
        yPosition += 5;
      }
      
      if (member.notes) {
        pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
        pdf.text(`Notes: ${member.notes}`, 20, yPosition);
        yPosition += 5;
      }
      
      yPosition += 8;
      
      // Ligne de séparation entre membres
      if (index < team.length - 1) {
        pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
        pdf.setLineWidth(0.2);
        pdf.line(20, yPosition - 4, 190, yPosition - 4);
      }
    });
    
    // Pied de page uniforme
    addPdfFooter(pdf);
    
    pdf.save(`Equipe_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    throw error;
  }
};
