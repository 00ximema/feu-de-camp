
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, isValid, differenceInDays, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EventDialog from './EventDialog';
import { useTeamManagement } from '@/hooks/useTeamManagement';

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
    return addDays(start, 6); // Par défaut, une semaine
  });
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const { team } = useTeamManagement();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; cellIndex: number } | null>(null);
  const planningRef = useRef<HTMLDivElement>(null);

  // Convertir les membres d'équipe au format attendu
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
      // Retourner une semaine par défaut
      const fallbackStart = new Date(2024, 0, 1);
      return Array.from({ length: 7 }, (_, i) => addDays(fallbackStart, i));
    }
  };

  const dateRange = generateDateRange(startDate, endDate);

  const handleCellClick = (rowIndex: number, cellIndex: number) => {
    console.log('Cell clicked:', rowIndex, cellIndex);
    setSelectedCell({ rowIndex, cellIndex });
    setDialogOpen(true);
  };

  const handleSaveEvent = (eventName: string, memberIds?: string[], type?: string, startDate?: string, endDate?: string) => {
    if (!selectedCell) return;
    
    console.log('Saving event:', eventName, memberIds, type);
    const { rowIndex, cellIndex } = selectedCell;
    const newData = [...planningData];
    const members = memberIds ? teamMembers.filter(m => memberIds.includes(m.id)) : undefined;
    
    const timeSlot = newData[rowIndex][cellIndex].timeSlot;
    const isSpecialRow = SPECIAL_ROWS.includes(timeSlot);
    
    newData[rowIndex][cellIndex].event = {
      id: `${rowIndex}-${cellIndex}`,
      name: isSpecialRow ? timeSlot : eventName,
      type: (type as any) || (isSpecialRow ? 'astreinte' : 'activity'),
      assignedMembers: members,
      startDate,
      endDate
    };
    
    setPlanningData(newData);
  };

  const handleDeleteEvent = (rowIndex: number, cellIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting event at:', rowIndex, cellIndex);
    const newData = [...planningData];
    delete newData[rowIndex][cellIndex].event;
    setPlanningData(newData);
  };

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

      setPlanningData(initialData);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du planning:', error);
      setPlanningData([]);
    }
  }, [startDate, endDate]);

  const exportToPDF = async () => {
    if (!planningRef.current) return;

    try {
      console.log('Export PDF...');
      const canvas = await html2canvas(planningRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 297, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('CVJ MG', 15, 17);
      
      pdf.setFontSize(16);
      pdf.text('Planning Équipe', 50, 17);
      
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
      
      const imgWidth = 267;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
      
      const fileName = 'Planning.pdf';
      pdf.save(fileName);
      console.log('PDF exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
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
        // Si la date de fin est antérieure à la nouvelle date de début, l'ajuster
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
            Cliquez sur une case pour ajouter ou modifier un événement
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

          <div ref={planningRef} className="bg-white p-4">
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
                              {cell.event.assignedMembers && cell.event.assignedMembers.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  {cell.event.assignedMembers.map(member => 
                                    `${member.prenom} ${member.nom}`
                                  ).join(', ')}
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
