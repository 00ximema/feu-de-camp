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
            
            <ScrollArea className="max-h-60 border rounded-md p-4">
              <div className="space-y-4">
                {/* Équipe */}
                {team.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-primary mb-2">Équipe</h4>
                    <div className="space-y-2">
                      {team.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => handleMemberToggle(member.id)}
                          />
                          <Label 
                            htmlFor={`member-${member.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {member.prenom} {member.nom} ({member.role})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {team.length > 0 && jeunes.length > 0 && <Separator />}

                {/* Jeunes */}
                {jeunes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-primary mb-2">Jeunes</h4>
                    <div className="space-y-2">
                      {jeunes.map((jeune) => (
                        <div key={jeune.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`jeune-${jeune.id}`}
                            checked={selectedJeunes.includes(jeune.id)}
                            onCheckedChange={() => handleJeuneToggle(jeune.id)}
                          />
                          <Label 
                            htmlFor={`jeune-${jeune.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {jeune.prenom} {jeune.nom} ({jeune.age} ans)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {team.length === 0 && jeunes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune équipe ou jeunes définis.
                    Vous pouvez créer l'événement sans sélection.
                  </p>
                )}
              </div>
            </ScrollArea>
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