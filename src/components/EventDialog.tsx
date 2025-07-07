
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useGroups } from '@/hooks/useGroups';
import { useJeunes } from '@/hooks/useJeunes';

interface TeamMember {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
  assignedMembers?: TeamMember[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  selectedGroups?: string[];
  selectedJeunes?: string[];
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventName: string, memberIds?: string[], type?: string, startDate?: string, endDate?: string, startTime?: string, endTime?: string, selectedGroups?: string[], selectedJeunes?: string[]) => void;
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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [eventType, setEventType] = useState<string>('activity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedJeunes, setSelectedJeunes] = useState<string[]>([]);

  const { groupes } = useGroups();
  const { jeunes } = useJeunes();

  const isSpecialTimeSlot = ['Astreintes', 'Congés', 'Repos récupérateurs'].includes(timeSlot);
  const isActivity = eventType === 'activity' && !isSpecialTimeSlot;

  useEffect(() => {
    if (isOpen) {
      if (currentEvent) {
        setEventName(currentEvent.name);
        setSelectedMembers(currentEvent.assignedMembers?.map(m => m.id) || []);
        setEventType(currentEvent.type);
        setStartDate(currentEvent.startDate || date);
        setEndDate(currentEvent.endDate || date);
        setStartTime(currentEvent.startTime || '');
        setEndTime(currentEvent.endTime || '');
        setSelectedGroups(currentEvent.selectedGroups || []);
        setSelectedJeunes(currentEvent.selectedJeunes || []);
      } else {
        setEventName(isSpecialTimeSlot ? timeSlot : '');
        setSelectedMembers([]);
        setEventType(isSpecialTimeSlot ? 'astreinte' : 'activity');
        setStartDate(date);
        setEndDate(date);
        setStartTime('');
        setEndTime('');
        setSelectedGroups([]);
        setSelectedJeunes([]);
      }
    }
  }, [isOpen, currentEvent, date, timeSlot, isSpecialTimeSlot]);

  const handleSave = () => {
    if (!isSpecialTimeSlot && !eventName.trim()) return;
    if (selectedMembers.length === 0) return;
    
    onSave(eventName, selectedMembers, eventType, startDate, endDate, startTime, endTime, selectedGroups, selectedJeunes);
    onClose();
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleJeuneToggle = (jeuneId: string) => {
    setSelectedJeunes(prev => 
      prev.includes(jeuneId) 
        ? prev.filter(id => id !== jeuneId)
        : [...prev, jeuneId]
    );
  };

  // Fonction pour formater une date de manière sécurisée en JJ/MM/AAAA
  const formatDateSafely = (dateString: string) => {
    try {
      if (!dateString) return 'Date non définie';
      const dateObj = new Date(dateString);
      if (!isValid(dateObj)) return 'Date invalide';
      return format(dateObj, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Erreur de date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isSpecialTimeSlot && (
            <>
              <div>
                <Label htmlFor="event-name">Nom de l'événement</Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Nom de l'activité"
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
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isActivity && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Heure de début</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">Heure de fin</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <Label>Membres assignés</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberToggle(member.id)}
                    />
                    <Label htmlFor={`member-${member.id}`} className="text-sm">
                      {member.prenom} {member.nom} - {member.role}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  Aucun membre d'équipe disponible. Ajoutez des membres depuis le module Gestion de l'équipe.
                </div>
              )}
            </div>
          </div>

          {isActivity && (
            <div>
              <Label>Participants</Label>
              <Tabs defaultValue="groups" className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="groups">Groupes</TabsTrigger>
                  <TabsTrigger value="individuals">Jeunes individuels</TabsTrigger>
                </TabsList>
                
                <TabsContent value="groups" className="space-y-2">
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {groupes.length > 0 ? (
                      groupes.map((groupe) => (
                        <div key={groupe.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${groupe.id}`}
                            checked={selectedGroups.includes(groupe.id)}
                            onCheckedChange={() => handleGroupToggle(groupe.id)}
                          />
                          <Label htmlFor={`group-${groupe.id}`} className="text-sm">
                            {groupe.nom} ({groupe.jeunesIds.length} jeunes)
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">
                        Aucun groupe créé. Ajoutez des groupes depuis le module Gestion des jeunes.
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="individuals" className="space-y-2">
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {jeunes.length > 0 ? (
                      jeunes.map((jeune) => (
                        <div key={jeune.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`jeune-${jeune.id}`}
                            checked={selectedJeunes.includes(jeune.id)}
                            onCheckedChange={() => handleJeuneToggle(jeune.id)}
                          />
                          <Label htmlFor={`jeune-${jeune.id}`} className="text-sm">
                            {jeune.prenom} {jeune.nom}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">
                        Aucun jeune inscrit. Ajoutez des jeunes depuis le module Gestion des jeunes.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

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
            <Button 
              onClick={handleSave} 
              disabled={(!isSpecialTimeSlot && !eventName.trim()) || selectedMembers.length === 0}
            >
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
