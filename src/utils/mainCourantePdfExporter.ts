import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPdfHeader, addPdfFooter, checkNewPage as checkPage, addWrappedText as wrapText, PDF_COLORS } from './pdfTemplate';

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
  const margin = 20;

  // En-tête uniforme
  let currentY = createPdfHeader(doc, {
    title: 'Main Courante',
    subtitle: `${events.length} événement${events.length > 1 ? 's' : ''} enregistré${events.length > 1 ? 's' : ''}`,
    sessionName
  });

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check if we need a new page
  const checkNewPage = (nextHeight: number) => {
    currentY = checkPage(doc, currentY, nextHeight, margin);
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

  // Pied de page uniforme
  addPdfFooter(doc);

  // Save the PDF
  const fileName = `main-courante-${sessionName ? sessionName.replace(/[^a-zA-Z0-9]/g, '-') + '-' : ''}${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
};