import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Stethoscope } from "lucide-react";
import TraitementForm from "./TraitementForm";
import SoinForm from "./SoinForm";

interface Soin {
  id: string;
  jeuneId: string;
  jeuneNom: string;
  type: 'soin' | 'consultation' | 'autre';
  titre: string;
  description: string;
  date: string;
  heure: string;
  soignant?: string;
  symptomes?: string;
  diagnostic?: string;
  traitement?: string;
  suivi?: boolean;
  dateCreation: string;
}

interface MedicalActionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  jeunes: any[];
  selectedJeuneId?: string | null;
  onDataUpdated: () => void;
  editingSoin?: Soin | null;
}

const MedicalActionSelector = ({ 
  isOpen, 
  onClose, 
  jeunes, 
  selectedJeuneId, 
  onDataUpdated,
  editingSoin 
}: MedicalActionSelectorProps) => {
  const [showTraitementForm, setShowTraitementForm] = useState(false);
  const [showSoinForm, setShowSoinForm] = useState(false);

  const handleClose = () => {
    setShowTraitementForm(false);
    setShowSoinForm(false);
    onClose();
  };

  const handleTraitementClick = () => {
    setShowTraitementForm(true);
  };

  const handleSoinClick = () => {
    setShowSoinForm(true);
  };

  const handleTraitementAdded = () => {
    setShowTraitementForm(false);
    onDataUpdated();
    onClose();
  };

  const handleSoinAdded = () => {
    setShowSoinForm(false);
    onDataUpdated();
    onClose();
  };

  // Si on est en mode édition d'un soin, aller directement au formulaire de soin
  if (editingSoin && !showSoinForm) {
    setShowSoinForm(true);
  }

  return (
    <>
      <Dialog open={isOpen && !showTraitementForm && !showSoinForm} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Que souhaitez-vous ajouter ?</DialogTitle>
            <DialogDescription>
              Choisissez le type d'intervention médicale à enregistrer
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Card 
              className="cursor-pointer hover:bg-primary/5 transition-colors border-2 hover:border-blue-200"
              onClick={handleTraitementClick}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <Pill className="h-5 w-5" />
                  <span>Traitement médical</span>
                </CardTitle>
                <CardDescription>
                  Ajouter un médicament, posologie et durée de traitement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-success/10 transition-colors border-2 hover:border-green-200"
              onClick={handleSoinClick}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Stethoscope className="h-5 w-5" />
                  <span>Soin ou consultation</span>
                </CardTitle>
                <CardDescription>
                  Enregistrer un soin infirmier, une consultation ou toute autre intervention
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TraitementForm 
        isOpen={showTraitementForm}
        onClose={() => setShowTraitementForm(false)}
        jeunes={jeunes}
        selectedJeuneId={selectedJeuneId}
        onTraitementAdded={handleTraitementAdded}
      />

      <SoinForm 
        isOpen={showSoinForm}
        onClose={() => setShowSoinForm(false)}
        jeunes={jeunes}
        selectedJeuneId={selectedJeuneId}
        onSoinAdded={handleSoinAdded}
        editingSoin={editingSoin}
      />
    </>
  );
};

export default MedicalActionSelector;