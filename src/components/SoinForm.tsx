
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Stethoscope, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import { Youngster } from "@/types/youngster";

interface SoinFormProps {
  isOpen: boolean;
  onClose: () => void;
  jeunes: Youngster[];
  selectedJeuneId?: string | null;
  onSoinAdded: () => void;
}

const SoinForm: React.FC<SoinFormProps> = ({ 
  isOpen, 
  onClose, 
  jeunes, 
  selectedJeuneId,
  onSoinAdded 
}) => {
  const [selectedJeune, setSelectedJeune] = useState<string>('');
  const [type, setType] = useState<'soin' | 'consultation' | 'autre'>('soin');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [soignant, setSoignant] = useState('');
  const [symptomes, setSymptomes] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [traitement, setTraitement] = useState('');
  const [suivi, setSuivi] = useState(false);
  
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  // Pré-sélectionner le jeune si un ID est fourni
  useEffect(() => {
    if (selectedJeuneId && isOpen) {
      setSelectedJeune(selectedJeuneId);
    }
  }, [selectedJeuneId, isOpen]);

  // Initialiser avec la date et heure actuelles
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setHeure(now.toTimeString().slice(0, 5));
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedJeune('');
    setType('soin');
    setTitre('');
    setDescription('');
    setDate('');
    setHeure('');
    setSoignant('');
    setSymptomes('');
    setDiagnostic('');
    setTraitement('');
    setSuivi(false);
  };

  const handleSubmit = async () => {
    if (!selectedJeune || !titre || !description || !date || !heure) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!isInitialized || !currentSession) {
      toast({
        title: "Erreur",
        description: "Base de données non initialisée ou aucune session active",
        variant: "destructive"
      });
      return;
    }

    const jeune = jeunes.find(j => j.id === selectedJeune);
    if (!jeune) {
      toast({
        title: "Erreur",
        description: "Jeune non trouvé",
        variant: "destructive"
      });
      return;
    }

    try {
      const soin: any = {
        id: `soin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: currentSession.id,
        jeuneId: jeune.id,
        jeuneNom: `${jeune.prenom} ${jeune.nom}`,
        type: type,
        titre,
        description,
        date,
        heure,
        dateCreation: new Date().toISOString()
      };

      // Add optional fields only if they have values
      if (soignant) soin.soignant = soignant;
      if (symptomes) soin.symptomes = symptomes;
      if (diagnostic) soin.diagnostic = diagnostic;
      if (traitement) soin.traitement = traitement;
      if (suivi) soin.suivi = suivi;

      await db.save('soins', soin);
      
      toast({
        title: `${type === 'soin' ? 'Soin' : type === 'consultation' ? 'Consultation' : 'Intervention'} ajouté${type === 'consultation' ? 'e' : ''}`,
        description: `${type === 'soin' ? 'Soin' : type === 'consultation' ? 'Consultation' : 'Intervention'} pour ${jeune.prenom} ${jeune.nom} enregistré${type === 'consultation' ? 'e' : ''} avec succès`
      });

      resetForm();
      onSoinAdded();
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du soin:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'enregistrer le ${type}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Nouveau {type === 'soin' ? 'soin' : type === 'consultation' ? 'consultation' : 'autre'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Type *</Label>
              <Select value={type} onValueChange={(value: 'soin' | 'consultation' | 'autre') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soin">Soin</SelectItem>
                  <SelectItem value="consultation">Consultation médicale</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Titre *</Label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={type === 'soin' ? "ex: Pansement genou" : type === 'consultation' ? "ex: Consultation fièvre" : "ex: Autre intervention"}
            />
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le soin, la consultation ou l'intervention"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Heure *</Label>
              <Input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
              />
            </div>
            <div>
              <Label>Soignant</Label>
              <Input
                value={soignant}
                onChange={(e) => setSoignant(e.target.value)}
                placeholder="Nom du soignant"
              />
            </div>
          </div>

          {type === 'consultation' && (
            <>
              <div>
                <Label>Symptômes</Label>
                <Textarea
                  value={symptomes}
                  onChange={(e) => setSymptomes(e.target.value)}
                  placeholder="Symptômes observés"
                  rows={2}
                />
              </div>

              <div>
                <Label>Diagnostic</Label>
                <Textarea
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  placeholder="Diagnostic posé"
                  rows={2}
                />
              </div>

              <div>
                <Label>Traitement prescrit</Label>
                <Textarea
                  value={traitement}
                  onChange={(e) => setTraitement(e.target.value)}
                  placeholder="Traitement ou recommandations"
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="suivi"
              checked={suivi}
              onCheckedChange={(checked) => setSuivi(checked as boolean)}
            />
            <Label htmlFor="suivi" className="text-sm">
              Nécessite un suivi
            </Label>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSubmit}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter le {type}
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

export default SoinForm;
