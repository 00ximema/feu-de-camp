
import jsPDF from 'jspdf';

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
  const pdf = new jsPDF();
  
  // Header avec logo
  pdf.setFillColor(147, 51, 234);
  pdf.rect(0, 0, 210, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.text('MG', 15, 17);
  
  pdf.setFontSize(16);
  pdf.text('Liste de l\'Équipe', 50, 17);
  
  // Date et stats
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, 35);
  pdf.text(`Total: ${team.length} membre${team.length > 1 ? 's' : ''}`, 15, 42);
  
  let yPosition = 55;
  
  team.forEach((member, index) => {
    // Titre du membre
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${member.prenom} ${member.nom}`, 15, yPosition);
    yPosition += 7;
    
    // Informations principales
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
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
      pdf.text(`Notes: ${member.notes}`, 20, yPosition);
      yPosition += 5;
    }
    
    yPosition += 8;
    
    // Nouvelle page si nécessaire
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
  });
  
  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Page ${i}/${pageCount}`, 180, 285);
    pdf.text('Fondation MG - Gestion de l\'Équipe', 15, 285);
  }
  
  pdf.save(`Equipe_${new Date().toISOString().split('T')[0]}.pdf`);
};
