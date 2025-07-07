
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TeamMember {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
  assignedMember?: TeamMember;
  startDate?: string;
  endDate?: string;
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventName: string, memberId?: number, type?: string, startDate?: string, endDate?: string) => void;
  timeSlot: string;
  date: string;
  teamMembers: TeamMember[];
  currentEvent?: PlanningEvent;
}

const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  timeSlot,
  date,
  teamMembers,
  currentEvent
}) => {
  const [eventName, setEventName] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [eventType, setEventType] = useState<string>('activity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentEvent) {
        setEventName(currentEvent.name);
        setSelectedMember(currentEvent.assignedMember?.id.toString() || '');
        setEventType(currentEvent.type);
        setStartDate(currentEvent.startDate || date);
        setEndDate(currentEvent.endDate || date);
      } else {
        setEventName('');
        setSelectedMember('');
        setEventType('activity');
        setStartDate(date);
        setEndDate(date);
      }
    }
  }, [isOpen, currentEvent, date]);

  const handleSave = () => {
    if (!eventName.trim()) return;
    
    const memberId = selectedMember ? parseInt(selectedMember) : undefined;
    onSave(eventName, memberId, eventType, startDate, endDate);
    onClose();
  };

  const isSpecialTimeSlot = ['Astreintes', 'Congés', 'Repos récupérateurs'].includes(timeSlot);

  // Fonction pour formater une date de manière sécurisée
  const formatDateSafely = (dateString: string) => {
    try {
      if (!dateString) return 'Date non définie';
      const dateObj = new Date(dateString);
      if (!isValid(dateObj)) return 'Date invalide';
      return format(dateObj, 'EEEE dd MMMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Erreur de date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="event-name">Nom de l'événement</Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder={isSpecialTimeSlot ? timeSlot : "Nom de l'activité"}
            />
          </div>

          <div>
            <Label htmlFor="event-type">Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Activité</SelectItem>
                <SelectItem value="meal">Repas</SelectItem>
                <SelectItem value="meeting">Réunion</SelectItem>
                <SelectItem value="leave">Congé</SelectItem>
                <SelectItem value="recovery">Repos récupérateur</SelectItem>
                <SelectItem value="astreinte">Astreinte</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned-member">Responsable</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun responsable</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.prenom} {member.nom} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <div><strong>Créneau:</strong> {timeSlot}</div>
            <div><strong>Date initiale:</strong> {formatDateSafely(date)}</div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={!eventName.trim()}>
              {currentEvent ? 'Modifier' : 'Ajouter'}
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

export default EventDialog;
