import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Download, Plus, Trash2, Edit, Clock } from "lucide-react";
import { format, addDays, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSession } from '@/hooks/useSession';
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { toast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PlanningEvent {
  id: string;
  name: string;
  type: 'activity' | 'meal' | 'meeting' | 'leave' | 'recovery' | 'astreinte' | 'other';
  assignedMembers?: Array<{
    id: string;
    nom: string;
    prenom: string;
    role: string;
  }>;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  selectedGroups?: string[];
  selectedJeunes?: string[];
  notes?: string;
}

interface PlanningCell {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

interface Planning {
  id: string;
  sessionId?: string;
  data: PlanningCell[][];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Animateur {
  id: string;
  nom: string;
  prenom: string;
  role: string;
}

interface Group {
  id: string;
  nom: string;
  couleur: string;
}

interface Youngster {
  id: string;
  nom: string;
  prenom: string;
}

const PlanningTableGenerator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<string>('activity');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedJeunes, setSelectedJeunes] = useState<string[]>([]);
  const [animateurs, setAnimateurs] = useState<Animateur[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [jeunes, setJeunes] = useState<Youngster[]>([]);
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [currentPlanningId, setCurrentPlanningId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const { currentSession } = useSession();
  const { isInitialized, db } = useLocalDatabase();

  const timeSlots = [
    'Matin (8h-12h)',
    'Après-midi (14h-18h)', 
    'Soir (18h-22h)',
    'Nuit (22h-8h)',
    'Congés',
    'Repos récupérateurs',
    'Astreintes'
  ];

  useEffect(() => {
    if (isInitialized && currentSession) {
      loadData();
    }
  }, [isInitialized, currentSession]);

  const loadData = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      console.log('Chargement des données pour la session:', currentSession.id);
      
      const [dbAnimateurs, dbGroups, dbJeunes, dbPlannings] = await Promise.all([
        db.getAll('animateurs', currentSession.id),
        db.getAll('groupes', currentSession.id),
        db.getAll('jeunes', currentSession.id),
        db.getAll('plannings', currentSession.id)
      ]);

      console.log('Données chargées:', {
        animateurs: dbAnimateurs.length,
        groupes: dbGroups.length,
        jeunes: dbJeunes.length,
        plannings: dbPlannings.length
      });

      setAnimateurs(dbAnimateurs);
      setGroups(dbGroups);
      setJeunes(dbJeunes);
      setPlannings(dbPlannings);

      if (dbPlannings.length > 0) {
        const latestPlanning = dbPlannings[dbPlannings.length - 1];
        setCurrentPlanningId(latestPlanning.id);
        setPlanningData(latestPlanning.data || []);
        setStartDate(latestPlanning.startDate || '');
        setEndDate(latestPlanning.endDate || '');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const generatePlanning = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner les dates de début et de fin",
        variant: "destructive"
      });
      return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (!isValid(start) || !isValid(end)) {
      toast({
        title: "Erreur",
        description: "Les dates sélectionnées ne sont pas valides",
        variant: "destructive"
      });
      return;
    }

    if (start > end) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin",
        variant: "destructive"
      });
      return;
    }

    const days = [];
    let currentDate = start;
    
    while (currentDate <= end) {
      days.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }

    const newPlanningData: PlanningCell[][] = timeSlots.map(timeSlot => 
      days.map(date => ({
        date,
        timeSlot
      }))
    );

    setPlanningData(newPlanningData);
    
    toast({
      title: "Planning généré",
      description: `Planning créé pour ${days.length} jours`
    });
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setSelectedCell({ row: rowIndex, col: colIndex });
    const cell = planningData[rowIndex][colIndex];
    
    if (cell.event) {
      setEventName(cell.event.name);
      setEventType(cell.event.type);
      setEventStartDate(cell.event.startDate || '');
      setEventEndDate(cell.event.endDate || '');
      setEventStartTime(cell.event.startTime || '');
      setEventEndTime(cell.event.endTime || '');
      setEventNotes(cell.event.notes || '');
      setSelectedMembers(cell.event.assignedMembers?.map(m => m.id) || []);
      setSelectedGroups(cell.event.selectedGroups || []);
      setSelectedJeunes(cell.event.selectedJeunes || []);
    } else {
      setEventName('');
      setEventType('activity');
      setEventStartDate('');
      setEventEndDate('');
      setEventStartTime('');
      setEventEndTime('');
      setEventNotes('');
      setSelectedMembers([]);
      setSelectedGroups([]);
      setSelectedJeunes([]);
    }
    
    setDialogOpen(true);
  };

  const handleSaveEvent = async (eventName: string, memberIds?: string[], type?: string, startDate?: string, endDate?: string, startTime?: string, endTime?: string, selectedGroups?: string[], selectedJeunes?: string[], notes?: string) => {
    if (!selectedCell) return;
    
    console.log('Saving event:', eventName, memberIds, type, startTime, endTime, selectedGroups, selectedJeunes, notes);
    
    const assignedMembers = memberIds ? animateurs.filter(a => memberIds.includes(a.id)) : [];
    
    const newEvent: PlanningEvent = {
      id: `event_${Date.now()}`,
      name: eventName,
      type: (type as PlanningEvent['type']) || 'activity',
      assignedMembers,
      startDate,
      endDate,
      startTime,
      endTime,
      selectedGroups,
      selectedJeunes,
      notes
    };

    const newPlanningData = [...planningData];
    newPlanningData[selectedCell.row][selectedCell.col] = {
      ...newPlanningData[selectedCell.row][selectedCell.col],
      event: newEvent
    };

    setPlanningData(newPlanningData);
    await savePlanning(newPlanningData);
    
    setDialogOpen(false);
    setSelectedCell(null);
    resetEventForm();
  };

  const handleDeleteEvent = async () => {
    if (!selectedCell) return;

    const newPlanningData = [...planningData];
    delete newPlanningData[selectedCell.row][selectedCell.col].event;

    setPlanningData(newPlanningData);
    await savePlanning(newPlanningData);
    
    setDialogOpen(false);
    setSelectedCell(null);
    resetEventForm();
  };

  const resetEventForm = () => {
    setEventName('');
    setEventType('activity');
    setEventStartDate('');
    setEventEndDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventNotes('');
    setSelectedMembers([]);
    setSelectedGroups([]);
    setSelectedJeunes([]);
  };

  const savePlanning = async (data: PlanningCell[][]) => {
    if (!currentSession || !isInitialized) return;

    try {
      const planningToSave: Planning = {
        id: currentPlanningId || `planning_${Date.now()}`,
        sessionId: currentSession.id,
        data,
        startDate,
        endDate,
        createdAt: currentPlanningId ? plannings.find(p => p.id === currentPlanningId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.save('plannings', planningToSave);
      
      if (!currentPlanningId) {
        setCurrentPlanningId(planningToSave.id);
        setPlannings(prev => [...prev, planningToSave]);
      } else {
        setPlannings(prev => prev.map(p => p.id === currentPlanningId ? planningToSave : p));
      }

      console.log('Planning sauvegardé:', planningToSave.id);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du planning:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le planning",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!tableRef.current || planningData.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun planning à exporter",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Export PDF planning démarré...');

      const originalElement = tableRef.current;
      
      const exportElement = document.createElement('div');
      exportElement.innerHTML = originalElement.innerHTML;
      exportElement.style.position = 'absolute';
      exportElement.style.left = '-9999px';
      exportElement.style.top = '0';
      exportElement.style.backgroundColor = 'white';
      exportElement.style.padding = '20px';
      exportElement.style.width = '1200px';
      exportElement.style.fontFamily = 'Arial, sans-serif';
      
      const buttons = exportElement.querySelectorAll('button');
      buttons.forEach(button => button.remove());
      
      document.body.appendChild(exportElement);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportElement, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1200
      });
      
      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 297, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.text('CVJ MG', 15, 17);
      
      pdf.setFontSize(14);
      pdf.text('Planning', 60, 17);
      
      if (startDate && endDate) {
        const startFormatted = format(parseISO(startDate), 'dd/MM/yyyy', { locale: fr });
        const endFormatted = format(parseISO(endDate), 'dd/MM/yyyy', { locale: fr });
        pdf.text(`Du ${startFormatted} au ${endFormatted}`, 120, 17);
      }
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 15, 35);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 45;
      let remainingHeight = imgHeight;
      
      while (remainingHeight > 0) {
        const pageHeight = pdfHeight - yPosition - 10;
        const currentHeight = Math.min(remainingHeight, pageHeight);
        
        pdf.addImage(
          imgData, 
          'PNG', 
          15, 
          yPosition, 
          imgWidth, 
          currentHeight
        );
        
        remainingHeight -= currentHeight;
        
        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 20;
        }
      }
      
      const fileName = `Planning_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export réussi",
        description: "Le planning a été exporté en PDF",
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le planning en PDF",
        variant: "destructive"
      });
    }
  };

  const formatDateSafely = (dateString: string) => {
    try {
      if (!dateString) return '';
      const dateObj = parseISO(dateString);
      if (!isValid(dateObj)) return dateString;
      return format(dateObj, 'dd/MM/yyyy', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  const getDatesArray = () => {
    if (planningData.length === 0) return [];
    return planningData[0].map(cell => cell.date);
  };

  const getRowBackgroundColor = (timeSlot: string) => {
    switch (timeSlot) {
      case 'Astreintes':
        return 'bg-red-50 hover:bg-red-100';
      case 'Congés':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'Repos récupérateurs':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'hover:bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Générateur de planning</span>
          </CardTitle>
          <CardDescription>
            Créez et gérez vos plannings de séjour avec attribution des tâches et suivi du personnel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generatePlanning} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Générer le planning
              </Button>
            </div>
          </div>

          {planningData.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={exportToPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter en PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {planningData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Planning généré</CardTitle>
            <CardDescription>
              Cliquez sur une cellule pour ajouter ou modifier un événement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={tableRef} className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Créneaux</TableHead>
                    {getDatesArray().map((date) => (
                      <TableHead key={date} className="min-w-[120px] text-center">
                        {formatDateSafely(date)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((timeSlot, rowIndex) => (
                    <TableRow key={timeSlot} className={getRowBackgroundColor(timeSlot)}>
                      <TableCell className="font-medium">{timeSlot}</TableCell>
                      {planningData[rowIndex]?.map((cell, colIndex) => (
                        <TableCell
                          key={`${rowIndex}-${colIndex}`}
                          className="p-1 cursor-pointer border"
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {cell.event ? (
                            <div className="space-y-1 p-2 bg-white rounded border-l-4 border-blue-500">
                              <div className="font-semibold text-sm">{cell.event.name}</div>
                              {cell.event.assignedMembers && cell.event.assignedMembers.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  {cell.event.assignedMembers.map(member => 
                                    `${member.prenom} ${member.nom}`
                                  ).join(', ')}
                                </div>
                              )}
                              {cell.event.startTime && cell.event.endTime && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {cell.event.startTime} - {cell.event.endTime}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-gray-400 text-sm">
                              +
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCell && planningData[selectedCell.row][selectedCell.col].event 
                ? 'Modifier l\'événement' 
                : 'Ajouter un événement'
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-name">Nom de l'événement</Label>
              <Input
                id="event-name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Ex: Activité piscine, Repas, Réunion équipe..."
              />
            </div>

            <div>
              <Label htmlFor="event-type">Type d'événement</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-start-date">Date de début</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event-end-date">Date de fin</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event-start-time">Heure de début</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="event-end-time">Heure de fin</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Personnel assigné</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-3 space-y-2">
                {animateurs.map((animateur) => (
                  <div key={animateur.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${animateur.id}`}
                      checked={selectedMembers.includes(animateur.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, animateur.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== animateur.id));
                        }
                      }}
                    />
                    <Label htmlFor={`member-${animateur.id}`} className="text-sm">
                      {animateur.prenom} {animateur.nom} - {animateur.role}
                    </Label>
                  </div>
                ))}
                {animateurs.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun animateur disponible</p>
                )}
              </div>
            </div>

            <div>
              <Label>Groupes concernés</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-3 space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGroups([...selectedGroups, group.id]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                        }
                      }}
                    />
                    <Label htmlFor={`group-${group.id}`} className="text-sm">
                      <Badge style={{ backgroundColor: group.couleur }} className="text-white">
                        {group.nom}
                      </Badge>
                    </Label>
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun groupe disponible</p>
                )}
              </div>
            </div>

            <div>
              <Label>Jeunes concernés</Label>
              <div className="max-h-32 overflow-y-auto border rounded p-3 space-y-2">
                {jeunes.map((jeune) => (
                  <div key={jeune.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`jeune-${jeune.id}`}
                      checked={selectedJeunes.includes(jeune.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedJeunes([...selectedJeunes, jeune.id]);
                        } else {
                          setSelectedJeunes(selectedJeunes.filter(id => id !== jeune.id));
                        }
                      }}
                    />
                    <Label htmlFor={`jeune-${jeune.id}`} className="text-sm">
                      {jeune.prenom} {jeune.nom}
                    </Label>
                  </div>
                ))}
                {jeunes.length === 0 && (
                  <p className="text-sm text-gray-500">Aucun jeune disponible</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="event-notes">Notes / Précisions</Label>
              <Textarea
                id="event-notes"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              {selectedCell && planningData[selectedCell.row][selectedCell.col].event && (
                <Button variant="destructive" onClick={handleDeleteEvent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => handleSaveEvent(eventName, selectedMembers, eventType, eventStartDate, eventEndDate, eventStartTime, eventEndTime, selectedGroups, selectedJeunes, eventNotes)}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningTableGenerator;
