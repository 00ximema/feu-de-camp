
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek } from 'date-fns';
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
  const [startDate, setStartDate] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const [teamMembers] = useState<TeamMember[]>([
    { id: 1, nom: 'Dupont', prenom: 'Jean', role: 'Directeur' },
    { id: 2, nom: 'Martin', prenom: 'Marie', role: 'Animateur' },
    { id: 3, nom: 'Bernard', prenom: 'Paul', role: 'Animateur' },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; cellIndex: number } | null>(null);
  const planningRef = useRef<HTMLDivElement>(null);

  // Generate 7 days from start date
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  const dates = generateDates();

  // Initialize planning data
  useEffect(() => {
    console.log('Initializing planning data for date:', startDate);
    const initialData: PlanningCell[][] = [];
    
    // Regular time slots
    TIME_SLOTS.forEach(timeSlot => {
      const row: PlanningCell[] = [];
      dates.forEach(date => {
        row.push({
          date: format(date, 'yyyy-MM-dd'),
          timeSlot,
        });
      });
      initialData.push(row);
    });

    // Special rows (Astreintes, Congés, Repos récupérateurs)
    SPECIAL_ROWS.forEach(specialRow => {
      const row: PlanningCell[] = [];
      dates.forEach(date => {
        row.push({
          date: format(date, 'yyyy-MM-dd'),
          timeSlot: specialRow,
        });
      });
      initialData.push(row);
    });

    setPlanningData(initialData);
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
      console.log('Exporting to PDF...');
      const canvas = await html2canvas(planningRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      // Header avec logo
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
      pdf.text(`Semaine du ${format(startDate, 'dd/MM/yyyy', { locale: fr })}`, 15, 35);
      
      // Add planning table
      const imgWidth = 267;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 15, 45, imgWidth, imgHeight);
      
      pdf.save(`Planning_${format(startDate, 'yyyy-MM-dd')}.pdf`);
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
    }
  };

  const isSpecialRow = (timeSlot: string) => SPECIAL_ROWS.includes(timeSlot);

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
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  setStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
                }}
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
                    {dates.map((date) => (
                      <TableHead key={format(date, 'yyyy-MM-dd')} className="text-center font-bold bg-gray-100 min-w-32">
                        <div>{format(date, 'EEEE', { locale: fr })}</div>
                        <div className="text-sm">{format(date, 'dd/MM', { locale: fr })}</div>
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
                              {cell.event.startDate !== cell.event.endDate && (
                                <div className="text-xs text-blue-600">
                                  {format(new Date(cell.event.startDate || ''), 'dd/MM')} - {format(new Date(cell.event.endDate || ''), 'dd/MM')}
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
