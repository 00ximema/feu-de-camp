
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Animateur {
  id: number;
  nom: string;
  prenom: string;
  role: string;
}

interface PlanningEvent {
  id: string;
  name: string;
  description?: string;
  color: string;
  assignedMember?: Animateur;
  type: 'activity' | 'duty' | 'leave' | 'recovery';
}

interface PlanningCell {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

interface PlanningConfig {
  name: string;
  startDate: string;
  endDate: string;
}

const PlanningTableGenerator = () => {
  const [config, setConfig] = useState<PlanningConfig>({
    name: '',
    startDate: '',
    endDate: ''
  });
  const [planningData, setPlanningData] = useState<PlanningCell[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ date: string; timeSlot: string } | null>(null);
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [newEvent, setNewEvent] = useState({ 
    name: '', 
    description: '', 
    color: 'bg-green-100 text-green-800',
    type: 'activity' as 'activity' | 'duty' | 'leave' | 'recovery',
    assignedMember: null as Animateur | null
  });
  const { toast } = useToast();

  const timeSlots = [
    'Matin',
    'Déjeuner', 
    'Après-midi',
    'Dîner',
    'Veillées',
    'Astreintes, congés, repos récupérateurs'
  ];

  const eventColors = [
    'bg-green-100 text-green-800',
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-pink-100 text-pink-800',
    'bg-orange-100 text-orange-800',
    'bg-gray-100 text-gray-800'
  ];

  const eventTypes = [
    { value: 'activity', label: 'Activité' },
    { value: 'duty', label: 'Astreinte' },
    { value: 'leave', label: 'Congé' },
    { value: 'recovery', label: 'Repos récupérateur' }
  ];

  // Charger les animateurs depuis localStorage
  useEffect(() => {
    const savedAnimateurs = localStorage.getItem('equipe-animateurs');
    if (savedAnimateurs) {
      setAnimateurs(JSON.parse(savedAnimateurs));
    }
  }, []);

  const generateDates = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  };

  const generatePlanning = () => {
    if (!config.name || !config.startDate || !config.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    const dates = generateDates(config.startDate, config.endDate);
    const cells: PlanningCell[] = [];

    dates.forEach(date => {
      timeSlots.forEach(timeSlot => {
        cells.push({
          date: date.toISOString().split('T')[0],
          timeSlot: timeSlot
        });
      });
    });

    setPlanningData(cells);
    setShowTable(true);
    
    toast({
      title: "Planning généré",
      description: `Planning "${config.name}" créé avec succès`
    });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const uniqueDates = [...new Set(planningData.map(cell => cell.date))].sort();

  const addEvent = () => {
    if (!selectedCell || !newEvent.name) return;

    // Vérifier si un membre de l'équipe est requis pour certains créneaux
    const requiresMember = selectedCell.timeSlot === 'Astreintes, congés, repos récupérateurs';
    if (requiresMember && !newEvent.assignedMember) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un membre de l'équipe pour ce créneau",
        variant: "destructive"
      });
      return;
    }

    const updatedData = planningData.map(cell => {
      if (cell.date === selectedCell.date && cell.timeSlot === selectedCell.timeSlot) {
        return {
          ...cell,
          event: {
            id: Date.now().toString(),
            name: newEvent.name,
            description: newEvent.description,
            color: newEvent.color,
            type: newEvent.type,
            assignedMember: newEvent.assignedMember
          }
        };
      }
      return cell;
    });

    setPlanningData(updatedData);
    setSelectedCell(null);
    setNewEvent({ 
      name: '', 
      description: '', 
      color: 'bg-green-100 text-green-800',
      type: 'activity',
      assignedMember: null
    });
    
    toast({
      title: "Événement ajouté",
      description: `"${newEvent.name}" a été ajouté au planning`
    });
  };

  const removeEvent = (date: string, timeSlot: string) => {
    const updatedData = planningData.map(cell => {
      if (cell.date === date && cell.timeSlot === timeSlot) {
        const { event, ...cellWithoutEvent } = cell;
        return cellWithoutEvent;
      }
      return cell;
    });

    setPlanningData(updatedData);
  };

  const isSpecialTimeSlot = (timeSlot: string) => {
    return timeSlot === 'Astreintes, congés, repos récupérateurs';
  };

  return (
    <div className="space-y-6">
      {/* Configuration du séjour */}
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Nom du séjour</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Robillard"
              />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <Button onClick={generatePlanning} className="bg-blue-600 hover:bg-blue-700">
              Générer planning complet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planning Tableau */}
      {showTable && (
        <Card>
          <CardHeader>
            <CardTitle>Planning Tableau - {config.name}</CardTitle>
            <CardDescription>Cliquez sur les cases pour ajouter des événements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50 text-left font-medium">
                      Créneaux
                    </th>
                    {uniqueDates.map(date => (
                      <th key={date} className="border border-gray-300 p-2 bg-gray-50 text-center min-w-[120px]">
                        <div className="text-sm">
                          <div className="font-medium">{getDayName(date)}.</div>
                          <div className="text-gray-600">{getDateDisplay(date)}</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(timeSlot => (
                    <tr key={timeSlot}>
                      <td className="border border-gray-300 p-3 bg-gray-50 font-medium">
                        {timeSlot}
                      </td>
                      {uniqueDates.map(date => {
                        const cell = planningData.find(c => c.date === date && c.timeSlot === timeSlot);
                        return (
                          <td key={`${date}-${timeSlot}`} className="border border-gray-300 p-1 h-16 relative">
                            {cell?.event ? (
                              <div className="h-full flex flex-col justify-between p-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <Badge className={cell.event.color}>
                                      {cell.event.name}
                                    </Badge>
                                    {cell.event.assignedMember && (
                                      <div className="text-xs text-gray-600 mt-1 flex items-center">
                                        <Users className="h-3 w-3 mr-1" />
                                        {cell.event.assignedMember.prenom} {cell.event.assignedMember.nom}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEvent(date, timeSlot)}
                                    className="h-6 w-6 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full h-full flex items-center justify-center hover:bg-gray-100"
                                onClick={() => setSelectedCell({ date, timeSlot })}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
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
      )}

      {/* Dialog pour ajouter un événement */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type d'événement</Label>
              <Select 
                value={newEvent.type} 
                onValueChange={(value: 'activity' | 'duty' | 'leave' | 'recovery') => 
                  setNewEvent(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom de l'événement</Label>
              <Input
                value={newEvent.name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Randonnées à poney"
              />
            </div>

            <div>
              <Label>Description (optionnelle)</Label>
              <Input
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails de l'activité..."
              />
            </div>

            {/* Sélection du membre de l'équipe pour les créneaux spéciaux */}
            {selectedCell && isSpecialTimeSlot(selectedCell.timeSlot) && (
              <div>
                <Label>Membre de l'équipe *</Label>
                <Select 
                  value={newEvent.assignedMember?.id.toString() || ''} 
                  onValueChange={(value) => {
                    const member = animateurs.find(a => a.id.toString() === value);
                    setNewEvent(prev => ({ ...prev, assignedMember: member || null }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {animateurs.map(animateur => (
                      <SelectItem key={animateur.id} value={animateur.id.toString()}>
                        {animateur.prenom} {animateur.nom} ({animateur.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Couleur</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {eventColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${color} ${
                      newEvent.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    onClick={() => setNewEvent(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={addEvent} disabled={!newEvent.name}>
                Ajouter
              </Button>
              <Button variant="outline" onClick={() => setSelectedCell(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningTableGenerator;
