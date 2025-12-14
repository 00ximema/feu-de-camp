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
import { addPdfFooter, PDF_COLORS } from '@/utils/pdfTemplate';
import campfireLogo from '@/assets/campfire-icon.png';

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
  events?: PlanningEvent[]; // Changé pour supporter plusieurs événements
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

  const handleSavePlanning = async () => {
    await savePlanning(planningData);
  };

  const deletePlanning = async () => {
    if (!isInitialized || !currentSession) return;

    try {
      const plannings = await db.getAll('plannings', currentSession.id);
      for (const planning of plannings) {
        await db.delete('plannings', planning.id);
      }
      
      setPlanningData([]);
      setShowPlanning(false);
      
      toast({
        title: "Planning supprimé",
        description: "Le planning a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du planning:', error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer le planning.",
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
        
        if (latestPlanning.data && latestPlanning.data.length > 0) {
          setPlanningData(latestPlanning.data);
          
          // Récupérer les dates du planning sauvegardé
          if (latestPlanning.startDate && latestPlanning.endDate) {
            setStartDate(new Date(latestPlanning.startDate));
            setEndDate(new Date(latestPlanning.endDate));
          }
          
          // Afficher automatiquement le planning s'il existe des données
          setShowPlanning(true);
          
          console.log('Planning chargé depuis la base de données');
          toast({
            title: "Planning restauré",
            description: "Votre planning précédent a été chargé automatiquement.",
          });
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
    
    const newEvent = {
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
    
    // Initialiser le tableau d'événements si nécessaire
    if (!newData[rowIndex][cellIndex].events) {
      newData[rowIndex][cellIndex].events = [];
    }
    
    // Ajouter le nouvel événement à la liste
    newData[rowIndex][cellIndex].events!.push(newEvent);
    
    setPlanningData(newData);
    await savePlanning(newData);
  };

  const handleDeleteEvent = async (rowIndex: number, cellIndex: number, eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deleting event:', eventId, 'at:', rowIndex, cellIndex);
    const newData = [...planningData];
    
    if (newData[rowIndex][cellIndex].events) {
      // Supprimer l'événement spécifique de la liste
      newData[rowIndex][cellIndex].events = newData[rowIndex][cellIndex].events!.filter(event => event.id !== eventId);
      
      // Si aucun événement restant, supprimer la propriété events
      if (newData[rowIndex][cellIndex].events!.length === 0) {
        delete newData[rowIndex][cellIndex].events;
      }
    }
    
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
      
      // Fonction pour créer l'en-tête uniforme
      const createHeader = async (pdf: jsPDF, pageNumber: number, totalPages: number, dateGroup: Date[]) => {
        // Fond avec dégradé subtil
        pdf.setFillColor(PDF_COLORS.background.r, PDF_COLORS.background.g, PDF_COLORS.background.b);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        // Ligne décorative orange en haut
        pdf.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
        pdf.rect(0, 0, pageWidth, 4, 'F');
        
        // Charger et ajouter le logo feu de camp
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve();
            logoImg.onerror = () => reject();
            logoImg.src = campfireLogo;
          });
          
          // Ajouter le logo en haut à gauche
          pdf.addImage(logoImg, 'PNG', 12, 6, 28, 28);
        } catch (error) {
          console.error('Erreur lors du chargement du logo:', error);
          pdf.setFontSize(12);
          pdf.setTextColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
          pdf.text('Feu de Camp', 15, 22);
        }
        
        // Titre du planning
        pdf.setTextColor(PDF_COLORS.text.r, PDF_COLORS.text.g, PDF_COLORS.text.b);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Planning du Séjour', 48, 18);
        
        // Période de cette page
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(PDF_COLORS.textLight.r, PDF_COLORS.textLight.g, PDF_COLORS.textLight.b);
        try {
          if (dateGroup.length > 0) {
            const firstDate = dateGroup[0];
            const lastDate = dateGroup[dateGroup.length - 1];
            if (isValid(firstDate) && isValid(lastDate)) {
              pdf.text(`Du ${format(firstDate, 'dd MMMM yyyy', { locale: fr })} au ${format(lastDate, 'dd MMMM yyyy', { locale: fr })}`, 48, 28);
            }
          }
        } catch (error) {
          console.error('Erreur formatage date PDF:', error);
          pdf.text('Planning', 48, 28);
        }
        
        // Numéro de page avec style
        pdf.setFillColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
        pdf.roundedRect(pageWidth - 45, 10, 35, 18, 3, 3, 'F');
        pdf.setTextColor(PDF_COLORS.white.r, PDF_COLORS.white.g, PDF_COLORS.white.b);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${pageNumber}/${totalPages}`, pageWidth - 27.5, 21, { align: 'center' });
        
        // Ligne de séparation
        pdf.setDrawColor(PDF_COLORS.primary.r, PDF_COLORS.primary.g, PDF_COLORS.primary.b);
        pdf.setLineWidth(0.5);
        pdf.line(12, 38, pageWidth - 12, 38);
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
        tempTableDiv.style.width = '1200px';
        tempTableDiv.style.fontFamily = 'Arial, sans-serif';
        tempTableDiv.style.fontSize = '9px';
        
        // Créer le tableau HTML pour ce groupe
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '9px';
        table.style.tableLayout = 'fixed';
        
        // En-tête du tableau
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Colonne des créneaux avec style orange
        const creneauHeader = document.createElement('th');
        creneauHeader.textContent = 'Créneaux';
        creneauHeader.style.width = '100px';
        creneauHeader.style.padding = '10px 6px';
        creneauHeader.style.border = '2px solid #e67e22';
        creneauHeader.style.backgroundColor = '#e67e22';
        creneauHeader.style.color = '#ffffff';
        creneauHeader.style.fontWeight = 'bold';
        creneauHeader.style.fontSize = '10px';
        headerRow.appendChild(creneauHeader);
        
        // Colonnes des dates avec style amélioré
        currentGroup.forEach(date => {
          const dateHeader = document.createElement('th');
          try {
            if (isValid(date)) {
              dateHeader.innerHTML = `
                <div style="font-weight: bold; font-size: 10px; text-transform: capitalize;">${format(date, 'EEEE', { locale: fr })}</div>
                <div style="font-size: 9px; color: #666;">${format(date, 'dd MMM', { locale: fr })}</div>
              `;
            } else {
              dateHeader.textContent = 'Date invalide';
            }
          } catch (error) {
            dateHeader.textContent = 'Erreur date';
          }
          dateHeader.style.width = `${Math.floor(900 / currentGroup.length)}px`;
          dateHeader.style.padding = '10px 6px';
          dateHeader.style.border = '2px solid #e67e22';
          dateHeader.style.backgroundColor = '#fef3e2';
          dateHeader.style.fontWeight = 'bold';
          dateHeader.style.textAlign = 'center';
          headerRow.appendChild(dateHeader);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corps du tableau
        const tbody = document.createElement('tbody');
        
        // Créer les lignes pour chaque créneau avec style amélioré
        [...TIME_SLOTS, ...SPECIAL_ROWS].forEach(timeSlot => {
          const row = document.createElement('tr');
          if (SPECIAL_ROWS.includes(timeSlot)) {
            row.style.backgroundColor = '#fff5eb';
          }
          
          // Colonne du créneau avec style
          const slotCell = document.createElement('td');
          slotCell.textContent = timeSlot;
          slotCell.style.padding = '8px 6px';
          slotCell.style.border = '1px solid #e67e22';
          slotCell.style.fontWeight = 'bold';
          slotCell.style.backgroundColor = '#fef9f3';
          slotCell.style.fontSize = '9px';
          slotCell.style.color = '#c45c00';
          row.appendChild(slotCell);
          
          // Cellules pour chaque date du groupe avec style amélioré
          currentGroup.forEach(date => {
            const cell = document.createElement('td');
            cell.style.padding = '8px 6px';
            cell.style.border = '1px solid #f0c9a0';
            cell.style.minHeight = '80px';
            cell.style.fontSize = '8px';
            cell.style.verticalAlign = 'top';
            cell.style.lineHeight = '1.3';
            cell.style.backgroundColor = '#ffffff';
            
            // Chercher les événements pour cette date et ce créneau
            const dateString = format(date, 'yyyy-MM-dd');
            const rowIndex = [...TIME_SLOTS, ...SPECIAL_ROWS].indexOf(timeSlot);
            const cellIndex = dateRange.findIndex(d => format(d, 'yyyy-MM-dd') === dateString);
            
            if (rowIndex >= 0 && cellIndex >= 0 && planningData[rowIndex] && planningData[rowIndex][cellIndex]) {
              const events = planningData[rowIndex][cellIndex].events;
              if (events && events.length > 0) {
                let content = '';
                
                events.forEach((event, index) => {
                  if (index > 0) content += '<div style="border-top: 1px solid #f0c9a0; margin: 4px 0; padding-top: 4px;"></div>';
                  
                  content += `<div style="font-weight: bold; color: #c45c00; margin-bottom: 3px; font-size: 9px;">${event.name}</div>`;
                  
                  if (event.startTime && event.endTime) {
                    content += `<div style="color: #e67e22; font-size: 8px; margin-bottom: 2px;">${event.startTime} - ${event.endTime}</div>`;
                  }
                  
                  if (event.assignedMembers && event.assignedMembers.length > 0) {
                    content += `<div style="color: #555; font-size: 8px; margin-bottom: 2px;">Equipe: ${event.assignedMembers.map(m => `${m.prenom} ${m.nom}`).join(', ')}</div>`;
                  }
                  
                  if (event.selectedGroups && event.selectedGroups.length > 0) {
                    content += `<div style="color: #27ae60; font-size: 8px; margin-bottom: 2px;">Groupes: ${event.selectedGroups.join(', ')}</div>`;
                  }
                  
                  if (event.selectedJeunes && event.selectedJeunes.length > 0) {
                    content += `<div style="color: #27ae60; font-size: 8px; margin-bottom: 2px;">${event.selectedJeunes.length} jeune${event.selectedJeunes.length > 1 ? 's' : ''}</div>`;
                  }
                  
                  if (event.notes) {
                    content += `<div style="color: #8e44ad; font-size: 7px; font-style: italic; margin-top: 2px;">Note: ${event.notes}</div>`;
                  }
                });
                
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
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 1200,
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
        const yPosition = 44;
        
        pdf.addImage(
          imgData,
          'PNG',
          xPosition,
          yPosition,
          scaledWidth,
          scaledHeight
        );
      }
      
      // Pied de page uniforme
      addPdfFooter(pdf);
      
      const fileName = `Planning_${format(startDate, 'dd-MM-yyyy')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export reussi",
        description: `Le planning a ete exporte en PDF avec succes (${pdf.getNumberOfPages()} page${pdf.getNumberOfPages() > 1 ? 's' : ''})`,
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

  const handleStartDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      if (!inputValue) return;
      
      const newDate = new Date(inputValue);
      if (isValid(newDate)) {
        setStartDate(newDate);
        if (endDate && endDate < newDate) {
          setEndDate(addDays(newDate, 6));
        }
        
        // Si un planning est déjà affiché, le régénérer automatiquement
        if (showPlanning && endDate) {
          const newEndDate = endDate < newDate ? addDays(newDate, 6) : endDate;
          setTimeout(async () => {
            const initialData = initializePlanningData();
            setPlanningData(initialData);
            await savePlanning(initialData);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de date de début:', error);
    }
  };

  const handleEndDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value;
      if (!inputValue) return;
      
      const newDate = new Date(inputValue);
      if (isValid(newDate) && startDate && newDate >= startDate) {
        setEndDate(newDate);
        
        // Si un planning est déjà affiché, le régénérer automatiquement
        if (showPlanning) {
          setTimeout(async () => {
            const initialData = initializePlanningData();
            setPlanningData(initialData);
            await savePlanning(initialData);
          }, 100);
        }
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
              {showPlanning && (
                <>
                  <Button onClick={handleSavePlanning} variant="secondary">
                    Enregistrer
                  </Button>
                  <Button onClick={deletePlanning} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  {startDate && endDate && (
                    <Button onClick={exportToPDF} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter en PDF
                    </Button>
                  )}
                </>
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
            <div ref={planningRef} className="bg-card p-4" id="planning-table">
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32 font-bold bg-muted">Créneaux</TableHead>
                      {dateRange.map((date, index) => (
                        <TableHead key={index} className="text-center font-bold bg-muted min-w-32">
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
                       <TableRow key={rowIndex} className={isSpecialRow(row[0]?.timeSlot) ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium bg-muted border-r">
                          {row[0]?.timeSlot}
                        </TableCell>
                        {row.map((cell, cellIndex) => (
                          <TableCell 
                            key={cellIndex} 
                            className="p-2 border min-h-16 cursor-pointer hover:bg-muted transition-colors relative group"
                            onClick={() => handleCellClick(rowIndex, cellIndex)}
                          >
                            {cell.events && cell.events.length > 0 ? (
                              <div className="space-y-2">
                                {cell.events.map((event, eventIndex) => (
                                  <div key={event.id} className="relative group/event border-l-2 border-blue-500 pl-2 pb-1">
                                    <div className="font-medium text-sm text-gray-900">
                                      {event.name}
                                    </div>
                                    {event.startTime && event.endTime && (
                                      <div className="text-xs text-blue-600">
                                        {event.startTime} - {event.endTime}
                                      </div>
                                    )}
                                    {event.assignedMembers && event.assignedMembers.length > 0 && (
                                      <div className="text-xs text-gray-600">
                                        <strong>Adultes:</strong> {event.assignedMembers.map(member => 
                                          `${member.prenom} ${member.nom}`
                                        ).join(', ')}
                                      </div>
                                    )}
                                    {event.selectedGroups && event.selectedGroups.length > 0 && (
                                      <div className="text-xs text-green-600">
                                        <strong>Groupes:</strong> {event.selectedGroups.join(', ')}
                                      </div>
                                    )}
                                    {event.selectedJeunes && event.selectedJeunes.length > 0 && (
                                      <div className="text-xs text-green-600">
                                        <strong>Jeunes:</strong> {event.selectedJeunes.length} sélectionné{event.selectedJeunes.length > 1 ? 's' : ''}
                                      </div>
                                    )}
                                    {event.notes && (
                                      <div className="text-xs text-purple-600 italic">
                                        {event.notes}
                                      </div>
                                    )}
                                    {event.startDate && event.endDate && 
                                     event.startDate !== event.endDate && (
                                      <div className="text-xs text-blue-600">
                                        {isValid(new Date(event.startDate)) && isValid(new Date(event.endDate)) ? (
                                          <>
                                            {format(new Date(event.startDate), 'dd/MM')} - {format(new Date(event.endDate), 'dd/MM')}
                                          </>
                                        ) : (
                                          'Dates invalides'
                                        )}
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="opacity-0 group-hover/event:opacity-100 absolute -top-1 -right-1 h-5 w-5 p-0 bg-card border border-red-200 hover:bg-red-50"
                                      onClick={(e) => handleDeleteEvent(rowIndex, cellIndex, event.id, e)}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </div>
                                ))}
                                {/* Bouton pour ajouter un nouvel événement */}
                                <div 
                                  className="text-xs text-primary text-center py-1 border border-dashed border-primary/30 rounded hover:bg-primary/5 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCellClick(rowIndex, cellIndex);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mx-auto" />
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 text-center">
                                <Plus className="h-4 w-4 mx-auto mb-1" />
                                Ajouter événement
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
        currentEvent={undefined}
      />
    </div>
  );
};

export default PlanningTableGenerator;
