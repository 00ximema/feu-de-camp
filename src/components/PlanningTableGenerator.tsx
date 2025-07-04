
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'other';
  assignedMember: {
    id: number;
    nom: string;
    prenom: string;
    role: string;
  } | null;
}

interface PlanningCell {
  date: string;
  timeSlot: string;
  event: PlanningEvent | null;
}

const PlanningTableGenerator = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<string[]>([
    "8h-9h", "9h-10h", "10h-11h", "11h-12h",
    "12h-13h", "13h-14h", "14h-15h", "15h-16h",
    "16h-17h", "17h-18h", "18h-19h", "19h-20h"
  ]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [planning, setPlanning] = useState<PlanningCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<PlanningCell | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<PlanningEvent>({
    id: '',
    name: '',
    type: 'activity',
    assignedMember: null,
  });
  const { toast } = useToast();
  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  useEffect(() => {
    if (currentSession) {
      loadTeamMembers(currentSession.id);
      loadPlanning(currentSession.id);
    }
  }, [currentSession, isInitialized]);

  const loadTeamMembers = async (sessionId: string) => {
    if (!isInitialized) return;
    try {
      const members = await db.getAll('animateurs', sessionId);
      setTeamMembers(members);
    } catch (error) {
      console.error("Erreur lors du chargement des membres de l'équipe:", error);
    }
  };

  const loadPlanning = async (sessionId: string) => {
    if (!isInitialized) return;
    try {
      const storedPlanning = await db.getById('plannings', sessionId);
      if (storedPlanning && storedPlanning.data && Array.isArray(storedPlanning.data)) {
        // Vérifier que les données correspondent à la structure attendue
        const validPlanning = storedPlanning.data as PlanningCell[][];
        setPlanning(validPlanning);
      } else {
        generatePlanning();
      }
    } catch (error) {
      console.error("Erreur lors du chargement du planning:", error);
      generatePlanning();
    }
  };

  useEffect(() => {
    generatePlanning();
  }, [startDate, timeSlots, teamMembers]);

  const generatePlanning = () => {
    const newPlanning: PlanningCell[][] = [];
    const numDays = 7;

    for (let i = 0; i < numDays; i++) {
      const day: PlanningCell[] = [];
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      for (const timeSlot of timeSlots) {
        day.push({
          date: dateString,
          timeSlot: timeSlot,
          event: null,
        });
      }
      newPlanning.push(day);
    }
    setPlanning(newPlanning);
  };

  const handleCellClick = (cell: PlanningCell) => {
    setSelectedCell(cell);
    setNewEvent({ id: '', name: '', type: 'activity', assignedMember: null });
    setShowAddEvent(true);
  };

  const handleAddEvent = () => {
    console.log('handleAddEvent called with:', newEvent);
    
    // Pour les congés et repos récupérateurs, le nom n'est pas obligatoire
    const isLeaveOrRecovery = newEvent.type === 'leave' || newEvent.type === 'recovery';
    
    if (!newEvent.type || (!isLeaveOrRecovery && !newEvent.name.trim()) || !newEvent.assignedMember) {
      toast({
        title: "Champs requis",
        description: isLeaveOrRecovery 
          ? "Veuillez sélectionner un type et un membre de l'équipe"
          : "Veuillez remplir le nom de l'événement, sélectionner un type et un membre de l'équipe",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCell) {
      toast({
        title: "Aucune case sélectionnée",
        description: "Veuillez sélectionner une case du planning",
        variant: "destructive"
      });
      return;
    }

    const updatedPlanning = planning.map(day =>
      day.map(cell => {
        if (cell.date === selectedCell.date && cell.timeSlot === selectedCell.timeSlot) {
          return {
            ...cell,
            event: {
              id: Date.now().toString(),
              name: newEvent.name || (newEvent.type === 'leave' ? 'Congé' : 'Repos récupérateur'),
              type: newEvent.type,
              assignedMember: newEvent.assignedMember,
            }
          };
        }
        return cell;
      })
    );

    setPlanning(updatedPlanning);
    setShowAddEvent(false);
    savePlanning(updatedPlanning);

    const eventName = newEvent.name || (newEvent.type === 'leave' ? 'Congé' : 'Repos récupérateur');
    toast({
      title: "Événement ajouté",
      description: `L'événement "${eventName}" a été ajouté au planning`
    });
  };

  const handleRemoveEvent = (date: string, timeSlot: string) => {
    const updatedPlanning = planning.map(day =>
      day.map(cell => {
        if (cell.date === date && cell.timeSlot === timeSlot) {
          return {
            ...cell,
            event: null,
          };
        }
        return cell;
      })
    );

    setPlanning(updatedPlanning);
    savePlanning(updatedPlanning);

    toast({
      title: "Événement supprimé",
      description: "L'événement a été supprimé du planning"
    });
  };

  const savePlanning = async (updatedPlanning: PlanningCell[][]) => {
    if (!isInitialized || !currentSession) return;
    try {
      await db.save('plannings', {
        id: currentSession.id,
        data: updatedPlanning
      });
      console.log('Planning enregistré avec succès dans la base de données locale');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du planning:", error);
      toast({
        title: "Erreur lors de l'enregistrement",
        description: "Impossible d'enregistrer le planning",
        variant: "destructive"
      });
    }
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return date.toLocaleDateString('fr-FR', options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Planning de la semaine</span>
          </CardTitle>
          <CardDescription>
            Visualisation et gestion du planning hebdomadaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="start-date">Date de début de la semaine:</Label>
            <Input
              type="date"
              id="start-date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>
          <Separator />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heure
                  </th>
                  {planning.map((day, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getDayName(day[0].date)} <br />
                      {new Date(day[0].date).toLocaleDateString('fr-FR')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map((timeSlot, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{timeSlot}</td>
                    {planning.map((day) => {
                      const cell = day.find(c => c.timeSlot === timeSlot);
                      return (
                        <td
                          key={`${cell?.date}-${cell?.timeSlot}`}
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        >
                          <Button
                            variant="outline"
                            className="w-full h-12 justify-start"
                            onClick={() => cell && handleCellClick(cell)}
                          >
                            {cell?.event ? (
                              <div className="flex items-center justify-between w-full">
                                <div>
                                  <p className="font-semibold">{cell.event.name}</p>
                                  <p className="text-xs text-gray-500">{cell.event.assignedMember?.prenom} {cell.event.assignedMember?.nom}</p>
                                </div>
                                <Badge variant="secondary">{cell.event.type}</Badge>
                              </div>
                            ) : (
                              <span className="text-gray-400">Ajouter un événement</span>
                            )}
                          </Button>
                          {cell?.event && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleRemoveEvent(cell.date, cell.timeSlot)}
                            >
                              Supprimer
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter un événement */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un événement</DialogTitle>
            <DialogDescription>
              Ajouter un événement à une case spécifique du planning
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCell && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Case sélectionnée: {new Date(selectedCell.date).toLocaleDateString('fr-FR')} - {selectedCell.timeSlot}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="event-type">Type d'événement *</Label>
              <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Activité</SelectItem>
                  <SelectItem value="meal">Repas</SelectItem>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="leave">Congé</SelectItem>
                  <SelectItem value="recovery">Repos récupérateur</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-name">
                Nom de l'événement {(newEvent.type === 'leave' || newEvent.type === 'recovery') ? '' : '*'}
              </Label>
              <Input
                id="event-name"
                value={newEvent.name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                placeholder={
                  newEvent.type === 'leave' 
                    ? "Congé (optionnel)" 
                    : newEvent.type === 'recovery' 
                    ? "Repos récupérateur (optionnel)"
                    : "Nom de l'événement"
                }
              />
            </div>

            <div>
              <Label htmlFor="team-member">Membre de l'équipe *</Label>
              <Select value={newEvent.assignedMember ? String(newEvent.assignedMember.id) : "none"} onValueChange={(value) => {
                if (value === "none") {
                  setNewEvent(prev => ({ ...prev, assignedMember: null }));
                } else {
                  const member = teamMembers.find(m => String(m.id) === value);
                  setNewEvent(prev => ({
                    ...prev,
                    assignedMember: member ? {
                      id: member.id,
                      nom: member.nom,
                      prenom: member.prenom,
                      role: member.role
                    } : null
                  }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sélectionner un membre</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.prenom} {member.nom} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAddEvent(false)}>
              Annuler
            </Button>
            <Button type="submit" onClick={handleAddEvent}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningTableGenerator;
