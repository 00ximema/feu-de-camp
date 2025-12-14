import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from 'jspdf';
import { useToast } from "@/hooks/use-toast";
import { createPdfHeader, addPdfFooter, addPdfSection, PDF_COLORS } from "@/utils/pdfTemplate";

const BlankPdfGenerator: React.FC = () => {
  const { toast } = useToast();

  const generateBlankPdf = () => {
    try {
      const pdf = new jsPDF();
      
      // En-tête uniforme
      let yPosition = createPdfHeader(pdf, {
        title: 'Fiche Jeune',
        subtitle: 'Modèle vierge à remplir',
        showDate: false
      });

      // Personal information section
      yPosition = addPdfSection(pdf, 'INFORMATIONS PERSONNELLES', yPosition);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      
      const personalFields = [
        'Nom: _________________________________',
        'Prénom: _________________________________',
        'Date de naissance: ___________________  Âge: _______',
        'Téléphone: _________________________________',
        'Email: _________________________________',
        'Adresse: _________________________________',
        '_________________________________'
      ];
      
      personalFields.forEach((field) => {
        pdf.text(field, 20, yPosition);
        yPosition += 10;
      });
      
      yPosition += 5;
      
      // Medical information section
      yPosition = addPdfSection(pdf, 'INFORMATIONS MÉDICALES', yPosition);
      
      const medicalFields = [
        'Allergies connues:',
        '_________________________________',
        '_________________________________',
        '',
        'Médicaments en cours:',
        '_________________________________',
        '_________________________________',
        '',
        'Problèmes de santé particuliers:',
        '_________________________________',
        '_________________________________'
      ];
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      medicalFields.forEach((field) => {
        if (field) {
          pdf.text(field, 20, yPosition);
        }
        yPosition += 8;
      });
      
      yPosition += 5;
      
      // Contact section
      yPosition = addPdfSection(pdf, 'CONTACT D\'URGENCE', yPosition);
      
      const contactFields = [
        'Nom: _________________________________',
        'Relation: _________________________________',
        'Téléphone: _________________________________'
      ];
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      contactFields.forEach((field) => {
        pdf.text(field, 20, yPosition);
        yPosition += 10;
      });
      
      // Pied de page uniforme
      addPdfFooter(pdf);
      
      pdf.save('Fiche_Jeune_Vierge.pdf');
      
      toast({
        title: "PDF généré",
        description: "Le modèle vierge a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <Button onClick={generateBlankPdf} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Télécharger modèle vierge
    </Button>
  );
};

export default BlankPdfGenerator;
