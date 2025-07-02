
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Pill, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import { Youngster } from "@/types/youngster";

interface TraitementFormProps {
  isOpen: boolean;
  onClose: () => void;
  jeunes: Youngster[];
  onTraitementAdded: () => void;
}

const TraitementForm: React.FC<TraitementFormProps> = ({ 
  isOpen, 
  onClose, 
  jeunes, 
  onTraitementAdded 
}) => {
  const [selectedJeune, setSelectedJeune] = useState<string>('');
  const [medicament, setMedicament] = useState('');
  const [posologie, setPosologie] = useState('');
  const [duree, setDuree] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  const handleSubmit = async () => {
    if (!selectedJeune || !medicament || !posologie || !duree || !dateDebut) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!isInitialized || !currentSession) return;

    const jeune = jeunes.find(j => j.id === selectedJeune);
    if (!jeune) return;

    // Calculer la date de fin
    const debut = new Date(dateDebut);
    const dureeJours = parseInt(duree);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + dureeJours);

    const traitement = {
      id: `traitement_${Date.now()}`,
      sessionId: currentSession.id,
      jeuneId: jeune.id,
      jeuneNom: `${jeune.prenom} ${jeune.nom}`,
      medicament,
      posologie,
      duree: `${duree} jours`,
      dateDebut,
      dateFin: fin.toISOString().split('T')[0],
      instructions,
      dateCreation: new Date().toISOString()
    };

    try {
      await db.save('traitements', traitement);
      
      toast({
        title: "Traitement ajouté",
        description: `Traitement pour ${jeune.prenom} ${jeune.nom} enregistré avec succès`
      });

      // Réinitialiser le formulaire
      setSelectedJeune('');
      setMedicament('');
      setPosologie('');
      setDuree('');
      setDateDebut('');
      setInstructions('');
      
      onTraitementAdded();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du traitement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le traitement",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5" />
            <span>Nouveau traitement</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Jeune *</Label>
            <Select value={selectedJeune} onValueChange={setSelectedJeune}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un jeune" />
              </SelectTrigger>
              <SelectContent>
                {jeunes.map(jeune => (
                  <SelectItem key={jeune.id} value={jeune.id}>
                    {jeune.prenom} {jeune.nom} ({jeune.age} ans)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Médicament *</Label>
            <Input
              value={medicament}
              onChange={(e) => setMedicament(e.target.value)}
              placeholder="Nom du médicament"
            />
          </div>

          <div>
            <Label>Posologie *</Label>
            <Input
              value={posologie}
              onChange={(e) => setPosologie(e.target.value)}
              placeholder="ex: 1 comprimé matin et soir"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Durée (jours) *</Label>
              <Input
                type="number"
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                placeholder="7"
              />
            </div>
            <div>
              <Label>Date de début *</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Instructions supplémentaires</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Prendre pendant les repas, etc."
              rows={3}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le traitement
            </Button>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TraitementForm;
