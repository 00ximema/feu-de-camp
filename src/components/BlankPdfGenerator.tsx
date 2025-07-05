
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from 'jspdf';
import { useToast } from "@/hooks/use-toast";

const BlankPdfGenerator: React.FC = () => {
  const { toast } = useToast();

  const generateBlankPdf = () => {
    try {
      const pdf = new jsPDF();
      
      // Header avec logo
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 210, 25, 'F');
      
      // Logo Fondation MG en blanc
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('Fondation MG', 15, 17);
      
      pdf.setFontSize(14);
      pdf.text('Maison de la Gendarmerie', 130, 17);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Title
      pdf.setFontSize(18);
      pdf.text('FICHE JEUNE', 15, 40);
      
      // Personal information section
      pdf.setFontSize(14);
      pdf.text('INFORMATIONS PERSONNELLES', 15, 55);
      
      pdf.setFontSize(12);
      const personalFields = [
        'Nom: _________________________________',
        'Prénom: _________________________________',
        'Date de naissance: ___________________  Âge: _______',
        'Téléphone: _________________________________',
        'Email: _________________________________',
        'Adresse: _________________________________',
        '_________________________________'
      ];
      
      personalFields.forEach((field, index) => {
        pdf.text(field, 15, 70 + (index * 8));
      });
      
      // Medical information section
      pdf.text('INFORMATIONS MÉDICALES', 15, 135);
      
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
      
      medicalFields.forEach((field, index) => {
        pdf.text(field, 15, 150 + (index * 8));
      });
      
      // Contact section
      pdf.text('CONTACT D\'URGENCE', 15, 240);
      
      const contactFields = [
        'Nom: _________________________________',
        'Relation: _________________________________',
        'Téléphone: _________________________________'
      ];
      
      contactFields.forEach((field, index) => {
        pdf.text(field, 15, 255 + (index * 8));
      });
      
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
