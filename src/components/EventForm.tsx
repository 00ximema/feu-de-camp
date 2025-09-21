import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  [key: string]: any; // Pour accepter toutes les propriétés supplémentaires
}

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: {
    date: string;
    time: string;
    description: string;
    selectedMembers: string[];
    selectedJeunes: string[];
  }) => void;
  team: TeamMember[];
  jeunes: Jeune[];
}

const EventForm: React.FC<EventFormProps> = ({
  isOpen,
  onClose,
  onSave,
  team,
  jeunes
}) => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedJeunes, setSelectedJeunes] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      return;
    }

    onSave({
      date,
      time,
      description: description.trim(),
      selectedMembers,
      selectedJeunes
    });

    // Reset form
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime(format(new Date(), 'HH:mm'));
    setDescription('');
    setSelectedMembers([]);
    setSelectedJeunes([]);
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleJeuneToggle = (jeuneId: string) => {
    setSelectedJeunes(prev => 
      prev.includes(jeuneId) 
        ? prev.filter(id => id !== jeuneId)
        : [...prev, jeuneId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nouvel événement - Main courante</DialogTitle>
          <DialogDescription>
            Enregistrez un événement avec les personnes concernées
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description de l'événement</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez l'événement..."
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Personnes concernées (optionnel)</h3>
            
            <div className="space-y-4">
              {/* Équipe */}
              {team.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-2">Équipe</h4>
                  <Select onValueChange={(value) => {
                    if (value && !selectedMembers.includes(value)) {
                      setSelectedMembers(prev => [...prev, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre d'équipe" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {team.filter(member => !selectedMembers.includes(member.id)).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.prenom} {member.nom} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedMembers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedMembers.map(memberId => {
                        const member = team.find(m => m.id === memberId);
                        return member ? (
                          <div key={memberId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{member.prenom} {member.nom} ({member.role})</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMembers(prev => prev.filter(id => id !== memberId))}
                            >
                              ×
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Jeunes */}
              {jeunes.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-primary mb-2">Jeunes</h4>
                  <Select onValueChange={(value) => {
                    if (value && !selectedJeunes.includes(value)) {
                      setSelectedJeunes(prev => [...prev, value]);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jeune" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {jeunes.filter(jeune => !selectedJeunes.includes(jeune.id)).map((jeune) => (
                        <SelectItem key={jeune.id} value={jeune.id}>
                          {jeune.prenom} {jeune.nom} ({jeune.age} ans)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedJeunes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedJeunes.map(jeuneId => {
                        const jeune = jeunes.find(j => j.id === jeuneId);
                        return jeune ? (
                          <div key={jeuneId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{jeune.prenom} {jeune.nom} ({jeune.age} ans)</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedJeunes(prev => prev.filter(id => id !== jeuneId))}
                            >
                              ×
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {team.length === 0 && jeunes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune équipe ou jeunes définis.
                  Vous pouvez créer l'événement sans sélection.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer l'événement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;