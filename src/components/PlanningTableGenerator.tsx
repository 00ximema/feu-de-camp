import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, isValid, eachDayOfInterval, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EventDialog from './EventDialog';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import { useLocalDatabase } from '@/hooks/useLocalDatabase';
import { useSession } from '@/hooks/useSession';
import { toast } from '@/components/ui/use-toast';
import logoFondationMG from '/lovable-uploads/573d21bd-66db-4264-8ddf-c5477bf8cb8f.png';

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

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [planningData, setPlanningData] = useState<PlanningCell[][]>([]);
  const [showPlanning, setShowPlanning] = useState(false);
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

  const dateRange = startDate && endDate ? generateDateRange(startDate, endDate) : [];

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
    if (!isInitialized || !currentSession || !startDate || !endDate) return;

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

  const initializePlanningData = () => {
    if (!startDate || !endDate) return [];
    
    console.log('Initialisation du planning pour la période:', startDate, 'à', endDate);
    
    try {
      const initialData: PlanningCell[][] = [];
      const dateRange = generateDateRange(startDate, endDate);
      
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

      return initialData;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du planning:', error);
      return [];
    }
  };

  const exportToPDF = async () => {
    if (!planningRef.current || !startDate || !endDate) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le planning",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Export PDF demarre...');
      
      // Calculer le nombre total de jours
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const dateRange = generateDateRange(startDate, endDate);
      
      // Diviser les dates par groupes de 7 jours maximum
      const dateGroups: Date[][] = [];
      for (let i = 0; i < dateRange.length; i += 7) {
        dateGroups.push(dateRange.slice(i, i + 7));
      }
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;
      
      // Fonction pour créer l'en-tête avec logo
      const createHeader = async (pdf: jsPDF, pageNumber: number, totalPages: number, dateGroup: Date[]) => {
        // Fond blanc
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        // Charger et ajouter le logo
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject();
            logoImg.src = logoFondationMG;
          });
          
          // Ajouter le logo en haut à gauche
          pdf.addImage(logoImg, 'PNG', 15, 5, 25, 25);
        } catch (error) {
          console.error('Erreur lors du chargement du logo:', error);
          // Fallback si le logo ne se charge pas
          pdf.setTextColor(0, 105, 181);
          pdf.setFontSize(14);
          pdf.text('Fondation', 15, 18);
          pdf.text('Gendarmerie', 15, 25);
        }
        
        // Titre du planning
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text('Planning Équipe', 50, 15);
        
        // Période de cette page
        pdf.setFontSize(12);
        try {
          if (dateGroup.length > 0) {
            const firstDate = dateGroup[0];
            const lastDate = dateGroup[dateGroup.length - 1];
            if (isValid(firstDate) && isValid(lastDate)) {
              pdf.text(`Du ${format(firstDate, 'dd/MM/yyyy')} au ${format(lastDate, 'dd/MM/yyyy')}`, 50, 25);
            }
          }
        } catch (error) {
          console.error('Erreur formatage date PDF:', error);
          pdf.text('Planning', 50, 25);
        }
        
        // Numéro de page
        pdf.setFontSize(10);
        pdf.text(`Page ${pageNumber}/${totalPages}`, pageWidth - 50, 20);
        
        // Ligne de séparation
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, 35, pageWidth - 15, 35);
      };

      // Créer une page pour chaque groupe de dates (max 7 jours)
      for (let groupIndex = 0; groupIndex < dateGroups.length; groupIndex++) {
        const currentGroup = dateGroups[groupIndex];
        
        if (groupIndex > 0) {
          pdf.addPage();
        }
        
        // Créer l'en-tête pour cette page
        await createHeader(pdf, groupIndex + 1, dateGroups.length, currentGroup);
        
        // Créer un tableau temporaire pour ce groupe de dates
        const tempTableDiv = document.createElement('div');
        tempTableDiv.style.position = 'absolute';
        tempTableDiv.style.left = '-9999px';
        tempTableDiv.style.top = '0';
        tempTableDiv.style.backgroundColor = 'white';
        tempTableDiv.style.padding = '10px';
        tempTableDiv.style.width = '1000px';
        tempTableDiv.style.fontFamily = 'Arial, sans-serif';
        tempTableDiv.style.fontSize = '10px';
        
        // Créer le tableau HTML pour ce groupe
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '9px';
        table.style.tableLayout = 'fixed';
        
        // En-tête du tableau
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Colonne des créneaux
        const creneauHeader = document.createElement('th');
        creneauHeader.textContent = 'Créneaux';
        creneauHeader.style.width = '120px';
        creneauHeader.style.padding = '12px 6px'; // Augmenter le padding
        creneauHeader.style.border = '1px solid #ccc';
        creneauHeader.style.backgroundColor = '#f5f5f5';
        creneauHeader.style.fontWeight = 'bold';
        headerRow.appendChild(creneauHeader);
        
        // Colonnes des dates
        currentGroup.forEach(date => {
          const dateHeader = document.createElement('th');
          try {
            if (isValid(date)) {
              dateHeader.innerHTML = `
                <div>${format(date, 'EEEE', { locale: fr })}</div>
                <div style="font-size: 8px;">${format(date, 'dd/MM', { locale: fr })}</div>
              `;
            } else {
              dateHeader.textContent = 'Date invalide';
            }
          } catch (error) {
            dateHeader.textContent = 'Erreur date';
          }
          dateHeader.style.width = `${Math.floor(880 / currentGroup.length)}px`;
          dateHeader.style.padding = '12px 6px'; // Augmenter le padding
          dateHeader.style.border = '1px solid #ccc';
          dateHeader.style.backgroundColor = '#f5f5f5';
          dateHeader.style.fontWeight = 'bold';
          dateHeader.style.textAlign = 'center';
          headerRow.appendChild(dateHeader);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corps du tableau
        const tbody = document.createElement('tbody');
        
        // Créer les lignes pour chaque créneau
        [...TIME_SLOTS, ...SPECIAL_ROWS].forEach(timeSlot => {
          const row = document.createElement('tr');
          if (SPECIAL_ROWS.includes(timeSlot)) {
            row.style.backgroundColor = '#f3f4f6';
          }
          
          // Colonne du créneau
          const slotCell = document.createElement('td');
          slotCell.textContent = timeSlot;
          slotCell.style.padding = '6px 4px'; // Diminuer le padding pour les créneaux
          slotCell.style.border = '1px solid #ccc';
          slotCell.style.fontWeight = 'bold';
          slotCell.style.backgroundColor = '#f9f9f9';
          row.appendChild(slotCell);
          
          // Cellules pour chaque date du groupe
          currentGroup.forEach(date => {
            const cell = document.createElement('td');
            cell.style.padding = '8px 6px'; // Augmenter le padding
            cell.style.border = '1px solid #ccc';
            cell.style.minHeight = '80px'; // Augmenter encore la hauteur des cellules
            cell.style.fontSize = '8px';
            cell.style.verticalAlign = 'top';
            
            // Chercher les événements pour cette date et ce créneau
            const dateString = format(date, 'yyyy-MM-dd');
            const rowIndex = [...TIME_SLOTS, ...SPECIAL_ROWS].indexOf(timeSlot);
            const cellIndex = dateRange.findIndex(d => format(d, 'yyyy-MM-dd') === dateString);
            
            if (rowIndex >= 0 && cellIndex >= 0 && planningData[rowIndex] && planningData[rowIndex][cellIndex]) {
              const event = planningData[rowIndex][cellIndex].event;
              if (event) {
                let content = `<div style="font-weight: bold; color: #1f2937; margin-bottom: 2px;">${event.name}</div>`;
                
                if (event.startTime && event.endTime) {
                  content += `<div style="color: #2563eb; font-size: 7px; margin-bottom: 1px;">${event.startTime} - ${event.endTime}</div>`;
                }
                
                if (event.assignedMembers && event.assignedMembers.length > 0) {
                  content += `<div style="color: #4b5563; font-size: 7px; margin-bottom: 1px;">${event.assignedMembers.map(m => `${m.prenom} ${m.nom}`).join(', ')}</div>`;
                }
                
                if (event.selectedGroups && event.selectedGroups.length > 0) {
                  content += `<div style="color: #059669; font-size: 7px;">Groupes sélectionnés</div>`;
                }
                
                if (event.notes) {
                  content += `<div style="color: #7c3aed; font-size: 7px; font-style: italic;">${event.notes}</div>`;
                }
                
                cell.innerHTML = content;
              }
            }
            
            row.appendChild(cell);
          });
          
          tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tempTableDiv.appendChild(table);
        document.body.appendChild(tempTableDiv);
        
        // Attendre le rendu
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Capturer le tableau
        const canvas = await html2canvas(tempTableDiv, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 1000,
          height: tempTableDiv.scrollHeight
        });
        
        document.body.removeChild(tempTableDiv);
        
        // Ajouter l'image au PDF
        const imgData = canvas.toDataURL('image/png');
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - 45;
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
        
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        
        const xPosition = margin + (availableWidth - scaledWidth) / 2;
        const yPosition = 40;
        
        pdf.addImage(
          imgData,
          'PNG',
          xPosition,
          yPosition,
          scaledWidth,
          scaledHeight
        );
      }
      
      // Pied de page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Fondation Gendarmerie - Planning | Page ${i}/${totalPages}`, margin, pageHeight - 5);
        pdf.text(`Genere le ${format(new Date(), 'dd/MM/yyyy a HH:mm')}`, pageWidth - 80, pageHeight - 5);
      }
      
      const fileName = `Planning_${format(startDate, 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export reussi",
        description: `Le planning a ete exporte en PDF avec succes (${totalPages} page${totalPages > 1 ? 's' : ''})`,
      });
      
      console.log('PDF exporte avec succes');
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
        if (endDate && endDate < newDate) {
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
      if (isValid(newDate) && startDate && newDate >= startDate) {
        setEndDate(newDate);
      }
    } catch (error) {
      console.error('Erreur lors du changement de date de fin:', error);
    }
  };

  const generatePlanning = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner les dates de début et de fin.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Initialiser les données du planning
      const initialData = initializePlanningData();
      setPlanningData(initialData);
      
      // Sauvegarder automatiquement le planning généré
      await savePlanning(initialData);
      
      setShowPlanning(true);
      
      toast({
        title: "Planning généré et sauvegardé",
        description: "Le planning a été créé et automatiquement enregistré avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du planning:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le planning",
        variant: "destructive"
      });
    }
  };

  const getStartDateValue = () => {
    try {
      return startDate && isValid(startDate) ? format(startDate, 'yyyy-MM-dd') : '';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '';
    }
  };

  const getEndDateValue = () => {
    try {
      return endDate && isValid(endDate) ? format(endDate, 'yyyy-MM-dd') : '';
    } catch (error) {
      console.error('Erreur formatage date input:', error);
      return '';
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
                placeholder="Sélectionnez la date de début"
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
                placeholder="Sélectionnez la date de fin"
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Button 
                onClick={generatePlanning}
                disabled={!startDate || !endDate}
                variant="default"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Générer le planning
              </Button>
              {showPlanning && startDate && endDate && (
                <Button onClick={exportToPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en PDF
                </Button>
              )}
            </div>
          </div>

          {!showPlanning ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Aucun planning généré</h3>
              <p className="text-sm">Sélectionnez les dates de début et de fin, puis cliquez sur "Générer le planning"</p>
            </div>
           ) : (
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
          )}
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
