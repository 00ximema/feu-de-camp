
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Pill, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import { Youngster } from "@/types/youngster";

interface Medicament {
  id: string;
  nom: string;
  posologie: string;
}

interface TraitementFormProps {
  isOpen: boolean;
  onClose: () => void;
  jeunes: Youngster[];
  selectedJeuneId?: string | null;
  onTraitementAdded: () => void;
}

const TraitementForm: React.FC<TraitementFormProps> = ({ 
  isOpen, 
  onClose, 
  jeunes, 
  selectedJeuneId,
  onTraitementAdded 
}) => {
  const [selectedJeune, setSelectedJeune] = useState<string>('');
  const [medicaments, setMedicaments] = useState<Medicament[]>([
    { id: '1', nom: '', posologie: '' }
  ]);
  const [duree, setDuree] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Pré-sélectionner le jeune si un ID est fourni
  useEffect(() => {
    if (selectedJeuneId && isOpen) {
      setSelectedJeune(selectedJeuneId);
    }
  }, [selectedJeuneId, isOpen]);

  const addMedicament = () => {
    setMedicaments([...medicaments, { id: Date.now().toString(), nom: '', posologie: '' }]);
  };

  const removeMedicament = (id: string) => {
    if (medicaments.length > 1) {
      setMedicaments(medicaments.filter(m => m.id !== id));
    }
  };

  const updateMedicament = (id: string, field: 'nom' | 'posologie', value: string) => {
    setMedicaments(medicaments.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = async () => {
    if (!selectedJeune || !duree || !dateDebut) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Vérifier qu'au moins un médicament est renseigné
    const medicamentsValides = medicaments.filter(m => m.nom.trim() && m.posologie.trim());
    if (medicamentsValides.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un médicament avec sa posologie",
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

    try {
      // Créer un traitement pour chaque médicament
      for (const medicament of medicamentsValides) {
        const traitement = {
          id: `traitement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: currentSession.id,
          jeuneId: jeune.id,
          jeuneNom: `${jeune.prenom} ${jeune.nom}`,
          medicament: medicament.nom,
          posologie: medicament.posologie,
          duree: `${duree} jours`,
          dateDebut,
          dateFin: fin.toISOString().split('T')[0],
          instructions,
          dateCreation: new Date().toISOString()
        };

        await db.save('traitements', traitement);
      }
      
      toast({
        title: "Traitements ajoutés",
        description: `${medicamentsValides.length} traitement(s) pour ${jeune.prenom} ${jeune.nom} enregistré(s) avec succès`
      });

      // Réinitialiser le formulaire
      setSelectedJeune('');
      setMedicaments([{ id: '1', nom: '', posologie: '' }]);
      setDuree('');
      setDateDebut('');
      setInstructions('');
      
      onTraitementAdded();
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des traitements:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les traitements",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="flex items-center justify-between mb-2">
              <Label>Médicaments *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addMedicament}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un médicament
              </Button>
            </div>
            
            <div className="space-y-3">
              {medicaments.map((medicament, index) => (
                <div key={medicament.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Médicament {index + 1}</span>
                    {medicaments.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMedicament(medicament.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nom du médicament</Label>
                      <Input
                        value={medicament.nom}
                        onChange={(e) => updateMedicament(medicament.id, 'nom', e.target.value)}
                        placeholder="ex: Paracétamol"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Posologie</Label>
                      <Input
                        value={medicament.posologie}
                        onChange={(e) => updateMedicament(medicament.id, 'posologie', e.target.value)}
                        placeholder="ex: 1 comprimé matin et soir"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              Ajouter le(s) traitement(s)
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
