import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardCheck, Download, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

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
  center: string;
  session: string;
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
    center: "",
    session: "",
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

  const exportToPDF = () => {
    try {
      const pdf = new jsPDF();
      
      // Header avec logo et titre centré
      // Logo en haut à gauche (placeholder - le vrai logo sera ajouté via une image encodée)
      pdf.setFontSize(8);
      pdf.text('FONDATION MG', 15, 15);
      
      // Titre centré
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const titleText = "Grille d'évaluation";
      const titleWidth = pdf.getTextWidth(titleText);
      const pageWidth = 210;
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(titleText, titleX, 20);
      
      // Informations principales
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 30;
      
      pdf.text(`Nom et prénom de l'animateur : ${evaluationData.animatorName}`, 15, yPos);
      pdf.text(`Nom du directeur : ${evaluationData.directorName}`, 110, yPos);
      yPos += 7;
      
      pdf.text(`Diplôme : ${evaluationData.hasTraining ? 'Oui' : 'Non'}`, 15, yPos);
      pdf.text(`Stagiaire : ${evaluationData.isIntern ? 'Oui' : 'Non'}`, 110, yPos);
      yPos += 7;
      
      pdf.text(`Âge : ${evaluationData.age}`, 15, yPos);
      pdf.text(`Centre : ${evaluationData.center}`, 110, yPos);
      yPos += 7;
      
      pdf.text(`Session : ${evaluationData.session}`, 15, yPos);
      yPos += 15;
      
      // Table header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Critères évalués', 15, yPos);
      pdf.text('Non', 120, yPos);
      pdf.text('+ ou -', 135, yPos);
      pdf.text('Oui', 150, yPos);
      pdf.text('Observations', 165, yPos);
      yPos += 7;
      
      // Table content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      
      evaluationData.criteria.forEach((criteria) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }
        
        // Critère text (wrap if too long)
        const splitText = pdf.splitTextToSize(criteria.text, 100);
        pdf.text(splitText, 15, yPos);
        
        // Scores
        pdf.text(criteria.score === 'non' ? 'X' : '', 122, yPos);
        pdf.text(criteria.score === 'moyen' ? 'X' : '', 137, yPos);
        pdf.text(criteria.score === 'oui' ? 'X' : '', 152, yPos);
        
        // Observations
        if (criteria.observations) {
          const obsText = pdf.splitTextToSize(criteria.observations, 35);
          pdf.text(obsText, 165, yPos);
        }
        
        yPos += Math.max(splitText.length * 4, 8);
      });
      
      // Remarques
      if (evaluationData.remarks) {
        yPos += 10;
        if (yPos > 240) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text('Remarques éventuelles :', 15, yPos);
        yPos += 7;
        pdf.setFont('helvetica', 'normal');
        const remarksText = pdf.splitTextToSize(evaluationData.remarks, 180);
        pdf.text(remarksText, 15, yPos);
        yPos += remarksText.length * 4 + 10;
      }
      
      // Signatures
      yPos += 20;
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Signatures :', 15, yPos);
      yPos += 15;
      
      // Signature directeur
      pdf.setFont('helvetica', 'normal');
      pdf.text('Signature du directeur :', 15, yPos);
      if (evaluationData.directorSignature) {
        pdf.setFont('helvetica', 'italic');
        pdf.text(evaluationData.directorSignature, 15, yPos + 10);
      }
      pdf.line(15, yPos + 15, 90, yPos + 15); // Ligne pour signature
      
      // Signature animateur
      pdf.text('Signature de l\'animateur :', 110, yPos);
      if (evaluationData.animatorSignature) {
        pdf.setFont('helvetica', 'italic');
        pdf.text(evaluationData.animatorSignature, 110, yPos + 10);
      }
      pdf.line(110, yPos + 15, 185, yPos + 15); // Ligne pour signature
      
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
              <Label htmlFor="center">Centre</Label>
              <Input
                id="center"
                value={evaluationData.center}
                onChange={(e) => setEvaluationData(prev => ({ ...prev, center: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="session">Session</Label>
            <Input
              id="session"
              value={evaluationData.session}
              onChange={(e) => setEvaluationData(prev => ({ ...prev, session: e.target.value }))}
            />
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
              rows={4}
              placeholder="Remarques générales..."
            />
          </div>
          
          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="director-signature">Signature électronique du directeur</Label>
              <div className="flex items-center space-x-2">
                <PenTool className="h-4 w-4 text-gray-400" />
                <Input
                  id="director-signature"
                  value={evaluationData.directorSignature}
                  onChange={(e) => setEvaluationData(prev => ({ ...prev, directorSignature: e.target.value }))}
                  placeholder="Nom complet du directeur"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="animator-signature">Signature électronique de l'animateur</Label>
              <div className="flex items-center space-x-2">
                <PenTool className="h-4 w-4 text-gray-400" />
                <Input
                  id="animator-signature"
                  value={evaluationData.animatorSignature}
                  onChange={(e) => setEvaluationData(prev => ({ ...prev, animatorSignature: e.target.value }))}
                  placeholder="Nom complet de l'animateur"
                />
              </div>
            </div>
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