import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MainCouranteEvent {
  id: string;
  date: string;
  time: string;
  description: string;
  selectedMembers: string[];
  selectedJeunes: string[];
  createdAt: string;
}

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

interface Jeune {
  id: string;
  nom: string;
  prenom: string;
  age: number;
}

export const exportMainCouranteToPDF = (
  events: MainCouranteEvent[],
  team: TeamMember[],
  jeunes: Jeune[],
  sessionName?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let currentY = 30;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (nextHeight: number) => {
    if (currentY + nextHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
  };

  // Helper function to get person names
  const getMemberName = (id: string) => {
    const member = team.find(m => m.id === id);
    return member ? `${member.prenom} ${member.nom} (${member.role})` : 'Membre inconnu';
  };

  const getJeuneName = (id: string) => {
    const jeune = jeunes.find(j => j.id === id);
    return jeune ? `${jeune.prenom} ${jeune.nom} (${jeune.age} ans)` : 'Jeune inconnu';
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MAIN COURANTE', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  if (sessionName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Session: ${sessionName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
  }

  doc.setFontSize(12);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Résumé: ${events.length} événement${events.length > 1 ? 's' : ''} enregistré${events.length > 1 ? 's' : ''}`, margin, currentY);
  currentY += 20;

  // Events
  const sortedEvents = events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  sortedEvents.forEach((event, index) => {
    // Check if we need space for the event (minimum 60 points)
    checkNewPage(60);

    // Event header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Événement ${index + 1}`, margin, currentY);
    currentY += 8;

    // Date and time
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const eventDateTime = format(new Date(event.date + 'T' + event.time), 'dd/MM/yyyy à HH:mm', { locale: fr });
    doc.text(`Date: ${eventDateTime}`, margin + 5, currentY);
    currentY += 8;

    // Description
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', margin + 5, currentY);
    currentY += 6;
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(event.description, margin + 5, currentY, pageWidth - 2 * margin - 10, 10);
    currentY += 5;

    // People involved
    const allPersons = [
      ...event.selectedMembers.map(getMemberName),
      ...event.selectedJeunes.map(getJeuneName)
    ];

    if (allPersons.length > 0) {
      checkNewPage(30);
      doc.setFont('helvetica', 'bold');
      doc.text('Personnes concernées:', margin + 5, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'normal');
      allPersons.forEach(person => {
        checkNewPage(6);
        doc.text(`• ${person}`, margin + 10, currentY);
        currentY += 6;
      });
    } else {
      checkNewPage(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Aucune personne spécifiquement concernée', margin + 5, currentY);
      currentY += 6;
    }

    // Created timestamp
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const createdAt = format(new Date(event.createdAt), 'dd/MM/yyyy à HH:mm:ss', { locale: fr });
    doc.text(`Créé le: ${createdAt}`, margin + 5, currentY);
    currentY += 15;

    // Separator line
    if (index < sortedEvents.length - 1) {
      checkNewPage(10);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    }
  });

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  const fileName = `main-courante-${sessionName ? sessionName.replace(/[^a-zA-Z0-9]/g, '-') + '-' : ''}${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};