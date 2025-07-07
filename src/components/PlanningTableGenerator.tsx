import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EventDialog from './EventDialog';

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

interface PlanningCell {
  date: string;
  timeSlot: string;
  event?: PlanningEvent;
}

const TIME_SLOTS = [
  'Matin (8h-12h)',
  'Midi (12h-14h)', 
  'Après-midi (14h-18h)',
  'Soir (18h-22h)',
  'Nuit (22h-8h)'
];

const SPECIAL_ROWS = [
  'Astreintes',
  'Congés', 
  'Repos récupérateurs'
];

const PlanningTableGenerator = () => {
  // Initialisation avec une date simple et valide
  const getDefaultStartDate = () => {
    try {
      const today = new Date();
      // Vérifier si la date est valide
      if (!isValid(today)) {
        return new Date(2024, 0, 1); // 1er janvier 2024
      }
      
      // Calculer le début de semaine de manière sûre
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
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const [teamMembers] = useState<TeamMember[]>([
    { id: 1, nom: 'Dupont', prenom: 'Jean', role: 'Directeur' },
    { id: 2, nom: 'Martin', prenom: 'Marie', role: 'Animateur' },
    { id: 3, nom: 'Bernard', prenom: 'Paul', role: 'Animateur' },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; cellIndex: number } | null>(null);
  const planningRef = useRef<HTMLDivElement>(null);

  // Génération sécurisée des dates
  const generateWeekDates = (baseDate: Date) => {
    const dates = [];
    try {
      if (!isValid(baseDate)) {
        throw new Error('Date de base invalide');
      }
      
      for (let i = 0; i < 7; i++) {
        const newDate = addDays(baseDate, i);
        if (isValid(newDate)) {
          dates.push(newDate);
        } else {
          // Date de fallback si addDays échoue
          dates.push(new Date(2024, 0, 1 + i));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération des dates:', error);
      // Générer des dates de fallback
      for (let i = 0; i < 7; i++) {
        dates.push(new Date(2024, 0, 1 + i));
      }
    }
    return dates;
  };

  const weekDates = generateWeekDates(startDate);

  // Initialisation du planning
  useEffect(() => {
    console.log('Initialisation du planning pour la date:', startDate);
    
    try {
      const initialData: PlanningCell[][] = [];
      
      // Créneaux horaires réguliers
      TIME_SLOTS.forEach(timeSlot => {
        const row: PlanningCell[] = [];
        weekDates.forEach(date => {
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

      // Lignes spéciales
      SPECIAL_ROWS.forEach(specialRow => {
        const row: PlanningCell[] = [];
        weekDates.forEach(date => {
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
  }, [startDate]);

  const handleCellClick = (rowIndex: number, cellIndex: number) => {
    console.log('Cell clicked:', rowIndex, cellIndex);
    setSelectedCell({ rowIndex, cellIndex });
    setDialogOpen(true);
  };

  const handleSaveEvent = (eventName: string, memberId?: number, type?: string, startDate?: string, endDate?: string) => {
    if (!selectedCell) return;
    
    console.log('Saving event:', eventName, memberId, type);
    const { rowIndex, cellIndex } = selectedCell;
    const newData = [...planningData];
    const member = memberId ? teamMembers.find(m => m.id === memberId) : undefined;
    
    newData[rowIndex][cellIndex].event = {
      id: `${rowIndex}-${cellIndex}`,
      name: eventName,
      type: (type as any) || (SPECIAL_ROWS.includes(newData[rowIndex][cellIndex].timeSlot) ? 'astreinte' : 'activity'),
      assignedMember: member,
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
      
      // En-tête
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, 297, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('CVJ MG', 15, 17);
      
      pdf.setFontSize(16);
      pdf.text('Planning Équipe', 50, 17);
      
      // Date
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
      
      // Table du planning
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      if (!inputValue) return;
      
      const newDate = new Date(inputValue);
      if (isValid(newDate)) {
        const mondayStart = startOfWeek(newDate, { weekStartsOn: 1 });
        if (isValid(mondayStart)) {
          setStartDate(mondayStart);
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de date:', error);
    }
  };

  // Rendu sécurisé de la date de début
  const getStartDateValue = () => {
    try {
      return isValid(startDate) ? format(startDate, 'yyyy-MM-dd') : '2024-01-01';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '2024-01-01';
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
              <Label htmlFor="start-date">Date de début (Lundi)</Label>
              <Input
                id="start-date" 
                type="date"
                value={getStartDateValue()}
                onChange={handleDateChange}
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
                    {weekDates.map((date, index) => (
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
                              {cell.event.assignedMember && (
                                <div className="text-xs text-gray-600">
                                  {cell.event.assignedMember.prenom} {cell.event.assignedMember.nom}
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

const handleCellClick = (rowIndex: number, cellIndex: number) => {
  console.log('Cellule cliquée:', rowIndex, cellIndex);
  setSelectedCell({ rowIndex, cellIndex });
  setDialogOpen(true);
};

const handleSaveEvent = (eventName: string, memberId?: number, type?: string, startDate?: string, endDate?: string) => {
  if (!selectedCell) return;
  
  console.log('Sauvegarde événement:', eventName, memberId, type);
  const { rowIndex, cellIndex } = selectedCell;
  const newData = [...planningData];
  const member = memberId ? teamMembers.find(m => m.id === memberId) : undefined;
  
  newData[rowIndex][cellIndex].event = {
    id: `${rowIndex}-${cellIndex}`,
    name: eventName,
    type: (type as any) || (SPECIAL_ROWS.includes(newData[rowIndex][cellIndex].timeSlot) ? 'astreinte' : 'activity'),
    assignedMember: member,
    startDate,
    endDate
  };
  
  setPlanningData(newData);
};

const handleDeleteEvent = (rowIndex: number, cellIndex: number, e: React.MouseEvent) => {
  e.stopPropagation();
  console.log('Suppression événement:', rowIndex, cellIndex);
  const newData = [...planningData];
  delete newData[rowIndex][cellIndex].event;
  setPlanningData(newData);
};

export default PlanningTableGenerator;
