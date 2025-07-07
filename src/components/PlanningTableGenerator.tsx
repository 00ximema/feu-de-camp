import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, isValid, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EventDialog from './EventDialog';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/components/ui/use-toast';

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
  description?: string;
  notes?: string;
}

interface PlanningCell {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

const TIME_SLOTS = [
  'Matin',
  'Midi', 
  'Après-midi',
  'Soir',
  'Nuit'
];

const SPECIAL_ROWS = [
  'Astreintes',
  'Congés', 
  'Repos récupérateurs'
];

const PlanningTableGenerator = () => {
  const getDefaultStartDate = () => {
    try {
      const today = new Date();
      if (!isValid(today)) {
        return new Date(2024, 0, 1);
      }
      
      const mondayStart = startOfWeek(today, { weekStartsOn: 1 });
      if (!isValid(mondayStart)) {
        return new Date(2024, 0, 1);
      }
      
      return mondayStart;
    } catch (error) {
      console.error('Erreur lors du calcul de la date de début:', error);
      return new Date(2024, 0, 1);
    }
  };

  const [startDate, setStartDate] = useState<Date>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<Date>(() => {
    const start = getDefaultStartDate();
    return addDays(start, 6);
  });
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const { team } = useTeamManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; cellIndex: number } | null>(null);
  const planningRef = useRef<HTMLDivElement>(null);

  const { isInitialized, db } = useLocalDatabase();
  const { currentSession } = useSession();

  const teamMembers: TeamMember[] = team.map(member => ({
    id: member.id,
    nom: member.nom,
    prenom: member.prenom,
    role: member.role
  }));

  const generateDateRange = (start: Date, end: Date) => {
    const dates = [];
    try {
      if (!isValid(start) || !isValid(end)) {
        throw new Error('Dates invalides');
      }
      
      const interval = eachDayOfInterval({ start, end });
      return interval.filter(date => isValid(date));
    } catch (error) {
      console.error('Erreur lors de la génération des dates:', error);
      const fallbackStart = new Date(2024, 0, 1);
      return Array.from({ length: 7 }, (_, i) => addDays(fallbackStart, i));
    }
  };

  const dateRange = generateDateRange(startDate, endDate);

  const formatDateSafely = (date: Date) => {
    try {
      if (!isValid(date)) {
        return '01/01/2024';
      }
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return '01/01/2024';
    }
  };

  const formatDateForInput = (date: Date) => {
    try {
      return isValid(date) ? format(date, 'yyyy-MM-dd') : '2024-01-01';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '2024-01-01';
    }
  };

  const savePlanning = async (updatedData: PlanningCell[][]) => {
    if (!isInitialized || !currentSession) return;

    try {
      const planningToSave = {
        id: `planning_${currentSession.id}_${Date.now()}`,
        sessionId: currentSession.id,
        data: updatedData,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.save('plannings', planningToSave);
      console.log('Planning sauvegardé avec succès');
      toast({
        title: "Planning sauvegardé",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du planning:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder le planning.",
        variant: "destructive",
      });
    }
  };

  const loadPlanning = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const plannings = await db.getAll('plannings', currentSession.id);
      if (plannings.length > 0) {
        const latestPlanning = plannings.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        )[0];
        
        if (latestPlanning.data) {
          setPlanningData(latestPlanning.data);
          console.log('Planning chargé depuis la base de données');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
    }
  };

  const handleCellClick = (rowIndex: number, cellIndex: number) => {
    console.log('Cell clicked:', rowIndex, cellIndex);
    setSelectedCell({ rowIndex, cellIndex });
    setDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: {
    eventName: string;
    memberIds?: string[];
    type?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    selectedGroups?: string[];
    selectedJeunes?: string[];
    notes?: string;
  }) => {
    if (!selectedCell) return;
    
    console.log('Saving event:', eventData);
    const { rowIndex, cellIndex } = selectedCell;
    const newData = [...planningData];
    const members = eventData.memberIds ? teamMembers.filter(m => eventData.memberIds!.includes(m.id)) : undefined;
    
    const timeSlot = newData[rowIndex][cellIndex].timeSlot;
    const isSpecialRow = SPECIAL_ROWS.includes(timeSlot);
    
    newData[rowIndex][cellIndex].event = {
      id: `${rowIndex}-${cellIndex}-${Date.now()}`,
      name: isSpecialRow ? timeSlot : eventData.eventName,
      type: (eventData.type as any) || (isSpecialRow ? 'astreinte' : 'activity'),
      assignedMembers: members,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      selectedGroups: eventData.selectedGroups,
      selectedJeunes: eventData.selectedJeunes,
      notes: eventData.notes,
      description: eventData.notes
    };
    
    setPlanningData(newData);
    await savePlanning(newData);
  };

  const handleDeleteEvent = async (rowIndex: number, cellIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting event at:', rowIndex, cellIndex);
    const newData = [...planningData];
    delete newData[rowIndex][cellIndex].event;
    setPlanningData(newData);
    await savePlanning(newData);
    
    toast({
      title: "Événement supprimé",
      description: "L'événement a été supprimé avec succès.",
    });
  };

  useEffect(() => {
    if (isInitialized && currentSession) {
      loadPlanning();
    }
  }, [isInitialized, currentSession]);

  useEffect(() => {
    console.log('Initialisation du planning pour la période:', startDate, 'à', endDate);
    
    try {
      const initialData: PlanningCell[][] = [];
      
      TIME_SLOTS.forEach(timeSlot => {
        const row: PlanningCell[] = [];
        dateRange.forEach(date => {
          try {
            const dateString = isValid(date) ? format(date, 'yyyy-MM-dd') : '2024-01-01';
            row.push({
              date: dateString,
              timeSlot,
            });
          } catch (error) {
            console.error('Erreur lors du formatage de date:', error);
            row.push({
              date: '2024-01-01',
              timeSlot,
            });
          }
        });
        initialData.push(row);
      });

      SPECIAL_ROWS.forEach(specialRow => {
        const row: PlanningCell[] = [];
        dateRange.forEach(date => {
          try {
            const dateString = isValid(date) ? format(date, 'yyyy-MM-dd') : '2024-01-01';
            row.push({
              date: dateString,
              timeSlot: specialRow,
            });
          } catch (error) {
            console.error('Erreur lors du formatage de date spéciale:', error);
            row.push({
              date: '2024-01-01',
              timeSlot: specialRow,
            });
          }
        });
        initialData.push(row);
      });

      if (planningData.length === 0) {
        setPlanningData(initialData);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du planning:', error);
      setPlanningData([]);
    }
  }, [startDate, endDate]);

  const exportToPDF = async () => {
    if (!planningRef.current) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le planning",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Export PDF démarré...');
      
      const originalElement = planningRef.current;
      
      // Créer un élément temporaire pour l'export
      const exportElement = document.createElement('div');
      exportElement.innerHTML = originalElement.innerHTML;
      exportElement.style.position = 'absolute';
      exportElement.style.left = '-9999px';
      exportElement.style.top = '0';
      exportElement.style.backgroundColor = 'white';
      exportElement.style.padding = '20px';
      exportElement.style.width = '1400px';
      exportElement.style.fontFamily = 'Arial, sans-serif';
      
      // Supprimer tous les boutons de l'export
      const buttons = exportElement.querySelectorAll('button');
      buttons.forEach(button => button.remove());
      
      // Supprimer les éléments d'interaction
      const interactive = exportElement.querySelectorAll('.group-hover\\:opacity-100, .opacity-0');
      interactive.forEach(el => el.remove());
      
      document.body.appendChild(exportElement);

      // Attendre un court délai pour que l'élément soit rendu
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1400,
        height: exportElement.scrollHeight
      });
      
      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Ajouter l'en-tête
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 297, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('CVJ MG', 15, 17);
      
      pdf.setFontSize(16);
      pdf.text('Planning Équipe', 60, 17);
      
      // Ajouter la date
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      try {
        if (isValid(startDate)) {
          pdf.text(`Semaine du ${format(startDate, 'dd/MM/yyyy', { locale: fr })}`, 15, 35);
        } else {
          pdf.text('Planning', 15, 35);
        }
      } catch (error) {
        console.error('Erreur formatage date PDF:', error);
        pdf.text('Planning', 15, 35);
      }
      
      // Calculer les dimensions de l'image
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 30;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 45;
      let remainingHeight = imgHeight;
      
      // Ajouter l'image page par page si nécessaire
      while (remainingHeight > 0) {
        const pageHeight = pdfHeight - yPosition - 10;
        const currentHeight = Math.min(remainingHeight, pageHeight);
        
        const sy = imgHeight - remainingHeight;
        const sHeight = currentHeight;
        
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
      
      const fileName = `Planning_${format(startDate, 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export réussi",
        description: "Le planning a été exporté en PDF avec succès",
      });
      
      console.log('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le planning en PDF",
        variant: "destructive"
      });
    }
  };

  const isSpecialRow = (timeSlot: string) => SPECIAL_ROWS.includes(timeSlot);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      if (!inputValue) return;
      
      const newDate = new Date(inputValue);
      if (isValid(newDate)) {
        setStartDate(newDate);
        if (endDate < newDate) {
          setEndDate(addDays(newDate, 6));
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de date de début:', error);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      if (!inputValue) return;
      
      const newDate = new Date(inputValue);
      if (isValid(newDate) && newDate >= startDate) {
        setEndDate(newDate);
      }
    } catch (error) {
      console.error('Erreur lors du changement de date de fin:', error);
    }
  };

  const getStartDateValue = () => {
    try {
      return isValid(startDate) ? format(startDate, 'yyyy-MM-dd') : '2024-01-01';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '2024-01-01';
    }
  };

  const getEndDateValue = () => {
    try {
      return isValid(endDate) ? format(endDate, 'yyyy-MM-dd') : '2024-01-07';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '2024-01-07';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Planning interactif</span>
          </CardTitle>
          <CardDescription>
            Cliquez sur une case pour ajouter ou modifier un événement. Les congés et repos récupérateurs seront disponibles pour signature dans l'onglet "Repos des personnels".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date" 
                type="date"
                value={getStartDateValue()}
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date" 
                type="date"
                value={getEndDateValue()}
                onChange={handleEndDateChange}
                min={getStartDateValue()}
              />
            </div>
            <Button onClick={exportToPDF} className="mt-6">
              <Download className="h-4 w-4 mr-2" />
              Exporter en PDF
            </Button>
          </div>

          <div ref={planningRef} className="bg-white p-4" id="planning-table">
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32 font-bold bg-gray-100">Créneaux</TableHead>
                    {dateRange.map((date, index) => (
                      <TableHead key={index} className="text-center font-bold bg-gray-100 min-w-32">
                        {(() => {
                          try {
                            if (isValid(date)) {
                              return (
                                <>
                                  <div>{format(date, 'EEEE', { locale: fr })}</div>
                                  <div className="text-sm">{format(date, 'dd/MM', { locale: fr })}</div>
                                </>
                              );
                            } else {
                              return <div>Date invalide</div>;
                            }
                          } catch (error) {
                            console.error('Erreur formatage en-tête:', error);
                            return <div>Erreur date</div>;
                          }
                        })()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planningData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={isSpecialRow(row[0]?.timeSlot) ? 'bg-purple-50' : ''}>
                      <TableCell className="font-medium bg-gray-50 border-r">
                        {row[0]?.timeSlot}
                      </TableCell>
                      {row.map((cell, cellIndex) => (
                        <TableCell 
                          key={cellIndex} 
                          className="p-2 border min-h-16 cursor-pointer hover:bg-gray-50 transition-colors relative group"
                          onClick={() => handleCellClick(rowIndex, cellIndex)}
                        >
                          {cell.event ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm text-gray-900">
                                {cell.event.name}
                              </div>
                              {cell.event.startTime && cell.event.endTime && (
                                <div className="text-xs text-blue-600">
                                  {cell.event.startTime} - {cell.event.endTime}
                                </div>
                              )}
                              {cell.event.assignedMembers && cell.event.assignedMembers.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  {cell.event.assignedMembers.map(member => 
                                    `${member.prenom} ${member.nom}`
                                  ).join(', ')}
                                </div>
                              )}
                              {cell.event.selectedGroups && cell.event.selectedGroups.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Groupes sélectionnés
                                </div>
                              )}
                              {cell.event.selectedJeunes && cell.event.selectedJeunes.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Jeunes individuels
                                </div>
                              )}
                              {cell.event.notes && (
                                <div className="text-xs text-purple-600 italic">
                                  {cell.event.notes}
                                </div>
                              )}
                              {cell.event.startDate && cell.event.endDate && 
                               cell.event.startDate !== cell.event.endDate && (
                                <div className="text-xs text-blue-600">
                                  {isValid(new Date(cell.event.startDate)) && isValid(new Date(cell.event.endDate)) ? (
                                    <>
                                      {format(new Date(cell.event.startDate), 'dd/MM')} - {format(new Date(cell.event.endDate), 'dd/MM')}
                                    </>
                                  ) : (
                                    'Dates invalides'
                                  )}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={(e) => handleDeleteEvent(rowIndex, cellIndex, e)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <EventDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedCell(null);
        }}
        onSave={handleSaveEvent}
        timeSlot={selectedCell ? planningData[selectedCell.rowIndex]?.[selectedCell.cellIndex]?.timeSlot || '' : ''}
        date={selectedCell ? planningData[selectedCell.rowIndex]?.[selectedCell.cellIndex]?.date || '' : ''}
        teamMembers={teamMembers}
        currentEvent={selectedCell ? planningData[selectedCell.rowIndex]?.[selectedCell.cellIndex]?.event : undefined}
      />
    </div>
  );
};

export default PlanningTableGenerator;
