import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import SignatureCanvas from './SignatureCanvas';
import { createPdfHeader, addPdfFooter, PDF_COLORS } from "@/utils/pdfTemplate";

interface EvaluationCriteria {
  id: string;
  text: string;
  score: string;
  observations: string;
}

interface EvaluationData {
  animatorName: string;
  directorName: string;
  hasTraining: boolean;
  isIntern: boolean;
  age: string;
  centerSession: string;
  criteria: EvaluationCriteria[];
  remarks: string;
  directorSignature: string;
  animatorSignature: string;
}

interface EvaluationFormProps {
  show: boolean;
  onClose: () => void;
  memberName?: string;
}

const evaluationCriteria = [
  "Connaît le public et s'adapte à ses besoins en fonction de l'âge.",
  "Se positionne en adulte référent : tenue et langage adaptés, ponctualité.",
  "Assure la sécurité physique et affective des mineurs.",
  "Est à l'écoute et fait preuve de bienveillance envers les mineurs.",
  "Prend des initiatives et sait s'adapter aux différentes situations.",
  "Est source de propositions.",
  "Gère tous les moments de la vie quotidienne.",
  "Sait préparer et animer des veillées.",
  "Sait préparer et animer des grands jeux.",
  "Sait travailler en équipe.",
  "Sait gérer les situations conflictuelles (équipe et enfants).",
  "Sait détecter, agir et prévenir en cas de situations menaçant l'intégrité des mineurs (harcèlement...etc).",
  "Respecte les directives et conseils délivrés par les directeurs."
];

const EvaluationForm = ({ show, onClose, memberName }: EvaluationFormProps) => {
  const { toast } = useToast();
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    animatorName: memberName || "",
    directorName: "",
    hasTraining: false,
    isIntern: false,
    age: "",
    centerSession: "",
    criteria: evaluationCriteria.map(text => ({
      id: crypto.randomUUID(),
      text,
      score: "",
      observations: ""
    })),
    remarks: "",
    directorSignature: "",
    animatorSignature: ""
  });

  const handleCriteriaChange = (criteriaId: string, field: 'score' | 'observations', value: string) => {
    setEvaluationData(prev => ({
      ...prev,
      criteria: prev.criteria.map(criteria =>
        criteria.id === criteriaId
          ? { ...criteria, [field]: value }
          : criteria
      )
    }));
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = 210;
      
      // En-tête uniforme
      let yPos = createPdfHeader(pdf, {
        title: 'Grille d\'évaluation',
        subtitle: evaluationData.centerSession || 'Évaluation animateur'
      });

      // Informations principales
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(`Nom et prénom de l'animateur : ${evaluationData.animatorName}`, 15, yPos);
      pdf.text(`Nom du directeur : ${evaluationData.directorName}`, 110, yPos);
      yPos += 7;
      
      pdf.text(`Diplôme : ${evaluationData.hasTraining ? 'Oui' : 'Non'}`, 15, yPos);
      pdf.text(`Stagiaire : ${evaluationData.isIntern ? 'Oui' : 'Non'}`, 110, yPos);
      yPos += 7;
      
      pdf.text(`Âge : ${evaluationData.age}`, 15, yPos);
      pdf.text(`Centre/Session : ${evaluationData.centerSession}`, 110, yPos);
      yPos += 10;
      
      // Tableau des critères
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      // En-têtes du tableau avec largeurs ajustées
      const startX = 15;
      const colWidths = [95, 15, 15, 15, 45];
      let currentX = startX;
      
      // Dessiner les bordures des en-têtes avec couleur du thème
      const headerHeight = 8;
      pdf.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
      pdf.rect(startX, yPos - 6, colWidths[0], headerHeight, 'F');
      pdf.rect(startX + colWidths[0], yPos - 6, colWidths[1], headerHeight, 'F');
      pdf.rect(startX + colWidths[0] + colWidths[1], yPos - 6, colWidths[2], headerHeight, 'F');
      pdf.rect(startX + colWidths[0] + colWidths[1] + colWidths[2], yPos - 6, colWidths[3], headerHeight, 'F');
      pdf.rect(startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos - 6, colWidths[4], headerHeight, 'F');
      
      // Textes des en-têtes centrés
      pdf.setTextColor(PDF_COLORS.white.r, PDF_COLORS.white.g, PDF_COLORS.white.b);
      pdf.text('Critères évalués', startX + 2, yPos);
      pdf.text('Non', startX + colWidths[0] + (colWidths[1] - pdf.getTextWidth('Non')) / 2, yPos);
      pdf.text('±', startX + colWidths[0] + colWidths[1] + (colWidths[2] - pdf.getTextWidth('±')) / 2, yPos);
      pdf.text('Oui', startX + colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] - pdf.getTextWidth('Oui')) / 2, yPos);
      pdf.text('Observations', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, yPos);
      
      yPos += headerHeight;
      
      // Contenu du tableau
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      
      evaluationData.criteria.forEach((criteria) => {
        const rowHeight = 9;
        currentX = startX;
        
        // Colonne critère
        const splitText = pdf.splitTextToSize(criteria.text, colWidths[0] - 4);
        pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
        pdf.rect(currentX, yPos - 6, colWidths[0], rowHeight);
        pdf.text(splitText.slice(0, 2), currentX + 2, yPos - 2);
        currentX += colWidths[0];
        
        // Colonnes scores avec X centrés
        for (let i = 1; i <= 3; i++) {
          pdf.rect(currentX, yPos - 6, colWidths[i], rowHeight);
          let mark = '';
          if (i === 1 && criteria.score === 'non') mark = 'X';
          if (i === 2 && criteria.score === 'moyen') mark = 'X';
          if (i === 3 && criteria.score === 'oui') mark = 'X';
          if (mark) {
            pdf.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
            const markWidth = pdf.getTextWidth(mark);
            pdf.text(mark, currentX + (colWidths[i] - markWidth) / 2, yPos - 1);
            pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
          }
          currentX += colWidths[i];
        }
        
        // Colonne observations
        pdf.rect(currentX, yPos - 6, colWidths[4], rowHeight);
        if (criteria.observations) {
          const obsText = pdf.splitTextToSize(criteria.observations, colWidths[4] - 4);
          pdf.text(obsText.slice(0, 1), currentX + 2, yPos - 2);
        }
        
        yPos += rowHeight;
      });
      
      // Remarques (toujours affichées)
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
      pdf.text('Remarques :', 15, yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      
      if (evaluationData.remarks) {
        const remarksText = pdf.splitTextToSize(evaluationData.remarks, 180);
        pdf.text(remarksText.slice(0, 2), 15, yPos);
      }
      pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
      pdf.line(15, yPos + 8, 195, yPos + 8);
      yPos += 15;
      
      // Signatures (agrandies)
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(PDF_COLORS.primaryDark.r, PDF_COLORS.primaryDark.g, PDF_COLORS.primaryDark.b);
      pdf.text('Signatures :', 15, yPos);
      yPos += 12;
      
      // Signature directeur
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
      pdf.text('Directeur :', 15, yPos);
      if (evaluationData.directorSignature) {
        try {
          pdf.addImage(evaluationData.directorSignature, 'PNG', 15, yPos + 2, 70, 18);
        } catch {
          pdf.setFont('helvetica', 'italic');
          pdf.text(evaluationData.directorSignature, 15, yPos + 10);
        }
      } else {
        pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
        pdf.line(15, yPos + 12, 85, yPos + 12);
      }
      
      // Signature animateur
      pdf.text('Animateur :', 110, yPos);
      if (evaluationData.animatorSignature) {
        try {
          pdf.addImage(evaluationData.animatorSignature, 'PNG', 110, yPos + 2, 70, 18);
        } catch {
          pdf.setFont('helvetica', 'italic');
          pdf.text(evaluationData.animatorSignature, 110, yPos + 10);
        }
      } else {
        pdf.setDrawColor(PDF_COLORS.border.r, PDF_COLORS.border.g, PDF_COLORS.border.b);
        pdf.line(110, yPos + 12, 180, yPos + 12);
      }
      
      // Pied de page uniforme
      addPdfFooter(pdf);
      
      pdf.save(`Evaluation_${evaluationData.animatorName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export réussi",
        description: "L'évaluation a été exportée en PDF avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'évaluation en PDF",
        variant: "destructive"
      });
    }
  };

  const saveEvaluation = () => {
    try {
      // Sauvegarder dans le localStorage
      const evaluations = JSON.parse(localStorage.getItem('evaluations') || '[]');
      const newEvaluation = {
        ...evaluationData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      evaluations.push(newEvaluation);
      localStorage.setItem('evaluations', JSON.stringify(evaluations));
      
      toast({
        title: "Évaluation sauvegardée",
        description: "L'évaluation a été sauvegardée avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder l'évaluation",
        variant: "destructive"
      });
    }
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ClipboardCheck className="h-5 w-5" />
            <span>Grille d'évaluation</span>
          </DialogTitle>
          <DialogDescription>
            Évaluation de l'animateur
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="animator-name">Nom et prénom de l'animateur</Label>
              <Input
                id="animator-name"
                value={evaluationData.animatorName}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, animatorName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="director-name">Nom du directeur</Label>
              <Input
                id="director-name"
                value={evaluationData.directorName}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, directorName: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-training"
                checked={evaluationData.hasTraining}
                onCheckedChange={(checked) => setEvaluationData(prev => ({ ...prev, hasTraining: !!checked }))}
              />
              <Label htmlFor="has-training">Diplôme</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-intern"
                checked={evaluationData.isIntern}
                onCheckedChange={(checked) => setEvaluationData(prev => ({ ...prev, isIntern: !!checked }))}
              />
              <Label htmlFor="is-intern">Stagiaire</Label>
            </div>
            <div>
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                value={evaluationData.age}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, age: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="center-session">Centre/Session</Label>
              <Input
                id="center-session"
                value={evaluationData.centerSession}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, centerSession: e.target.value }))}
              />
            </div>
          </div>
          
          {/* Grille d'évaluation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Critères d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluationData.criteria.map((criteria, index) => (
                  <div key={criteria.id} className="border-b pb-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-6">
                        <p className="text-sm font-medium">{criteria.text}</p>
                      </div>
                      <div className="col-span-3">
                        <RadioGroup
                          value={criteria.score}
                          onValueChange={(value) => handleCriteriaChange(criteria.id, 'score', value)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="non" id={`${criteria.id}-non`} />
                            <Label htmlFor={`${criteria.id}-non`} className="text-xs">Non</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="moyen" id={`${criteria.id}-moyen`} />
                            <Label htmlFor={`${criteria.id}-moyen`} className="text-xs">+ ou -</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="oui" id={`${criteria.id}-oui`} />
                            <Label htmlFor={`${criteria.id}-oui`} className="text-xs">Oui</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Observations..."
                          value={criteria.observations}
                          onChange={(e) => handleCriteriaChange(criteria.id, 'observations', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Remarques */}
          <div>
            <Label htmlFor="remarks">Remarques éventuelles</Label>
            <Textarea
              id="remarks"
              value={evaluationData.remarks}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, remarks: e.target.value }))}
              rows={3}
              placeholder="Remarques générales..."
            />
          </div>
          
          {/* Signatures en bas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignatureCanvas
              label="Signature du directeur"
              value={evaluationData.directorSignature}
              onSignatureChange={(signature) => setEvaluationData(prev => ({ ...prev, directorSignature: signature }))}
            />
            <SignatureCanvas
              label="Signature de l'animateur"
              value={evaluationData.animatorSignature}
              onSignatureChange={(signature) => setEvaluationData(prev => ({ ...prev, animatorSignature: signature }))}
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={saveEvaluation}>
              Sauvegarder
            </Button>
            <Button onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvaluationForm;