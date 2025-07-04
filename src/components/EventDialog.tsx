
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventName: string, memberId?: number, type?: string) => void;
  timeSlot: string;
  date: string;
  teamMembers: TeamMember[];
  currentEvent?: {
    name: string;
    assignedMember?: TeamMember;
    type?: string;
  };
}

const EventDialog = ({ isOpen, onClose, onSave, timeSlot, date, teamMembers, currentEvent }: EventDialogProps) => {
  const [eventName, setEventName] = useState(currentEvent?.name || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentEvent?.assignedMember?.id?.toString() || '');
  const [eventType, setEventType] = useState(currentEvent?.type || 'activity');

  const isSpecialRow = ['Astreintes', 'Congés', 'Repos récupérateurs'].includes(timeSlot);

  const handleSave = () => {
    if (!eventName.trim()) return;
    
    const memberId = selectedMemberId ? parseInt(selectedMemberId) : undefined;
    onSave(eventName, memberId, eventType);
    onClose();
    setEventName('');
    setSelectedMemberId('');
    setEventType('activity');
  };

  const handleClose = () => {
    onClose();
    setEventName('');
    setSelectedMemberId('');
    setEventType('activity');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
          <DialogDescription>
            {timeSlot} - {new Date(date).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="event-name" className="text-right">
              {isSpecialRow ? 'Nom' : 'Événement'}
            </Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder={isSpecialRow ? "Nom du membre" : "Nom de l'activité"}
              className="col-span-3"
            />
          </div>
          
          {!isSpecialRow && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-type" className="text-right">
                Type
              </Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Activité</SelectItem>
                  <SelectItem value="meal">Repas</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="member" className="text-right">
              {isSpecialRow ? 'Membre' : 'Responsable'}
            </Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.prenom} {member.nom} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!eventName.trim()}>
            {currentEvent ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
