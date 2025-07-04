
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocalDatabase } from "@/hooks/useLocalDatabase";
import { useSession } from "@/hooks/useSession";
import jsPDF from 'jspdf';

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
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
  const [sessionName, setSessionName] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
  const [timeSlots] = useState<string[]>([
    "Matin", "Déjeuner", "Après-midi", "Dîner", "Veillées", "Nuit"
  ]);
  const [specialRows] = useState<string[]>([
    "Astreintes", "Congés", "Repos récupérateurs"
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
      setSessionName(currentSession.name);
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
        setPlanning(storedPlanning.data as PlanningCell[][]);
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
  }, [startDate, endDate, timeSlots, teamMembers]);

  const generatePlanning = () => {
    const newPlanning: PlanningCell[][] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const allSlots = [...timeSlots, ...specialRows];

    for (let i = 0; i < daysDiff; i++) {
      const day: PlanningCell[] = [];
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      for (const timeSlot of allSlots) {
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
    
    // Déterminer le type par défaut selon le créneau
    let defaultType: PlanningEvent['type'] = 'activity';
    if (cell.timeSlot === 'Astreintes') defaultType = 'astreinte';
    else if (cell.timeSlot === 'Congés') defaultType = 'leave';
    else if (cell.timeSlot === 'Repos récupérateurs') defaultType = 'recovery';
    else if (cell.timeSlot === 'Déjeuner' || cell.timeSlot === 'Dîner') defaultType = 'meal';

    setNewEvent({ 
      id: '', 
      name: '', 
      type: defaultType, 
      assignedMember: null 
    });
    setShowAddEvent(true);
  };

  const handleAddEvent = () => {
    const isSpecialRow = specialRows.includes(selectedCell?.timeSlot || '');
    
    if (!newEvent.assignedMember) {
      toast({
        title: "Membre requis",
        description: "Veuillez sélectionner un membre de l'équipe",
        variant: "destructive"
      });
      return;
    }

    if (!isSpecialRow && !newEvent.name.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir un nom d'activité",
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
          let eventName = newEvent.name;
          if (!eventName) {
            if (newEvent.type === 'leave') eventName = 'Congé';
            else if (newEvent.type === 'recovery') eventName = 'Repos récupérateur';
            else if (newEvent.type === 'astreinte') eventName = 'Astreinte';
          }

          return {
            ...cell,
            event: {
              id: Date.now().toString(),
              name: eventName,
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

    toast({
      title: "Événement ajouté",
      description: `L'événement a été ajouté au planning`
    });
  };

  const handleRemoveEvent = (date: string, timeSlot: string) => {
    const updatedPlanning = planning.map(day =>
      day.map(cell => {
        if (cell.date === date && cell.timeSlot === timeSlot) {
          return { ...cell, event: null };
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
      console.log('Planning enregistré avec succès');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du planning:", error);
      toast({
        title: "Erreur lors de l'enregistrement",
        description: "Impossible d'enregistrer le planning",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Format paysage
    
    // Logo
    const logoImg = new Image();
    logoImg.onload = () => {
      pdf.addImage(logoImg, 'PNG', 20, 10, 30, 20);
      
      // Titre
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Planning Tableau - ${sessionName}`, 60, 20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`, 60, 28);
      
      // Tableau
      const startY = 45;
      const cellWidth = 35;
      const cellHeight = 12;
      const allSlots = [...timeSlots, ...specialRows];
      
      // En-têtes des jours
      pdf.setFont('helvetica', 'bold');
      pdf.text('Créneaux', 20, startY - 5);
      
      planning.forEach((day, dayIndex) => {
        const date = new Date(day[0].date);
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        
        pdf.text(`${dayName}`, 60 + dayIndex * cellWidth, startY - 10);
        pdf.text(`${dateStr}`, 60 + dayIndex * cellWidth, startY - 5);
      });
      
      // Lignes du planning
      pdf.setFont('helvetica', 'normal');
      allSlots.forEach((slot, slotIndex) => {
        const y = startY + slotIndex * cellHeight;
        
        // Nom du créneau
        pdf.setFont('helvetica', 'bold');
        pdf.text(slot, 20, y + 8);
        
        // Contenu des cellules
        pdf.setFont('helvetica', 'normal');
        planning.forEach((day, dayIndex) => {
          const cell = day.find(c => c.timeSlot === slot);
          const x = 60 + dayIndex * cellWidth;
          
          if (cell?.event) {
            pdf.setFontSize(8);
            pdf.text(cell.event.name, x, y + 4);
            if (cell.event.assignedMember) {
              pdf.text(`${cell.event.assignedMember.prenom} ${cell.event.assignedMember.nom}`, x, y + 8);
            }
            pdf.setFontSize(12);
          }
          
          // Bordures
          pdf.rect(x - 2, y, cellWidth, cellHeight);
        });
        
        // Bordure gauche pour le nom du créneau
        pdf.rect(18, y, 40, cellHeight);
      });
      
      pdf.save(`planning-${sessionName}-${new Date().toISOString().split('T')[0]}.pdf`);
    };
    
    logoImg.src = '/lovable-uploads/450370f1-5749-44c5-8da4-6670c288f50c.png';
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const getDateStr = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const generateCompletePlanning = () => {
    // Cette fonction pourrait être étendue pour générer automatiquement un planning complet
    toast({
      title: "Fonction à développer",
      description: "La génération automatique de planning sera implémentée prochainement",
    });
  };

  const allSlots = [...timeSlots, ...specialRows];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Configuration du séjour</span>
          </CardTitle>
          <CardDescription>
            Définir les dates de début et fin pour générer automatiquement le planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="session-name">Nom du séjour</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ex: Robillard"
              />
            </div>
            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                type="date"
                id="start-date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                type="date"
                id="end-date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateCompletePlanning} className="w-full bg-slate-800 hover:bg-slate-900">
                Générer planning complet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Planning Tableau - {sessionName}</span>
              </CardTitle>
              <CardDescription>
                Du {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exporter PDF</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-medium">
                    Créneaux
                  </th>
                  {planning.map((day, index) => (
                    <th key={index} className="border border-gray-300 px-4 py-2 bg-gray-100 text-center font-medium min-w-[140px]">
                      <div>{getDayName(day[0].date)}</div>
                      <div className="text-sm text-gray-600">{getDateStr(day[0].date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allSlots.map((timeSlot, slotIndex) => (
                  <tr key={slotIndex} className={specialRows.includes(timeSlot) ? 'bg-blue-50' : ''}>
                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">
                      {timeSlot}
                    </td>
                    {planning.map((day, dayIndex) => {
                      const cell = day.find(c => c.timeSlot === timeSlot);
                      return (
                        <td
                          key={`${dayIndex}-${slotIndex}`}
                          className="border border-gray-300 px-2 py-2 text-center relative group cursor-pointer hover:bg-gray-50"
                          onClick={() => cell && handleCellClick(cell)}
                        >
                          {cell?.event ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
                                {cell.event.name}
                              </div>
                              {cell.event.assignedMember && (
                                <div className="text-xs text-gray-600">
                                  {cell.event.assignedMember.prenom} {cell.event.assignedMember.nom}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveEvent(cell.date, cell.timeSlot);
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-2xl">+</div>
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
              Ajouter un événement au planning
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
            
            {!specialRows.includes(selectedCell?.timeSlot || '') && (
              <div>
                <Label htmlFor="event-name">Nom de l'activité *</Label>
                <Input
                  id="event-name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de l'activité"
                />
              </div>
            )}

            <div>
              <Label htmlFor="team-member">Membre de l'équipe *</Label>
              <Select 
                value={newEvent.assignedMember ? String(newEvent.assignedMember.id) : "none"} 
                onValueChange={(value) => {
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
                }}
              >
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
